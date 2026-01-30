# Sistema de Automatizaciones Programadas (Scheduler)

> **IMPORTANTE**: Ver [CAMBIOS_SEGURIDAD_ORGANIZACIONES.md](./CAMBIOS_SEGURIDAD_ORGANIZACIONES.md) para la guía completa de migración de seguridad.

## Resumen

El sistema de automatizaciones permite programar la ejecución de scripts Python según expresiones cron. El scheduler se inicia automáticamente cuando arranca la aplicación Next.js.

## Autenticación

Todos los endpoints requieren **autenticación vía JWT en cookies**. Incluir `credentials: 'include'` en todas las peticiones.

> **Nota**: Los parámetros `correo` y `correo_admin` ya NO son necesarios. El backend los obtiene del JWT.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              instrumentation.ts                      │    │
│  │         (Inicia scheduler al arrancar)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                lib/scheduler.ts                      │    │
│  │  - Carga automatizaciones de todas las org_*         │    │
│  │  - Programa tareas con node-cron                     │    │
│  │  - Ejecuta scripts Python según cron_expresion       │    │
│  │  - Guarda logs en BD                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              app/Automatizacion/                     │    │
│  │           (Scripts Python a ejecutar)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Inicio Automático

El scheduler se inicia automáticamente cuando Next.js arranca, gracias al archivo `instrumentation.ts`:

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarScheduler } = await import('./lib/scheduler');
    await iniciarScheduler();
  }
}
```

**Requisito:** La opción `instrumentationHook` debe estar habilitada en `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
```

---

## Endpoints del Scheduler

### 1. Ver Estado del Scheduler (GET)

```
GET /api/automatizaciones/scheduler?organizacion=MiOrg
```

> **Nota**: El parámetro `organizacion` es opcional. Si no se envía, usa la organización activa del JWT.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "scheduler": {
      "running": true,
      "lastCheck": "2024-01-21T10:30:00.000Z",
      "totalOrganizations": 3,
      "totalTasks": 12
    },
    "organizacion": {
      "nombre": "MiOrg",
      "tareasActivas": 4,
      "automatizacionesIds": [1, 3, 7, 9]
    },
    "allOrganizations": [
      { "name": "miorg", "taskCount": 4 },
      { "name": "empresa2", "taskCount": 5 },
      { "name": "test", "taskCount": 3 }
    ]
  }
}
```

### 2. Controlar Scheduler (POST)

```
POST /api/automatizaciones/scheduler
Content-Type: application/json
```

**Acciones disponibles:**

| Acción | Descripción |
|--------|-------------|
| `iniciar` | Inicia el scheduler si no está corriendo |
| `detener` | Detiene todas las tareas programadas |
| `recargar` | Recarga solo las automatizaciones de tu organización |
| `recargar_todo` | Reinicia el scheduler y recarga todas las organizaciones |

**Ejemplo - Recargar organización:**

```json
{
  "organizacion": "MiOrg",
  "accion": "recargar"
}
```

> **Nota**: El campo `organizacion` es opcional. Si no se envía, usa la organización activa del JWT.

**Respuesta:**

```json
{
  "success": true,
  "message": "Automatizaciones de MiOrg recargadas",
  "data": {
    "scheduler": {
      "running": true,
      "lastCheck": "2024-01-21T10:35:00.000Z",
      "totalTasks": 12
    }
  }
}
```

---

## Expresiones Cron

El formato de expresión cron es:

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo = 0)
│ │ │ │ │
* * * * *
```

**Ejemplos comunes:**

| Expresión | Descripción |
|-----------|-------------|
| `0 8 * * *` | Todos los días a las 8:00 AM |
| `30 22 * * *` | Todos los días a las 10:30 PM |
| `0 9 * * 1-5` | Lunes a Viernes a las 9:00 AM |
| `0 0 1 * *` | Primer día de cada mes a medianoche |
| `*/15 * * * *` | Cada 15 minutos |
| `0 */2 * * *` | Cada 2 horas |

**Zona horaria:** El scheduler usa `America/Mexico_City` por defecto.

---

## Ciclo de Vida de una Automatización Programada

1. **Creación:** Al crear/editar una automatización, el scheduler se recarga automáticamente
2. **Programación:** Si `activo = true`, se programa según su `cron_expresion`
3. **Ejecución:** Cuando llega la hora, el scheduler:
   - Crea un registro en `logs_automatizaciones` con estado `en_ejecucion`
   - Ejecuta el script Python con las variables de entorno
   - Al terminar, actualiza el log con el resultado
   - Actualiza `ultima_ejecucion` y `ultima_estado` en la automatización

---

## Variables de Entorno para Scripts

Cuando el scheduler ejecuta un script, proporciona estas variables:

| Variable | Descripción |
|----------|-------------|
| `VAR_LOCAL_ORG` | Nombre de la organización |
| `VAR_LOCAL_DATABASE_NAME` | Nombre de la base de datos (org_*) |
| `VAR_LOCAL_ADMIN_EMAIL` | `scheduler@system` (ejecución programada) |
| `VAR_LOCAL_AUTOMATIZACION_ID` | ID de la automatización |
| `VAR_LOCAL_EXECUTION_ID` | ID único de esta ejecución |
| `VAR_LOCAL_LOG_ID` | ID del registro de log |
| `VAR_LOCAL_SCHEDULED` | `true` (indica ejecución programada) |
| `VAR_LOCAL_*` | Variables personalizadas definidas en la automatización |

---

## Comportamiento del Scheduler

### Recarga Periódica
- El scheduler recarga todas las automatizaciones cada **5 minutos**
- Esto permite detectar cambios sin reiniciar la aplicación

### Timeout de Ejecución
- Las ejecuciones programadas tienen un timeout de **10 minutos**
- Si un script excede este tiempo, se termina con `SIGTERM`

### Detección de Organizaciones
- El scheduler busca todas las bases de datos que empiecen con `org_`
- Solo programa automatizaciones que tengan `activo = true`

---

## Logs de Ejecución

Los logs se guardan en la tabla `logs_automatizaciones`:

```sql
SELECT
  l.id,
  l.estado,
  l.mensaje,
  l.fecha_inicio,
  l.fecha_fin,
  l.duracion_segundos,
  l.output
FROM logs_automatizaciones l
WHERE l.automatizacion_id = 1
ORDER BY l.fecha_inicio DESC;
```

**Estados posibles:**

| Estado | Descripción |
|--------|-------------|
| `en_ejecucion` | Script ejecutándose actualmente |
| `exitoso` | Terminó con código 0 sin errores |
| `advertencia` | Terminó con código 0 pero hubo warnings |
| `error` | Terminó con código != 0 o hubo excepciones |

---

## Troubleshooting

### La automatización no se ejecuta

1. **Verificar que está activa:**
   ```sql
   SELECT id, nombre, activo, cron_expresion FROM automatizaciones WHERE id = X;
   ```

2. **Verificar expresión cron válida:**
   - Usar https://crontab.guru para validar

3. **Verificar que el scheduler está corriendo:**
   ```
   GET /api/automatizaciones/scheduler?organizacion=MiOrg
   ```

4. **Verificar logs del servidor:**
   - Buscar `[Scheduler]` en la consola

5. **Forzar recarga:**
   ```json
   POST /api/automatizaciones/scheduler
   { "accion": "recargar_todo", ... }
   ```

### El script falla

1. **Verificar que el script existe:**
   ```bash
   ls app/Automatizacion/{script_path}
   ```

2. **Verificar Python disponible:**
   ```bash
   # Si hay venv
   app/Automatizacion/.venv/bin/python --version
   # O
   python3 --version
   ```

3. **Revisar logs:**
   ```sql
   SELECT output FROM logs_automatizaciones
   WHERE automatizacion_id = X
   ORDER BY fecha_inicio DESC LIMIT 1;
   ```

---

## Ejemplo de Configuración Completa

### 1. Crear Script Python

```python
# app/Automatizacion/scripts/reporte_diario.py
"""
@SAT_METADATA
nombre: Reporte Diario
descripcion: Genera y envía reporte diario de actividad
autor: Sistema
version: 1.0.0
variables_requeridas:
  - DESTINATARIO_EMAIL
fases:
  - nombre: Recopilación
    descripcion: Obtener datos del día
  - nombre: Generación
    descripcion: Crear reporte PDF
  - nombre: Envío
    descripcion: Enviar por email
@END_SAT_METADATA
"""

import os
from sat_progress import SATProgress

progress = SATProgress()

# Fase 1
progress.start_phase("Recopilación")
# ... lógica ...
progress.complete_phase()

# Fase 2
progress.start_phase("Generación")
# ... lógica ...
progress.complete_phase()

# Fase 3
progress.start_phase("Envío")
email = os.environ.get('VAR_LOCAL_DESTINATARIO_EMAIL')
# ... lógica ...
progress.complete_phase()

progress.finish("Reporte enviado exitosamente")
```

### 2. Crear Automatización via API

```bash
# Nota: Las cookies JWT deben incluirse en la petición
curl -X POST http://localhost:3000/api/automatizaciones \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<tu_jwt_token>" \
  -d '{
    "organizacion": "MiEmpresa",
    "nombre": "prod_reporte_diario",
    "descripcion": "Genera reporte diario a las 8 AM",
    "script_path": "scripts/reporte_diario.py",
    "cron_expresion": "0 8 * * *",
    "activo": true,
    "variables_personalizadas": {
      "DESTINATARIO_EMAIL": "gerencia@empresa.com"
    }
  }'
```

### 3. Verificar Programación

```bash
# Nota: Las cookies JWT deben incluirse en la petición
curl -H "Cookie: access_token=<tu_jwt_token>" \
  "http://localhost:3000/api/automatizaciones/scheduler?organizacion=MiEmpresa"
```

---

## Notas Importantes

1. **Persistencia:** El scheduler vive en memoria. Si la aplicación se reinicia, las tareas se reprograman automáticamente.

2. **Multi-tenant:** El scheduler maneja múltiples organizaciones simultáneamente, cada una con sus propias automatizaciones.

3. **Concurrencia:** Múltiples automatizaciones pueden ejecutarse simultáneamente.

4. **Logs extensos:** El output se trunca a 50,000 caracteres para evitar problemas de almacenamiento.