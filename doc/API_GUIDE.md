# 🚀 Guía de Endpoints - Sistema Multi-tenant

## 📍 Ubicación de los endpoints

Los endpoints se crean en la carpeta:
```
app/api/
```

Cada carpeta representa una ruta:
- `app/api/hello/route.ts` → `/api/hello`
- `app/api/auth/register/route.ts` → `/api/auth/register`
- `app/api/auth/login/route.ts` → `/api/auth/login`

## 🔐 Endpoints de Autenticación

### 1. Registro de Usuario

**Endpoint:** `POST /api/auth/register`

**Body (JSON):**
```json
{
  "organizacion": "mi_empresa",
  "nombre": "Juan Pérez",
  "fecha_nacimiento": "1990-05-15",
  "contraseña": "password123",
  "telefono": "5551234567",
  "correo": "juan@miempresa.com"
}
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion": "mi_empresa",
    "nombre": "Juan Pérez",
    "fecha_nacimiento": "1990-05-15",
    "contraseña": "password123",
    "telefono": "5551234567",
    "correo": "juan@miempresa.com"
  }'
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@miempresa.com",
    "tipo_usuario": "administrador",
    "organizacion": "mi_empresa",
    "database": "org_mi_empresa",
    "created_at": "2026-01-06T13:30:00.000Z"
  }
}
```

**Notas:**
- ✅ El **primer usuario** de una organización será **administrador**
- ✅ Los usuarios siguientes serán **contador**
- ✅ Se crea automáticamente una base de datos para la organización: `org_nombre_empresa`
- ✅ Los datos están completamente aislados entre organizaciones

---

### 2. Login de Usuario

**Endpoint:** `POST /api/auth/login`

**Body (JSON):**
```json
{
  "organizacion": "mi_empresa",
  "correo": "juan@miempresa.com",
  "contraseña": "password123"
}
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion": "mi_empresa",
    "correo": "juan@miempresa.com",
    "contraseña": "password123"
  }'
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@miempresa.com",
    "telefono": "5551234567",
    "fecha_nacimiento": "1990-05-15",
    "tipo_usuario": "administrador",
    "organizacion": "mi_empresa",
    "database": "org_mi_empresa"
  }
}
```

---

### 3. Hola Mundo

**Endpoint:** `GET /api/hello`

**Ejemplo con cURL:**
```bash
curl http://localhost:3000/api/hello
```

**Respuesta (200):**
```json
{
  "message": "¡Hola Mundo!",
  "timestamp": "2026-01-06T13:30:00.000Z",
  "status": "ok"
}
```

---

## 🏗️ Cómo crear un nuevo endpoint

### Ejemplo: Crear endpoint para obtener todos los usuarios

1. **Crear archivo:**
```
app/api/usuarios/route.ts
```

2. **Código básico:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Obtener organización del query parameter
    const { searchParams } = new URL(request.url);
    const organizacion = searchParams.get('organizacion');

    if (!organizacion) {
      return NextResponse.json(
        { error: 'Organización es requerida' },
        { status: 400 }
      );
    }

    const dbName = `org_${organizacion.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const pool = getOrganizationPool(dbName);

    const result = await pool.query(
      'SELECT id, nombre, correo, telefono, tipo_usuario FROM usuarios'
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
```

3. **Usar el endpoint:**
```bash
curl http://localhost:3000/api/usuarios?organizacion=mi_empresa
```

---

## 📊 Arquitectura Multi-tenant

### Estructura de Base de Datos

```
PostgreSQL Server
├── postgres (master DB)
├── org_mi_empresa
│   └── tabla: usuarios
├── org_otra_empresa
│   └── tabla: usuarios
└── org_empresa_xyz
    └── tabla: usuarios
```

### Tabla `usuarios` (en cada organización)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único del usuario |
| nombre | VARCHAR(255) | Nombre completo |
| fecha_nacimiento | DATE | Fecha de nacimiento (YYYY-MM-DD) |
| contraseña | VARCHAR(255) | Contraseña hasheada (bcrypt) |
| telefono | VARCHAR(20) | Teléfono de contacto |
| correo | VARCHAR(255) | Email único por organización |
| tipo_usuario | VARCHAR(50) | 'administrador' o 'contador' |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

---

## 🔒 Seguridad Implementada

- ✅ Contraseñas hasheadas con **bcrypt** (12 rounds)
- ✅ Validación de formato de email
- ✅ Validación de fecha de nacimiento
- ✅ Contraseñas de mínimo 8 caracteres
- ✅ Índices en base de datos para optimización
- ✅ **Aislamiento completo de datos** por organización

---

## 🐳 Docker

### Levantar PostgreSQL
```bash
docker-compose up -d postgres
```

### Ver logs
```bash
docker logs sat_postgres
```

### Conectarse a PostgreSQL
```bash
docker exec -it sat_postgres psql -U postgres
```

### Comandos útiles en PostgreSQL
```sql
-- Listar todas las bases de datos
\l

-- Conectarse a una base de datos
\c org_mi_empresa

-- Listar tablas
\dt

-- Ver usuarios
SELECT * FROM usuarios;
```

---

## 🧪 Testing

### Flujo completo de prueba

1. **Registrar primer usuario (será administrador):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion": "test_company",
    "nombre": "Admin User",
    "fecha_nacimiento": "1985-01-15",
    "contraseña": "admin123456",
    "telefono": "5551111111",
    "correo": "admin@test.com"
  }'
```

2. **Registrar segundo usuario (será contador):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion": "test_company",
    "nombre": "Contador User",
    "fecha_nacimiento": "1990-05-20",
    "contraseña": "contador123",
    "telefono": "5552222222",
    "correo": "contador@test.com"
  }'
```

3. **Login con administrador:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "organizacion": "test_company",
    "correo": "admin@test.com",
    "contraseña": "admin123456"
  }'
```

---

## 📝 Variables de Entorno

Ver archivo `.env`:
```env
NODE_ENV=development
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_2025
```
