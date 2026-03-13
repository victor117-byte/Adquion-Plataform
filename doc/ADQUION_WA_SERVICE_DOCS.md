# WA Service API — Guía de integración para Adquion

Documentación para conectar el backend de Adquion al servicio de WhatsApp de Grid-Works.

---

## Arquitectura

```
Adquion Backend
      │
      │  HTTPS (un solo dominio)
      ▼
https://converso.ngrok.app
      │
      ├── /api/*        → Converso Backend   (puerto 3000)
      ├── /wa/*         → WA Service         (puerto 3001)
      └── /auth/*       → Auth Service       (puerto 3002)
```

El WA Service recibe mensajes de WhatsApp vía Meta Cloud API, los distribuye a los suscriptores registrados (como Adquion), y permite enviar respuestas.

---

## Credenciales necesarias

Solicitar al equipo de Grid-Works:

```env
WA_BASE_URL=https://converso.ngrok.app/wa
WA_MASTER_API_KEY=<clave-proporcionada-por-grid-works>
WA_ORG_ID=adquion          # identificador único de tu organización
```

---

## Headers obligatorios en todas las peticiones

```http
x-api-key: <WA_MASTER_API_KEY>
x-org-id: adquion
Content-Type: application/json
```

---

## Paso 1 — Registrar el canal de WhatsApp

Si Adquion tiene su propio número de WhatsApp Business, regístralo una sola vez. La operación es idempotente — si el `phoneNumberId` ya existe, actualiza sus credenciales.

```http
POST https://converso.ngrok.app/wa/api/channels
```

**Body:**
```json
{
  "orgId": "adquion",
  "phoneNumber": "+521234567890",
  "displayName": "Adquion Bot",
  "accessToken": "<meta-permanent-access-token>",
  "phoneNumberId": "<meta-phone-number-id>",
  "wabaId": "<whatsapp-business-account-id>",
  "verifyToken": "<token-que-adquion-elige-para-verificacion>"
}
```

> Adquion puede tener **múltiples canales activos simultáneamente** (N números de WA Business). Cada `phoneNumberId` es independiente.

**Respuesta exitosa `201`:**
```json
{
  "success": true,
  "data": {
    "id": "ch_abc123",
    "orgId": "adquion",
    "phoneNumber": "+521234567890",
    "displayName": "Adquion Bot",
    "isActive": true,
    "createdAt": "2026-03-13T10:00:00.000Z"
  }
}
```

**Configurar en Meta Developer Console:**
- Webhook URL: `https://converso.ngrok.app/wa/api/webhook/meta/adquion`
- Verify Token: el mismo `verifyToken` que enviaste arriba
- Suscribirse a: `messages`

---

## Paso 2 — Listar canales registrados

```http
GET https://converso.ngrok.app/wa/api/channels
```

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ch_abc123",
      "orgId": "adquion",
      "phoneNumber": "+521234567890",
      "displayName": "Adquion Bot",
      "isActive": true,
      "createdAt": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

---

## Paso 3 — Registrar Adquion como suscriptor de eventos

Para recibir mensajes entrantes en tiempo real, registra tu endpoint una sola vez. También es idempotente si provees una `apiKey` fija.

```http
POST https://converso.ngrok.app/wa/api/subscriptions
```

**Body:**
```json
{
  "orgId": "adquion",
  "url": "https://tu-backend-adquion.com/api/wa-events",
  "events": ["message.received", "message.sent", "message.status_updated", "conversation.bot_mode_changed"],
  "apiKey": "<clave-secreta-que-adquion-genera>"
}
```

| Campo | Tipo | Req | Descripción |
|-------|------|-----|-------------|
| `orgId` | string | ✓ | Debe ser `"adquion"` |
| `url` | string | ✓ | Endpoint de Adquion que recibirá los eventos |
| `events` | string[] | ✓ | Tipos de evento a recibir (ver tabla abajo) |
| `apiKey` | string | — | Clave que el WA Service incluirá en cada webhook como `x-api-key`. Recomendado para verificar autenticidad. |

**Tipos de evento disponibles:**
| Evento | Descripción |
|--------|-------------|
| `message.received` | Mensaje entrante de un usuario de WhatsApp |
| `message.sent` | Confirmación de mensaje enviado |
| `message.status_updated` | Cambio de estado (enviado → entregado → leído) |
| `conversation.bot_mode_changed` | El bot fue activado o desactivado en una conversación |

**Respuesta exitosa `201`:**
```json
{
  "success": true,
  "apiKey": "<la-misma-clave-o-la-generada>",
  "data": {
    "id": "sub_xyz789",
    "orgId": "adquion",
    "url": "https://tu-backend-adquion.com/api/wa-events",
    "events": ["message.received", "message.sent", "message.status_updated", "conversation.bot_mode_changed"],
    "createdAt": "2026-03-13T10:00:00.000Z"
  }
}
```

> ⚠️ El campo `apiKey` **solo se devuelve en la creación**. Guárdalo con seguridad.

---

## Paso 4 — Listar suscripciones activas

```http
GET https://converso.ngrok.app/wa/api/subscriptions
```

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sub_xyz789",
      "orgId": "adquion",
      "url": "https://tu-backend-adquion.com/api/wa-events",
      "events": ["message.received", "message.sent", "message.status_updated", "conversation.bot_mode_changed"],
      "createdAt": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

---

## Paso 5 — Implementar el endpoint receptor de eventos

Adquion debe exponer un endpoint `POST` que reciba los eventos del WA Service.

### Estructura del evento

```typescript
type WebhookEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.status_updated'
  | 'conversation.bot_mode_changed'

interface WebhookEvent<T = unknown> {
  type: WebhookEventType
  orgId: string
  occurredAt: string   // ISO 8601
  payload: T
}

// Payload para message.received
interface MessageReceivedPayload {
  messageId: string
  conversationJid: string   // e.g. "521234567890@s.whatsapp.net"
  from: string              // número del usuario
  text: string              // contenido del mensaje
  channelId: string
  phoneNumberId: string     // Meta phone_number_id que recibió el mensaje
  receivedAt: string
}

// Payload para message.sent
interface MessageSentPayload {
  messageId: string
  conversationJid: string
  to: string
  text: string
  channelId: string
  sentAt: string
}

// Payload para message.status_updated
interface MessageStatusUpdatedPayload {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  updatedAt: string
}

// Payload para conversation.bot_mode_changed
interface BotModeChangedPayload {
  conversationJid: string
  mode: 'active' | 'inactive'
  changedAt: string
}
```

### Ejemplo de implementación (Express/NestJS)

```typescript
app.post('/api/wa-events', async (req, res) => {
  // Verificar autenticidad (recomendado)
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.WA_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  res.status(200).end() // responder rápido — el WA Service tiene timeout de 5s

  const event = req.body

  if (event.type === 'message.received') {
    const { from, text, orgId, phoneNumberId } = event.payload

    // 1. Correr tu lógica de agente
    const reply = await tuAgente.procesar(text, from)

    // 2. Enviar respuesta por el mismo número que recibió el mensaje
    await fetch('https://converso.ngrok.app/wa/api/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.WA_MASTER_API_KEY,
        'x-org-id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: from,
        text: reply,
        orgId,
        fromPhoneNumberId: phoneNumberId,  // responder por el mismo canal
      }),
    })
  }

  if (event.type === 'conversation.bot_mode_changed') {
    const { conversationJid, mode } = event.payload
    // mode === 'inactive' → un agente humano tomó el control
    // mode === 'active'   → se devolvió el control al bot
  }
})
```

---

## Referencia completa de endpoints

### POST `/wa/api/messages/send` — Enviar mensaje

```http
POST https://converso.ngrok.app/wa/api/messages/send
```

**Body:**
```json
{
  "to": "521234567890",
  "text": "Hola, ¿en qué te puedo ayudar?",
  "orgId": "adquion",
  "fromPhoneNumberId": "<meta-phone-number-id>"
}
```

| Campo | Tipo | Req | Descripción |
|-------|------|-----|-------------|
| `to` | string | ✓ | Número destino (solo dígitos, sin `+`) |
| `text` | string | ✓ | Texto del mensaje |
| `orgId` | string | ✓ | Siempre `"adquion"` |
| `fromPhoneNumberId` | string | — | `phoneNumberId` del canal desde el que enviar. Si se omite, usa el primer canal activo de la org. **Recomendado** cuando Adquion tiene múltiples números. |

**Respuesta `201`:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "metaMessageId": "wamid.xxx"
}
```

---

### GET `/wa/api/conversations` — Listar conversaciones

```http
GET https://converso.ngrok.app/wa/api/conversations?limit=50
```

**Query params:**
| Param | Default | Descripción |
|-------|---------|-------------|
| `limit` | `50` | Máximo de conversaciones a devolver |

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_abc",
      "jid": "521234567890@s.whatsapp.net",
      "orgId": "adquion",
      "channelId": "ch_abc123",
      "botActive": true,
      "lastMessageAt": "2026-03-13T12:00:00.000Z"
    }
  ]
}
```

---

### GET `/wa/api/conversations/{jid}/messages` — Mensajes de una conversación

```http
GET https://converso.ngrok.app/wa/api/conversations/521234567890%40s.whatsapp.net/messages?limit=50
```

> El `jid` debe ir **URL-encoded** (`@` → `%40`).

**Query params:**
| Param | Default | Descripción |
|-------|---------|-------------|
| `limit` | `50` | Máximo de mensajes a devolver |

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "conversationJid": "521234567890@s.whatsapp.net",
      "content": "Hola, ¿tienen disponibilidad?",
      "direction": "inbound",
      "status": "read",
      "sentAt": "2026-03-13T12:00:00.000Z"
    },
    {
      "id": "msg_002",
      "conversationJid": "521234567890@s.whatsapp.net",
      "content": "¡Hola! Sí, con gusto te ayudo.",
      "direction": "outbound",
      "status": "delivered",
      "sentAt": "2026-03-13T12:00:05.000Z"
    }
  ]
}
```

**Valores `direction`**: `"inbound"` (del usuario) | `"outbound"` (del bot/agente)
**Valores `status`**: `"sent"` | `"delivered"` | `"read"` | `"failed"`

---

### PATCH `/wa/api/conversations/{jid}/mode` — Activar / desactivar bot

Controla si el bot responde automáticamente en una conversación. Útil para que un agente humano tome el control temporalmente.

```http
PATCH https://converso.ngrok.app/wa/api/conversations/521234567890%40s.whatsapp.net/mode
```

**Body:**
```json
{ "botActive": false }
```

> `false` → agente humano toma el control · `true` → bot responde automáticamente

**Respuesta `200`:**
```json
{
  "success": true,
  "data": {
    "jid": "521234567890@s.whatsapp.net",
    "botActive": false
  }
}
```

---

### GET `/wa/api/health` — Health check

```http
GET https://converso.ngrok.app/wa/api/health
```

**Respuesta `200`:**
```json
{
  "status": "ok",
  "service": "wa-service",
  "db": "connected",
  "latency_ms": 5
}
```

**Respuesta `503`** (si la DB no responde):
```json
{
  "status": "error",
  "service": "wa-service",
  "db": "disconnected"
}
```

---

## Flujo completo

```
Usuario WhatsApp
      │
      ▼
Meta Cloud API
      │
      ▼
WA Service POST /wa/api/webhook/meta/adquion
      │  (almacena mensaje, notifica suscriptores)
      ▼
Adquion POST /api/wa-events
      │  (procesa con tu agente)
      │  usa payload.phoneNumberId para saber qué número recibió el mensaje
      ▼
WA Service POST /wa/api/messages/send  { fromPhoneNumberId: payload.phoneNumberId }
      │
      ▼
Usuario WhatsApp (recibe respuesta por el mismo número)
```

---

## Referencia rápida

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/wa/api/channels` | Registrar canal WA Business |
| GET | `/wa/api/channels` | Listar canales registrados |
| POST | `/wa/api/subscriptions` | Registrar suscriptor de eventos |
| GET | `/wa/api/subscriptions` | Listar suscripciones activas |
| POST | `/wa/api/messages/send` | Enviar mensaje de WhatsApp |
| GET | `/wa/api/conversations` | Listar conversaciones |
| GET | `/wa/api/conversations/{jid}/messages` | Mensajes de una conversación |
| PATCH | `/wa/api/conversations/{jid}/mode` | Activar/desactivar bot |
| GET | `/wa/api/webhook/meta/{orgId}` | Verificación webhook Meta (GET) |
| POST | `/wa/api/webhook/meta/{orgId}` | Recibir eventos de Meta (POST) |
| GET | `/wa/api/health` | Estado del servicio |

---

## Códigos de error comunes

| Código | Descripción |
|--------|-------------|
| `401` | `x-api-key` inválida o faltante |
| `403` | `x-org-id` no coincide con la clave |
| `404` | Conversación o canal no encontrado |
| `422` | Body mal formado o campos faltantes |
| `502` | Error al comunicarse con Meta Cloud API |

---

## Notas importantes

- El WA Service tiene un timeout de **5 segundos** para entregar webhooks. Tu endpoint `/api/wa-events` debe responder `200` inmediatamente y procesar el mensaje de forma asíncrona.
- Los mensajes se almacenan en la base de datos del WA Service bajo `orgId: "adquion"` — los datos de Adquion están completamente aislados de otros clientes.
- Adquion puede registrar **múltiples canales** (números de WA Business) simultáneamente. Usa `fromPhoneNumberId` al enviar para controlar desde qué número sale el mensaje.
- El campo `phoneNumberId` en `MessageReceivedPayload` indica qué número recibió el mensaje — úsalo para responder por el mismo canal.
- No necesitas integrar el Auth Service de Grid-Works. Adquion mantiene su propio sistema de autenticación de usuarios. La `WA_MASTER_API_KEY` es exclusiva para comunicación entre servicios.
