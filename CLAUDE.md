# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

**Adquion Plataform** es el **frontend (SPA)** de un SaaS de gestión fiscal y contable multi-tenant, dirigido a **despachos contables, empresas y profesionales fiscales** en México (integra descargas y procesos ligados al SAT). Permite centralizar contribuyentes, documentos fiscales, automatizaciones, notificaciones por WhatsApp y reportes/dashboards, con roles diferenciados de **administrador** y **contador** por organización.

Este repositorio **solo contiene el frontend**. No incluye el backend, la base de datos ni el servicio de WhatsApp — esos viven en repos/servicios separados descritos abajo. Cualquier lógica de negocio, autenticación real o persistencia se hace en el backend remoto.

## Infraestructura y a dónde se conecta

```
Adquion Plataform (este repo)
   Vite + React SPA — desplegado en Vercel
        │
        │  fetch a /api/* (mismo origen, evita CORS)
        ▼
  vercel.json rewrite /api/:path*  ──▶  https://backend.adquion.com/api/:path*
        │
        ▼
  Backend Adquion (repo aparte, no en este proyecto)
        │
        ├── Autenticación: JWT en cookies httpOnly + refresh token
        ├── Stripe: /stripe/subscription, /stripe/plans, /stripe/checkout, /stripe/portal, /stripe/cancel
        ├── Multi-tenant: cada usuario puede pertenecer a varias "organizaciones" (cada una con su propia database)
        └── WhatsApp: se integra con un servicio externo de terceros (Grid-Works / "Converso")
                  https://converso.ngrok.app
                  ├── /api/*  → Converso Backend (puerto 3000)
                  ├── /wa/*   → WA Service (puerto 3001) — Meta Cloud API
                  └── /auth/* → Auth Service (puerto 3002)
```

Puntos clave:
- **En dev/preview/producción**, Vite hace proxy de `/api` hacia `https://backend.adquion.com` (ver `vite.config.ts`, `PROXY_TARGET` por `mode`). En modo `test` apunta a `http://localhost:3000`.
- **En Vercel**, el mismo rol lo cumple el rewrite en `vercel.json` (`/api/:path*` → `https://backend.adquion.com/api/:path*`).
- La variable `VITE_API_URL` (en `.env`, `.env.production`, `.env.test`) normalmente se deja en `/api` para aprovechar el proxy y evitar CORS; ver `src/utils/api.ts`.
- El **backend real de Adquion** vive fuera de este repo (probablemente en el proyecto "Converso-Backend" referenciado en el entorno de trabajo). Los endpoints de negocio (dashboard stats, contribuyentes, documentos, automatizaciones) son responsabilidad de ese backend, no de este frontend.
- El **servicio de WhatsApp** es de un proveedor externo (Grid-Works). El backend de Adquion actúa como suscriptor de ese servicio; documentación completa en `doc/ADQUION_WA_SERVICE_DOCS.md`, `doc/API_WHATSAPP.md` y `doc/WHATSAPP_INTEGRATION_GUIDE.md`.
- Reportes avanzados se integran vía **Power BI** (ver `src/components/main/PowerBISection.tsx`).
- Pagos/suscripciones vía **Stripe** (`src/hooks/use-subscription.ts`, `src/pages/BillingRedirect.tsx`).

## Comandos comunes

```bash
npm run dev        # servidor de desarrollo (Vite), puerto 8080, proxy /api -> backend.adquion.com
npm run build       # build de producción -> dist/
npm run build:dev   # build en modo development (usa mismo proxy que dev)
npm run preview     # sirve el build de dist/ localmente, puerto 4173, con el mismo proxy /api
npm run lint         # ESLint sobre todo el repo
```

No hay test runner configurado (`npm run test` solo levanta Vite en modo `test`, no ejecuta pruebas unitarias). No hay comando para correr un test individual porque no existe un framework de testing implementado todavía.

## Arquitectura del frontend

- **Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui (Radix UI) + TanStack Query + React Router + React Hook Form + Zod.
- **Entry/routing** (`src/App.tsx`): rutas top-level son `/` (landing, `Index`), `/auth` (login/registro), `/onboarding`, `/main` (app autenticada), `/dashboard/billing` (retorno de Stripe Checkout). Todo va envuelto en `QueryClientProvider` → `ThemeProvider` → `AuthProvider` → `UpgradePlanProvider`.
- **Autenticación** (`src/contexts/AuthContext.tsx` + `src/utils/api.ts`): no usa tokens en localStorage — el backend setea cookies httpOnly. El frontend:
  - Llama `/auth/me` al montar para verificar sesión.
  - Reintenta automáticamente una vez ante `401` llamando `/auth/refresh` (con protección contra refresh concurrente vía `isRefreshing`/`refreshPromise`).
  - Renueva el token cada 4 minutos con un `setInterval` mientras haya sesión activa.
  - Emite el evento global `auth:session-expired` cuando el refresh falla; `AuthProvider` lo escucha y decide si redirigir a `/auth` (verifica primero con `/auth/me` porque un 401 en un endpoint como `/stripe/subscription` no siempre implica sesión expirada).
- **Multi-tenant**: un `User` tiene un array de `organizaciones` (cada una con `database` y `rol`: `administrador` | `contador`) y una `organizacionActiva`. Cambiar de organización se hace con `switchOrganization` → `POST /auth/switch-organization`, que actualiza rol y organización activa sin recargar la página.
- **Capa de API** (`src/utils/api.ts`): helpers `get/post/patch/del/postFormData` centralizan `fetch` con `credentials: 'include'`. Maneja de forma especial el `403` con `upgradeRequired: true` como `ApiLimitExceededError` (límites de plan SaaS), propagado vía un sistema de listeners (`onLimitExceeded`) que dispara el modal de upgrade (`UpgradePlanContext`).
- **Secciones de la app** (`src/components/main/*Section.tsx`): Dashboard, Dashboard2, Contribuyentes, Documentos, Automatizaciones, Usuarios, Notificaciones, WhatsApp, Power BI, Suscripción, Configuración — montadas dentro de `src/pages/Main.tsx`.
- **Estado de datos remotos**: hooks dedicados en `src/hooks/` (`use-dashboard-overview`, `use-dashboard-declaraciones`, `use-organizations`, `use-subscription`, `use-usage`, `use-api`) encapsulan las llamadas a la capa de API anterior.

### Cosas a tener en cuenta

- Según `doc/dashboard.md`, el `DashboardSection` principal todavía tiene datos **hardcodeados** (stats y actividad reciente) porque los endpoints `/api/dashboard/stats` y `/api/dashboard/activity` no estaban implementados en el backend al momento de escribir esa nota — verificar el estado actual antes de asumir que el dashboard consume datos reales.
- `doc/SETUP_NGROK_VERCEL.md` documenta el escenario de desarrollo con frontend en Vercel + backend local vía túnel ngrok con CORS y `credentials: true` — útil si se necesita probar contra un backend local en vez de `backend.adquion.com`.
