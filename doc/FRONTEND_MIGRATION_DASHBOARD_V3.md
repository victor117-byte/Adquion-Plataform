# Dashboard Declaraciones - Guía de Migración Frontend v3

**Fecha:** 2026-02-16
**Autor:** Backend Team
**Motivo:** Optimización de rendimiento (1,800ms → 10ms) y corrección de datos

---

## Resumen de cambios

El endpoint `GET /api/dashboard-declaraciones` fue optimizado. Los cambios que afectan al frontend son:

1. **Dos campos eliminados** del listado: `pdf_base64` y `pdf_pago`
2. **Un campo nuevo**: `tiene_pdf_pago` (boolean)
3. **Más datos visibles**: 2,912 declaraciones (antes 1,815 por bug de agrupación)
4. **PDFs se obtienen bajo demanda** via endpoint separado (ya existente)

---

## 1. Campos del listado: antes vs ahora

### Campos que SIGUEN IGUAL (sin cambios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `rfc` | `string` | RFC del contribuyente |
| `razon_social` | `string` | Razón social |
| `ejercicio` | `string` | Año fiscal (ej: "2024") |
| `periodo_de_declaracion` | `string` | Mes/periodo (ej: "Enero", "Enero-Junio") |
| `fecha_y_hora_presentacion` | `string` | Fecha de presentación (DD/MM/YYYY) |
| `linea_de_captura` | `string` | Referencia de pago SAT |
| `num_de_operacion` | `string` | Número de operación SAT |
| `total_a_pagar_unico` | `number` | Monto total a pagar |
| `impuesto_a_favor` | `string` | Impuesto a favor |
| `estatus_pago` | `string` | `"Pagado"` \| `"Pendiente"` \| `"Vencido"` |
| `fecha_de_pago` | `string` | Fecha en que se pagó (si aplica) |
| `vigente_hasta` | `string` | Fecha límite de pago (DD/MM/YYYY) |
| `tiene_pdf` | `boolean` | ¿Tiene PDF de declaración? |
| `ruta_pago` | `string` | Ruta del archivo de pago |

### Campos ELIMINADOS

| Campo eliminado | Razón |
|----------------|-------|
| `pdf_base64` | Causaba transferencia de ~3.6MB por página. Usar endpoint `/pdf` en su lugar |
| `pdf_pago` | Mismo motivo. Usar endpoint `/pdf` con `tabla=py_pago` |

### Campos NUEVOS

| Campo nuevo | Tipo | Descripción |
|------------|------|-------------|
| `tiene_pdf_pago` | `boolean` | `true` si existe PDF del comprobante de pago |

---

## 2. Estructura de respuesta

### GET /api/dashboard-declaraciones

**URL:** `GET /api/dashboard-declaraciones?organizacion={org}`

**Query params (sin cambios):**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `organizacion` | string | requerido | Nombre de la organización |
| `page` | number | 1 | Página actual |
| `limit` | number | 20 | Registros por página (max 100) |
| `sort_by` | string | `fecha_y_hora_presentacion` | Campo de ordenamiento |
| `sort_order` | `asc` \| `desc` | `desc` | Dirección del orden |
| `rfc` | string | - | Filtrar por RFC exacto |
| `razon_social` | string | - | Buscar en razón social (parcial) |
| `ejercicio` | string | - | Filtrar por año (ej: "2024") |
| `periodo` | string | - | Buscar en periodo (parcial) |
| `estatus_pago` | string | - | `Pagado`, `Pendiente`, `Vencido` o combinados con coma |
| `busqueda` | string | - | Búsqueda global (RFC, razón social, línea de captura) |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "razon_social": "EMPRESA SA DE CV",
      "rfc": "EMP123456XX0",
      "fecha_y_hora_presentacion": "15/01/2025",
      "linea_de_captura": "0425 0ABC 1200 4490 0280",
      "impuesto_a_favor": null,
      "ejercicio": "2024",
      "periodo_de_declaracion": "Diciembre",
      "num_de_operacion": "250240103599",
      "total_a_pagar_unico": 7598.00,
      "estatus_pago": "Pagado",
      "fecha_de_pago": "16/01/2025",
      "vigente_hasta": "25/02/2025",
      "tiene_pdf": true,
      "tiene_pdf_pago": true,
      "ruta_pago": "uploads/org_lh/EMP123456XX0/pago_250240103599.pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2912,
    "total_pages": 146,
    "has_next": true,
    "has_prev": false
  },
  "kpis": {
    "total_declaraciones": 2912,
    "total_pagadas": 2192,
    "total_pendientes": 5,
    "total_vencidas": 715,
    "porcentaje_cumplimiento": 75,
    "monto_total_declarado": 17161061.00,
    "monto_pagado": 9026560.00,
    "monto_pendiente": 8134501.00,
    "contribuyentes_activos": 300
  },
  "filtros_aplicados": {
    "rfcs_permitidos": null
  }
}
```

---

## 3. Cómo obtener y mostrar PDFs

Los PDFs ya NO vienen en el listado. Se obtienen bajo demanda cuando el usuario hace clic.

### Endpoint de PDF (sin cambios)

```
GET /api/dashboard-declaraciones/pdf?organizacion={org}&num_de_operacion={num}&tabla={tabla}
```

| Param | Valores | Descripción |
|-------|---------|-------------|
| `organizacion` | string | Nombre de la org |
| `num_de_operacion` | string | Valor de `row.num_de_operacion` |
| `tabla` | `py_declaracion` \| `py_pago` | Tipo de PDF a obtener |

**Respuesta:**
```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjQK...",
  "rfc": "EMP123456XX0"
}
```

### Ejemplo de implementación React/Next.js

```typescript
// Componente de botón para ver PDF
function VerPdfButton({ row, organizacion }: { row: DashboardDeclaracion; organizacion: string }) {
  const [loading, setLoading] = useState(false);

  const verPdf = async (tabla: 'py_declaracion' | 'py_pago') => {
    if (!row.num_de_operacion) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        organizacion,
        num_de_operacion: row.num_de_operacion,
        tabla,
      });

      const res = await fetch(`/api/dashboard-declaraciones/pdf?${params}`);
      const data = await res.json();

      if (!data.success || !data.pdf_base64) {
        alert('PDF no disponible');
        return;
      }

      // Convertir base64 a Blob y abrir en nueva pestaña
      const byteCharacters = atob(data.pdf_base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');

    } catch (error) {
      console.error('Error obteniendo PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Botón para PDF de declaración */}
      {row.tiene_pdf && (
        <button onClick={() => verPdf('py_declaracion')} disabled={loading}>
          Ver Declaración
        </button>
      )}

      {/* Botón para PDF de pago */}
      {row.tiene_pdf_pago && (
        <button onClick={() => verPdf('py_pago')} disabled={loading}>
          Ver Pago
        </button>
      )}
    </div>
  );
}
```

### Ejemplo con iframe/modal

```typescript
// Si prefieres mostrar el PDF en un modal con iframe
const [pdfUrl, setPdfUrl] = useState<string | null>(null);

const verPdfEnModal = async (numOp: string, tabla: string) => {
  const res = await fetch(
    `/api/dashboard-declaraciones/pdf?organizacion=${org}&num_de_operacion=${numOp}&tabla=${tabla}`
  );
  const { pdf_base64 } = await res.json();

  if (pdf_base64) {
    setPdfUrl(`data:application/pdf;base64,${pdf_base64}`);
    // Abrir modal...
  }
};

// En tu modal:
// <iframe src={pdfUrl} width="100%" height="600px" />
```

---

## 4. Tipos TypeScript actualizados

```typescript
type EstatusPago = 'Pagado' | 'Pendiente' | 'Vencido';

interface DashboardDeclaracion {
  razon_social: string | null;
  rfc: string | null;
  fecha_y_hora_presentacion: string | null;
  linea_de_captura: string | null;
  impuesto_a_favor: string | null;
  total_a_pagar_unico: number;
  estatus_pago: EstatusPago;
  fecha_de_pago: string | null;
  vigente_hasta: string | null;
  ejercicio: string | null;
  periodo_de_declaracion: string | null;
  num_de_operacion: string | null;
  tiene_pdf: boolean;        // ¿Tiene PDF de declaración?
  tiene_pdf_pago: boolean;   // ¿Tiene PDF de pago? (NUEVO)
  ruta_pago: string | null;
  // ELIMINADOS: pdf_base64, pdf_pago
}

interface DashboardKPIs {
  total_declaraciones: number;
  total_pagadas: number;
  total_pendientes: number;
  total_vencidas: number;
  porcentaje_cumplimiento: number;  // 0-100
  monto_total_declarado: number;
  monto_pagado: number;
  monto_pendiente: number;
  contribuyentes_activos: number;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardDeclaracion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  kpis: DashboardKPIs;
  filtros_aplicados: Record<string, unknown>;
}
```

---

## 5. Lógica del estatus_pago

El estatus se calcula **en tiempo real** en cada request (no se cachea). La lógica es:

```
┌─────────────────────────────────────────────────────┐
│  ¿linea_de_captura está vacía?                      │
│     SÍ → PAGADO (no hay nada que pagar)             │
│     NO ↓                                            │
│  ¿Existe un pago con esa linea_de_captura?          │
│     SÍ → PAGADO                                     │
│     NO ↓                                            │
│  ¿vigente_hasta >= fecha de hoy?                    │
│     SÍ → PENDIENTE (aún tiene tiempo)               │
│     NO → VENCIDO (ya pasó la fecha límite)          │
└─────────────────────────────────────────────────────┘
```

**Ejemplo con fecha de hoy = 16/02/2026:**

| Declaración | vigente_hasta | ¿Tiene pago? | Resultado |
|-------------|--------------|--------------|-----------|
| Dec A | 17/02/2026 | No | **Pendiente** |
| Dec B | 15/02/2026 | No | **Vencido** |
| Dec C | 15/02/2026 | Sí | **Pagado** |
| Dec D | *(vacío)* | - | **Pagado** (sin línea de captura) |

El estatus cambia automáticamente al pasar la fecha de vigencia. No requiere acción del backend ni del frontend.

---

## 6. Checklist de migración

- [ ] Eliminar referencias a `row.pdf_base64` del código frontend
- [ ] Eliminar referencias a `row.pdf_pago` del código frontend
- [ ] Agregar `tiene_pdf_pago` al tipo/interfaz de declaración
- [ ] Implementar botón "Ver PDF" que llame a `/api/dashboard-declaraciones/pdf`
- [ ] Implementar botón "Ver Pago" que llame al mismo endpoint con `tabla=py_pago`
- [ ] Usar `row.tiene_pdf` para mostrar/ocultar botón de declaración
- [ ] Usar `row.tiene_pdf_pago` para mostrar/ocultar botón de pago
- [ ] Actualizar tipos TypeScript según sección 4
- [ ] Verificar que la paginación funciona (ahora hay más registros: ~2,900 vs ~1,800)

---

## 7. Endpoints disponibles (resumen)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/dashboard-declaraciones?organizacion=X` | Listado paginado con filtros y KPIs |
| `GET` | `/api/dashboard-declaraciones/kpis?organizacion=X` | Solo KPIs (cache 30s) |
| `GET` | `/api/dashboard-declaraciones/pdf?organizacion=X&num_de_operacion=Y&tabla=Z` | Obtener PDF específico |
| `GET` | `/api/dashboard-declaraciones/initialize?organizacion=X` | Verificar si está inicializado |
| `POST` | `/api/dashboard-declaraciones/initialize` | Inicializar vista (solo admin) |