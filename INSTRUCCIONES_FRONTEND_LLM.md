# INSTRUCCIONES PARA INTEGRAR API DE DOCUMENTOS EN FRONTEND

## CONTEXTO TÉCNICO
El backend FastAPI está funcionando en `http://localhost:8000` con endpoints funcionales de autenticación y documentos con paginación real. La base de datos PostgreSQL está conectada y funcionando. Todos los endpoints requieren autenticación con token Bearer.

## ENDPOINTS DISPONIBLES

### 1. AUTENTICACIÓN
**POST /api/auth/login**
- URL: `http://localhost:8000/api/auth/login`
- Content-Type: `application/json`
- Body: `{"email": "admin@test.com", "password": "admin123"}`
- Response: `{"access_token": "token_string", "token_type": "bearer", "user": {...}}`

**POST /api/auth/register**
- URL: `http://localhost:8000/api/auth/register`
- Content-Type: `application/json`
- Body: `{"email": "nuevo@test.com", "password": "password123", "role": "user"}`

**GET /api/users/me**
- URL: `http://localhost:8000/api/users/me`
- Headers: `Authorization: Bearer {token}`
- Response: `{"id": 1, "email": "admin@test.com", "role": "admin"}`

### 2. DOCUMENTOS

**POST /api/documents/upload**
- URL: `http://localhost:8000/api/documents/upload`
- Headers: `Authorization: Bearer {token}`
- Body: FormData con archivo en campo 'file'
- Tipos permitidos: PDF, JPG, PNG, DOCX, DOC
- Response: `{"id": 1, "filename": "uuid.pdf", "original_name": "documento.pdf", "status": "pending", ...}`

**GET /api/documents**
- URL: `http://localhost:8000/api/documents`
- Headers: `Authorization: Bearer {token}`
- Query params opcionales:
  - `page=1` (número de página, default 1)
  - `limit=10` (documentos por página, default 10, máximo 100)
  - `status=pending|processing|processed|error` (filtrar por estado)
  - `search=texto` (buscar en nombres de archivo)
- Ejemplo: `http://localhost:8000/api/documents?page=2&limit=5&status=pending&search=factura`
- Response: 
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "uuid-generado.pdf",
      "original_name": "mi-documento.pdf",
      "file_size": 1024,
      "content_type": "application/pdf",
      "status": "pending",
      "uploaded_at": "2025-10-06T15:30:00",
      "processed_at": null,
      "user_id": "admin@test.com",
      "processing_result": null
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_documents": 42,
    "documents_per_page": 10,
    "has_next": true,
    "has_previous": false,
    "next_page": 2,
    "previous_page": null
  },
  "filters": {
    "status": "pending",
    "search": "documento"
  }
}
```

**GET /api/documents/{id}**
- URL: `http://localhost:8000/api/documents/123`
- Headers: `Authorization: Bearer {token}`
- Response: Objeto documento individual

## FLUJO DE AUTENTICACIÓN REQUERIDO

1. **Login primero**: Hacer POST a `/api/auth/login` con credenciales
2. **Guardar token**: Almacenar `access_token` del response (en localStorage o state)
3. **Usar token**: Incluir `Authorization: Bearer {token}` en TODOS los requests de documentos
4. **Manejar errores 401**: Si token expira o es inválido, hacer login nuevamente

## CÓDIGO DE EJEMPLO PARA IMPLEMENTAR

```javascript
// 1. CONFIGURACIÓN BASE
const API_BASE = 'http://localhost:8000';

// 2. FUNCIÓN DE LOGIN
async function login(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Login falló');
    
    const data = await response.json();
    localStorage.setItem('authToken', data.access_token);
    return data;
}

// 3. FUNCIÓN PARA OBTENER TOKEN
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// 4. FUNCIÓN PARA SUBIR DOCUMENTO
async function uploadDocument(file) {
    const token = getAuthToken();
    if (!token) throw new Error('No autenticado');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error subiendo archivo');
    }
    
    return await response.json();
}

// 5. FUNCIÓN PARA OBTENER DOCUMENTOS CON PAGINACIÓN
async function getDocuments(page = 1, limit = 10, status = null, search = null) {
    const token = getAuthToken();
    if (!token) throw new Error('No autenticado');
    
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_BASE}/api/documents?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Error obteniendo documentos');
    
    return await response.json();
}
```

## MANEJO DE ERRORES

- **401 Unauthorized**: Token inválido o expirado - hacer login nuevamente
- **400 Bad Request**: Datos inválidos - validar campos antes de enviar
- **404 Not Found**: Recurso no existe - verificar IDs
- **500 Internal Server Error**: Error del servidor - mostrar mensaje genérico

## CONSIDERACIONES DE UX

1. **Estados de carga**: Mostrar spinners durante requests
2. **Paginación**: Implementar controles de navegación usando `pagination` metadata
3. **Filtros**: Permitir filtrar por estado y búsqueda de texto
4. **Upload progress**: Mostrar progreso durante subida de archivos
5. **Validación client-side**: Verificar tipos de archivo antes de subir
6. **Manejo de errores**: Mostrar mensajes de error claros al usuario

## TIPOS DE ARCHIVO SOPORTADOS

- PDF: `application/pdf`
- JPG: `image/jpeg`
- PNG: `image/png`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- DOC: `application/msword`

## ESTADOS DE DOCUMENTO

- `pending`: Subido, esperando procesamiento
- `processing`: En proceso de análisis
- `processed`: Completado exitosamente
- `error`: Error durante procesamiento

## CREDENCIALES DE PRUEBA

- Email: `admin@test.com`
- Password: `admin123`

## CORS CONFIGURADO PARA

- `http://localhost:8080`
- `http://localhost:8082`
- `http://localhost:3000`
- `http://127.0.0.1:8080`
- `http://127.0.0.1:8082`
- `http://127.0.0.1:3000`

## IMPORTANTE

- Todos los endpoints de documentos requieren autenticación
- Los tokens se almacenan como Bearer tokens
- La paginación es obligatoria para performance
- Los archivos se guardan físicamente en el servidor
- Solo se pueden ver documentos del usuario autenticado
- El servidor está corriendo en modo desarrollo con hot-reload

## FEEDBACK PARA EL EQUIPO BACKEND (PARA COMPARTIR)
A continuación hay observaciones concretas y snippets que pueden compartir con el equipo backend para acelerar la resolución de los problemas de integración con el frontend.

1) Inconsistencia en la clave del token en localStorage
- Observación: El equipo backend indica que el frontend central (`src/lib/api.ts`) espera guardar el token en `localStorage` bajo la clave `auth_token`. En este documento y en los ejemplos del frontend usamos `authToken` / `authToken`/`authToken`. Esto causa fallos si el frontend y los snippets no usan la misma clave.
- Recomendación: Estandarizar en una sola clave. Sugerencia: usar `auth_token` (snake_case) o acordar con frontend. Ejemplo para frontend:
  localStorage.setItem('auth_token', data.access_token);
  Y para leer:
  const token = localStorage.getItem('auth_token');

2) Formato de la respuesta de login — obligatorio
- Requisito: `POST /api/auth/login` debe devolver exactamente estas propiedades:
  - `access_token`: string
  - `token_type`: "bearer"
  - `user`: objeto usuario
- Si el backend devuelve el token en otro campo (`token`, `value`, etc.) o codificado de forma no documentada, el frontend no podrá usarlo. Ajusten el backend o documenten claramente el campo.

3) Aceptar y parsear `Authorization: Bearer <token>` de forma robusta
- Recomendación técnica (FastAPI): leer el header `Authorization` de forma case-insensitive y aceptar el prefijo `Bearer ` (con espacio). Ejemplo rápido:

```py
# snippet para handlers FastAPI (desarrollo)
from fastapi import Request

async def read_auth_header(request: Request):
    auth = request.headers.get('authorization')
    # Log temporal para debugging
    print('Authorization header received:', auth)
    if not auth or not auth.lower().startswith('bearer '):
        return None
    token = auth.split(' ', 1)[1]
    return token
```

4) CORS — permitir cabeceras y exponer si hace falta
- Asegúrense de que `CORSMiddleware` incluye `allow_headers` que permita `Authorization` y `allow_origins` cubra el host del frontend.
- Ejemplo recomendado:

```py
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://localhost:8080", "http://127.0.0.1:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"]
)
```

5) Endpoint de validación de token
- Si tienen `/api/auth/validate-token`, comprobar que acepte `Authorization: Bearer <token>` y devuelva:
  - `200 OK` con `{ "valid": true }` cuando el token sea válido
  - `401` cuando no lo sea
- Añadan logs temporales para ver la cadena de token que llega.

6) Pruebas reproducíbles (curl)
- Pasos que el backend debe ejecutar localmente (ejemplos):

```bash
# 1) Login
curl -v -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"admin123"}'

# 2) Usar el access_token retornado en la siguiente llamada
curl -v -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <access_token>"

# 3) Subir archivo (ejemplo con curl)
curl -v -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/ruta/al/archivo.pdf"
```

7) Logging mínimo para desarrollo
- Logear `request.headers.get('authorization')` y el resultado del parseo del token.
- Si usan JWT, imprimir (solo en dev) el header decodificado para validar estructura.

8) Checklist de aceptación (quick):
- [ ] `POST /api/auth/login` devuelve `access_token` y `token_type: 'bearer'`
- [ ] Frontend y snippets usan la misma clave en localStorage (ej. `auth_token`)
- [ ] `GET /api/users/me` funciona con `Authorization: Bearer {access_token}`
- [ ] `POST /api/documents/upload` acepta FormData y `Authorization` y devuelve 200
- [ ] CORS permite la cabecera `Authorization`

---

Si deseas, puedo insertar este bloque al final del archivo `INSTRUCCIONES_BACKEND.md` o actualizar ambos documentos con una nota que incluya exactamente la clave `localStorage` que deben usar. ¿Quieres que lo agregue también dentro de `INSTRUCCIONES_BACKEND.md` para que el equipo backend lo reciba junto con los pasos previos?