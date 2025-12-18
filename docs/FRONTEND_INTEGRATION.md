# 🔌 API Integration Guide - Frontend

Guía completa para integrar el frontend con el backend de Aplicación SAT.

## 📋 Tabla de Contenidos

1. [Base URL y Configuración](#base-url)
2. [Autenticación](#autenticación)
3. [Endpoints Disponibles](#endpoints)
4. [Flujos Completos](#flujos)
5. [Ejemplos de Código](#ejemplos)
6. [Manejo de Errores](#errores)

---

## 🌐 Base URL y Configuración {#base-url}

```javascript
const API_BASE_URL = 'http://localhost:8000';
// En producción: 'https://api.aplicacion-sat.com'

// Headers por defecto
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Headers con autenticación
const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});
```

---

## 🔐 Autenticación {#autenticación}

### Token JWT

**Todos los endpoints protegidos requieren:**
```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Almacenar Token

```javascript
// Guardar token
localStorage.setItem('auth_token', token);

// Obtener token
const token = localStorage.getItem('auth_token');

// Eliminar token (logout)
localStorage.removeItem('auth_token');
```

---

## 📍 Endpoints Disponibles {#endpoints}

### 1. Health & Status

#### `GET /health`
Verificar estado del sistema.

**Request:**
```javascript
fetch(`${API_BASE_URL}/health`)
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sistema operativo",
  "timestamp": null,
  "checks": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

---

### 2. Autenticación

#### `POST /api/auth/register`
Registrar nuevo usuario.

**Request:**
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "MiPassword123!",
  "name": "Juan Pérez",
  "full_name": "Juan Pérez García",
  "company_name": "Mi Empresa SA"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@empresa.com",
    "full_name": "Juan Pérez García",
    "role": "organization_admin",
    "company": "Mi Empresa SA",
    "is_active": true,
    "created_at": "2025-12-18T10:00:00",
    "subscription": {
      "plan": "free",
      "status": "trialing",
      "expires_at": "2026-01-17T10:00:00Z",
      "is_trial": true,
      "trial_ends_at": "2026-01-17T10:00:00Z",
      "days_remaining": 30
    },
    "can_access_features": true
  }
}
```

**Errores:**
- `400` - Email ya existe
- `422` - Validación fallida (email inválido, password débil)

---

#### `POST /api/auth/login`
Iniciar sesión.

**Request:**
```javascript
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=usuario@empresa.com&password=MiPassword123!
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@empresa.com",
    "full_name": "Juan Pérez García",
    "role": "organization_admin",
    "company": "Mi Empresa SA",
    "subscription": { /* ... */ }
  }
}
```

**Errores:**
- `401` - Credenciales incorrectas

---

### 3. Organizaciones

#### `GET /api/organizations/me`
Obtener información de mi organización.

**Request:**
```javascript
GET /api/organizations/me
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Mi Empresa SA",
  "plan": "free",
  "created_at": "2025-12-18T10:00:00",
  "subscription": {
    "plan": "free",
    "status": "trialing",
    "expires_at": "2026-01-17T10:00:00Z",
    "days_remaining": 30
  }
}
```

---

### 4. Documentos

#### `POST /api/documents/upload`
Subir documento.

**Request:**
```javascript
POST /api/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
  - file: [archivo]
  - cliente: "Nombre del Cliente"
  - file_type: "pdf" (opcional)
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "document_id": 123,
    "filename": "documento.pdf",
    "status": "uploaded"
  }
}
```

---

#### `GET /api/documents/`
Listar documentos.

**Request:**
```javascript
GET /api/documents/?page=1&per_page=10
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 123,
        "filename": "documento.pdf",
        "original_filename": "mi-archivo.pdf",
        "file_type": "pdf",
        "file_size": 102400,
        "status": "uploaded",
        "cliente": "Cliente Test",
        "uploaded_by": 1,
        "created_at": "2025-12-18T10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 10,
    "total_pages": 5
  }
}
```

**Query Params:**
- `page` (default: 1)
- `per_page` (default: 10)
- `status` (opcional): "uploaded", "processing", "completed", "failed"

---

#### `GET /api/documents/{id}`
Obtener documento específico.

**Request:**
```javascript
GET /api/documents/123
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 123,
    "filename": "documento.pdf",
    "original_filename": "mi-archivo.pdf",
    "file_type": "pdf",
    "file_size": 102400,
    "status": "uploaded",
    "cliente": "Cliente Test",
    "organization_id": 1,
    "uploaded_by": 1,
    "upload_path": "/uploads/documento.pdf",
    "created_at": "2025-12-18T10:00:00",
    "updated_at": "2025-12-18T10:00:00"
  }
}
```

**Errores:**
- `404` - Documento no encontrado
- `403` - No tienes permiso (documento de otra organización)

---

### 5. Usuarios

#### `GET /api/users/`
Listar usuarios de mi organización.

**Request:**
```javascript
GET /api/users/?page=1&per_page=10
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "total": 5,
  "users": [
    {
      "id": 1,
      "email": "usuario@empresa.com",
      "full_name": "Juan Pérez",
      "role": "organization_admin",
      "is_active": true,
      "created_at": "2025-12-18T10:00:00"
    },
    {
      "id": 2,
      "email": "usuario2@empresa.com",
      "full_name": "María López",
      "role": "user",
      "is_active": true,
      "created_at": "2025-12-18T11:00:00"
    }
  ],
  "page": 1,
  "per_page": 10
}
```

---

### 6. Suscripciones

#### `GET /api/subscriptions/`
Obtener información de suscripción.

**Request:**
```javascript
GET /api/subscriptions/
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "plan": "free",
  "status": "trialing",
  "expires_at": "2026-01-17T10:00:00Z",
  "trial_ends_at": "2026-01-17T10:00:00Z",
  "days_remaining": 30,
  "is_trial": true,
  "features": {
    "max_users": 5,
    "max_documents": 100,
    "max_storage_gb": 10
  }
}
```

**Estados posibles:**
- `trialing` - En período de prueba
- `active` - Suscripción activa
- `past_due` - Pago vencido
- `canceled` - Cancelada
- `unpaid` - Sin pagar

---

## 🔄 Flujos Completos {#flujos}

### Flujo 1: Registro e Inicio de Sesión

```javascript
// 1. Registrar usuario
const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      company_name: userData.companyName
    })
  });
  
  if (!response.ok) {
    throw new Error('Error en registro');
  }
  
  const data = await response.json();
  
  // Guardar token
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};

// 2. Login
const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Credenciales incorrectas');
  }
  
  const data = await response.json();
  
  // Guardar token
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};

// 3. Logout
const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

---

### Flujo 2: Subir y Listar Documentos

```javascript
// 1. Subir documento
const uploadDocument = async (file, clienteName) => {
  const token = localStorage.getItem('auth_token');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cliente', clienteName);
  
  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Error subiendo documento');
  }
  
  return await response.json();
};

// 2. Listar documentos
const listDocuments = async (page = 1, perPage = 10) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/api/documents/?page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Error listando documentos');
  }
  
  return await response.json();
};

// 3. Obtener documento específico
const getDocument = async (documentId) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Documento no encontrado');
  }
  
  return await response.json();
};
```

---

### Flujo 3: Verificar Suscripción

```javascript
// Verificar si el usuario puede acceder a features
const checkSubscription = async () => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Error verificando suscripción');
  }
  
  const data = await response.json();
  
  // Verificar si está activa
  if (data.status === 'trialing' || data.status === 'active') {
    return {
      canAccess: true,
      plan: data.plan,
      daysRemaining: data.days_remaining
    };
  }
  
  return {
    canAccess: false,
    reason: 'Suscripción expirada'
  };
};
```

---

## 💻 Ejemplos de Código {#ejemplos}

### React Hook Personalizado

```javascript
// useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return { user, token, loading, login, logout };
};
```

### Componente de Upload

```javascript
// DocumentUpload.jsx
import { useState } from 'react';

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [cliente, setCliente] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Selecciona un archivo');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cliente', cliente);

      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      alert('Documento subido exitosamente');
      
      // Limpiar form
      setFile(null);
      setCliente('');
      
    } catch (error) {
      alert('Error subiendo documento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".pdf,.txt,.doc,.docx"
      />
      
      <input
        type="text"
        placeholder="Nombre del cliente"
        value={cliente}
        onChange={(e) => setCliente(e.target.value)}
      />
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir Documento'}
      </button>
    </form>
  );
};

export default DocumentUpload;
```

### Lista de Documentos con Paginación

```javascript
// DocumentList.jsx
import { useState, useEffect } from 'react';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [page]);

  const loadDocuments = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/documents/?page=${page}&per_page=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      setDocuments(data.data.documents);
      setTotalPages(Math.ceil(data.data.total / 10));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Documentos</h2>
      
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.id}</td>
                  <td>{doc.original_filename}</td>
                  <td>{doc.cliente}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>{doc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            
            <span>Página {page} de {totalPages}</span>
            
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentList;
```

---

## ⚠️ Manejo de Errores {#errores}

### Códigos de Estado HTTP

```javascript
const handleApiError = (response) => {
  switch (response.status) {
    case 400:
      return 'Solicitud incorrecta - verifica los datos';
    case 401:
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return 'Sesión expirada - inicia sesión nuevamente';
    case 403:
      return 'No tienes permiso para realizar esta acción';
    case 404:
      return 'Recurso no encontrado';
    case 422:
      return 'Datos de validación incorrectos';
    case 500:
      return 'Error del servidor - intenta más tarde';
    default:
      return 'Error desconocido';
  }
};
```

### Interceptor de Requests

```javascript
// api.js
const API_BASE_URL = 'http://localhost:8000';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Si el token expiró, redirigir a login
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || handleApiError(response));
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## 🔑 Validaciones del Frontend

### Email
```javascript
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### Password
```javascript
const isValidPassword = (password) => {
  // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};
```

### Tamaño de Archivo
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};
```

---

## 📱 Ejemplo Completo: App React

```javascript
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/documents" element={
          <PrivateRoute>
            <Documents />
          </PrivateRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🚀 Deployment

### Variables de Entorno

```javascript
// .env.development
REACT_APP_API_URL=http://localhost:8000

// .env.production
REACT_APP_API_URL=https://api.aplicacion-sat.com
```

### Uso en código

```javascript
const API_URL = process.env.REACT_APP_API_URL;
```

---

## 📚 Recursos Adicionales

- **Documentación Swagger**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`
- **Tests**: Ver `tests/` para ejemplos de uso

---

## ✅ Checklist de Integración

- [ ] Configurar base URL del API
- [ ] Implementar manejo de tokens JWT
- [ ] Crear interceptor de requests
- [ ] Implementar login/register
- [ ] Implementar logout
- [ ] Proteger rutas privadas
- [ ] Manejar errores 401 (sesión expirada)
- [ ] Implementar upload de archivos
- [ ] Implementar listado con paginación
- [ ] Validar datos en el frontend
- [ ] Mostrar información de suscripción
- [ ] Manejar estados de carga
- [ ] Implementar feedback de errores al usuario

---

**¿Dudas?** Consulta los tests en `tests/` para ver ejemplos reales de uso de cada endpoint.
