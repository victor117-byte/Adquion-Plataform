# Guía de Integración: WhatsApp Business + Agentes IA

> Basado en la implementación de **converso-customer-flow** + **Converso-Backend**.
> Este documento describe todos los campos, endpoints y flujo necesarios para conectar
> WhatsApp Business (Meta Cloud API), configurar un agente de IA y vincular ambos a
> uno o más números de teléfono.

---

## Índice

1. [Autenticación y Headers](#1-autenticación-y-headers)
2. [Configuración General de la Organización](#2-configuración-general-de-la-organización)
3. [WhatsApp Business — Meta Cloud API](#3-whatsapp-business--meta-cloud-api)
4. [Agentes de IA](#4-agentes-de-ia)
5. [Números de Teléfono y Vinculación con Agentes](#5-números-de-teléfono-y-vinculación-con-agentes)
6. [Configuración del Webhook en Meta](#6-configuración-del-webhook-en-meta)
7. [Flujo Completo Recomendado](#7-flujo-completo-recomendado)
8. [Referencia Rápida de Endpoints](#8-referencia-rápida-de-endpoints)

---

## 1. Autenticación y Headers

Todas las peticiones al backend requieren:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
x-database: <organization_database>   ← routing multi-tenant
```

> `x-database` es el identificador de base de datos de la organización activa.
> Se obtiene de la sesión del usuario en `organizacionActiva.database`.

**Token refresh:** el backend maneja refresh automático vía cookie `httpOnly`.
- On `401` → `POST /api/auth/refresh` → reintentar la request original.
- Si el refresh también falla → redirigir a login.

---

## 2. Configuración General de la Organización

Antes de conectar WhatsApp, la organización debe tener su configuración base.

### Endpoint

```
GET  /api/settings
PUT  /api/settings
POST /api/settings/logo   (multipart/form-data, campo: "logo")
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | `string` | Nombre visible de la empresa/organización |
| `webhook` | `string` | URL del webhook externo (si se usa notificación hacia otro sistema) |
| `globalRules` | `string` | Instrucciones globales que aplican a todos los agentes. Ej: "Solo responder en español. No agendar citas los domingos." |
| `logoUrl` | `string?` | URL relativa del logo (se sube por separado con POST /api/settings/logo) |

### Ejemplo PUT

```json
{
  "name": "Mi Empresa",
  "webhook": "https://mi-sistema.com/webhook-converso",
  "globalRules": "Responde siempre en español. Sé conciso y amigable."
}
```

---

## 3. WhatsApp Business — Meta Cloud API

### Prerrequisitos en Meta (lo que el usuario debe tener antes)

Para obtener las credenciales necesarias, el usuario debe:

1. Tener una cuenta en **Meta for Developers** → [developers.facebook.com](https://developers.facebook.com)
2. Crear una **Meta App** de tipo "Business"
3. Agregar el producto **WhatsApp** a la app
4. Tener un **WhatsApp Business Account (WABA)** verificado
5. Tener al menos un **número de teléfono** registrado en el WABA

---

### Dónde encontrar cada credencial

| Credencial | Dónde obtenerla en Meta |
|-----------|------------------------|
| `whatsapp_business_id` | Meta Business Suite → WhatsApp Manager → **Business Account ID** |
| `whatsapp_phone_number_id` | Meta for Developers → App → WhatsApp → Getting Started → **Phone Number ID** |
| `meta_access_token` | Meta for Developers → App → WhatsApp → Getting Started → **Temporary access token** (o generar un token permanente via System Users) |
| `meta_app_id` | Meta for Developers → App Dashboard → **App ID** (número en la barra superior) |
| `meta_app_secret` | Meta for Developers → App Dashboard → Settings → Basic → **App Secret** |
| `verify_token` | **Lo define el desarrollador** (string aleatorio, se usa para verificar el webhook) |

---

### Endpoint de configuración

```
GET  /api/configuracion/meta     → obtiene config actual (o null si no está configurado)
POST /api/configuracion/meta     → crea o actualiza (upsert)
```

### Payload completo

```json
{
  "whatsapp_business_id": "123456789012345",
  "whatsapp_phone_number_id": "987654321098765",
  "meta_access_token": "EAAxxxxxxxxxxxxx...",
  "meta_app_id": "111222333444",
  "meta_app_secret": "abc123def456...",
  "verify_token": "mi_token_secreto_personalizado",
  "is_active": true
}
```

> **Nota:** No existe un endpoint DELETE. Para desactivar la integración
> se re-envía el mismo payload con `is_active: false`.

### Respuesta

```json
{
  "success": true,
  "message": "Configuración guardada",
  "data": {
    "id": 1,
    "whatsapp_business_id": "123456789012345",
    "whatsapp_phone_number_id": "987654321098765",
    "meta_access_token": "EAAxxxxxxxxxxxxx...",
    "meta_app_id": "111222333444",
    "meta_app_secret": "abc123def456...",
    "verify_token": "mi_token_secreto_personalizado",
    "is_active": true,
    "created_at": "2026-03-13T10:00:00Z",
    "updated_at": "2026-03-13T10:00:00Z"
  }
}
```

---

## 4. Agentes de IA

Un **agente** es la configuración del bot de IA: personalidad, tono, idioma, prompt del sistema y archivos de conocimiento (RAG).

### Endpoints

```
GET    /api/agents                          → lista todos los agentes de la org
POST   /api/agents                          → crear agente
PUT    /api/agents/:id                      → actualizar agente
DELETE /api/agents/:id                      → eliminar agente
POST   /api/agents/:agentId/files           → subir archivo de contexto (multipart, campo: "file")
DELETE /api/agents/:agentId/files/:fileId   → eliminar archivo de contexto
```

### Campos del Agente

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | `string` | ✅ | Nombre identificador del agente |
| `description` | `string` | — | Descripción breve del propósito del agente |
| `systemPrompt` | `string` | — | Instrucciones del sistema (prompt principal). Define comportamiento, límites y personalidad |
| `tone` | `string` | — | Tono de comunicación: `"profesional"`, `"amigable"`, `"formal"`, `"casual"` |
| `language` | `string` | — | Idioma principal: `"es"` (Español), `"en"` (Inglés), `"pt"` (Portugués) |
| `status` | `"active"` \| `"draft"` | — | Solo agentes `active` atienden conversaciones reales |

### Ejemplo de creación

```json
POST /api/agents
{
  "name": "Asistente de Ventas",
  "description": "Atiende consultas de ventas y agenda demostraciones",
  "systemPrompt": "Eres un asistente de ventas amable de Mi Empresa. Ayudas a los clientes a conocer nuestros productos, respondes dudas y agendas demostraciones. No discutas precios, deriva al equipo de ventas para negociaciones.",
  "tone": "amigable",
  "language": "es",
  "status": "active"
}
```

### Archivos de Contexto (RAG)

Se pueden adjuntar archivos de conocimiento al agente para enriquecer sus respuestas.

- **Formatos aceptados:** `.pdf`, `.txt`, `.md`, `.docx`, `.csv`
- **Tamaño máximo:** 10 MB por archivo
- **Subida:** `multipart/form-data`, campo `file`

```
POST /api/agents/abc123/files
Content-Type: multipart/form-data
[campo "file": archivo.pdf]
```

**Respuesta del archivo subido:**

```json
{
  "id": "file_xyz",
  "name": "catalogo_productos.pdf",
  "size": "2.4 MB",
  "url": "/uploads/agents/abc123/catalogo_productos.pdf",
  "uploadedAt": "2026-03-13T10:00:00Z"
}
```

---

## 5. Números de Teléfono y Vinculación con Agentes

Este es el paso que **conecta** un número de WhatsApp con un agente específico.

### Endpoints

```
GET    /api/numeros         → lista números registrados
POST   /api/numeros         → registrar un número
PUT    /api/numeros/:id     → actualizar (vincular/desvincular agente, activar/desactivar)
DELETE /api/numeros/:id     → eliminar número
```

### Campos para registrar un número

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | `string` | ✅ | Etiqueta interna (ej: "Línea principal", "Soporte") |
| `tipo` | `"meta"` \| `"evolution"` | ✅ | Proveedor: `"meta"` = Meta Cloud API, `"evolution"` = Evolution API |
| `phone_number_id` | `string` | ✅ | ID del número en el proveedor (para Meta, es el `whatsapp_phone_number_id`) |
| `display_phone` | `string?` | — | Número legible para mostrar en UI (ej: "+52 55 1234 5678") |
| `agent_id` | `number?` | — | ID del agente que atenderá este número (se puede asignar después) |

### Ejemplo: registrar número Meta

```json
POST /api/numeros
{
  "nombre": "Línea principal",
  "tipo": "meta",
  "phone_number_id": "987654321098765",
  "display_phone": "+52 55 1234 5678",
  "agent_id": 3
}
```

### Ejemplo: vincular/cambiar agente a un número existente

```json
PUT /api/numeros/1
{
  "agent_id": 5
}
```

### Ejemplo: desactivar número (sin borrar)

```json
PUT /api/numeros/1
{
  "is_active": false
}
```

### Ejemplo: desvincular agente (número sin bot)

```json
PUT /api/numeros/1
{
  "agent_id": null
}
```

### Respuesta del número

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Línea principal",
    "tipo": "meta",
    "phone_number_id": "987654321098765",
    "display_phone": "+52 55 1234 5678",
    "is_active": true,
    "agent_id": 3,
    "agent_name": "Asistente de Ventas",
    "agent_status": "active",
    "created_at": "2026-03-13T10:00:00Z",
    "updated_at": "2026-03-13T10:00:00Z"
  }
}
```

---

## 6. Configuración del Webhook en Meta

El backend expone un webhook que Meta llamará por cada mensaje entrante.

### URL del Webhook

```
https://<BACKEND_URL>/api/webhook/meta/<organization_database>
```

**Ejemplo:**
```
https://converso-backend.ngrok.app/api/webhook/meta/org_empresa_abc
```

> `organization_database` es el valor del campo `database` de la organización activa.

### Pasos en Meta for Developers

1. Ir a **Meta for Developers → App → WhatsApp → Configuration**
2. En "Webhook", hacer clic en **Edit**
3. Ingresar:
   - **Callback URL:** `https://<BACKEND_URL>/api/webhook/meta/<org_database>`
   - **Verify Token:** el mismo `verify_token` que se guardó en `/api/configuracion/meta`
4. Hacer clic en **Verify and Save**
5. Suscribirse a los campos: `messages` (mínimo requerido)

---

## 7. Flujo Completo Recomendado

```
1. Configurar organización
   PUT /api/settings
   → nombre, webhook, globalRules

2. Configurar Meta Cloud API
   POST /api/configuracion/meta
   → 6 credenciales + is_active: true

3. Crear agente(s)
   POST /api/agents
   → name, systemPrompt, tone, language, status: "active"

   [Opcional] Subir archivos RAG
   POST /api/agents/:id/files

4. Registrar número(s) y vincular agente
   POST /api/numeros
   → nombre, tipo: "meta", phone_number_id, agent_id

5. Configurar webhook en Meta Developer Portal
   URL: /api/webhook/meta/<org_database>
   Verify Token: el mismo de paso 2

6. Verificar funcionamiento
   → Enviar mensaje de prueba al número de WhatsApp
   → El backend debe recibirlo y el agente responder
```

---

## 8. Referencia Rápida de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/settings` | Obtener configuración de la organización |
| `PUT` | `/api/settings` | Actualizar configuración |
| `POST` | `/api/settings/logo` | Subir logo (multipart, campo: `logo`) |
| `GET` | `/api/configuracion/meta` | Obtener config Meta Cloud API |
| `POST` | `/api/configuracion/meta` | Crear/actualizar config Meta (upsert) |
| `GET` | `/api/agents` | Listar agentes |
| `POST` | `/api/agents` | Crear agente |
| `PUT` | `/api/agents/:id` | Actualizar agente |
| `DELETE` | `/api/agents/:id` | Eliminar agente |
| `POST` | `/api/agents/:id/files` | Subir archivo de contexto (multipart, campo: `file`) |
| `DELETE` | `/api/agents/:id/files/:fileId` | Eliminar archivo de contexto |
| `GET` | `/api/numeros` | Listar números registrados |
| `POST` | `/api/numeros` | Registrar número |
| `PUT` | `/api/numeros/:id` | Actualizar número (vincular agente, activar/desactivar) |
| `DELETE` | `/api/numeros/:id` | Eliminar número |
| `POST` | `/api/webhook/meta/:database` | Webhook receptor de mensajes de Meta |

---

## Notas Importantes

- **Multi-tenant:** Cada organización usa su propio `database`. El header `x-database` es obligatorio en todas las requests.
- **No existe DELETE para Meta config:** para "desconectar" se re-envía el payload con `is_active: false`.
- **Un número → un agente:** cada número puede tener como máximo un agente vinculado. Para cambiar el agente simplemente hacer `PUT /api/numeros/:id` con el nuevo `agent_id`.
- **Múltiples números por organización:** una organización puede registrar varios números (diferentes líneas de negocio), cada uno con su propio agente.
- **`globalRules` de Settings** aplica a **todos** los agentes de la organización como capa base. El `systemPrompt` del agente se aplica encima de las reglas globales.
- **`status: "draft"`** en el agente significa que está en desarrollo y no atiende conversaciones reales, aunque esté vinculado a un número.
