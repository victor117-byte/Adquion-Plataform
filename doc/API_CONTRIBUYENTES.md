# API de Contribuyentes - Guía de Integración Frontend

## Resumen

El endpoint `/api/contribuyentes` permite gestionar contribuyentes fiscales con soporte completo para CRUD, certificados SAT (.cer/.key), y seguimiento de vigencia de certificados.

---

## Autenticación y Permisos

Todos los endpoints requieren:
- `correo` / `correo_usuario`: Email del usuario autenticado
- `organizacion`: Nombre de la organización

### Permisos por Rol

| Rol | Acceso |
|-----|--------|
| **Administrador** | CRUD completo de **todos** los contribuyentes |
| **Contador** | CRUD solo de contribuyentes **asignados a él** |

---

## Endpoints

### 1. Listar Contribuyentes (GET)

```
GET /api/contribuyentes?correo=user@example.com&organizacion=MiOrg
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "role": "administrador",
    "contribuyentes": [
      {
        "id": 1,
        "rfc": "XAXX010101000",
        "nombre": "Juan Pérez García",
        "tipo_persona": "fisica",
        "direccion_fiscal": "Col. Centro",
        "calle_numero": "Calle Principal #123",
        "poblacion_municipio": "Cuauhtémoc",
        "cp": "06600",
        "estado_republica": "Ciudad de México",
        "estado": "activo",
        "telefonos": ["5551234567", "5559876543"],
        "correos": ["juan@email.com"],
        "contrasena_sat": "********",
        "contrasena_firma": "********",
        "cuenta_rtp": "usuario_rtp",
        "contrasena_rtp": "********",
        "cuenta_isr": "cuenta_isr",
        "contrasena_isr": "********",
        "cuenta_sipare": "sipare_user",
        "contrasena_sipare": "********",
        "usuario_asignado_id": 2,
        "usuario_asignado_nombre": "María Contadora",
        "usuario_asignado_correo": "maria@empresa.com",
        "certificado_cer_path": "/uploads/miorg/XAXX010101000/XAXX010101000.cer",
        "certificado_key_path": "/uploads/miorg/XAXX010101000/XAXX010101000.key",
        "certificado_fecha_emision": "2024-01-15T00:00:00.000Z",
        "certificado_fecha_expiracion": "2028-01-15T23:59:59.000Z",
        "certificado_numero_serie": "30001000000500003416",
        "certificado_info": {
          "tiene_certificado": true,
          "estado": {
            "estado": "vigente",
            "dias_restantes": 1091,
            "mensaje": "Vigente por 36 meses"
          },
          "fecha_emision": "2024-01-15T00:00:00.000Z",
          "fecha_expiracion": "2028-01-15T23:59:59.000Z",
          "numero_serie": "30001000000500003416"
        },
        "created_at": "2024-01-10T15:30:22.000Z"
      }
    ],
    "resumen_certificados": {
      "total": 15,
      "vigentes": 10,
      "por_vencer": 3,
      "vencidos": 1,
      "sin_certificado": 1
    }
  }
}
```

#### Estados de Certificado

| Estado | Descripción | Acción Recomendada |
|--------|-------------|-------------------|
| `vigente` | Más de 90 días para vencer | Ninguna |
| `por_vencer` | Entre 1 y 90 días para vencer | Mostrar alerta amarilla/naranja |
| `vencido` | Ya expiró | Mostrar alerta roja urgente |
| `sin_certificado` | No tiene certificado registrado | Solicitar al contribuyente |

---

### 2. Crear Contribuyente (POST)

```
POST /api/contribuyentes
Content-Type: application/json
```

#### Body

```json
{
  "correo_usuario": "admin@empresa.com",
  "organizacion": "MiEmpresa",
  "rfc": "XAXX010101000",
  "nombre": "Juan Pérez García",
  "tipo_persona": "fisica",
  "direccion_fiscal": "Col. Centro",
  "calle_numero": "Calle Principal #123",
  "poblacion_municipio": "Cuauhtémoc",
  "estado_republica": "Ciudad de México",
  "cp": "06600",
  "telefonos": ["5551234567"],
  "correos": ["juan@email.com"],
  "contrasena_sat": "miContraseñaSAT",
  "contrasena_firma": "miContraseñaFirma",
  "cuenta_rtp": "usuario_rtp",
  "contrasena_rtp": "pass_rtp",
  "cuenta_isr": "cuenta_isr",
  "contrasena_isr": "pass_isr",
  "cuenta_sipare": "sipare_user",
  "contrasena_sipare": "pass_sipare",
  "estado": "activo"
}
```

#### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `correo_usuario` | string | Email del usuario que crea |
| `organizacion` | string | Nombre de la organización |
| `rfc` | string | RFC del contribuyente (12-13 caracteres) |
| `nombre` | string | Nombre o razón social |
| `tipo_persona` | string | `fisica` o `moral` |
| `direccion_fiscal` | string | Dirección fiscal completa (colonia) |
| `estado_republica` | string | Estado de la república |

#### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `calle_numero` | string | Calle y número |
| `poblacion_municipio` | string | Población o municipio |
| `cp` | string | Código postal |
| `telefonos` | string[] | Lista de teléfonos |
| `correos` | string[] | Lista de correos |
| `contrasena_sat` | string | Contraseña del portal SAT |
| `contrasena_firma` | string | Contraseña de la e.firma |
| `cuenta_rtp` / `contrasena_rtp` | string | Credenciales RTP |
| `cuenta_isr` / `contrasena_isr` | string | Credenciales ISR |
| `cuenta_sipare` / `contrasena_sipare` | string | Credenciales SIPARE |
| `estado` | string | `activo` o `inactivo` (default: `activo`) |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Contribuyente creado exitosamente",
  "data": {
    "id": 1,
    "rfc": "XAXX010101000",
    "nombre": "Juan Pérez García",
    "tipo_persona": "fisica",
    "usuario_asignado_id": 2,
    "created_at": "2024-01-10T15:30:22.000Z"
  }
}
```

---

### 3. Actualizar Contribuyente (PATCH)

```
PATCH /api/contribuyentes
Content-Type: application/json
```

#### Body

```json
{
  "correo_usuario": "admin@empresa.com",
  "organizacion": "MiEmpresa",
  "id_contribuyente": 1,
  "nombre": "Juan Pérez García Actualizado",
  "telefonos": ["5551234567", "5559999999"],
  "estado": "activo",
  "usuario_asignado_id": 3
}
```

**Nota:** Solo administradores pueden cambiar `usuario_asignado_id` para reasignar contribuyentes.

---

### 4. Eliminar Contribuyente (DELETE)

```
DELETE /api/contribuyentes
Content-Type: application/json
```

#### Body

```json
{
  "correo_usuario": "admin@empresa.com",
  "organizacion": "MiEmpresa",
  "id_contribuyente": 1
}
```

**Nota:** Solo administradores pueden eliminar contribuyentes.

---

## Gestión de Certificados SAT

Los certificados del SAT consisten en dos archivos:
- **`.cer`** - Certificado público (contiene fecha de emisión/expiración)
- **`.key`** - Clave privada (protegida con contraseña)

Los certificados tienen vigencia de **4 años** desde su emisión.

### Estructura de Almacenamiento

```
uploads/
└── {organizacion}/
    └── {RFC}/
        ├── {RFC}.cer
        └── {RFC}.key
```

---

### 5. Subir Certificados (POST /certificados)

```
POST /api/contribuyentes/certificados
Content-Type: multipart/form-data
```

#### Body (FormData)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `correo` | string | ✅ | Email del usuario |
| `organizacion` | string | ✅ | Nombre de la organización |
| `contribuyente_id` | number | ✅ | ID del contribuyente |
| `archivo_cer` | File | ❌* | Archivo .cer |
| `archivo_key` | File | ❌* | Archivo .key |
| `fecha_emision` | string | ❌ | Fecha manual (YYYY-MM-DD) |
| `fecha_expiracion` | string | ❌ | Fecha manual (YYYY-MM-DD) |

*Al menos uno de los archivos es requerido.

#### Ejemplo de Implementación React

```typescript
const subirCertificados = async (
  contribuyenteId: number,
  archivoCer: File | null,
  archivoKey: File | null
) => {
  const formData = new FormData();
  formData.append('correo', 'admin@empresa.com');
  formData.append('organizacion', 'MiEmpresa');
  formData.append('contribuyente_id', contribuyenteId.toString());

  if (archivoCer) {
    formData.append('archivo_cer', archivoCer);
  }
  if (archivoKey) {
    formData.append('archivo_key', archivoKey);
  }

  const response = await fetch('/api/contribuyentes/certificados', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Certificados actualizados exitosamente",
  "data": {
    "contribuyente_id": 1,
    "rfc": "XAXX010101000",
    "nombre": "Juan Pérez García",
    "certificado": {
      "cer_path": "/uploads/miempresa/XAXX010101000/XAXX010101000.cer",
      "key_path": "/uploads/miempresa/XAXX010101000/XAXX010101000.key",
      "fecha_emision": "2024-01-15T00:00:00.000Z",
      "fecha_expiracion": "2028-01-15T23:59:59.000Z",
      "numero_serie": "30001000000500003416",
      "estado": {
        "estado": "vigente",
        "dias_restantes": 1091
      },
      "info_extraida_automaticamente": true
    }
  }
}
```

**Nota:** Si el sistema tiene `openssl` instalado, extrae automáticamente las fechas y número de serie del archivo `.cer`. Si no, puede usar fechas manuales.

---

### 6. Consultar Certificados (GET /certificados)

```
GET /api/contribuyentes/certificados?correo=admin@empresa.com&organizacion=MiEmpresa&contribuyente_id=1
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "contribuyente_id": 1,
    "rfc": "XAXX010101000",
    "nombre": "Juan Pérez García",
    "certificado": {
      "tiene_cer": true,
      "tiene_key": true,
      "cer_existe_fisicamente": true,
      "key_existe_fisicamente": true,
      "fecha_emision": "2024-01-15T00:00:00.000Z",
      "fecha_expiracion": "2028-01-15T23:59:59.000Z",
      "numero_serie": "30001000000500003416",
      "estado": {
        "estado": "vigente",
        "dias_restantes": 1091,
        "mensaje": "Vigente por 36 meses"
      }
    }
  }
}
```

---

### 7. Eliminar Certificados (DELETE /certificados)

```
DELETE /api/contribuyentes/certificados
Content-Type: application/json
```

#### Body

```json
{
  "correo": "admin@empresa.com",
  "organizacion": "MiEmpresa",
  "contribuyente_id": 1,
  "eliminar_cer": true,
  "eliminar_key": true
}
```

**Nota:** Solo administradores pueden eliminar certificados.

---

## Componentes de UI Sugeridos

### Indicador de Estado de Certificado

```typescript
interface CertificadoEstado {
  estado: 'vigente' | 'por_vencer' | 'vencido' | 'sin_certificado';
  dias_restantes: number | null;
  mensaje: string;
}

const CertificadoBadge = ({ estado }: { estado: CertificadoEstado }) => {
  const colores = {
    vigente: 'bg-green-100 text-green-800 border-green-200',
    por_vencer: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    vencido: 'bg-red-100 text-red-800 border-red-200',
    sin_certificado: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const iconos = {
    vigente: '✓',
    por_vencer: '⚠',
    vencido: '✕',
    sin_certificado: '○',
  };

  return (
    <span className={`px-2 py-1 rounded border text-sm ${colores[estado.estado]}`}>
      {iconos[estado.estado]} {estado.mensaje}
    </span>
  );
};
```

### Panel de Resumen de Certificados

```typescript
interface ResumenCertificados {
  total: number;
  vigentes: number;
  por_vencer: number;
  vencidos: number;
  sin_certificado: number;
}

const ResumenCertificadosPanel = ({ resumen }: { resumen: ResumenCertificados }) => {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{resumen.vigentes}</div>
        <div className="text-sm text-gray-500">Vigentes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{resumen.por_vencer}</div>
        <div className="text-sm text-gray-500">Por vencer</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{resumen.vencidos}</div>
        <div className="text-sm text-gray-500">Vencidos</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-400">{resumen.sin_certificado}</div>
        <div className="text-sm text-gray-500">Sin certificado</div>
      </div>
    </div>
  );
};
```

### Formulario de Subida de Certificados

```typescript
import { useState, useRef } from 'react';

const CertificadoUploader = ({ contribuyenteId }: { contribuyenteId: number }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cerInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const archivoCer = cerInputRef.current?.files?.[0] || null;
    const archivoKey = keyInputRef.current?.files?.[0] || null;

    if (!archivoCer && !archivoKey) {
      setError('Selecciona al menos un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('correo', 'admin@empresa.com');
      formData.append('organizacion', 'MiEmpresa');
      formData.append('contribuyente_id', contribuyenteId.toString());

      if (archivoCer) formData.append('archivo_cer', archivoCer);
      if (archivoKey) formData.append('archivo_key', archivoKey);

      const response = await fetch('/api/contribuyentes/certificados', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Mostrar información extraída
      if (data.data.certificado.info_extraida_automaticamente) {
        alert(`Certificado válido hasta: ${new Date(data.data.certificado.fecha_expiracion).toLocaleDateString()}`);
      }

      // Limpiar inputs
      if (cerInputRef.current) cerInputRef.current.value = '';
      if (keyInputRef.current) keyInputRef.current.value = '';

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir certificados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Subir Certificados SAT</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Certificado (.cer)
          </label>
          <input
            ref={cerInputRef}
            type="file"
            accept=".cer"
            className="block w-full text-sm border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Clave Privada (.key)
          </label>
          <input
            ref={keyInputRef}
            type="file"
            accept=".key"
            className="block w-full text-sm border rounded p-2"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Subir Certificados'}
      </button>

      <p className="text-xs text-gray-500">
        El sistema extraerá automáticamente las fechas de vigencia del certificado.
      </p>
    </div>
  );
};
```

### Lista de Contribuyentes con Alertas

```typescript
const ContribuyentesTable = ({ contribuyentes }: { contribuyentes: Contribuyente[] }) => {
  // Ordenar: vencidos primero, luego por_vencer, luego el resto
  const ordenados = [...contribuyentes].sort((a, b) => {
    const prioridad = { vencido: 0, por_vencer: 1, vigente: 2, sin_certificado: 3 };
    return prioridad[a.certificado_info.estado.estado] - prioridad[b.certificado_info.estado.estado];
  });

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">RFC</th>
          <th className="p-2 text-left">Nombre</th>
          <th className="p-2 text-left">Estado</th>
          <th className="p-2 text-left">Certificado</th>
          <th className="p-2 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {ordenados.map((c) => (
          <tr
            key={c.id}
            className={
              c.certificado_info.estado.estado === 'vencido' ? 'bg-red-50' :
              c.certificado_info.estado.estado === 'por_vencer' ? 'bg-yellow-50' : ''
            }
          >
            <td className="p-2 font-mono">{c.rfc}</td>
            <td className="p-2">{c.nombre}</td>
            <td className="p-2">
              <span className={`px-2 py-1 rounded text-xs ${
                c.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {c.estado}
              </span>
            </td>
            <td className="p-2">
              <CertificadoBadge estado={c.certificado_info.estado} />
            </td>
            <td className="p-2">
              <button className="text-blue-600 hover:underline mr-2">Editar</button>
              <button className="text-blue-600 hover:underline">Certificados</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## Tipos TypeScript

```typescript
// types/contribuyentes.ts

export type TipoPersona = 'fisica' | 'moral';
export type EstadoContribuyente = 'activo' | 'inactivo';
export type EstadoCertificado = 'vigente' | 'por_vencer' | 'vencido' | 'sin_certificado';

export interface CertificadoEstado {
  estado: EstadoCertificado;
  dias_restantes: number | null;
  mensaje: string;
}

export interface CertificadoInfo {
  tiene_certificado: boolean;
  estado: CertificadoEstado;
  fecha_emision: string | null;
  fecha_expiracion: string | null;
  numero_serie: string | null;
}

export interface Contribuyente {
  id: number;
  rfc: string;
  nombre: string;
  tipo_persona: TipoPersona;
  direccion_fiscal: string;
  calle_numero: string | null;
  poblacion_municipio: string | null;
  cp: string | null;
  estado_republica: string;
  estado: EstadoContribuyente;
  telefonos: string[];
  correos: string[];
  contrasena_sat: string | null;
  contrasena_firma: string | null;
  cuenta_rtp: string | null;
  contrasena_rtp: string | null;
  cuenta_isr: string | null;
  contrasena_isr: string | null;
  cuenta_sipare: string | null;
  contrasena_sipare: string | null;
  usuario_asignado_id: number;
  usuario_asignado_nombre: string;
  usuario_asignado_correo: string;
  certificado_cer_path: string | null;
  certificado_key_path: string | null;
  certificado_fecha_emision: string | null;
  certificado_fecha_expiracion: string | null;
  certificado_numero_serie: string | null;
  certificado_info: CertificadoInfo;
  created_at: string;
  updated_at: string;
}

export interface ResumenCertificados {
  total: number;
  vigentes: number;
  por_vencer: number;
  vencidos: number;
  sin_certificado: number;
}

export interface ContribuyentesResponse {
  success: boolean;
  data: {
    role: 'administrador' | 'contador';
    contribuyentes: Contribuyente[];
    resumen_certificados: ResumenCertificados;
  };
}

export interface ContribuyenteCreateRequest {
  correo_usuario: string;
  organizacion: string;
  rfc: string;
  nombre: string;
  tipo_persona: TipoPersona;
  direccion_fiscal: string;
  estado_republica: string;
  calle_numero?: string;
  poblacion_municipio?: string;
  cp?: string;
  telefonos?: string[];
  correos?: string[];
  contrasena_sat?: string;
  contrasena_firma?: string;
  cuenta_rtp?: string;
  contrasena_rtp?: string;
  cuenta_isr?: string;
  contrasena_isr?: string;
  cuenta_sipare?: string;
  contrasena_sipare?: string;
  estado?: EstadoContribuyente;
}

export interface CertificadoUploadResponse {
  success: boolean;
  message: string;
  data: {
    contribuyente_id: number;
    rfc: string;
    nombre: string;
    certificado: {
      cer_path: string | null;
      key_path: string | null;
      fecha_emision: string | null;
      fecha_expiracion: string | null;
      numero_serie: string | null;
      estado: { estado: EstadoCertificado; dias_restantes: number | null } | null;
      info_extraida_automaticamente: boolean;
    };
  };
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros faltantes o inválidos |
| 403 | Sin permiso (contador intentando acceder a contribuyente no asignado) |
| 404 | Usuario o contribuyente no encontrado |
| 500 | Error interno del servidor |

---

## Notas Importantes

1. **Seguridad de Contraseñas**: Las contraseñas (SAT, firma, RTP, ISR, SIPARE) se almacenan en texto plano. Considerar cifrado adicional si es requerido.

2. **Extracción Automática**: El sistema intenta extraer fechas del archivo `.cer` usando OpenSSL. Si falla, el frontend debe proporcionar las fechas manualmente.

3. **Almacenamiento de Archivos**: Los certificados se guardan en `./uploads/{org}/{RFC}/`. Asegurar que este directorio tenga permisos correctos.

4. **Vigencia de Certificados**: Los certificados del SAT tienen vigencia de 4 años. El sistema clasifica como "por_vencer" cuando faltan 90 días o menos.

5. **Notificaciones**: Se recomienda implementar un sistema de notificaciones para alertar cuando certificados estén por vencer.
