# API Dashboard Declaraciones v2

> **Base URL**: `/api/dashboard-declaraciones`
> **Version**: 2.0.0
> **Fecha**: 2026-02-10

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

### Vista: py_dashboard_declaraciones

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `razon_social` | TEXT | Razon social |
| `rfc` | TEXT | RFC |
| `fecha_y_hora_presentacion` | TEXT | Fecha de presentacion (texto original) |
| `linea_de_captura` | TEXT | Linea de captura |
| `impuesto_a_favor` | TEXT | Impuesto a favor |
| `concepto_de_pago` | TEXT | Concepto de pago |
| `ejercicio` | TEXT | Ano fiscal |
| `periodo_de_declaracion` | TEXT | Periodo |
| `total_a_pagar_unico` | DECIMAL(18,2) | Monto deduplicado (solo cuenta 1 vez por linea de captura) |
| `estatus_pago` | TEXT | `Pagado`, `Pendiente` o `Vencido` |
| `fecha_de_pago` | TEXT | Fecha de pago (si existe) |

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
      "linea_de_captura": "ABC123456789",
      "impuesto_a_favor": null,
      "total_a_pagar_unico": 1500.00,
      "concepto_de_pago": "ISR",
      "estatus_pago": "Pendiente",
      "fecha_de_pago": null,
      "ejercicio": "2026",
      "periodo_de_declaracion": "Enero"
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

---

### 2. KPIs (Polling)

```http
GET /api/dashboard-declaraciones/kpis?organizacion={org}
```

#### Parametros de Query

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organizacion` | string | Si | Nombre de la organizacion |
| `rfc` | string | No | Filtrar KPIs por RFC |
| `ejercicio` | string | No | Filtrar KPIs por ejercicio |

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
  "filtros": { "rfc": null, "ejercicio": null },
  "timestamp": "2026-02-10T15:35:00Z"
}
```

**Cache**: `Cache-Control: private, max-age=30`

---

### 3. Verificar Inicializacion

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

### 4. Inicializar Dashboard

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

> Crea las tablas `py_declaracion` y `py_pago` (si no existen) y la vista `py_dashboard_declaraciones`. No requiere sincronizacion — la vista es en tiempo real.

---

## Codigos de Error

| Codigo HTTP | Codigo | Descripcion |
|-------------|--------|-------------|
| 400 | `MISSING_ORG` | Falta el parametro organizacion |
| 400 | `INVALID_JSON` | Body JSON invalido |
| 401 | `AUTH_FAILED` | Token JWT invalido o expirado |
| 403 | - | Sin permisos (no es administrador) |
| 404 | `NOT_INITIALIZED` | Vista no creada para esta org |
| 429 | `RATE_LIMITED` | Demasiadas solicitudes (60/min) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |
| 500 | `INIT_FAILED` | Error al crear la vista |

---

## Ejemplos de Uso (Frontend)

### Hook para consultar declaraciones

```typescript
import { useState, useEffect, useCallback } from 'react';

interface FiltrosDeclaraciones {
  rfc?: string;
  razon_social?: string;
  ejercicio?: string;
  periodo?: string;
  estatus_pago?: string; // 'Pagado' | 'Pendiente' | 'Vencido'
  busqueda?: string;
}

export function useDashboardDeclaraciones(
  organizacion: string,
  filtros: FiltrosDeclaraciones = {},
  page = 1,
  limit = 20
) {
  const [data, setData] = useState([]);
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

      // Agregar filtros no vacios
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
