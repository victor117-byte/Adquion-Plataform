# API de Autenticación

Sistema de autenticación basado en JWT con cookies httpOnly.

## Características

- **Tokens en cookies httpOnly**: Protección contra XSS
- **Login sin organización**: El usuario solo necesita correo y contraseña
- **Multi-organización**: Un usuario puede pertenecer a múltiples organizaciones
- **Refresh automático**: Access token (15 min) + Refresh token (7 días)

---

## Endpoints

### POST `/api/auth/register`

Registra un nuevo usuario. Si la organización no existe, se crea automáticamente.

**Request:**
```json
{
  "organizacion": "Mi Empresa",
  "nombre": "Juan Pérez",
  "fecha_nacimiento": "1990-05-15",
  "contraseña": "MiPassword123",
  "telefono": "5512345678",
  "correo": "juan@empresa.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Organización y usuario administrador creados exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@empresa.com",
    "tipo_usuario": "administrador",
    "organizacion": "Mi Empresa",
    "database": "org_mi_empresa",
    "created_at": "2024-01-15T10:30:00Z",
    "isFirstUser": true
  }
}
```

**Cookies establecidas:**
- `access_token`: Token de acceso (15 min)
- `refresh_token`: Token de refresco (7 días)

**Notas:**
- El primer usuario de una organización es `administrador`
- Los siguientes usuarios son `contador`
- Contraseña mínimo 8 caracteres

---

### POST `/api/auth/login`

Inicia sesión. No requiere especificar organización.

**Request:**
```json
{
  "correo": "juan@empresa.com",
  "contraseña": "MiPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@empresa.com",
    "tipo_usuario": "administrador",
    "organizaciones": [
      {
        "nombre": "Mi Empresa",
        "database": "org_mi_empresa",
        "rol": "administrador"
      },
      {
        "nombre": "Otra Empresa",
        "database": "org_otra_empresa",
        "rol": "contador"
      }
    ],
    "organizacionActiva": {
      "nombre": "Mi Empresa",
      "database": "org_mi_empresa"
    }
  }
}
```

**Cookies establecidas:**
- `access_token`: Token de acceso (15 min)
- `refresh_token`: Token de refresco (7 días)

---

### POST `/api/auth/logout`

Cierra sesión eliminando las cookies.

**Request:** Sin body

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### GET `/api/auth/me`

Obtiene información de la sesión actual.

**Headers:** Requiere cookie `access_token` o `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@empresa.com",
    "tipo_usuario": "administrador",
    "organizaciones": [
      {
        "nombre": "Mi Empresa",
        "database": "org_mi_empresa",
        "rol": "administrador"
      }
    ],
    "organizacionActiva": {
      "nombre": "Mi Empresa",
      "database": "org_mi_empresa"
    }
  }
}
```

---

### PATCH `/api/auth/me`

Cambia la organización activa del usuario.

**Request:**
```json
{
  "database": "org_otra_empresa"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Organización activa cambiada a Otra Empresa",
  "data": {
    "organizacionActiva": {
      "nombre": "Otra Empresa",
      "database": "org_otra_empresa"
    }
  }
}
```

**Nota:** Se actualizan ambas cookies con la nueva organización activa.

---

### POST `/api/auth/refresh`

Refresca el access token usando el refresh token.

**Request:** Sin body (usa cookie `refresh_token`)

**Response (200):**
```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "data": {
    "expiresAt": "2024-01-15T10:45:00Z"
  }
}
```

---

### GET `/api/auth/users`

Lista usuarios de la organización actual.

**Headers:** Requiere autenticación

**Query params:**
- `database` (opcional): Consultar otra organización

**Response (administrador):**
```json
{
  "success": true,
  "data": {
    "role": "administrador",
    "database": "org_mi_empresa",
    "totalUsers": 5,
    "users": [
      {
        "id": 1,
        "nombre": "Juan Pérez",
        "correo": "juan@empresa.com",
        "tipo_usuario": "administrador",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Response (contador):** Solo ve su propia información.

---

### PATCH `/api/auth/users`

Actualiza el rol de un usuario (solo administradores).

**Request:**
```json
{
  "id_usuario": 2,
  "tipo_usuario": "administrador",
  "database": "org_mi_empresa"
}
```

---

### DELETE `/api/auth/users`

Elimina un usuario (solo administradores).

**Request:**
```json
{
  "id_usuario": 2,
  "database": "org_mi_empresa"
}
```

---

## Manejo de Errores

| Código | Descripción |
|--------|-------------|
| 400 | Datos de entrada inválidos |
| 401 | No autorizado - Token requerido o inválido |
| 403 | Prohibido - Sin permisos para esta acción |
| 404 | Recurso no encontrado |
| 409 | Conflicto - Usuario ya existe |
| 500 | Error interno del servidor |

**Formato de error:**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## Implementación Frontend (React/Next.js)

### Configuración de Fetch

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Importante para enviar cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}
```

### Hook de Autenticación

```typescript
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { fetchAPI } from '@/lib/api';

interface User {
  userId: number;
  nombre: string;
  correo: string;
  tipo_usuario: 'administrador' | 'contador';
  organizaciones: Array<{
    nombre: string;
    database: string;
    rol: string;
  }>;
  organizacionActiva: {
    nombre: string;
    database: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (correo: string, contraseña: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  switchOrganization: (database: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetchAPI('/api/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(correo: string, contraseña: string) {
    const response = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contraseña }),
    });
    setUser(response.data);
  }

  async function logout() {
    await fetchAPI('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  async function switchOrganization(database: string) {
    const response = await fetchAPI('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ database }),
    });
    // Actualizar la organización activa
    setUser(prev => prev ? {
      ...prev,
      organizacionActiva: response.data.organizacionActiva
    } : null);
  }

  async function refreshSession() {
    await fetchAPI('/api/auth/refresh', { method: 'POST' });
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      switchOrganization,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
```

### Refresh Automático

```typescript
// lib/tokenRefresh.ts
let refreshPromise: Promise<void> | null = null;

export async function refreshTokenIfNeeded() {
  // Evitar múltiples refreshes simultáneos
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetchAPI('/api/auth/refresh', { method: 'POST' })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Interceptor para manejar 401
export async function fetchWithRefresh(endpoint: string, options: RequestInit = {}) {
  try {
    return await fetchAPI(endpoint, options);
  } catch (error: any) {
    if (error.message?.includes('Token inválido o expirado')) {
      // Intentar refresh
      await refreshTokenIfNeeded();
      // Reintentar la petición original
      return await fetchAPI(endpoint, options);
    }
    throw error;
  }
}
```

---

## Notas de Seguridad

1. **Cookies httpOnly**: Los tokens no son accesibles desde JavaScript
2. **Secure cookies**: En producción, solo se envían por HTTPS
3. **SameSite=Lax**: Protección contra CSRF
4. **Refresh tokens**: Permiten sesiones largas sin exponer el access token
5. **Bcrypt**: Contraseñas hasheadas con 10 salt rounds
