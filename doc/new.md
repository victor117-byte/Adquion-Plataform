# API Dashboard Declaraciones - v3.0

## Cambios en esta versión (13/02/2026)

✅ Agregados campos: `fecha_hasta`, `pdf_pago`, `pdf_base64`, `ruta_pago`
✅ Removido: `concepto_de_pago` (agrupado por monto total)
✅ Actualizada lógica de `estatus_pago`:
  - Si `linea_de_captura` está vacía → `Pagado`
  - Si `total_a_pagar_unico` es 0 o NULL → `Pagado`
  - Si hay `fecha_de_pago` → `Pagado`
  - Si sin pago pero vigencia válida → `Pendiente`
  - Si fuera de vigencia → `Vencido`

---

## GET /api/dashboard-declaraciones

Obtiene el listado de declaraciones fiscales con filtros y paginación.

### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `organizacion` | string | ✅ | RFC u organización | `org_lh` |
| `page` | number | ❌ | Número de página (defecto: 1) | `1` |
| `limit` | number | ❌ | Registros por página (defecto: 20, máx: 100) | `20` |
| `rfc` | string | ❌ | Filtrar por RFC exacto | `ABC010101000` |
| `razon_social` | string | ❌ | Búsqueda parcial por nombre | `EMPRESA%` |
| `ejercicio` | string | ❌ | Filtrar por año (YYYY) | `2025` |
| `periodo` | string | ❌ | Filtrar por período | `01` |
| `estatus_pago` | string | ❌ | Filtrar por estado (Pagado/Pendiente/Vencido) o múltiples `Pagado,Pendiente` | `Pagado` |
| `busqueda` | string | ❌ | Búsqueda en RFC, razón social, linea_de_captura | `busqueda=ABC` |
| `sort_by` | string | ❌ | Campo para ordenar | `fecha_y_hora_presentacion` |
| `sort_order` | string | ❌ | `asc` o `desc` (defecto: desc) | `desc` |

### Headers Requeridos

```
Authorization: Bearer <JWT_TOKEN>
```

### Ejemplos de Request

#### Ejemplo 1: Obtener todas las declaraciones pagadas

```bash
GET /api/dashboard-declaraciones?organizacion=org_lh&estatus_pago=Pagado&limit=20&page=1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Ejemplo 2: Filtrar por RFC

```bash
GET /api/dashboard-declaraciones?organizacion=org_lh&rfc=CMX010101ABC&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Ejemplo 3: Buscar por razón social con múltiples estados

```bash
GET /api/dashboard-declaraciones?organizacion=org_lh&razon_social=EMPRESA&estatus_pago=Pendiente,Vencido&sort_by=fecha_hasta&sort_order=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response - Estructura

### 200 OK

```json
{
  "success": true,
  "data": [
    {
      "razon_social": "COMERCIAL MÉXICO S.A.",
      "rfc": "CMX010101ABC",
      "fecha_y_hora_presentacion": "2026-02-10T14:32:15",
      "linea_de_captura": "127456890123456789",
      "impuesto_a_favor": "$1,250.50",
      "total_a_pagar_unico": 8500.75,
      "estatus_pago": "Pagado",
      "fecha_de_pago": "2026-02-11",
      "fecha_hasta": "15/03/2026",
      "ejercicio": "2025",
      "periodo_de_declaracion": "01",
      "num_de_operacion": "2026021001",
      "tiene_pdf": true,
      "pdf_base64": "JVBERi0xLjQKJeLjz9zT0NTD98DAyMjk0OTU4NzY0NzU4Nzc4NTY0NzU4NzY0Nzc4...",
      "pdf_pago": "JVBERi0xLjQKJeLjz9zT0NTD98DAyMjk0OTU4NzY0NzU4Nzc4NTY0Nzc4NTY0Nzc4...",
      "ruta_pago": "/uploads/org_lh/CMX010101ABC/pago_declaracion_2025_01.pdf"
    },
    {
      "razon_social": "SERVICIOS PROFESIONALES XYZ",
      "rfc": "SPX020202XYZ",
      "fecha_y_hora_presentacion": "2026-02-09T09:15:42",
      "linea_de_captura": "184756321098765432",
      "impuesto_a_favor": "$500.00",
      "total_a_pagar_unico": 5200.00,
      "estatus_pago": "Pendiente",
      "fecha_de_pago": null,
      "fecha_hasta": "14/03/2026",
      "ejercicio": "2025",
      "periodo_de_declaracion": "01",
      "num_de_operacion": "2026020902",
      "tiene_pdf": true,
      "pdf_base64": "JVBERi0xLjQKJeLjz9zT0NTD98DAyMjk0OTU4NzY0NzU4Nzc4NTY0Nzc4NTY0Nzc4...",
      "pdf_pago": null,
      "ruta_pago": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "kpis": {
    "total_declaraciones": 150,
    "total_pagadas": 120,
    "total_pendientes": 20,
    "total_vencidas": 10,
    "porcentaje_cumplimiento": 80,
    "monto_total_declarado": 425000.50,
    "monto_pagado": 305000.00,
    "monto_pendiente": 120000.50,
    "contribuyentes_activos": 15
  },
  "filtros_aplicados": {
    "rfcs_permitidos": ["CMX010101ABC", "SPX020202XYZ"]
  },
  "rate_limit_remaining": 42
}
```

---

## Campos de Respuesta

### Información Principal

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `razon_social` | string \| null | Nombre legal del contribuyente |
| `rfc` | string \| null | RFC del contribuyente |
| `ejercicio` | string \| null | Año fiscal (YYYY) |
| `periodo_de_declaracion` | string \| null | Período de la declaración |
| `num_de_operacion` | string \| null | Número de operación SAT |
| `linea_de_captura` | string \| null | Línea de captura de la declaración |

### Montos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_a_pagar_unico` | number | Monto total a pagar (sin desglose por concepto) |
| `impuesto_a_favor` | string \| null | Monto de impuesto a favor (reembolsable) |

### Fechas

| Campo | Tipo | Descripción | Formato |
|-------|------|-------------|---------|
| `fecha_y_hora_presentacion` | string \| null | Cuándo se presentó la declaración | ISO 8601 |
| `fecha_de_pago` | string \| null | Cuándo se realizó el pago (null si no está pagada) | YYYY-MM-DD |
| `fecha_hasta` | string \| null | Fecha límite de vigencia de la declaración | DD/MM/YYYY |

### Estatus

| Campo | Tipo | Valores | Descripción |
|-------|------|--------|-------------|
| `estatus_pago` | string | `Pagado` \| `Pendiente` \| `Vencido` | Estado del pago |
| `tiene_pdf` | boolean | true \| false | ¿Existe PDF de la declaración? |

### PDFs y Archivos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pdf_base64` | string \| null | PDF de declaración codificado en base64 (puede ser muy grande ~500KB-2MB) |
| `pdf_pago` | string \| null | PDF de comprobante de pago en base64 (null si no está pagada) |
| `ruta_pago` | string \| null | Ruta del archivo de pago en el servidor (para auditoría/logging) |

---

## Códigos de Error

### 400 Bad Request

```json
{
  "error": "Organizacion es requerida",
  "code": "MISSING_ORG"
}
```

```json
{
  "error": "Estatus inválidos: InvalidStatus1, InvalidStatus2",
  "code": "INVALID_ESTATUS"
}
```

### 401 Unauthorized

```json
{
  "error": "No autorizado",
  "code": "AUTH_FAILED"
}
```

```json
{
  "error": "Datos de usuario inválidos",
  "code": "INVALID_USER"
}
```

### 404 Not Found

```json
{
  "error": "Dashboard no inicializado",
  "message": "Ejecuta POST /api/dashboard-declaraciones/initialize para configurar el dashboard",
  "code": "NOT_INITIALIZED",
  "initialized": false
}
```

### 429 Too Many Requests

```json
{
  "error": "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
  "code": "RATE_LIMITED"
}
```

Headers adicionales:
```
Retry-After: 60
X-RateLimit-Remaining: 0
```

### 500 Internal Server Error

```json
{
  "error": "Error interno del servidor",
  "code": "INTERNAL_ERROR"
}
```

---

## POST /api/dashboard-declaraciones/initialize

Inicializa o reinicia la vista `py_dashboard_declaraciones` en la organización.

### Request

```bash
POST /api/dashboard-declaraciones/initialize
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "organizacion": "org_lh"
}
```

### Response - 200 OK

```json
{
  "success": true,
  "message": "Dashboard fiscal inicializado correctamente",
  "estadisticas": {
    "total": 150,
    "pagados": 120,
    "pendientes": 20,
    "vencidos": 10
  }
}
```

### Response - 403 Forbidden (No administrador)

```json
{
  "error": "Solo administradores pueden inicializar el dashboard",
  "status": 403
}
```

---

## GET /api/dashboard-declaraciones/initialize

Verifica el estado de la vista en la organización.

### Request

```bash
GET /api/dashboard-declaraciones/initialize?organizacion=org_lh
Authorization: Bearer <JWT_TOKEN>
```

### Response - 200 OK

```json
{
  "success": true,
  "initialized": true,
  "stats": {
    "total_registros": 150,
    "pagados": 120,
    "pendientes": 20,
    "vencidos": 10
  }
}
```

---

## Ejemplos de Implementación Frontend

### React - Descargar PDF

```typescript
const downloadPDF = (base64: string, filename: string) => {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  link.click();
};

// Uso
{declaration.pdf_base64 && (
  <button 
    onClick={() => downloadPDF(declaration.pdf_base64, `declaracion_${declaration.rfc}.pdf`)}
    className="btn btn-primary"
  >
    📄 Declaración
  </button>
)}

{declaration.pdf_pago && (
  <button 
    onClick={() => downloadPDF(declaration.pdf_pago, `pago_${declaration.rfc}.pdf`)}
    className="btn btn-success"
  >
    ✅ Comprobante Pago
  </button>
)}
```

### TypeScript - Types

```typescript
interface DashboardRow {
  razon_social: string | null;
  rfc: string | null;
  fecha_y_hora_presentacion: string | null;
  linea_de_captura: string | null;
  impuesto_a_favor: string | null;
  total_a_pagar_unico: number;
  estatus_pago: 'Pagado' | 'Pendiente' | 'Vencido';
  fecha_de_pago: string | null;
  fecha_hasta: string | null;  // ✨ NUEVO
  ejercicio: string | null;
  periodo_de_declaracion: string | null;
  num_de_operacion: string | null;
  tiene_pdf: boolean;
  pdf_base64: string | null;   // ✨ NUEVO
  pdf_pago: string | null;     // ✨ NUEVO
  ruta_pago: string | null;    // ✨ NUEVO
}

interface DashboardResponse {
  success: boolean;
  data: DashboardRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  kpis: {
    total_declaraciones: number;
    total_pagadas: number;
    total_pendientes: number;
    total_vencidas: number;
    porcentaje_cumplimiento: number;
    monto_total_declarado: number;
    monto_pagado: number;
    monto_pendiente: number;
    contribuyentes_activos: number;
  };
  filtros_aplicados: any;
  rate_limit_remaining: number;
}
```

### Renderizar tabla con fechas

```tsx
<table className="table">
  <thead>
    <tr>
      <th>RFC</th>
      <th>Razón Social</th>
      <th>Estatus</th>
      <th>Total a Pagar</th>
      <th>Vigencia</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {data.map((row) => (
      <tr key={row.linea_de_captura}>
        <td>{row.rfc}</td>
        <td>{row.razon_social}</td>
        <td>
          <span className={`badge badge-${
            row.estatus_pago === 'Pagado' ? 'success' : 
            row.estatus_pago === 'Pendiente' ? 'warning' : 
            'danger'
          }`}>
            {row.estatus_pago}
          </span>
        </td>
        <td>${row.total_a_pagar_unico.toFixed(2)}</td>
        <td>{row.fecha_hasta}</td>  {/* ✨ NUEVO */}
        <td>
          {row.pdf_base64 && (
            <button 
              size="sm"
              onClick={() => downloadPDF(row.pdf_base64, `${row.rfc}.pdf`)}
            >
              📄
            </button>
          )}
          {row.pdf_pago && (
            <button 
              size="sm"
              onClick={() => downloadPDF(row.pdf_pago, `${row.rfc}_pago.pdf`)}
            >
              ✅
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Rate Limiting

- **Límite**: 60 solicitudes por minuto por usuario/organización
- **Header**: `X-RateLimit-Remaining` indica solicitudes restantes
- **Respuesta 429**: Si se supera el límite

---

## Seguridad

✅ Autenticación JWT requerida
✅ Solo usuarios autenticados pueden acceder
✅ Contadores solo ven RFCs asignados
✅ Administradores ven todos los RFCs
✅ Sanitización de inputs
✅ Rate limiting por usuario

---

## Notas de Performance

- **Tamaño PDF**: Los base64 pueden ser 500KB - 2MB por registro
- **Con 20 registros**: Una página podría ser 10-40MB
- **Recomendación**: 
  - Reducir `limit` si tiene muchos PDFs
  - Implementar lazy-loading en modal
  - Mostrar solo en click, no por defecto

---

## Troubleshooting

### PDF no descarga
✅ Verificar que `pdf_base64` no sea `null`
✅ Verificar decodificación base64
✅ Revisar consola del navegador

### Registros duplicados
✅ Vista se actualizó, reinicializar: `POST /initialize`

### Estatus incorrecto
✅ Verificar `fecha_hasta` vs fecha actual
✅ Verificar si `linea_de_captura` está vacía
✅ Revisar logs del backend
