# API Dashboard Declaraciones v2

> **Base URL**: `/api/dashboard-declaraciones`
> **Version**: 2.3.0
> **Fecha**: 2026-02-18

---

## Arquitectura

```
Frontend (React)
    |
    v
Next.js API Routes (/api/dashboard-declaraciones)
    |
    v
PostgreSQL VIEW: py_dashboard_declaraciones
    |
    +-- py_declaracion (datos crudos de declaraciones)
    +-- py_pago (datos crudos de pagos)
```

La vista `py_dashboard_declaraciones` calcula el estatus de pago **en tiempo real** (no usa tabla materializada ni triggers). Deduplica montos usando `ROW_NUMBER()` para evitar contar `total_a_pagar` mas de una vez por linea de captura.

---

## Autenticacion

Todos los endpoints requieren JWT (cookie httpOnly).

```bash
POST /api/auth/login
Body: { "correo": "usuario@email.com", "contraseña": "...", "organizacion": "mi_empresa" }
```

---

## Seguridad por Rol

Todos los endpoints del dashboard filtran datos segun el tipo de usuario:

| Tipo Usuario | Acceso |
|---|---|
| `administrador` | Ve **todas** las declaraciones, KPIs y PDFs de la organizacion |
| `contador` | Solo ve declaraciones, KPIs y PDFs de los **contribuyentes que tiene asignados** |

El filtrado se aplica automaticamente por RFC. Un contador con 3 contribuyentes asignados solo vera las declaraciones de esos 3 RFCs. Si no tiene contribuyentes asignados, no vera nada.

Este filtrado aplica a:
- `GET /api/dashboard-declaraciones` (listado y KPIs embebidos)
- `GET /api/dashboard-declaraciones/kpis` (KPIs independientes)
- `GET /api/dashboard-declaraciones/pdf` (visualizacion de PDF)

### Filtro por usuario (solo administradores)

Los administradores pueden consultar el desempeño de un contador o de ellos mismos usando el parametro `contador_id`. Cuando se usa, el dashboard muestra unicamente los contribuyentes asignados a ese usuario.

```
GET /api/dashboard-declaraciones?organizacion=X&contador_id=4
GET /api/dashboard-declaraciones/kpis?organizacion=X&contador_id=4
```

Para obtener la lista de usuarios disponibles (para el dropdown del frontend):

```
GET /api/dashboard-declaraciones/usuarios?organizacion=X
```

> Ver guia completa en `doc/FRONTEND_MIGRATION_DASHBOARD_V4.md`

---

## Tablas Fuente

### py_declaracion

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `tipo_pdf` | TEXT | Tipo de PDF clasificado |
| `rfc` | TEXT | RFC del contribuyente |
| `fecha_y_hora_presentacion` | TEXT | Fecha/hora de presentacion (texto) |
| `num_de_operacion` | TEXT | Numero de operacion SAT |
| `periodo_de_declaracion` | TEXT | Periodo (ej: "Enero", "Febrero") |
| `ejercicio` | TEXT | Ano fiscal (ej: "2026") |
| `total_a_pagar` | TEXT | Monto total a pagar (texto, ej: "1500.00") |
| `vigente_hasta` | TEXT | Fecha de vigencia de la linea de captura (texto) |
| `linea_de_captura` | TEXT | Linea de captura unica |
| `razon_social` | TEXT | Razon social del contribuyente |
| `tipo_social` | TEXT | Tipo de sociedad |
| `impuesto_a_favor` | TEXT | Impuesto a favor (texto) |
| `concepto_de_pago` | TEXT | Concepto del pago |
| `pago_por_concepto` | TEXT | Monto por concepto |
| `numero_de_concepto` | TEXT | Numero de concepto |
| `path` | TEXT | Ruta del archivo PDF |
| `fecha_captura` | TIMESTAMP | Fecha de insercion en BD |
| `pdf_base64` | TEXT | Contenido del PDF en base64 (para visualizacion) |
| `ruta_archivo` | TEXT | Ruta origen del archivo (interno, no se expone al frontend) |

### py_pago

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `tipo_pdf` | TEXT | Tipo de PDF |
| `rfc` | TEXT | RFC del contribuyente |
| `entidad` | TEXT | Entidad bancaria |
| `tipo` | TEXT | Tipo de pago |
| `fecha_presentacion` | TEXT | Fecha de presentacion |
| `importe_a_pagar` | TEXT | Importe pagado |
| `linea_de_captura` | TEXT | Linea de captura (JOIN key) |
| `num_operacion` | TEXT | Numero de operacion |
| `vigencia` | TEXT | Vigencia |
| `tipo_de_declaracion` | TEXT | Tipo de declaracion |
| `fecha_de_pago` | TEXT | Fecha en que se realizo el pago |
| `concepto_de_pago` | TEXT | Concepto del pago |
| `pago_por_concepto` | TEXT | Monto por concepto |
| `numero_de_concepto` | TEXT | Numero de concepto |
| `path` | TEXT | Ruta del archivo PDF |
| `fecha_captura` | TIMESTAMP | Fecha de insercion en BD |
| `pdf_base64` | TEXT | Contenido del PDF en base64 (para visualizacion) |
| `ruta_archivo` | TEXT | Ruta origen del archivo (interno, no se expone al frontend) |

### Vista: py_dashboard_declaraciones

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `razon_social` | TEXT | Razon social |
| `rfc` | TEXT | RFC del contribuyente |
| `fecha_y_hora_presentacion` | TEXT | Fecha de presentacion (texto original) |
| `linea_de_captura` | TEXT | Linea de captura (unica por operacion, puede ser null si impuesto a favor) |
| `impuesto_a_favor` | TEXT | Impuesto a favor |
| `ejercicio` | TEXT | Ano fiscal |
| `periodo_de_declaracion` | TEXT | Periodo |
| `num_de_operacion` | TEXT | Numero de operacion SAT de la declaracion (puede ser null) |
| `total_a_pagar_unico` | DECIMAL(18,2) | Monto deduplicado (solo cuenta 1 vez por linea de captura) |
| `estatus_pago` | TEXT | `Pagado`, `Pendiente` o `Vencido` |
| `fecha_de_pago` | TEXT | Fecha de pago (si existe) |
| `vigente_hasta` | TEXT | Fecha de vigencia de la linea de captura |
| `tiene_pdf` | BOOLEAN | Indica si la declaracion tiene PDF disponible |
| `tiene_pdf_pago` | BOOLEAN | Indica si el pago asociado tiene PDF disponible |
| `num_operacion_pago` | TEXT | Numero de operacion del pago (para obtener PDF de pago) |

> **Importante**: `pdf_base64` NO se incluye en el listado. Se obtiene via el endpoint `/pdf`.

**Logica de Estatus:**
- **Pagado**: Existe registro en `py_pago` con `fecha_de_pago` no vacia
- **Pendiente**: No hay pago Y `vigente_hasta >= hoy`
- **Vencido**: No hay pago Y `vigente_hasta < hoy`

---

## Endpoints

### 1. Listar Declaraciones

```http
GET /api/dashboard-declaraciones?organizacion={org}
```

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |
| `rfc` | string | No | Filtrar por RFC exacto (12-13 caracteres) |
| `razon_social` | string | No | Busqueda parcial por razon social |
| `ejercicio` | string | No | Filtrar por ano fiscal (ej: "2026") |
| `periodo` | string | No | Filtrar por periodo (ej: "enero") |
| `estatus_pago` | string | No | `Pagado`, `Pendiente`, `Vencido` (o varios separados por coma) |
| `busqueda` | string | No | Busqueda general (RFC, razon social, linea captura, concepto) |
| `page` | number | No | Pagina (default: 1) |
| `limit` | number | No | Registros por pagina (default: 20, max: 100) |
| `sort_by` | string | No | Campo para ordenar |
| `sort_order` | string | No | `asc` o `desc` (default: `desc`) |
| `contador_id` | number | No | **Solo admin.** Filtra por contribuyentes del usuario con ese ID |

#### Campos de Ordenamiento Validos

`rfc`, `razon_social`, `ejercicio`, `fecha_y_hora_presentacion`, `total_a_pagar_unico`, `estatus_pago`, `fecha_de_pago`, `linea_de_captura`

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": [
    {
      "razon_social": "Empresa SA de CV",
      "rfc": "XAXX010101000",
      "fecha_y_hora_presentacion": "15/01/2026 10:30:00",
      "linea_de_captura": "0426 04XB 9900 4857 6224",
      "impuesto_a_favor": null,
      "total_a_pagar_unico": 1500.00,
      "estatus_pago": "Pagado",
      "fecha_de_pago": "16/01/2026",
      "vigente_hasta": "31/01/2026",
      "ejercicio": "2026",
      "periodo_de_declaracion": "Enero",
      "num_de_operacion": "OP2026010112345",
      "tiene_pdf": true,
      "tiene_pdf_pago": true,
      "num_operacion_pago": "250900001976"
    },
    {
      "razon_social": "Empresa SA de CV",
      "rfc": "XAXX010101000",
      "fecha_y_hora_presentacion": "15/02/2026 09:00:00",
      "linea_de_captura": null,
      "impuesto_a_favor": "500.00",
      "total_a_pagar_unico": 0,
      "estatus_pago": "Pagado",
      "fecha_de_pago": null,
      "vigente_hasta": null,
      "ejercicio": "2026",
      "periodo_de_declaracion": "Febrero",
      "num_de_operacion": null,
      "tiene_pdf": true,
      "tiene_pdf_pago": false,
      "num_operacion_pago": null
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
    "total_pagadas": 80,
    "total_pendientes": 50,
    "total_vencidas": 20,
    "porcentaje_cumplimiento": 53,
    "monto_total_declarado": 250000.00,
    "monto_pagado": 150000.00,
    "monto_pendiente": 100000.00,
    "contribuyentes_activos": 45
  },
  "filtros_aplicados": {
    "estatus_pago": "Pendiente"
  },
  "rate_limit_remaining": 55
}
```

> **Nota sobre PDFs**: Los campos `tiene_pdf` y `tiene_pdf_pago` indican si hay PDF disponible. El contenido (base64) NO se incluye en el listado. Para obtenerlo, usar el endpoint `/pdf`.
>
> **Campos clave para obtener PDFs**:
> - **PDF Declaracion**: Usar `num_de_operacion` (si existe), o `rfc` + `linea_de_captura`, o `rfc` + `ejercicio` + `periodo_de_declaracion`
> - **PDF Pago**: Usar `num_operacion_pago` como `num_de_operacion` con `tabla=py_pago`, o `rfc` + `linea_de_captura` con `tabla=py_pago`

---

### 2. Obtener PDF de Declaracion/Pago

```http
GET /api/dashboard-declaraciones/pdf?organizacion={org}&...
```

Soporta **3 estrategias de busqueda** (usa la primera disponible):

1. **Por `num_de_operacion`** — cuando el campo existe (16% de registros)
2. **Por `rfc` + `linea_de_captura`** — declaraciones con pago pendiente/realizado (44%)
3. **Por `rfc` + `ejercicio` + `periodo`** — declaraciones con impuesto a favor, sin linea de captura (40%)

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |
| `tabla` | string | No | `py_declaracion` (default) o `py_pago` |
| `num_de_operacion` | string | Condicional | Numero de operacion SAT (si existe) |
| `rfc` | string | Condicional | RFC del contribuyente (requerido si no hay num_de_operacion) |
| `linea_de_captura` | string | No | Linea de captura (unica por operacion, si existe) |
| `ejercicio` | string | No | Ano fiscal (para desambiguar cuando no hay linea_de_captura) |
| `periodo` | string | No | Periodo de declaracion (para desambiguar cuando no hay linea_de_captura) |

> **Regla**: Se requiere al menos `num_de_operacion` **o** `rfc`. Si no se envia ninguno, retorna 400.

#### Logica de busqueda del backend

**py_declaracion:**
```
si num_de_operacion existe:
    buscar por num_de_operacion
sino si rfc existe:
    si linea_de_captura existe:
        buscar por rfc + linea_de_captura
    sino:
        buscar por rfc + ejercicio + periodo (caso impuesto a favor)
```

**py_pago:**
```
si num_de_operacion existe:
    buscar por num_operacion
sino si rfc + linea_de_captura existen:
    buscar por rfc + linea_de_captura
```

> En ambos casos se ordena por `fecha_captura DESC` para obtener el registro mas reciente.

#### Ejemplos de llamada

```
# --- DECLARACIONES (tabla=py_declaracion, default) ---

# Con num_de_operacion (preferido cuando existe)
GET /pdf?organizacion=mi_empresa&num_de_operacion=OP2026010112345

# Con linea de captura (declaraciones con pago)
GET /pdf?organizacion=mi_empresa&rfc=GOBB840106PN4&linea_de_captura=0426%2004XB%209900%204857%206224

# Sin linea de captura (impuesto a favor)
GET /pdf?organizacion=mi_empresa&rfc=GOBB840106PN4&ejercicio=2025&periodo=Diciembre

# --- PAGOS (tabla=py_pago) ---

# Con num_operacion_pago (todos los pagos lo tienen)
GET /pdf?organizacion=mi_empresa&num_de_operacion=250900001976&tabla=py_pago

# Fallback por rfc + linea de captura
GET /pdf?organizacion=mi_empresa&rfc=GOBB840106PN4&linea_de_captura=0426%2004XB%209900%204857%206224&tabla=py_pago
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZw...",
  "rfc": "XAXX010101000"
}
```

#### Respuesta No Encontrado (404)

```json
{
  "error": "PDF no encontrado",
  "code": "NOT_FOUND"
}
```

> **Seguridad**: Un contador solo puede obtener PDFs de contribuyentes que tiene asignados. Si intenta acceder a un PDF de otro contribuyente, recibira 404.

---

### 3. KPIs (Polling)

```http
GET /api/dashboard-declaraciones/kpis?organizacion={org}
```

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |
| `rfc` | string | No | Filtrar KPIs por RFC |
| `ejercicio` | string | No | Filtrar KPIs por ejercicio |
| `contador_id` | number | No | **Solo admin.** Filtra KPIs por contribuyentes del usuario con ese ID |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "kpis": {
    "total_declaraciones": 150,
    "total_pagadas": 80,
    "total_pendientes": 50,
    "total_vencidas": 20,
    "porcentaje_cumplimiento": 53,
    "monto_total_declarado": 250000.00,
    "monto_pagado": 150000.00,
    "monto_pendiente": 100000.00,
    "contribuyentes_activos": 45
  },
  "filtros": { "rfc": null, "ejercicio": null, "contador_id": null },
  "timestamp": "2026-02-18T10:00:00Z"
}
```

**Cache**: `Cache-Control: private, max-age=30`

> **Nota**: Los KPIs de un contador solo reflejan los contribuyentes que tiene asignados.
> Cuando un admin usa `contador_id`, los KPIs reflejan unicamente ese usuario.

---

### 4. Ejercicios Disponibles

```http
GET /api/dashboard-declaraciones/ejercicios?organizacion={org}
```

Devuelve los años fiscales disponibles para el dropdown de filtro. Respeta los permisos del usuario: un contador solo ve los años de sus contribuyentes asignados.

**Cache**: `Cache-Control: private, max-age=120`

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |
| `contador_id` | number | No | **Solo admin.** Filtra ejercicios por contribuyentes del usuario con ese ID |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "ejercicios": ["2026", "2025", "2024", "2023", "2022", "2021", "2020"]
}
```

> Los ejercicios vienen ordenados de mas reciente a mas antiguo.

---

### 5. Lista de Usuarios (solo administradores)

```http
GET /api/dashboard-declaraciones/usuarios?organizacion={org}
```

Devuelve todos los usuarios de la organizacion con su conteo de contribuyentes activos asignados. Usado para poblar el dropdown de filtro por contador en el frontend.

**Requiere**: Rol `administrador`. Retorna 403 para cualquier otro rol.

**Cache**: `Cache-Control: private, max-age=60`

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "usuarios": [
    {
      "id": 2,
      "nombre": "Martin",
      "correo": "martin@empresa.com",
      "tipo_usuario": "administrador",
      "total_contribuyentes": 5
    },
    {
      "id": 4,
      "nombre": "Joseline Lopez",
      "correo": "joseline@empresa.com",
      "tipo_usuario": "contador",
      "total_contribuyentes": 28
    }
  ]
}
```

> Los usuarios vienen ordenados: primero `administrador`, luego `contador`, ambos por nombre.

---

### 6. Verificar Inicializacion

```http
GET /api/dashboard-declaraciones/initialize?organizacion={org}
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "initialized": true,
  "stats": {
    "total_registros": 150,
    "pagados": 80,
    "pendientes": 50,
    "vencidos": 20
  }
}
```

---

### 7. Inicializar Dashboard

```http
POST /api/dashboard-declaraciones/initialize
```

**Requiere**: Rol `administrador`

#### Body

```json
{
  "organizacion": "mi_empresa"
}
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Dashboard fiscal inicializado correctamente",
  "estadisticas": {
    "total": 150,
    "pagados": 80,
    "pendientes": 50,
    "vencidos": 20
  }
}
```

> Crea las tablas `py_declaracion` y `py_pago` (si no existen), agrega columnas `pdf_base64` y `ruta_archivo` a tablas existentes, y crea/actualiza la vista `py_dashboard_declaraciones`. No requiere sincronizacion — la vista es en tiempo real.

---

## Codigos de Error

| Codigo HTTP | Codigo | Descripcion |
|-------------|--------|-------------|
| 400 | `MISSING_ORG` | Falta el parametro organizacion |
| 400 | `MISSING_PARAM` | Falta un parametro requerido (ej: num_de_operacion) |
| 400 | `INVALID_PARAM` | Parametro con valor invalido |
| 400 | `INVALID_JSON` | Body JSON invalido |
| 401 | `AUTH_FAILED` | Token JWT invalido o expirado |
| 403 | - | Sin permisos (no es administrador) |
| 404 | `NOT_INITIALIZED` | Vista no creada para esta org |
| 404 | `NOT_FOUND` | Recurso no encontrado (ej: PDF) |
| 429 | `RATE_LIMITED` | Demasiadas solicitudes (60/min) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |
| 500 | `INIT_FAILED` | Error al crear la vista |

---

## Ejemplos de Uso (Frontend)

### Hook para consultar declaraciones

```typescript
import { useState, useEffect, useCallback } from 'react';

interface DeclaracionRow {
  razon_social: string | null;
  rfc: string | null;
  fecha_y_hora_presentacion: string | null;
  linea_de_captura: string | null;
  impuesto_a_favor: string | null;
  total_a_pagar_unico: number;
  estatus_pago: 'Pagado' | 'Pendiente' | 'Vencido';
  fecha_de_pago: string | null;
  vigente_hasta: string | null;
  ejercicio: string | null;
  periodo_de_declaracion: string | null;
  num_de_operacion: string | null;
  tiene_pdf: boolean;
  tiene_pdf_pago: boolean;
  num_operacion_pago: string | null;
}

interface FiltrosDeclaraciones {
  rfc?: string;
  razon_social?: string;
  ejercicio?: string;
  periodo?: string;
  estatus_pago?: string;
  busqueda?: string;
}

export function useDashboardDeclaraciones(
  organizacion: string,
  filtros: FiltrosDeclaraciones = {},
  page = 1,
  limit = 20
) {
  const [data, setData] = useState<DeclaracionRow[]>([]);
  const [kpis, setKpis] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        organizacion,
        page: String(page),
        limit: String(limit),
      });

      if (filtros.rfc) params.set('rfc', filtros.rfc);
      if (filtros.razon_social) params.set('razon_social', filtros.razon_social);
      if (filtros.ejercicio) params.set('ejercicio', filtros.ejercicio);
      if (filtros.periodo) params.set('periodo', filtros.periodo);
      if (filtros.estatus_pago) params.set('estatus_pago', filtros.estatus_pago);
      if (filtros.busqueda) params.set('busqueda', filtros.busqueda);

      const res = await fetch(`/api/dashboard-declaraciones?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cargar datos');
      }

      const result = await res.json();
      setData(result.data);
      setKpis(result.kpis);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [organizacion, filtros, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, kpis, pagination, loading, error, refetch: fetchData };
}
```

### Hook para obtener y visualizar PDF

```typescript
interface PdfLookupParams {
  num_de_operacion?: string | null;
  rfc?: string | null;
  linea_de_captura?: string | null;
  ejercicio?: string | null;
  periodo_de_declaracion?: string | null;
}

export function usePdfViewer(organizacion: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verPdf = useCallback(async (
    lookup: PdfLookupParams,
    tabla: 'py_declaracion' | 'py_pago' = 'py_declaracion'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organizacion, tabla });

      // Enviar todos los campos disponibles para maximizar la busqueda
      if (lookup.num_de_operacion) params.set('num_de_operacion', lookup.num_de_operacion);
      if (lookup.rfc) params.set('rfc', lookup.rfc);
      if (lookup.linea_de_captura) params.set('linea_de_captura', lookup.linea_de_captura);
      if (lookup.ejercicio) params.set('ejercicio', lookup.ejercicio);
      if (lookup.periodo_de_declaracion) params.set('periodo', lookup.periodo_de_declaracion);

      const res = await fetch(`/api/dashboard-declaraciones/pdf?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al obtener PDF');
      }

      const result = await res.json();

      // Convertir base64 a Blob y abrir en nueva ventana
      const byteCharacters = atob(result.pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      return result.pdf_base64;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [organizacion]);

  return { verPdf, loading, error };
}
```

### Ejemplo de uso en componente (tabla con boton PDF)

```tsx
function TablaDeclaraciones({ organizacion }: { organizacion: string }) {
  const { data, kpis, pagination, loading } = useDashboardDeclaraciones(organizacion);
  const { verPdf, loading: pdfLoading } = usePdfViewer(organizacion);

  if (loading) return <p>Cargando...</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>RFC</th>
          <th>Razon Social</th>
          <th>Ejercicio</th>
          <th>Periodo</th>
          <th>Total a Pagar</th>
          <th>Estatus</th>
          <th>PDF Declaracion</th>
          <th>PDF Pago</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td>{row.rfc}</td>
            <td>{row.razon_social}</td>
            <td>{row.ejercicio}</td>
            <td>{row.periodo_de_declaracion}</td>
            <td>${row.total_a_pagar_unico?.toFixed(2)}</td>
            <td>{row.estatus_pago}</td>
            <td>
              {row.tiene_pdf ? (
                <button
                  onClick={() => verPdf({
                    num_de_operacion: row.num_de_operacion,
                    rfc: row.rfc,
                    linea_de_captura: row.linea_de_captura,
                    ejercicio: row.ejercicio,
                    periodo_de_declaracion: row.periodo_de_declaracion,
                  })}
                  disabled={pdfLoading}
                >
                  Ver PDF
                </button>
              ) : (
                <span>-</span>
              )}
            </td>
            <td>
              {row.tiene_pdf_pago ? (
                <button
                  onClick={() => verPdf({
                    num_de_operacion: row.num_operacion_pago,
                    rfc: row.rfc,
                    linea_de_captura: row.linea_de_captura,
                  }, 'py_pago')}
                  disabled={pdfLoading}
                >
                  Ver Pago
                </button>
              ) : (
                <span>-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Hook para polling de KPIs

```typescript
export function useKPIsPolling(organizacion: string, intervalMs = 30000) {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      const res = await fetch(
        `/api/dashboard-declaraciones/kpis?organizacion=${organizacion}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
      }
    };

    fetchKPIs();
    const interval = setInterval(fetchKPIs, intervalMs);
    return () => clearInterval(interval);
  }, [organizacion, intervalMs]);

  return kpis;
}
```

### Inicializar (una sola vez por org)

```typescript
async function inicializarDashboard(organizacion: string) {
  const res = await fetch('/api/dashboard-declaraciones/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ organizacion }),
  });
  return res.json();
}
```

---

## Rate Limiting

- **Limite**: 60 requests/min por usuario+organizacion
- **Polling recomendado**: Cada 30 segundos para KPIs
- **Debounce en filtros**: 300ms antes de enviar request

---

## Limpieza de Duplicados

Los scripts de automatizacion Python ejecutan limpieza automatica de duplicados al finalizar cada sincronizacion. Las tablas y sus criterios de deduplicacion son:

| Tabla | Deduplicar por | Conserva |
|---|---|---|
| `py_declaracion` | `rfc` + `num_de_operacion` + `numero_de_concepto` | Registro mas reciente |
| `py_pago` | `rfc` + `linea_de_captura` + `numero_de_concepto` | Registro mas reciente |
| `py_constancia_de_situacion_fiscal` | `rfc` | Registro mas reciente |
| `py_diot` | `folio` | Registro mas reciente |
| `py_opinion_de_cumplimiento` | `rfc` + `folio` | Registro mas reciente |
| `py_informacion_contribuyente` | `rfc` | Registro mas reciente |
