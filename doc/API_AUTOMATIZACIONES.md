# API de Automatizaciones

> **IMPORTANTE**: Ver [CAMBIOS_SEGURIDAD_ORGANIZACIONES.md](./CAMBIOS_SEGURIDAD_ORGANIZACIONES.md) para la guía completa de migración de seguridad.

## Resumen

Sistema completo para gestionar automatizaciones programadas con ejecución basada en expresiones cron. Las automatizaciones se ejecutan automáticamente según su programación y los logs se registran con zona horaria de México.

## Autenticación

Todos los endpoints requieren **autenticación vía JWT en cookies**. Incluir `credentials: 'include'` en todas las peticiones.

```typescript
fetch('/api/automatizaciones', { credentials: 'include' });
```

> **Nota**: Los parámetros `correo` y `correo_admin` ya NO son necesarios. El backend los obtiene del JWT.

---

## Características Principales

- **Ejecución programada**: Las automatizaciones se ejecutan automáticamente según expresión cron
- **Zona horaria México**: Todas las fechas se manejan en `America/Mexico_City`
- **Multi-tenant**: Cada organización tiene sus propias automatizaciones aisladas
- **Logs detallados**: Registro completo de cada ejecución con output del script
- **Variables personalizadas**: Soporte para variables de entorno custom por automatización

---

## Endpoints

### Base URL
```
/api/automatizaciones
```

---

## 1. Listar Automatizaciones (GET)

**Solo administradores** pueden acceder.

```
GET /api/automatizaciones?organizacion={org}
```

### Parámetros Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `organizacion` | string | No | Nombre de la organización (opcional, usa la org activa del JWT si no se envía) |

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "automatizaciones": [
      {
        "id": 1,
        "nombre": "prod_sincronizacion_diaria",
        "nombre_display": "sincronizacion_diaria",
        "descripcion": "Sincroniza datos del SAT diariamente",
        "script_path": "org_miorg/sincronizacion.py",
        "cron_expresion": "0 8 * * *",
        "activo": true,
        "variables_personalizadas": {
          "RFC": "ABC123456789",
          "MODO": "completo"
        },
        "ultima_ejecucion": "2024-01-21T08:00:00.000Z",
        "ultima_estado": "exitoso",
        "creado_por": 1,
        "creado_por_nombre": "Admin",
        "creado_por_correo": "admin@empresa.com",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-21T08:00:00.000Z",
        "total_ejecuciones": 21,
        "ejecuciones_exitosas": 20,
        "ejecuciones_error": 1
      }
    ]
  }
}
```

### Notas
- Solo se listan automatizaciones con prefijo `prod_`
- `nombre_display` es el nombre sin el prefijo `prod_`
- Incluye conteos de ejecuciones para mostrar estadísticas

---

## 2. Crear Automatización (POST)

**Solo administradores** pueden crear.

```
POST /api/automatizaciones
Content-Type: application/json
```

### Body

```json
{
  "organizacion": "MiEmpresa",
  "nombre": "prod_mi_automatizacion",
  "descripcion": "Descripción de la automatización",
  "script_path": "org_miempresa/mi_script.py",
  "cron_expresion": "0 8 * * *",
  "activo": false,
  "variables_personalizadas": {
    "VARIABLE1": "valor1",
    "VARIABLE2": "valor2"
  }
}
```

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `organizacion` | string | No | Nombre de la organización (opcional, usa la org activa del JWT) |
| `nombre` | string | Sí | **Debe empezar con `prod_`** |
| `descripcion` | string | No | Descripción de la automatización |
| `script_path` | string | Sí | Ruta relativa desde `app/Automatizacion/` |
| `cron_expresion` | string | Sí | Expresión cron (5 campos) |
| `activo` | boolean | No | Default: `false` (desactivada) |
| `variables_personalizadas` | object | No | Variables custom para el script |

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Automatización creada exitosamente",
  "data": {
    "id": 1,
    "nombre": "prod_mi_automatizacion",
    "nombre_display": "mi_automatizacion",
    ...
  }
}
```

### Errores Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | El nombre debe empezar con "prod_" | Nombre no tiene prefijo |
| 400 | Formato de expresión cron inválido | Cron malformado |
| 403 | Solo administradores pueden crear | Usuario no es admin |

---

## 3. Editar Automatización (PATCH)

**Solo administradores** pueden editar.

```
PATCH /api/automatizaciones
Content-Type: application/json
```

### Body

```json
{
  "organizacion": "MiEmpresa",
  "id_automatizacion": 1,
  "activo": true,
  "cron_expresion": "30 9 * * 1-5",
  "variables_personalizadas": {
    "NUEVA_VAR": "nuevo_valor"
  }
}
```

> **Nota**: El campo `organizacion` es opcional. Si no se envía, usa la organización activa del JWT.

### Campos Editables

| Campo | Descripción |
|-------|-------------|
| `nombre` | Renombrar (mantener prefijo `prod_`) |
| `descripcion` | Actualizar descripción |
| `script_path` | Cambiar script |
| `cron_expresion` | Cambiar programación |
| `activo` | Activar/desactivar |
| `variables_personalizadas` | Actualizar variables |

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Automatización actualizada exitosamente",
  "data": { ... }
}
```

### Nota Importante
Al editar una automatización, el **scheduler se recarga automáticamente** para aplicar los cambios de inmediato.

---

## 4. Eliminar Automatización (DELETE)

**Solo administradores** pueden eliminar.

```
DELETE /api/automatizaciones
Content-Type: application/json
```

### Body

```json
{
  "organizacion": "MiEmpresa",
  "id_automatizacion": 1
}
```

> **Nota**: El campo `organizacion` es opcional. Si no se envía, usa la organización activa del JWT.

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Automatización eliminada exitosamente",
  "data": {
    "nombre": "prod_mi_automatizacion",
    "script_path": "org_miempresa/mi_script.py"
  }
}
```

### Nota
Los logs de ejecución se eliminan automáticamente (CASCADE).

---

## Expresiones Cron

Formato de 5 campos:

```
┌───────────── minuto (0-59)
│ ┌───────────── hora (0-23)
│ │ ┌───────────── día del mes (1-31)
│ │ │ ┌───────────── mes (1-12)
│ │ │ │ ┌───────────── día de la semana (0-6, Dom=0)
│ │ │ │ │
* * * * *
```

### Ejemplos Comunes

| Expresión | Descripción |
|-----------|-------------|
| `0 8 * * *` | Todos los días a las 8:00 AM |
| `30 22 * * *` | Todos los días a las 10:30 PM |
| `0 9 * * 1-5` | Lunes a Viernes a las 9:00 AM |
| `0 0 1 * *` | Primer día de cada mes a medianoche |
| `*/15 * * * *` | Cada 15 minutos |
| `0 */2 * * *` | Cada 2 horas |

### Zona Horaria
Todas las expresiones cron usan **America/Mexico_City**.

---

## Variables de Entorno para Scripts

Cuando se ejecuta un script, recibe estas variables automáticamente:

| Variable | Descripción |
|----------|-------------|
| `VAR_LOCAL_ORG` | Nombre de la organización |
| `VAR_LOCAL_DATABASE_NAME` | Nombre de la BD (org_*) |
| `VAR_LOCAL_ADMIN_EMAIL` | Email del admin o `scheduler@system` |
| `VAR_LOCAL_AUTOMATIZACION_ID` | ID de la automatización |
| `VAR_LOCAL_EXECUTION_ID` | ID único de esta ejecución |
| `VAR_LOCAL_LOG_ID` | ID del registro de log |
| `VAR_LOCAL_SCHEDULED` | `true` si es ejecución programada |
| `VAR_LOCAL_{CUSTOM}` | Variables personalizadas (en mayúsculas) |

### Ejemplo en Python

```python
import os

org = os.environ.get('VAR_LOCAL_ORG')
db_name = os.environ.get('VAR_LOCAL_DATABASE_NAME')
mi_var = os.environ.get('VAR_LOCAL_MI_VARIABLE')

print(f"Ejecutando para organización: {org}")
print(f"Base de datos: {db_name}")
print(f"Mi variable: {mi_var}")
```

---

## Estados de Ejecución

| Estado | Descripción |
|--------|-------------|
| `en_ejecucion` | Script ejecutándose actualmente |
| `exitoso` | Terminó con código 0 sin errores |
| `advertencia` | Terminó con código 0 pero hubo warnings en stderr |
| `error` | Terminó con código != 0 o hubo excepciones |

---

## Implementación Frontend

### 1. Listar Automatizaciones

```typescript
interface Automatizacion {
  id: number;
  nombre: string;
  nombre_display: string;
  descripcion: string | null;
  script_path: string;
  cron_expresion: string;
  activo: boolean;
  variables_personalizadas: Record<string, string>;
  ultima_ejecucion: string | null;
  ultima_estado: 'exitoso' | 'error' | 'advertencia' | 'en_ejecucion' | null;
  creado_por_nombre: string;
  creado_por_correo: string;
  created_at: string;
  updated_at: string;
  total_ejecuciones: number;
  ejecuciones_exitosas: number;
  ejecuciones_error: number;
}

async function listarAutomatizaciones(organizacion?: string) {
  // organizacion es opcional - si no se envía, usa la org activa del JWT
  const url = organizacion
    ? `/api/automatizaciones?organizacion=${encodeURIComponent(organizacion)}`
    : '/api/automatizaciones';

  const res = await fetch(url, {
    credentials: 'include'  // Importante para enviar cookies JWT
  });
  const data = await res.json();

  if (data.success) {
    return data.data.automatizaciones as Automatizacion[];
  }
  throw new Error(data.message);
}
```

### 2. Crear Automatización

```typescript
interface CrearAutomatizacionDTO {
  organizacion?: string;  // Opcional: si no se envía, usa la org activa del JWT
  nombre: string; // Debe empezar con "prod_"
  descripcion?: string;
  script_path: string;
  cron_expresion: string;
  activo?: boolean;
  variables_personalizadas?: Record<string, string>;
}

async function crearAutomatizacion(data: CrearAutomatizacionDTO) {
  // Validar prefijo
  if (!data.nombre.startsWith('prod_')) {
    throw new Error('El nombre debe empezar con "prod_"');
  }

  const res = await fetch('/api/automatizaciones', {
    method: 'POST',
    credentials: 'include',  // Importante para enviar cookies JWT
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return await res.json();
}
```

### 3. Activar/Desactivar

```typescript
async function toggleAutomatizacion(
  id: number,
  activo: boolean,
  organizacion?: string  // Opcional: si no se envía, usa la org activa del JWT
) {
  const res = await fetch('/api/automatizaciones', {
    method: 'PATCH',
    credentials: 'include',  // Importante para enviar cookies JWT
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizacion,
      id_automatizacion: id,
      activo
    })
  });

  return await res.json();
}
```

### 4. Mostrar Estado con Colores

```typescript
function getEstadoColor(estado: string | null): string {
  switch (estado) {
    case 'exitoso': return 'green';
    case 'advertencia': return 'yellow';
    case 'error': return 'red';
    case 'en_ejecucion': return 'blue';
    default: return 'gray';
  }
}

function getEstadoTexto(estado: string | null): string {
  switch (estado) {
    case 'exitoso': return 'Exitoso';
    case 'advertencia': return 'Con advertencias';
    case 'error': return 'Error';
    case 'en_ejecucion': return 'En ejecución';
    default: return 'Sin ejecutar';
  }
}
```

### 5. Formatear Cron para Humanos

```typescript
function formatearCron(cron: string): string {
  const partes = cron.split(' ');
  if (partes.length !== 5) return cron;

  const [min, hora, diaM, mes, diaS] = partes;

  // Casos comunes
  if (diaM === '*' && mes === '*' && diaS === '*') {
    return `Diario a las ${hora}:${min.padStart(2, '0')}`;
  }
  if (diaM === '*' && mes === '*' && diaS === '1-5') {
    return `Lun-Vie a las ${hora}:${min.padStart(2, '0')}`;
  }
  if (min.startsWith('*/')) {
    return `Cada ${min.slice(2)} minutos`;
  }
  if (hora.startsWith('*/')) {
    return `Cada ${hora.slice(2)} horas`;
  }

  return cron;
}
```

---

## Aislamiento por Organización

- Cada organización **solo ve sus propias automatizaciones**
- Los logs de ejecución están aislados por organización
- El scheduler maneja múltiples organizaciones pero mantiene datos separados
- Un administrador de Org A **no puede ver** datos de Org B

---

## Troubleshooting

### La automatización no ejecuta

1. Verificar que `activo = true`
2. Verificar expresión cron válida
3. Revisar logs del servidor buscando `[Scheduler]`
4. Verificar que el script existe en la ruta especificada

### Ejecuta dos veces

El scheduler ahora usa variables globales para evitar duplicación en hot-reload de Next.js. Si persiste el problema:
1. Reiniciar completamente el servidor (no hot-reload)
2. Verificar que no hay múltiples instancias del servidor corriendo

### Timezone incorrecto

Las fechas se guardan en zona horaria de México (`America/Mexico_City`). Si ves diferencias:
1. Verificar configuración de timezone del servidor de BD
2. El frontend debe mostrar las fechas considerando que ya están en hora de México

---

## Endpoints Relacionados

- [API Scheduler](./API_AUTOMATIZACIONES_SCHEDULER.md) - Control del scheduler
- [API Ejecutar](./API_AUTOMATIZACIONES_EJECUTAR.md) - Ejecución manual
- [API Logs](./API_AUTOMATIZACIONES_LOGS.md) - Consulta de logs
- [API Scripts Disponibles](./API_AUTOMATIZACIONES_DISPONIBLES.md) - Listar scripts