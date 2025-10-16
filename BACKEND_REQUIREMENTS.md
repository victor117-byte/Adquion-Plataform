# 📋 Requisitos del Backend para Adquion

## Resumen de Arquitectura

Tu backend debe manejar:
1. **Autenticación JWT** - Login, registro, gestión de sesiones
2. **Stripe Integration** - Suscripciones y pagos
3. **User Management** - Roles, permisos, perfiles
4. **Document Management** - Upload, procesamiento de archivos SAT

---

## 🔐 1. Autenticación & Usuarios

### Base de datos - Tabla `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'accountant', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Endpoints requeridos:

#### POST `/api/auth/register`
Crear nueva cuenta de usuario.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123",
  "name": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user"
  }
}
```

**Response (400) - Error:**
```json
{
  "message": "El email ya está registrado"
}
```

---

#### POST `/api/auth/login`
Iniciar sesión con credenciales.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expires_at": "2025-11-16T00:00:00Z"
    }
  }
}
```

---

#### POST `/api/auth/reset-password`
Enviar email de recuperación de contraseña.

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email de recuperación enviado"
}
```

---

#### GET `/api/auth/me`
Obtener información del usuario actual (requiere token).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expires_at": "2025-11-16T00:00:00Z"
    }
  }
}
```

---

## 💳 2. Stripe & Suscripciones

### Base de datos - Tabla `subscriptions`
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'business'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Endpoints requeridos:

#### POST `/api/payments/create-setup-intent`
Crear un Setup Intent para guardar método de pago.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "client_secret": "seti_1234567890_secret_xyz",
  "customer_id": "cus_123456789"
}
```

**Implementación sugerida:**
```python
# Ejemplo con FastAPI
@router.post("/create-setup-intent")
async def create_setup_intent(user: User = Depends(get_current_user)):
    # Crear o recuperar cliente de Stripe
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name
        )
        # Guardar customer_id en la BD
        user.stripe_customer_id = customer.id
        await db.commit()
    
    # Crear Setup Intent
    setup_intent = stripe.SetupIntent.create(
        customer=user.stripe_customer_id,
        payment_method_types=['card']
    )
    
    return {
        "client_secret": setup_intent.client_secret,
        "customer_id": user.stripe_customer_id
    }
```

---

#### POST `/api/payments/create-subscription`
Crear una nueva suscripción.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "plan": "pro",
  "payment_method_id": "pm_1234567890"
}
```

**Response (200):**
```json
{
  "subscription_id": "sub_1234567890",
  "status": "active",
  "current_period_end": "2025-11-16T00:00:00Z"
}
```

**Implementación sugerida:**
```python
@router.post("/create-subscription")
async def create_subscription(
    data: CreateSubscriptionRequest,
    user: User = Depends(get_current_user)
):
    # Mapear plan a price_id de Stripe
    price_ids = {
        "pro": "price_pro_monthly",
        "business": "price_business_monthly"
    }
    
    # Adjuntar método de pago al cliente
    stripe.PaymentMethod.attach(
        data.payment_method_id,
        customer=user.stripe_customer_id
    )
    
    # Establecer como método de pago predeterminado
    stripe.Customer.modify(
        user.stripe_customer_id,
        invoice_settings={'default_payment_method': data.payment_method_id}
    )
    
    # Crear suscripción
    subscription = stripe.Subscription.create(
        customer=user.stripe_customer_id,
        items=[{'price': price_ids[data.plan]}],
        expand=['latest_invoice.payment_intent']
    )
    
    # Guardar en BD
    db_subscription = Subscription(
        user_id=user.id,
        stripe_subscription_id=subscription.id,
        plan=data.plan,
        status=subscription.status,
        current_period_end=subscription.current_period_end
    )
    await db.add(db_subscription)
    await db.commit()
    
    return {
        "subscription_id": subscription.id,
        "status": subscription.status,
        "current_period_end": subscription.current_period_end
    }
```

---

#### GET `/api/payments/subscription-status`
Verificar el estado de la suscripción del usuario.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "active": true,
  "plan": "pro",
  "status": "active",
  "current_period_end": "2025-11-16T00:00:00Z"
}
```

---

#### POST `/api/payments/cancel-subscription`
Cancelar la suscripción actual.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "message": "Suscripción cancelada exitosamente",
  "cancels_at": "2025-11-16T00:00:00Z"
}
```

---

## 👥 3. Gestión de Usuarios (Admin)

#### GET `/api/users`
Listar todos los usuarios (solo admin).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid-1",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### PUT `/api/users/{user_id}`
Actualizar información de usuario (admin).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "name": "Juan Pérez Actualizado",
  "role": "accountant",
  "status": "active"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid-1",
    "name": "Juan Pérez Actualizado",
    "email": "juan@example.com",
    "role": "accountant",
    "status": "active"
  }
}
```

---

## 📄 4. Gestión de Documentos

#### POST `/api/documents/upload`
Subir documento fiscal.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
file: [archivo.pdf]
client_id: "uuid-client-123"
document_type: "invoice"
```

**Response (200):**
```json
{
  "document": {
    "id": "uuid-doc-123",
    "filename": "factura-001.pdf",
    "url": "https://storage.example.com/documents/uuid-doc-123.pdf",
    "status": "processing",
    "uploaded_at": "2025-10-16T12:00:00Z"
  }
}
```

---

#### GET `/api/documents`
Listar documentos del usuario.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
```
?page=1&limit=20&status=processed
```

**Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid-doc-123",
      "filename": "factura-001.pdf",
      "url": "https://storage.example.com/documents/uuid-doc-123.pdf",
      "status": "processed",
      "uploaded_at": "2025-10-16T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127
  }
}
```

---

## 🔒 Seguridad & Middleware

### JWT Token
- Usar JWT con expiración de 7 días
- Refresh tokens opcionales
- Incluir: `user_id`, `email`, `role` en el payload

### CORS
```python
# FastAPI ejemplo
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting
- Login: 5 intentos por minuto por IP
- API calls: 100 requests por minuto por usuario

---

## 📦 Variables de Entorno Necesarias

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/adquion

# JWT
JWT_SECRET_KEY=tu-super-secreto-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168

# Stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Testing con Mock

Para testing sin backend real, puedes usar:

```typescript
// src/lib/mockApi.ts
export const mockApi = {
  async login(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      token: 'mock-token-12345',
      user: {
        id: '1',
        email,
        name: 'Usuario Test',
        role: 'user',
        subscription: {
          plan: 'free',
          status: 'active'
        }
      }
    };
  },
  
  async createSubscription(plan: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      subscription_id: 'sub_mock_123',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
};
```

---

## 📚 Recursos Útiles

- **Stripe Docs**: https://stripe.com/docs/billing/subscriptions/overview
- **FastAPI**: https://fastapi.tiangolo.com/
- **JWT**: https://jwt.io/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

¿Necesitas ayuda con alguna implementación específica? Pregúntame y te ayudo con código de ejemplo.
