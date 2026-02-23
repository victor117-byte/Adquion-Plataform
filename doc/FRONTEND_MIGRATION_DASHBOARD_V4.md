# Dashboard Declaraciones - Guía de Migración Frontend v4

**Fecha:** 2026-02-18
**Motivo:** Filtro por contador/usuario para administradores

---

## Resumen de cambios

Se agrega la capacidad de que un **administrador** pueda revisar el desempeño de cada contador (o de sí mismo) desde el dashboard. El filtro muestra únicamente los contribuyentes y declaraciones asignadas al usuario seleccionado.

**Nuevo endpoint:**
- `GET /api/dashboard-declaraciones/usuarios` — lista de usuarios para el dropdown (solo admins)

**Parámetro nuevo en endpoints existentes:**
- `GET /api/dashboard-declaraciones?contador_id={id}` — filtra declaraciones por usuario
- `GET /api/dashboard-declaraciones/kpis?contador_id={id}` — filtra KPIs por usuario

---

## 1. Quién puede usar el filtro

| Tipo Usuario | Puede usar `contador_id` | Ve el dropdown |
|---|---|---|
| `administrador` | Sí | Sí |
| `contador` | No (se ignora) | No |

El backend ignora `contador_id` si quien consulta no es administrador. El frontend debe **ocultar el dropdown** para usuarios tipo `contador`.

---

## 2. Flujo de implementación

```
1. Al cargar el dashboard (solo si rol === 'administrador'):
   GET /api/dashboard-declaraciones/usuarios?organizacion={org}
   → Poblar dropdown con la lista de usuarios

2. Usuario selecciona un contador del dropdown:
   GET /api/dashboard-declaraciones?organizacion={org}&contador_id={id}
   GET /api/dashboard-declaraciones/kpis?organizacion={org}&contador_id={id}
   → Actualizar tabla y KPIs

3. Usuario limpia el filtro (selecciona "Todos"):
   GET /api/dashboard-declaraciones?organizacion={org}   (sin contador_id)
   GET /api/dashboard-declaraciones/kpis?organizacion={org}
   → Vuelve a mostrar todas las declaraciones
```

---

## 3. Nuevo endpoint: Lista de usuarios

```http
GET /api/dashboard-declaraciones/usuarios?organizacion={org}
```

**Solo accesible para administradores.** Devuelve todos los usuarios de la organización con su conteo de contribuyentes activos asignados.

### Respuesta exitosa (200)

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
      "nombre": "Joseline López",
      "correo": "joseline@empresa.com",
      "tipo_usuario": "contador",
      "total_contribuyentes": 28
    },
    {
      "id": 5,
      "nombre": "José Manuel",
      "correo": "j.manuel@empresa.com",
      "tipo_usuario": "contador",
      "total_contribuyentes": 0
    }
  ]
}
```

> Los usuarios vienen ordenados: primero `administrador`, luego `contador`, ambos por nombre.
> `total_contribuyentes: 0` significa que el usuario no tiene contribuyentes asignados aún.

### Respuesta si no es administrador (403)

```json
{
  "error": "Solo administradores pueden acceder a este recurso"
}
```

---

## 4. Parámetro `contador_id` en endpoints existentes

### GET /api/dashboard-declaraciones

Se agrega el parámetro opcional `contador_id` (solo tiene efecto para admins):

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contador_id` | number | No | ID del usuario a filtrar. Solo funciona para administradores. |

**Sin cambios en la estructura de respuesta.** Los KPIs embebidos ya reflejarán el filtro aplicado.

#### Ejemplo: declaraciones del contador con id=4

```
GET /api/dashboard-declaraciones?organizacion=mi_empresa&contador_id=4
```

### GET /api/dashboard-declaraciones/kpis

Se agrega el mismo parámetro `contador_id`:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contador_id` | number | No | ID del usuario a filtrar. Solo funciona para administradores. |

La respuesta ahora incluye `contador_id` en `filtros`:

```json
{
  "success": true,
  "kpis": {
    "total_declaraciones": 45,
    "total_pagadas": 30,
    "total_pendientes": 10,
    "total_vencidas": 5,
    "porcentaje_cumplimiento": 67,
    "monto_total_declarado": 80000.00,
    "monto_pagado": 55000.00,
    "monto_pendiente": 25000.00,
    "contribuyentes_activos": 8
  },
  "filtros": {
    "rfc": null,
    "ejercicio": null,
    "contador_id": "4"
  },
  "timestamp": "2026-02-18T10:00:00Z"
}
```

---

## 5. Sugerencia de UI para el dropdown

El dropdown debe mostrarse **únicamente a administradores**, preferiblemente en la barra de filtros del dashboard junto a los filtros existentes (ejercicio, estatus, etc.).

```
┌─────────────────────────────────────────────────────┐
│  Filtros                                            │
│                                                     │
│  Ejercicio: [2026 ▼]   Estatus: [Todos ▼]          │
│                                                     │
│  Ver como:  [Todos los usuarios ▼]  ← NUEVO         │
│             ├ Todos los usuarios                    │
│             ├ ── Administradores ──                 │
│             ├ Martin (5 contribuyentes)             │
│             ├ ── Contadores ──                      │
│             ├ Joseline López (28 contribuyentes)    │
│             ├ José Manuel (0 contribuyentes)        │
│             └ ...                                   │
└─────────────────────────────────────────────────────┘
```

**Opción "Todos los usuarios"** = no enviar `contador_id` (admin ve todo).

---

## 6. Casos especiales

| Caso | Comportamiento |
|------|----------------|
| Contador seleccionado sin contribuyentes asignados (`total_contribuyentes: 0`) | KPIs en cero, tabla vacía. Es válido. |
| Admin selecciona "Todos" | No se envía `contador_id`. Admin ve todas las declaraciones. |
| Admin ve su propio desempeño | Enviar `contador_id` con el `id` del admin autenticado. |
| Contador intenta usar `contador_id` | Backend lo ignora. El contador siempre ve solo sus contribuyentes. |

---

## 7. Filtro por año (ejercicio)

El filtro por año ya funciona en todos los endpoints mediante el parámetro `ejercicio`. Solo falta el dropdown con los años disponibles.

### Obtener años disponibles

```http
GET /api/dashboard-declaraciones/ejercicios?organizacion={org}
```

Respeta permisos: contador solo ve años de sus contribuyentes. Admin puede combinar con `contador_id`.

```json
{
  "success": true,
  "ejercicios": ["2026", "2025", "2024", "2023", "2022", "2021", "2020"]
}
```

### Usar el filtro

```
GET /api/dashboard-declaraciones?organizacion={org}&ejercicio=2025
GET /api/dashboard-declaraciones/kpis?organizacion={org}&ejercicio=2025

// Combinado con contador_id
GET /api/dashboard-declaraciones/kpis?organizacion={org}&ejercicio=2025&contador_id=4
GET /api/dashboard-declaraciones/ejercicios?organizacion={org}&contador_id=4
```

---

## 8. Checklist de implementación

- [ ] Llamar a `GET /api/dashboard-declaraciones/ejercicios` al cargar el dashboard para poblar el dropdown de año
- [ ] Al seleccionar año: agregar `ejercicio={año}` a las llamadas de dashboard y KPIs
- [ ] Al limpiar año: quitar `ejercicio` de las llamadas
- [ ] Llamar a `GET /api/dashboard-declaraciones/usuarios` al cargar el dashboard (solo si admin)
- [ ] Renderizar el dropdown de usuarios solo si `tipo_usuario === 'administrador'`
- [ ] Al seleccionar usuario: agregar `contador_id={id}` a las llamadas de dashboard, KPIs y ejercicios
- [ ] Al seleccionar "Todos": quitar `contador_id` de las llamadas
- [ ] Mostrar el nombre del usuario seleccionado en el título o subtítulo del dashboard (opcional pero recomendado)
- [ ] Manejar el caso donde `total_contribuyentes === 0` (mostrar estado vacío sin error)
- [ ] Cuando se cambia `contador_id`, recargar también los ejercicios disponibles (pueden variar por usuario)
