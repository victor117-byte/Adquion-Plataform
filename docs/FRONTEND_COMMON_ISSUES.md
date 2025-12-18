# ⚠️ Issues Comunes del Frontend - Soluciones

## 🔍 Problema #1: "No veo documentos al consultar la API"

### ❌ Error Común

```javascript
// ❌ INCORRECTO - Frontend enviando parámetro cliente con el nombre de la organización
fetch('/api/documents/?cliente=demo17_organization')
```

### ✅ Solución

El parámetro `cliente` NO es el nombre de la organización. Es el nombre del **cliente específico del documento**.

```javascript
// ✅ CORRECTO - NO enviar parámetro cliente para ver todos
fetch('/api/documents/')  // Ve TODOS los documentos de tu organización

// ✅ CORRECTO - Filtrar por cliente específico del documento
fetch('/api/documents/?cliente=Empresa%20ABC')  // Solo docs de "Empresa ABC"
```

### 📋 Explicación Completa

**Multi-tenancy funciona así:**

1. **Filtro por organización = AUTOMÁTICO** 🔒
   - Se extrae del token JWT
   - No necesitas enviarlo
   - El backend filtra automáticamente por `organization_id`

2. **Campo `cliente` = Opcional para filtrar documentos** 🔍
   - Es el nombre del cliente del **documento específico**
   - Ejemplo: "Juan Pérez", "Empresa ABC", "Cliente XYZ"
   - NO es el nombre de tu organización
   - Si NO lo envías = ves TODOS los documentos de tu org

### 🎯 Casos de Uso

```javascript
// Caso 1: Ver TODOS los documentos de mi organización
const getAllDocuments = async () => {
  const response = await fetch('/api/documents/', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Retorna TODOS los documentos de tu organización
};

// Caso 2: Filtrar por cliente específico
const getClientDocuments = async (clientName) => {
  const response = await fetch(`/api/documents/?cliente=${encodeURIComponent(clientName)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Retorna solo documentos donde doc.cliente === clientName
};

// Caso 3: Usuario normal ver solo sus documentos
const getMyDocuments = async () => {
  const response = await fetch('/api/documents/?my_documents=true', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Admin con my_documents=true: ve solo documentos que él subió
  // Usuario normal: SIEMPRE ve solo sus documentos (my_documents se ignora)
};
```

---

## 🔍 Problema #2: "Login falla con formato JSON"

### ❌ Error Común

```javascript
// ❌ INCORRECTO - Login con JSON
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'user@example.com', password: '123' })
});
```

### ✅ Solución

Login usa `application/x-www-form-urlencoded`, NO JSON:

```javascript
// ✅ CORRECTO - Login con form-urlencoded
const formData = new URLSearchParams();
formData.append('username', 'user@example.com');  // Campo 'username' recibe el EMAIL
formData.append('password', '123456');

await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData.toString()
});
```

**⚠️ Nota:** El campo se llama `username` pero debes enviar el **email**.

---

## 🔍 Problema #3: "Token expira y no se maneja"

### ❌ Error Común

```javascript
// ❌ INCORRECTO - No manejar 401
const response = await fetch('/api/documents/', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();  // Error si 401
```

### ✅ Solución

Siempre verifica el status code y maneja 401:

```javascript
// ✅ CORRECTO - Manejar token expirado
const response = await fetch('/api/documents/', {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (response.status === 401) {
  // Token expirado
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
  return;
}

if (!response.ok) {
  throw new Error('Error en la petición');
}

const data = await response.json();
```

### 🔧 Interceptor Global (Recomendado)

```javascript
// src/services/api.js
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return await response.json();
};
```

---

## 🔍 Problema #4: "Upload de archivos no funciona"

### ❌ Error Común

```javascript
// ❌ INCORRECTO - Enviar como JSON
await fetch('/api/documents/upload', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ file: file, cliente: 'Test' })
});
```

### ✅ Solución

Usar FormData sin especificar Content-Type:

```javascript
// ✅ CORRECTO - FormData para upload
const formData = new FormData();
formData.append('file', file);  // File object del input
formData.append('cliente', 'Nombre del Cliente');

await fetch('/api/documents/upload', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`
    // NO incluir Content-Type, el browser lo configura automáticamente
  },
  body: formData
});
```

---

## 🔍 Problema #5: "Paginación no funciona correctamente"

### ❌ Error Común

```javascript
// ❌ INCORRECTO - Calcular páginas manualmente
const totalPages = Math.ceil(total / 10);  // Hardcoded per_page
```

### ✅ Solución

Usar los valores que retorna la API:

```javascript
// ✅ CORRECTO - Usar valores de la respuesta
const response = await fetch('/api/documents/?page=1&per_page=20');
const data = await response.json();

const totalPages = Math.ceil(data.total / data.per_page);
const hasNextPage = data.page < totalPages;
const hasPrevPage = data.page > 1;
```

### 📊 Estructura de Respuesta

```json
{
  "documents": [...],
  "total": 50,          // Total de documentos
  "page": 1,            // Página actual
  "per_page": 20        // Documentos por página
}
```

---

## 🔍 Problema #6: "CORS errors en desarrollo"

### ❌ Error Común

```
Access to fetch at 'http://localhost:8000/api/documents/' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

### ✅ Solución

Verificar que el backend tenga configurado CORS:

```python
# Backend ya configurado en src/api/app.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Si usas otro puerto, agrégalo al `.env`:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174
```

---

## 🔍 Problema #7: "No entiendo los roles de usuario"

### 📋 Roles Explicados

```javascript
// organization_admin
// - Ve TODOS los documentos de su organización
// - Puede gestionar usuarios de su organización
// - Puede ver estadísticas de toda la organización

// organization_user (o 'user')
// - Ve SOLO sus propios documentos
// - No puede ver documentos de otros usuarios de su org
// - No puede gestionar usuarios
```

### 🎯 Ejemplos

```javascript
// Usuario Admin: victor@empresa.com (organization_admin)
GET /api/documents/
// Retorna: TODOS los documentos de "Empresa SA"

// Usuario Normal: juan@empresa.com (organization_user)
GET /api/documents/
// Retorna: SOLO documentos subidos por juan@empresa.com

// Admin que quiere ver solo sus documentos
GET /api/documents/?my_documents=true
// Retorna: SOLO documentos subidos por victor@empresa.com
```

---

## 📚 Referencias

- **Documentación completa**: [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
- **Flujos de usuario**: [FRONTEND_FLOWS.md](./FRONTEND_FLOWS.md)
- **API Swagger**: http://localhost:8000/docs
- **Arquitectura**: [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)

---

## 🆘 ¿Aún tienes problemas?

1. Verifica el token JWT en [jwt.io](https://jwt.io) - debe contener `organization_id`
2. Revisa los logs del backend: `tail -f logs/app_*.log`
3. Usa la consola de Swagger: http://localhost:8000/docs
4. Verifica el formato exacto de la petición en Network tab del browser

---

## ✅ Checklist Frontend

Antes de reportar un bug, verifica:

- [ ] Token JWT válido y no expirado
- [ ] Header `Authorization: Bearer {token}` presente
- [ ] Login usa `application/x-www-form-urlencoded`
- [ ] Upload usa `FormData` (no JSON)
- [ ] Parámetro `cliente` NO se envía (a menos que quieras filtrar)
- [ ] Manejo de errores 401 implementado
- [ ] CORS configurado en backend (.env)
- [ ] Endpoint correcto (sin typos)
