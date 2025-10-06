# Integración con Backend FastAPI

## 📋 Requisitos del Backend

Para que la aplicación funcione correctamente, tu backend FastAPI debe implementar los siguientes endpoints:

### 🔐 Autenticación

#### POST `/api/auth/register`
Registro de nuevos usuarios
```json
Request:
{
  "email": "usuario@example.com",
  "password": "contraseña123",
  "name": "Nombre Completo"
}

Response (200):
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nombre Completo",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
Inicio de sesión
```json
Request:
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}

Response (200):
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nombre Completo",
    "role": "user"
  }
}
```

#### POST `/api/auth/reset-password`
Recuperación de contraseña
```json
Request:
{
  "email": "usuario@example.com"
}

Response (200):
{
  "message": "Email de recuperación enviado"
}
```

### 📄 Documentos

#### POST `/api/documents/upload`
Carga de archivos PDF/XML
```
Request: multipart/form-data
- file: archivo PDF o XML

Headers:
- Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "filename": "documento.pdf",
  "status": "processing",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/documents`
Listar documentos del usuario
```
Headers:
- Authorization: Bearer {token}

Response (200):
{
  "documents": [
    {
      "id": "uuid",
      "filename": "documento.pdf",
      "status": "processed",
      "uploaded_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 👥 Gestión de Usuarios (solo admins)

#### GET `/api/users`
Listar usuarios
```
Headers:
- Authorization: Bearer {token}

Response (200):
[
  {
    "id": "uuid",
    "name": "Usuario",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/api/users`
Crear usuario
```json
Request:
{
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "role": "user",
  "status": "active"
}

Headers:
- Authorization: Bearer {token}

Response (201):
{
  "id": "uuid",
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "role": "user",
  "status": "active"
}
```

#### PUT `/api/users/{user_id}`
Actualizar usuario
```json
Request:
{
  "name": "Usuario Actualizado",
  "role": "accountant",
  "status": "active"
}

Headers:
- Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "name": "Usuario Actualizado",
  "role": "accountant",
  "status": "active"
}
```

#### DELETE `/api/users/{user_id}`
Eliminar usuario
```
Headers:
- Authorization: Bearer {token}

Response (204): No content
```

### 💳 Pagos (Stripe)

#### POST `/api/payments/create-subscription`
Crear suscripción
```json
Request:
{
  "plan": "Pro",
  "paymentMethod": {
    "card": {
      "number": "4242424242424242",
      "name": "Titular",
      "expiry": "12/25",
      "cvv": "123"
    }
  }
}

Headers:
- Authorization: Bearer {token}

Response (200):
{
  "subscriptionId": "sub_xxx",
  "status": "active",
  "plan": "Pro",
  "amount": 29
}
```

## 🔧 Configuración

1. Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:8000/api
```

2. Para producción, actualiza la URL:
```env
VITE_API_URL=https://tu-backend.com/api
```

## 🔒 Autenticación

El frontend guarda el token JWT en `localStorage` con la clave `auth_token` y lo envía en cada request como:
```
Authorization: Bearer {token}
```

## 📝 Roles de Usuario

- `user`: Usuario normal
- `accountant`: Contador con permisos especiales
- `admin`: Administrador con acceso completo

## ⚠️ CORS

Tu backend debe permitir requests desde el dominio del frontend. Configura CORS en FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Testing

Para probar sin backend, puedes usar un mock server o modificar temporalmente `AuthContext.tsx` para simular respuestas.
