# Setup: Frontend en Vercel + Backend local via ngrok

Guía para conectar un frontend desplegado en Vercel con un backend corriendo en local,
usando un tunnel de ngrok con dominio estático.

---

## Arquitectura

```
Browser (Vercel) ──fetch──▶ https://tu-proyecto.ngrok.io/api/...
                                        |
                                  ngrok tunnel
                                        |
                             localhost:3000 (tu máquina)
```

---

## 1. ngrok — Configurar dominio estático

### Requisitos
- Cuenta en https://ngrok.com (plan gratuito tiene 1 dominio estático)
- ngrok v3 instalado: https://ngrok.com/download

### Reservar el dominio
1. Ir a https://dashboard.ngrok.com/domains
2. Crear un dominio estático (ej: `mi-proyecto.ngrok.io`)
3. Copiar tu authtoken en https://dashboard.ngrok.com/authtokens

### Configurar ngrok
```bash
ngrok config add-authtoken TU_AUTH_TOKEN
```

### Comando para iniciar el tunnel
```bash
ngrok http 3000 --url=mi-proyecto.ngrok.io
```

> Cambia `3000` por el puerto donde corre tu backend.

---

## 2. Backend — Configurar CORS

El browser aplica CORS en todas las requests cross-origin.
Como el frontend está en Vercel y el backend en ngrok, CORS es obligatorio.

### Node.js / Express

```js
import cors from 'cors';

app.use(cors({
  origin: [
    'https://mi-frontend.vercel.app',  // dominio de Vercel
    'http://localhost:8080',            // desarrollo local frontend
  ],
  credentials: true,  // OBLIGATORIO para cookies httpOnly (auth)
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
```

> `credentials: true` es obligatorio si usas cookies httpOnly para JWT.
> Sin esto, el browser bloquea las cookies y el usuario no puede autenticarse.

### NestJS

```typescript
app.enableCors({
  origin: [
    'https://mi-frontend.vercel.app',
    'http://localhost:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
});
```

---

## 3. Frontend — Configuración

### 3a. Variables de entorno

Crear `.env.production` en la raíz del proyecto:

```env
VITE_API_URL=https://mi-proyecto.ngrok.io/api
```

Crear `.env.development` (opcional, para dev local):

```env
VITE_API_URL=http://localhost:3000/api
```

> Si usas Create React App, usa `REACT_APP_API_URL` en lugar de `VITE_API_URL`.

### 3b. Cliente HTTP centralizado

Crear `src/utils/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};

  // ngrok muestra una página de advertencia si no se incluye este header
  if (API_BASE.includes('ngrok') || !import.meta.env.PROD) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    ...getHeaders(!(options.body instanceof FormData)),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // envia cookies httpOnly automáticamente
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return response.json();
}

export const get  = <T>(url: string)                    => fetchAPI<T>(url, { method: 'GET' });
export const post = <T>(url: string, data?: unknown)    => fetchAPI<T>(url, { method: 'POST',   body: data ? JSON.stringify(data) : undefined });
export const patch= <T>(url: string, data?: unknown)    => fetchAPI<T>(url, { method: 'PATCH',  body: data ? JSON.stringify(data) : undefined });
export const del  = <T>(url: string)                    => fetchAPI<T>(url, { method: 'DELETE' });
```

### 3c. Vite config (opcional — solo para desarrollo local con ngrok)

Si quieres apuntar el servidor de dev a ngrok sin CORS, agrega un proxy en `vite.config.ts`:

```typescript
const NGROK_BACKEND = 'https://mi-proyecto.ngrok.io';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: NGROK_BACKEND,
        changeOrigin: true,
        secure: false,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      },
    },
  },
});
```

Y en `.env.development`:
```env
VITE_API_URL=/api
```

---

## 4. Vercel — Variables de entorno

En el dashboard de Vercel:
1. Ir a tu proyecto → Settings → Environment Variables
2. Agregar:

| Variable       | Value                                  | Environment |
|----------------|----------------------------------------|-------------|
| VITE_API_URL   | https://mi-proyecto.ngrok.io/api       | Production  |

3. Hacer redeploy para que tome el cambio.

---

## 5. Checklist de verificación

- [ ] ngrok corriendo: `ngrok http 3000 --url=mi-proyecto.ngrok.io`
- [ ] Backend levantado en el puerto correcto
- [ ] CORS configurado con el dominio de Vercel y `credentials: true`
- [ ] `VITE_API_URL` apuntando al dominio ngrok en `.env.production`
- [ ] `ngrok-skip-browser-warning` header incluido en las requests
- [ ] Build hecho con `npm run build` después de cambiar `.env.production`
- [ ] Variable de entorno configurada en Vercel y redeploy hecho

---

## Limitaciones conocidas

| Problema | Consecuencia |
|---|---|
| ngrok caído o máquina apagada | El frontend en Vercel no funciona |
| URL ngrok cambia (si no es estática) | Hay que rebuildar y redesplegar |
| Plan gratuito ngrok | 1 dominio estático, 1 tunnel activo |

> Esta arquitectura es ideal para demos, staging y desarrollo. Para producción real,
> usar un servidor dedicado con IP fija o un servicio cloud (Railway, Render, etc.).
