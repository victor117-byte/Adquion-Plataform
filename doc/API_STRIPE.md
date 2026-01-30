# API de Stripe - Suscripciones

Sistema de suscripciones con integración de Stripe para gestión de planes y pagos.

## Configuración Requerida

4. Datos de Prueba para Stripe
En el checkout de Stripe, usa estas tarjetas de prueba:

Tarjeta	Número	Resultado
Pago exitoso	4242 4242 4242 4242	Aprobada
Tarjeta rechazada	4000 0000 0000 0002	Rechazada
3D Secure	4000 0000 0000 3220	Requiere autenticación
Para todos los casos:

Fecha de expiración: Cualquier fecha futura (ej: 12/28)
CVC: Cualquier 3 dígitos (ej: 123)
Código postal: Cualquier número (ej: 12345)
Nombre: Cualquier nombre

### Variables de Entorno

```env
STRIPE_SECRET_KEY=sk_test_...      # Clave secreta de Stripe (test o live)
STRIPE_PUBLISHABLE_KEY=pk_test_... # Clave pública (para el frontend)
STRIPE_WEBHOOK_SECRET=whsec_...    # Secreto del webhook (obtener de Stripe Dashboard)
```

### Configurar Webhook en Stripe Dashboard

1. Ir a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Crear nuevo endpoint: `https://tu-dominio.com/api/stripe/webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copiar el "Signing secret" y agregarlo a `STRIPE_WEBHOOK_SECRET`

Para desarrollo local, usar [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Planes Disponibles

| Plan | ID | Precio | Stripe Price ID |
|------|-----|--------|-----------------|
| Basic Free | `basic_free` | $0 MXN | N/A |
| Pro | `pro` | $999.99 MXN/mes | `price_1SumsnEF20OdClUhJVZu4cni` |
| Business | `business` | $1,999.99 MXN/mes | `price_1SumvbEF20OdClUhVqgqKnv4` |

---

## Endpoints

### GET /api/stripe/plans

Obtiene los planes disponibles. **No requiere autenticación** (pero si hay token, marca el plan actual).

```typescript
const response = await fetch('/api/stripe/plans', {
  credentials: 'include'
});

const data = await response.json();
// data.data.plans = [{ id, name, price, currency, limits, features, is_current, is_popular }]
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic_free",
        "name": "Basic Free",
        "price": 0,
        "currency": "MXN",
        "billing_cycle": "monthly",
        "limits": {
          "max_files": 50,
          "max_sat_automations": 1,
          "max_users": 1,
          "max_clients": 0,
          "storage_mb": 100,
          "scheduled_executions_day": 0,
          "has_full_dashboard": false,
          "has_whatsapp_notifications": false,
          "has_ai_agent": false
        },
        "features": [
          "50 archivos máximo",
          "1 automatización SAT",
          "1 usuario",
          "Sin contribuyentes",
          "100 MB almacenamiento"
        ],
        "is_current": true,
        "is_popular": false
      },
      {
        "id": "pro",
        "name": "Pro",
        "price": 999.99,
        "currency": "MXN",
        "limits": { ... },
        "features": [ ... ],
        "is_current": false,
        "is_popular": true
      },
      {
        "id": "business",
        "name": "Business",
        "price": 1999.99,
        "currency": "MXN",
        "limits": { ... },
        "features": [ ... ],
        "is_current": false,
        "is_popular": false
      }
    ],
    "billing_cycles": ["monthly"]
  }
}
```

---

### GET /api/stripe/subscription

Obtiene el estado actual de la suscripción de la organización. **Requiere autenticación.**

```typescript
const response = await fetch('/api/stripe/subscription', {
  credentials: 'include'
});

const data = await response.json();
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "plan_id": "basic_free",
    "plan_name": "Basic Free",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": null,
    "current_period_end": null,
    "cancel_at_period_end": false,
    "limits": {
      "max_files": 50,
      "max_sat_automations": 1,
      ...
    },
    "is_free": true,
    "has_stripe_subscription": false
  }
}
```

---

### POST /api/stripe/checkout

Crea una sesión de Stripe Checkout para upgrade de plan. **Requiere autenticación.**

```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan_id: 'pro' })  // o 'business'
});

const data = await response.json();

if (data.success) {
  // Redirigir al checkout de Stripe
  window.location.href = data.data.checkout_url;
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
    "session_id": "cs_test_..."
  }
}
```

**URLs de redirección después del checkout:**
- Éxito: `/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`
- Cancelado: `/dashboard/billing?canceled=true`

---

### POST /api/stripe/portal

Genera una URL del portal de cliente de Stripe para gestionar facturación. **Requiere autenticación y suscripción de pago activa.**

```typescript
const response = await fetch('/api/stripe/portal', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();

if (data.success) {
  // Redirigir al portal de Stripe
  window.location.href = data.data.portal_url;
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "portal_url": "https://billing.stripe.com/p/session/..."
  }
}
```

---

### POST /api/stripe/cancel

Cancela o reactiva la suscripción. **Solo administradores.**

#### Cancelar suscripción:
```typescript
const response = await fetch('/api/stripe/cancel', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})  // Sin body para cancelar
});
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Suscripción programada para cancelarse al final del período",
  "data": {
    "cancel_at_period_end": true,
    "current_period_end": "2024-02-15T00:00:00.000Z"
  }
}
```

#### Reactivar suscripción cancelada:
```typescript
const response = await fetch('/api/stripe/cancel', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reactivate: true })
});
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Suscripción reactivada exitosamente",
  "data": {
    "cancel_at_period_end": false,
    "current_period_end": "2024-02-15T00:00:00.000Z"
  }
}
```

---

## Implementación Frontend

### Componente de Planes

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  is_current: boolean;
  is_popular: boolean;
}

export function PricingPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch('/api/stripe/plans', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });

      const data = await response.json();

      if (data.success) {
        // Redirigir a Stripe Checkout
        window.location.href = data.data.checkout_url;
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) return <div>Cargando planes...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`border rounded-lg p-6 ${
            plan.is_popular ? 'border-blue-500 ring-2 ring-blue-500' : ''
          }`}
        >
          {plan.is_popular && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
              Más popular
            </span>
          )}

          <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
          <p className="text-3xl font-bold mt-2">
            ${plan.price.toLocaleString()} <span className="text-sm">{plan.currency}/mes</span>
          </p>

          <ul className="mt-4 space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i}>✓ {feature}</li>
            ))}
          </ul>

          <button
            onClick={() => handleUpgrade(plan.id)}
            disabled={plan.is_current || plan.price === 0 || upgrading === plan.id}
            className={`mt-4 w-full py-2 rounded ${
              plan.is_current
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {plan.is_current
              ? 'Plan actual'
              : upgrading === plan.id
              ? 'Procesando...'
              : plan.price === 0
              ? 'Gratis'
              : 'Upgrade'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Componente de Estado de Suscripción

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Subscription {
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_free: boolean;
  has_stripe_subscription: boolean;
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const response = await fetch('/api/stripe/subscription', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      window.location.href = data.data.portal_url;
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('¿Estás seguro de cancelar tu suscripción?')) return;

    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      fetchSubscription(); // Recargar
      alert(data.message);
    }
  }

  async function handleReactivate() {
    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactivate: true })
    });
    const data = await response.json();
    if (data.success) {
      fetchSubscription();
      alert(data.message);
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (!subscription) return <div>Error al cargar suscripción</div>;

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-bold">Tu Suscripción</h2>

      <div className="mt-4 space-y-2">
        <p><strong>Plan:</strong> {subscription.plan_name}</p>
        <p><strong>Estado:</strong> {subscription.status}</p>

        {subscription.current_period_end && (
          <p>
            <strong>Próxima renovación:</strong>{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        )}

        {subscription.cancel_at_period_end && (
          <p className="text-red-500">
            ⚠️ La suscripción se cancelará el{' '}
            {new Date(subscription.current_period_end!).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-4 space-x-2">
        {subscription.has_stripe_subscription && (
          <button
            onClick={handleManageBilling}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Gestionar facturación
          </button>
        )}

        {subscription.has_stripe_subscription && !subscription.cancel_at_period_end && (
          <button
            onClick={handleCancelSubscription}
            className="px-4 py-2 text-red-500 border border-red-500 rounded hover:bg-red-50"
          >
            Cancelar suscripción
          </button>
        )}

        {subscription.cancel_at_period_end && (
          <button
            onClick={handleReactivate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Reactivar suscripción
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Flujo de Pruebas

### 1. Ver planes (sin autenticar)

```bash
curl http://localhost:3000/api/stripe/plans
```

### 2. Ver suscripción actual (autenticado)

```bash
# Primero hacer login, luego:
curl -b "access_token=TU_TOKEN" http://localhost:3000/api/stripe/subscription
```

### 3. Hacer upgrade a Pro

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -b "access_token=TU_TOKEN" \
  -d '{"plan_id": "pro"}'
```

### 4. Tarjetas de prueba de Stripe

| Número | Descripción |
|--------|-------------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Tarjeta rechazada |
| 4000 0000 0000 3220 | Requiere autenticación 3D Secure |

- Fecha: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- ZIP: Cualquier código postal

---

## Manejo de Errores

| Código | Error | Descripción |
|--------|-------|-------------|
| 401 | No autorizado | Token no proporcionado o inválido |
| 400 | plan_id es requerido | Falta el plan_id en checkout |
| 400 | No puedes hacer checkout del plan gratuito | Intentando checkout de basic_free |
| 400 | No hay una suscripción de pago activa | Intentando cancelar sin suscripción |
| 403 | Solo los administradores pueden cancelar | Usuario no es admin |
| 404 | Plan no encontrado | plan_id inválido |

---

## Notas Importantes

1. **IMPORTANTE**: Configurar `STRIPE_WEBHOOK_SECRET` para que los webhooks funcionen
2. Las suscripciones se crean automáticamente como `basic_free` cuando se accede por primera vez
3. El webhook maneja automáticamente:
   - Activación de suscripción después del pago
   - Renovación mensual
   - Pagos fallidos (marca como `past_due`)
   - Cancelaciones (downgrade a free)
4. El frontend debe incluir `credentials: 'include'` en todas las peticiones
