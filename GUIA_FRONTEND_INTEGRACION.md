# 🚀 Guía de Integración Frontend - Backend API Documentos

## 📋 Resumen del Problema Resuelto

El backend ya está **100% funcional** y todos los endpoints han sido testeados exitosamente. Los problemas de autenticación 401 Unauthorized están resueltos.

## 🔧 Cambios Necesarios en el Frontend

### 1. **✅ Verificar el Header Authorization**

**❌ INCORRECTO:**
```javascript
// Estos formatos NO funcionan
headers: {
  'authorization': token,                    // Minúsculas
  'Authorization': token,                    // Sin "Bearer "
  'authorization': 'bearer ' + token,       // "bearer" en minúsculas
}
```

**✅ CORRECTO:**
```javascript
// Este es el formato correcto
headers: {
  'Authorization': 'Bearer ' + token        // "Bearer " con mayúscula y espacio
}
```

### 2. **🔐 Flujo de Autenticación Completo**

```javascript
// Paso 1: Login
async function login(email, password) {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    const token = data.access_token;
    
    // Guardar token (localStorage, sessionStorage, estado, etc.)
    localStorage.setItem('authToken', token);
    
    return { success: true, token, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Paso 2: Usar token en peticiones
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}
```

### 3. **📋 Obtener Lista de Documentos**

```javascript
async function getDocuments(page = 1, limit = 10, status = null, search = null) {
  try {
    // Construir URL con parámetros
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await fetch(`http://localhost:8000/api/documents?${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      documents: data.documents,
      pagination: data.pagination,
      filters: data.filters
    };
  } catch (error) {
    console.error('Error obteniendo documentos:', error);
    return { success: false, error: error.message };
  }
}

// Ejemplo de uso:
// const result = await getDocuments(1, 10, 'pending', 'mi_archivo');
```

### 4. **📤 Upload de Archivos - MUY IMPORTANTE**

```javascript
async function uploadFile(file) {
  try {
    // Validar archivo
    if (!file) {
      throw new Error('No se seleccionó ningún archivo');
    }
    
    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // IMPORTANTE: NO incluir Content-Type en headers para multipart/form-data
    const response = await fetch('http://localhost:8000/api/documents/upload', {
      method: 'POST',
      headers: getAuthHeaders(), // Solo Authorization header
      body: formData             // FormData se encarga del Content-Type
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      document: data
    };
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return { success: false, error: error.message };
  }
}

// Ejemplo de uso con input file:
// const fileInput = document.getElementById('fileInput');
// const result = await uploadFile(fileInput.files[0]);
```

### 5. **🔍 Obtener Documento Específico**

```javascript
async function getDocument(documentId) {
  try {
    const response = await fetch(`http://localhost:8000/api/documents/${documentId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const document = await response.json();
    return { success: true, document };
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    return { success: false, error: error.message };
  }
}
```

### 6. **👤 Obtener Información del Usuario**

```javascript
async function getCurrentUser() {
  try {
    const response = await fetch('http://localhost:8000/api/users/me', {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const user = await response.json();
    return { success: true, user };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return { success: false, error: error.message };
  }
}
```

## 🎯 Ejemplo Completo de Componente React

```jsx
import React, { useState, useEffect } from 'react';

const DocumentsManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Login
  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      setUser(result.user);
      loadDocuments();
    } else {
      alert('Error de login: ' + result.error);
    }
  };
  
  // Cargar documentos
  const loadDocuments = async () => {
    setLoading(true);
    const result = await getDocuments();
    if (result.success) {
      setDocuments(result.documents);
    } else {
      alert('Error cargando documentos: ' + result.error);
    }
    setLoading(false);
  };
  
  // Upload archivo
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const result = await uploadFile(file);
    if (result.success) {
      alert('Archivo subido exitosamente');
      loadDocuments(); // Recargar lista
    } else {
      alert('Error subiendo archivo: ' + result.error);
    }
    setLoading(false);
  };
  
  return (
    <div>
      {/* Formulario de login */}
      {!user && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleLogin(formData.get('email'), formData.get('password'));
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      )}
      
      {/* Panel principal */}
      {user && (
        <div>
          <h2>Bienvenido, {user.email}</h2>
          
          {/* Upload de archivos */}
          <div>
            <input 
              type="file" 
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt"
            />
          </div>
          
          {/* Lista de documentos */}
          <div>
            <h3>Documentos</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : (
              <ul>
                {documents.map(doc => (
                  <li key={doc.id}>
                    {doc.original_name} - {doc.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsManager;
```

## 🛠 Troubleshooting para Desarrolladores

### Debug paso a paso:

1. **Verificar en DevTools → Network:**
   - La petición debe mostrar: `Authorization: Bearer YWRtaW5AdGVzdC5jb206YWRtaW4=`
   - Para upload: `Content-Type: multipart/form-data; boundary=...`

2. **Console del navegador:**
```javascript
// Test manual en consola
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'admin@test.com', password: 'admin123'})
})
.then(r => r.json())
.then(data => {
  console.log('Token:', data.access_token);
  
  // Test documentos
  return fetch('http://localhost:8000/api/documents', {
    headers: {'Authorization': 'Bearer ' + data.access_token}
  });
})
.then(r => r.json())
.then(console.log);
```

3. **Logs del servidor:**
   - Si ves: `📋 [DOCS LIST] Authorization header: 'Bearer abc123...'` → ✅ OK
   - Si ves: `🔐 [REQUEST] No se encontró Authorization header` → ❌ Problema en frontend

## 📝 Credenciales de Testing

```
Email: admin@test.com
Password: admin123
```

## 🚨 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| 401 "Token requerido" | Header Authorization faltante | Verificar `getAuthHeaders()` |
| 401 "Formato de token inválido" | Falta "Bearer " | Usar `Bearer ${token}` |
| 400 "Tipo de archivo no permitido" | Archivo no soportado | Usar PDF, JPG, PNG, DOCX, DOC, TXT |
| CORS error | Puerto incorrecto | Verificar que API esté en puerto 8000 |

## ✅ URLs de los Endpoints

- **Login:** `POST http://localhost:8000/api/auth/login`
- **Documentos:** `GET http://localhost:8000/api/documents`
- **Upload:** `POST http://localhost:8000/api/documents/upload`
- **Documento específico:** `GET http://localhost:8000/api/documents/{id}`
- **Usuario actual:** `GET http://localhost:8000/api/users/me`

¡Con estos cambios, el frontend debería funcionar perfectamente con el backend! 🚀