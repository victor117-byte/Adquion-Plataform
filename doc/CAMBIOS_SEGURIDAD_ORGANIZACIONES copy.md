# Cambios de Seguridad: Aislamiento de Organizaciones

## Resumen Ejecutivo

Se implementó un fix de seguridad crítico que previene el acceso no autorizado a datos entre organizaciones. **Los usuarios con múltiples organizaciones ya no pueden ver datos de una organización mientras están en otra.**

## Cambio Principal

### Antes (VULNERABLE)
```typescript
// El frontend enviaba correo y organizacion como parámetros
// El backend CONFIABA en estos valores sin validar
GET /api/documentos?correo=usuario@email.com&organizacion=OtraOrg
```

Un usuario malicioso podía modificar el parámetro `organizacion` para acceder a datos de cualquier organización.

### Ahora (SEGURO)
```typescript
// El backend obtiene el correo del JWT y valida que el usuario
// tenga acceso a la organización solicitada
GET /api/documentos?organizacion=MiOrg
// o simplemente
GET /api/documentos  // usa la organización activa del JWT
```

---

## CRÍTICO: Cambio de Organización

### PATCH /api/auth/me (Recomendado)

**Este endpoint es OBLIGATORIO para cambiar de organización.** Cuando el usuario selecciona otra organización, el frontend DEBE llamar a este endpoint para actualizar los tokens JWT.

```typescript
// Cambiar de organización
const cambiarOrganizacion = async (database: string) => {
  const response = await fetch('/api/auth/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database })  // ej: "org_miempresa"
  });

  const data = await response.json();

  if (data.success) {
    // Los nuevos tokens ya están en las cookies automáticamente
    console.log('Cambiado a:', data.data.organizacionActiva.nombre);

    // IMPORTANTE: Refrescar la UI con los datos de la nueva org
    // Opción 1: Recargar página
    window.location.reload();

    // Opción 2: Actualizar estado global y recargar datos
    // setCurrentOrg(data.data.organizacionActiva);
    // await recargarDatos();
  }
};
```

### Alternativa: POST /api/auth/switch-organization

También disponible como endpoint alternativo:

```typescript
const cambiarOrganizacion = async (database: string) => {
  const response = await fetch('/api/auth/switch-organization', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database })
  });
  // ... mismo comportamiento
};
```

### GET /api/auth/switch-organization

Obtiene la lista de organizaciones disponibles y cuál está activa:

```typescript
const obtenerOrganizaciones = async () => {
  const response = await fetch('/api/auth/switch-organization', {
    credentials: 'include'
  });
  const data = await response.json();

  // data.data.organizacionActiva - La organización actual
  // data.data.organizaciones - Array de todas las organizaciones disponibles

  return data.data;
};

// Respuesta ejemplo:
{
  "success": true,
  "data": {
    "organizacionActiva": {
      "nombre": "MiEmpresa",
      "database": "org_miempresa",
      "rol": "administrador"
    },
    "organizaciones": [
      { "nombre": "MiEmpresa", "database": "org_miempresa", "rol": "administrador", "esActiva": true },
      { "nombre": "OtraEmpresa", "database": "org_otraempresa", "rol": "contador", "esActiva": false }
    ]
  }
}
```

### ¿Por qué es necesario?

El JWT contiene `organizacionActiva` que determina qué base de datos usan los endpoints por defecto. Sin llamar al endpoint de cambio:
- Los endpoints seguirán usando la organización del login
- El usuario verá los mismos datos aunque cambie la UI
- **NO hay aislamiento real de datos**

---

## Cambios Requeridos en el Frontend

### 1. Eliminar parámetros `correo` y `correo_admin`

**Ya NO es necesario enviar estos parámetros.** El backend los obtiene del JWT.

#### Antes:
```typescript
// GET requests
const response = await fetch(
  `/api/documentos?correo=${user.correo}&organizacion=${org}`,
  { credentials: 'include' }
);

// POST requests
const response = await fetch('/api/automatizaciones', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correo_admin: user.correo,  // ❌ Ya no necesario
    organizacion: org,
    nombre: 'prod_mi_script',
    // ...
  })
});
```

#### Ahora:
```typescript
// GET requests
const response = await fetch(
  `/api/documentos?organizacion=${org}`,
  { credentials: 'include' }
);

// POST requests
const response = await fetch('/api/automatizaciones', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizacion: org,  // ✅ Solo organizacion
    nombre: 'prod_mi_script',
    // ...
  })
});
```

### 2. El parámetro `organizacion` es OPCIONAL

Si no se envía, el backend usa la **organización activa** del JWT (`payload.organizacionActiva`).

```typescript
// Ambas formas son válidas:

// Opción 1: Especificar organización
GET /api/documentos?organizacion=MiEmpresa

// Opción 2: Usar organización activa del token
GET /api/documentos
```

### 3. Nuevos códigos de error

| Código | Significado |
|--------|-------------|
| 401 | Token no presente o inválido |
| 403 | **NUEVO**: No tienes acceso a esta organización |

```typescript
// Manejar el nuevo error 403
const response = await fetch('/api/documentos?organizacion=OtraOrg', {
  credentials: 'include'
});

if (response.status === 403) {
  const data = await response.json();
  // data.message = "No tienes acceso a esta organización"
  // Redirigir al usuario o mostrar error
}
```

---

## Endpoints Actualizados

### Automatizaciones

| Endpoint | Métodos | Parámetros removidos |
|----------|---------|---------------------|
| `/api/automatizaciones` | GET, POST, PATCH, DELETE | `correo`, `correo_admin` |
| `/api/automatizaciones/ejecutar` | POST, DELETE | `correo_admin` |
| `/api/automatizaciones/disponibles` | GET | `correo` |
| `/api/automatizaciones/logs` | GET | `correo` |
| `/api/automatizaciones/status` | GET, DELETE | `correo` |
| `/api/automatizaciones/metadata` | GET | `correo` |
| `/api/automatizaciones/scheduler` | GET, POST | `correo`, `correo_admin` |

### Contribuyentes

| Endpoint | Métodos | Parámetros removidos |
|----------|---------|---------------------|
| `/api/contribuyentes` | GET, POST, PATCH, DELETE | `correo`, `correo_admin` |
| `/api/contribuyentes/certificados` | GET, POST, DELETE | `correo` |

### Documentos

| Endpoint | Métodos | Parámetros removidos |
|----------|---------|---------------------|
| `/api/documentos` | GET, POST, PATCH, DELETE | `correo` |
| `/api/documentos/archivo` | GET | `correo` |

### Reportes

| Endpoint | Métodos | Parámetros removidos |
|----------|---------|---------------------|
| `/api/reportes` | GET, POST, PATCH, DELETE | `correo`, `correo_admin` |

### Usuarios

| Endpoint | Métodos | Parámetros removidos |
|----------|---------|---------------------|
| `/api/usuarios/preferencias` | GET, PATCH | `correo` |

---

## Ejemplos de Migración por Endpoint

### GET /api/documentos

```typescript
// ❌ Antes
const url = `/api/documentos?correo=${user.correo}&organizacion=${org}`;

// ✅ Ahora
const url = `/api/documentos?organizacion=${org}`;
// o simplemente
const url = `/api/documentos`;
```

### POST /api/automatizaciones

```typescript
// ❌ Antes
const body = {
  correo_admin: user.correo,
  organizacion: currentOrg,
  nombre: 'prod_mi_script',
  script_path: 'scripts/mi_script.py',
  cron_expresion: '0 8 * * *'
};

// ✅ Ahora
const body = {
  organizacion: currentOrg,  // opcional si es la org activa
  nombre: 'prod_mi_script',
  script_path: 'scripts/mi_script.py',
  cron_expresion: '0 8 * * *'
};
```

### POST /api/automatizaciones/ejecutar

```typescript
// ❌ Antes
const body = {
  correo_admin: user.correo,
  organizacion: currentOrg,
  id_automatizacion: 5
};

// ✅ Ahora
const body = {
  organizacion: currentOrg,
  id_automatizacion: 5
};
```

### DELETE /api/reportes

```typescript
// ❌ Antes
const body = {
  correo_admin: user.correo,
  organizacion: currentOrg,
  id_reporte: 3
};

// ✅ Ahora
const body = {
  organizacion: currentOrg,
  id_reporte: 3
};
```

### GET /api/usuarios/preferencias

```typescript
// ❌ Antes
const url = `/api/usuarios/preferencias?correo=${user.correo}&organizacion=${org}`;

// ✅ Ahora
const url = `/api/usuarios/preferencias?organizacion=${org}`;
// o simplemente
const url = `/api/usuarios/preferencias`;
```

---

## Hook de Fetch Recomendado

Para simplificar la migración, se recomienda crear un hook centralizado:

```typescript
// hooks/useApi.ts
import { useAuth } from '@/contexts/AuthContext';

export function useApi() {
  const { currentOrganization } = useAuth();

  const fetchApi = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    // Agregar organizacion a query params si no está presente
    const url = new URL(endpoint, window.location.origin);
    if (!url.searchParams.has('organizacion') && currentOrganization) {
      url.searchParams.set('organizacion', currentOrganization);
    }

    const response = await fetch(url.toString(), {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Manejar errores de autenticación/autorización
    if (response.status === 401) {
      // Token expirado, intentar refresh o redirigir a login
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    if (response.status === 403) {
      const data = await response.json();
      throw new Error(data.message || 'No tienes acceso a este recurso');
    }

    return response;
  };

  const get = (endpoint: string) => fetchApi(endpoint);

  const post = (endpoint: string, body: object) =>
    fetchApi(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }),
    });

  const patch = (endpoint: string, body: object) =>
    fetchApi(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }),
    });

  const del = (endpoint: string, body: object) =>
    fetchApi(endpoint, {
      method: 'DELETE',
      body: JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }),
    });

  return { get, post, patch, del };
}
```

### Uso del hook:

```typescript
function MisDocumentos() {
  const { get, post } = useApi();
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    const cargarDocumentos = async () => {
      const response = await get('/api/documentos');
      const data = await response.json();
      setDocumentos(data.data.documentos);
    };
    cargarDocumentos();
  }, []);

  const crearDocumento = async (formData: FormData) => {
    // Para FormData, usar fetch directamente
    const response = await fetch('/api/documentos', {
      method: 'POST',
      credentials: 'include',
      body: formData,  // No incluir Content-Type para FormData
    });
    // ...
  };
}
```

---

## Checklist de Migración

- [ ] Actualizar todas las llamadas GET para remover `correo` de query params
- [ ] Actualizar todas las llamadas POST/PATCH/DELETE para remover `correo`/`correo_admin` del body
- [ ] Implementar manejo de error 403 "No tienes acceso a esta organización"
- [ ] Verificar que `credentials: 'include'` está presente en todas las llamadas
- [ ] Probar el cambio de organización para usuarios con múltiples orgs
- [ ] Verificar que no se puede acceder a datos de otras organizaciones

---

## Testing

### Caso de prueba: Aislamiento de organizaciones

1. Usuario con acceso a Org_A y Org_B
2. Login y seleccionar Org_A como activa
3. Intentar acceder a `/api/documentos?organizacion=Org_B`
4. **Resultado esperado**: Funciona (usuario tiene acceso a ambas)

5. Intentar acceder a `/api/documentos?organizacion=Org_C`
6. **Resultado esperado**: Error 403 "No tienes acceso a esta organización"

### Caso de prueba: Token manipulado

1. Intentar modificar el parámetro `organizacion` a una org sin acceso
2. **Resultado esperado**: Error 403

---

## Preguntas Frecuentes

### ¿Por qué se removió el parámetro correo?

Era una vulnerabilidad de seguridad. Un atacante podía enviar el correo de otro usuario y potencialmente acceder a sus datos.

### ¿Qué pasa si envío correo de todas formas?

El backend lo ignora. Siempre usa el correo del JWT.

### ¿Puedo seguir enviando correo para compatibilidad?

Sí, pero es código muerto. El backend no lo usa. Se recomienda removerlo para mantener el código limpio.

### ¿Qué pasa si no envío organizacion?

Se usa la organización activa del JWT (`payload.organizacionActiva`), que es la última organización que el usuario seleccionó al hacer login o al cambiar de organización.
