# API WhatsApp — Guía de integración Frontend

Documentación completa de los endpoints de WhatsApp Business para el panel de administración.

---

## Índice

1. [Arquitectura y conceptos](#arquitectura-y-conceptos)
2. [Autenticación](#autenticación)
3. [Canales](#canales) — números de WA Business
4. [Agentes IA](#agentes-ia) — bots de respuesta automática
5. [Conversaciones](#conversaciones) — historial de chats
6. [Webhook interno](#webhook-interno)
7. [Flujos de uso](#flujos-de-uso)
8. [Referencia rápida](#referencia-rápida)

---

## Arquitectura y conceptos

```
Organización
  ├── Canal A  (+52 55 1234 5678)  →  Agente "Fiscal Básico"
  ├── Canal B  (+52 55 9876 5432)  →  Agente "Fiscal Premium"
  └── Canal C  (+52 55 0000 0000)  →  sin agente (solo recibe)
```

| Concepto | Descripción |
|----------|-------------|
| **Canal** | Un número de WhatsApp Business registrado. Recibe mensajes de clientes. |
| **Agente** | Configuración del bot IA (modelo, prompt, temperatura). Puede atender múltiples canales. |
| **Conversación** | Hilo de mensajes con un contacto. Se vincula automáticamente al contribuyente por teléfono o RFC. |

**Reglas:**
- Una org puede tener **N canales** y **N agentes**.
- Un agente puede estar asignado a **múltiples canales**.
- Un canal tiene **cero o un agente activo** a la vez.
- Si un canal no tiene agente asignado, solo almacena mensajes (sin respuesta automática).

---

## Autenticación

Todos los endpoints requieren JWT en cookie `httpOnly`. El frontend debe enviar las requests con `credentials: 'include'` (axios: `withCredentials: true`).

Los endpoints marcados con 🔒 requieren rol `administrador`.

---

## Canales

### `GET /api/whatsapp/canales`

Lista todos los canales de WhatsApp de la organización.

**Response `200`:**
```json
{
  "canales": [
    {
      "id": 1,
      "channel_id": "ch_abc123",
      "phone_number": "+521234567890",
      "display_name": "Adquion Fiscal",
      "phone_number_id": "123456789012345",
      "waba_id": "987654321098765",
      "wa_org_id": "org_adquion",
      "agente_id": 2,
      "subscription_id": "sub_xyz789",
      "webhook_url": "https://backend.adquion.com/api/wa-events",
      "activo": true,
      "created_at": "2026-03-13T10:00:00.000Z",
      "updated_at": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

> `access_token`, `verify_token` y `webhook_api_key` **nunca se devuelven** por seguridad.

---

### 🔒 `POST /api/whatsapp/canales`

Registra un nuevo número de WhatsApp Business.

**Body:**
```json
{
  "phoneNumber":    "+521234567890",
  "displayName":   "Adquion Fiscal",
  "accessToken":   "EAAxxxxxxxxxxxxx",
  "phoneNumberId": "123456789012345",
  "wabaId":        "987654321098765",
  "verifyToken":   "mi_token_secreto",
  "agenteId":      2
}
```

| Campo | Tipo | Req | Descripción |
|-------|------|-----|-------------|
| `phoneNumber` | string | ✓ | Número con código de país, e.g. `+521234567890` |
| `displayName` | string | ✓ | Nombre del canal en el panel |
| `accessToken` | string | ✓ | Meta permanent access token (del portal de Meta) |
| `phoneNumberId` | string | ✓ | ID del número en Meta Developer Console |
| `wabaId` | string | ✓ | WhatsApp Business Account ID |
| `verifyToken` | string | — | Token de verificación para Meta. Se auto-genera si se omite. |
| `agenteId` | number | — | ID del agente a asignar. Se puede asignar después. |

**Response `201`:**
```json
{
  "canal": {
    "id": 1,
    "channel_id": "ch_abc123",
    "phone_number": "+521234567890",
    "display_name": "Adquion Fiscal",
    "phone_number_id": "123456789012345",
    "waba_id": "987654321098765",
    "wa_org_id": "org_adquion",
    "agente_id": 2,
    "subscription_id": "sub_xyz789",
    "webhook_url": "https://backend.adquion.com/api/wa-events",
    "activo": true
  },
  "metaWebhook": {
    "url": "https://converso.ngrok.app/wa/api/webhook/meta/org_adquion",
    "verifyToken": "abc123def456",
    "nota": "Configura estos valores en Meta Developer Console → WhatsApp → Webhooks"
  }
}
```

> ⚠️ Guarda `metaWebhook.url` y `metaWebhook.verifyToken` para configurarlos en el portal de Meta. El `verifyToken` **no se puede recuperar después**.

---

### `GET /api/whatsapp/canales/[id]`

Obtiene el detalle de un canal específico.

**Response `200`:**
```json
{
  "canal": {
    "id": 1,
    "channel_id": "ch_abc123",
    "phone_number": "+521234567890",
    "display_name": "Adquion Fiscal",
    "phone_number_id": "123456789012345",
    "waba_id": "987654321098765",
    "wa_org_id": "org_adquion",
    "agente_id": 2,
    "subscription_id": "sub_xyz789",
    "webhook_url": "https://backend.adquion.com/api/wa-events",
    "activo": true,
    "created_at": "2026-03-13T10:00:00.000Z",
    "updated_at": "2026-03-13T10:00:00.000Z"
  }
}
```

---

### 🔒 `PATCH /api/whatsapp/canales/[id]`

Actualiza el nombre, estado o el agente asignado de un canal.

**Body (todos opcionales):**
```json
{
  "display_name": "Adquion Premium",
  "activo": true,
  "agente_id": 3
}
```

Para **desasignar** el agente de un canal:
```json
{ "agente_id": null }
```

**Response `200`:**
```json
{
  "canal": {
    "id": 1,
    "phone_number": "+521234567890",
    "display_name": "Adquion Premium",
    "agente_id": 3,
    "activo": true,
    "updated_at": "2026-03-13T11:00:00.000Z"
  }
}
```

---

### 🔒 `DELETE /api/whatsapp/canales/[id]`

Desactiva un canal (soft delete — los mensajes históricos se conservan).

**Response `200`:**
```json
{
  "deleted": true,
  "nota": "Canal desactivado. Las conversaciones existentes se conservan."
}
```

---

## Agentes IA

### `GET /api/whatsapp/agentes`

Lista todos los agentes IA. Incluye qué canales tiene asignados cada uno.

**Response `200`:**
```json
{
  "agentes": [
    {
      "id": 1,
      "nombre": "Asistente Fiscal Básico",
      "activo": true,
      "system_prompt": "Eres un asistente fiscal...",
      "contexto": "La empresa opera en CDMX...",
      "modelo": "llama-3.3-70b-versatile",
      "temperatura": 0.3,
      "max_historial": 10,
      "created_at": "2026-03-13T10:00:00.000Z",
      "updated_at": "2026-03-13T10:00:00.000Z",
      "canales_asignados": [
        {
          "id": 1,
          "phone_number": "+521234567890",
          "display_name": "Adquion Fiscal",
          "activo": true
        }
      ]
    }
  ]
}
```

---

### 🔒 `POST /api/whatsapp/agentes`

Crea un nuevo agente IA.

> Requiere feature `ai_agent` habilitada en el plan de la organización.

**Body:**
```json
{
  "nombre": "Asistente Premium",
  "system_prompt": "Eres un experto fiscal...",
  "contexto": "Contexto adicional de la organización...",
  "modelo": "llama-3.3-70b-versatile",
  "temperatura": 0.3,
  "max_historial": 10,
  "activo": true
}
```

| Campo | Tipo | Req | Descripción |
|-------|------|-----|-------------|
| `nombre` | string | ✓ | Nombre del agente en el panel |
| `system_prompt` | string | — | Instrucciones base del bot. Si está vacío, usa el prompt por defecto. |
| `contexto` | string | — | Contexto adicional inyectado en cada conversación (RAG fiscal) |
| `modelo` | string | — | Modelo de Groq. Default: `llama-3.3-70b-versatile` |
| `temperatura` | number | — | 0.0–1.0. Más alto = más creativo. Default: `0.3` |
| `max_historial` | number | — | Mensajes previos que ve el bot (1–50). Default: `10` |
| `activo` | boolean | — | Default: `true` |

**Response `201`:**
```json
{
  "agente": {
    "id": 2,
    "nombre": "Asistente Premium",
    "activo": true,
    "system_prompt": "Eres un experto fiscal...",
    "contexto": "Contexto adicional...",
    "modelo": "llama-3.3-70b-versatile",
    "temperatura": 0.3,
    "max_historial": 10,
    "created_at": "2026-03-13T10:00:00.000Z",
    "updated_at": "2026-03-13T10:00:00.000Z"
  }
}
```

---

### `GET /api/whatsapp/agentes/[id]`

Obtiene el detalle de un agente con sus canales asignados.

**Response `200`:**
```json
{
  "agente": {
    "id": 2,
    "nombre": "Asistente Premium",
    "activo": true,
    "system_prompt": "...",
    "contexto": "...",
    "modelo": "llama-3.3-70b-versatile",
    "temperatura": 0.3,
    "max_historial": 10,
    "created_at": "2026-03-13T10:00:00.000Z",
    "updated_at": "2026-03-13T10:00:00.000Z",
    "canales_asignados": [
      {
        "id": 1,
        "phone_number": "+521234567890",
        "display_name": "Adquion Fiscal",
        "activo": true
      },
      {
        "id": 3,
        "phone_number": "+521234567891",
        "display_name": "Adquion Morelos",
        "activo": true
      }
    ]
  }
}
```

---

### 🔒 `PATCH /api/whatsapp/agentes/[id]`

Actualiza la configuración de un agente.

> Requiere feature `ai_agent`.

**Body (todos opcionales):**
```json
{
  "nombre": "Asistente Premium v2",
  "activo": true,
  "system_prompt": "Eres un experto fiscal actualizado...",
  "contexto": "Nuevo contexto...",
  "modelo": "llama-3.3-70b-versatile",
  "temperatura": 0.5,
  "max_historial": 15
}
```

**Response `200`:**
```json
{
  "agente": { ...agente actualizado... }
}
```

---

### 🔒 `DELETE /api/whatsapp/agentes/[id]`

Elimina un agente.

> **Falla si el agente tiene canales activos asignados.** Desasigna primero con `PATCH /canales/[id]` → `{ agente_id: null }`.

**Response `200`:**
```json
{ "deleted": true }
```

**Error `409` — agente en uso:**
```json
{
  "error": "No se puede eliminar: el agente está asignado a canales activos",
  "canales": [
    { "id": 1, "phone_number": "+521234567890" }
  ]
}
```

---

## Conversaciones

### `GET /api/whatsapp/conversaciones`

Lista todas las conversaciones, ordenadas por actividad reciente.

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `limit` | `50` | Máximo de resultados (max: 100) |
| `offset` | `0` | Para paginación |

**Response `200`:**
```json
{
  "conversaciones": [
    {
      "id": 1,
      "jid": "521234567890@s.whatsapp.net",
      "phone": "521234567890",
      "canal_id": 1,
      "rfc": "ABCD123456XYZ",
      "nombre_contacto": "Juan Pérez García",
      "bot_activo": true,
      "ultimo_mensaje_at": "2026-03-13T12:00:00.000Z",
      "created_at": "2026-03-13T09:00:00.000Z",
      "updated_at": "2026-03-13T12:00:00.000Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

---

### `GET /api/whatsapp/conversaciones/[jid]`

Detalle de una conversación y su historial de mensajes.

> El `jid` debe ir **URL-encoded** (`@` → `%40`).
> Ejemplo: `521234567890%40s.whatsapp.net`

**Query params:**

| Param | Default | Descripción |
|-------|---------|-------------|
| `limit` | `50` | Máximo de mensajes (max: 200) |
| `offset` | `0` | Para paginación |

**Response `200`:**
```json
{
  "conversacion": {
    "id": 1,
    "jid": "521234567890@s.whatsapp.net",
    "phone": "521234567890",
    "canal_id": 1,
    "rfc": "ABCD123456XYZ",
    "nombre_contacto": "Juan Pérez García",
    "bot_activo": true,
    "ultimo_mensaje_at": "2026-03-13T12:00:00.000Z"
  },
  "mensajes": [
    {
      "id": 1,
      "conversacion_id": 1,
      "message_id": "wamid.xxx",
      "rol": "user",
      "contenido": "Hola, ¿cuánto debo de IVA?",
      "tipo": "text",
      "metadata": null,
      "created_at": "2026-03-13T12:00:00.000Z"
    },
    {
      "id": 2,
      "conversacion_id": 1,
      "message_id": null,
      "rol": "assistant",
      "contenido": "Hola Juan, según tu situación tienes 2 declaraciones pendientes...",
      "tipo": "text",
      "metadata": null,
      "created_at": "2026-03-13T12:00:05.000Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

**Valores de `rol`:** `"user"` (mensaje del contacto) | `"assistant"` (respuesta del bot)

---

### 🔒 `PATCH /api/whatsapp/conversaciones/[jid]`

Actualiza el estado de una conversación: activar/desactivar bot o vincular RFC manualmente.

**Body (todos opcionales):**
```json
{
  "bot_activo": false,
  "rfc": "ABCD123456XYZ",
  "nombre_contacto": "Juan Pérez García"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `bot_activo` | boolean | `false` → agente humano toma el control · `true` → devuelve control al bot |
| `rfc` | string | Vincula manualmente la conversación a un contribuyente |
| `nombre_contacto` | string | Nombre visible en el panel (se usa si no hay rfc o junto con él) |

**Response `200`:**
```json
{
  "conversacion": { ...conversacion actualizada... }
}
```

---

## Webhook interno

### `POST /api/wa-events`

Endpoint público receptor de eventos del WA Service. **No llamar desde el frontend.**

Maneja automáticamente:
- `message.received` → guarda mensaje, identifica contribuyente, llama al agente IA, envía respuesta
- `conversation.bot_mode_changed` → sincroniza el estado `bot_activo` con el WA Service

---

## Flujos de uso

### Flujo 1 — Configuración inicial

```
1. Crear agente
   POST /api/whatsapp/agentes
   → { nombre: "Mi Bot", system_prompt: "..." }

2. Registrar canal WA Business
   POST /api/whatsapp/canales
   → { phoneNumber, displayName, accessToken, phoneNumberId, wabaId, agenteId }

3. Copiar metaWebhook.url y metaWebhook.verifyToken
   → Configurar en Meta Developer Console

¡Listo! Los mensajes entrantes ya se procesan automáticamente.
```

### Flujo 2 — Agregar segundo número al mismo agente

```
1. Registrar el nuevo canal
   POST /api/whatsapp/canales
   → { phoneNumber: "+521234567891", ..., agenteId: 1 }

2. Configurar nuevo webhook en Meta Console
   (misma URL, distinto verifyToken)
```

### Flujo 3 — Asignar agente distinto a un canal existente

```
PATCH /api/whatsapp/canales/2
→ { agente_id: 3 }
```

### Flujo 4 — Agente humano toma control de una conversación

```
PATCH /api/whatsapp/conversaciones/521234567890%40s.whatsapp.net
→ { bot_activo: false }

# Para devolver el control al bot:
→ { bot_activo: true }
```

### Flujo 5 — Vincular contacto sin RFC registrado

```
PATCH /api/whatsapp/conversaciones/521234567890%40s.whatsapp.net
→ { rfc: "ABCD123456XYZ", nombre_contacto: "Juan Pérez" }
```

### Flujo 6 — Eliminar un agente en uso

```
1. Desasignar de todos sus canales
   PATCH /api/whatsapp/canales/1  →  { agente_id: null }
   PATCH /api/whatsapp/canales/3  →  { agente_id: null }

2. Eliminar el agente
   DELETE /api/whatsapp/agentes/2
```

---

## Referencia rápida

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/whatsapp/canales` | usuario | Lista canales |
| `POST` | `/api/whatsapp/canales` | 🔒 admin | Registra nuevo canal |
| `GET` | `/api/whatsapp/canales/[id]` | usuario | Detalle de canal |
| `PATCH` | `/api/whatsapp/canales/[id]` | 🔒 admin | Actualiza canal / asigna agente |
| `DELETE` | `/api/whatsapp/canales/[id]` | 🔒 admin | Desactiva canal |
| `GET` | `/api/whatsapp/agentes` | usuario | Lista agentes + canales asignados |
| `POST` | `/api/whatsapp/agentes` | 🔒 admin | Crea agente IA |
| `GET` | `/api/whatsapp/agentes/[id]` | usuario | Detalle de agente |
| `PATCH` | `/api/whatsapp/agentes/[id]` | 🔒 admin | Actualiza agente |
| `DELETE` | `/api/whatsapp/agentes/[id]` | 🔒 admin | Elimina agente |
| `GET` | `/api/whatsapp/conversaciones` | usuario | Lista conversaciones |
| `GET` | `/api/whatsapp/conversaciones/[jid]` | usuario | Mensajes de conversación |
| `PATCH` | `/api/whatsapp/conversaciones/[jid]` | 🔒 admin | Gestiona bot / vincula RFC |

---

## Códigos de error

| Código | Descripción |
|--------|-------------|
| `400` | Body inválido o ID malformado |
| `401` | Sin sesión activa |
| `403` | Sin permisos (rol o feature no habilitada) |
| `404` | Recurso no encontrado |
| `409` | Conflicto — e.g. intentar eliminar agente en uso |
| `410` | Endpoint deprecado |
| `422` | Campos requeridos faltantes o valores fuera de rango |
| `502` | Error comunicándose con el WA Service externo |

---

## Notas de implementación

- El `jid` en URL siempre va **URL-encoded**: `encodeURIComponent(jid)`
- La vinculación de contribuyente por teléfono es **automática** cuando el contacto manda su primer mensaje. Solo necesitas vinculación manual cuando el teléfono registrado en el sistema difiere del que usa para WhatsApp.
- Los tokens sensibles (`access_token`, `verify_token`, `webhook_api_key`) **nunca se devuelven** en ningún endpoint GET.
- El endpoint `POST /api/whatsapp/canales` llama al WA Service externo. Si falla (error 502), el número no quedó registrado — es seguro reintentarlo.
