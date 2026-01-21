# API de Documentos - Guía de Integración Frontend

## Resumen

El endpoint `/api/documentos` permite gestionar documentos fiscales de contribuyentes con soporte completo para CRUD, paginación, filtros y permisos basados en rol.

---

## Autenticación y Permisos

Todos los endpoints requieren:
- `correo`: Email del usuario autenticado
- `organizacion`: Nombre de la organización

### Permisos por Rol

| Rol | Acceso |
|-----|--------|
| **Administrador** | Ve y gestiona documentos de **todos** los contribuyentes |
| **Contador** | Ve y gestiona **solo** documentos de contribuyentes asignados |

---

## Endpoints

### 1. Listar Documentos (GET)

```
GET /api/documentos?correo=user@example.com&organizacion=MiOrg
```

#### Parámetros de Paginación

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página (comienza en 1) |
| `limit` | number | 20 | Documentos por página (máx: 100) |

#### Parámetros de Filtro

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `contribuyente_id` | number | Filtrar por ID de contribuyente |
| `rfc` | string | Filtrar por RFC (búsqueda parcial, case-insensitive) |
| `tipo_documento` | string | Filtrar por tipo exacto de documento |
| `nombre` | string | Buscar en nombre de archivo (parcial, case-insensitive) |
| `fecha_desde` | string | Fecha mínima de creación (YYYY-MM-DD) |
| `fecha_hasta` | string | Fecha máxima de creación (YYYY-MM-DD) |

#### Parámetros de Ordenamiento

| Parámetro | Valores | Default |
|-----------|---------|---------|
| `orden` | `created_at`, `nombre_original`, `tamaño_bytes` | `created_at` |
| `direccion` | `asc`, `desc` | `desc` |

#### Ejemplo de Request Completo

```typescript
// Obtener página 2, 10 documentos por página, filtrado por RFC y ordenado por nombre
const params = new URLSearchParams({
  correo: 'admin@empresa.com',
  organizacion: 'MiEmpresa',
  page: '2',
  limit: '10',
  rfc: 'XAXX010101',
  orden: 'nombre_original',
  direccion: 'asc'
});

const response = await fetch(`/api/documentos?${params}`);
const data = await response.json();
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "documentos": [
      {
        "id": 1,
        "contribuyente_id": 5,
        "nombre_original": "factura_enero_2024.pdf",
        "nombre_almacenado": "doc_1705590622000_abc123.pdf",
        "ruta_archivo": "/uploads/org_miempresa/documentos/doc_1705590622000_abc123.pdf",
        "tipo_documento": "factura",
        "tamaño_bytes": 245678,
        "mime_type": "application/pdf",
        "created_at": "2024-01-18T15:30:22.000Z",
        "updated_at": "2024-01-18T15:30:22.000Z",
        "contribuyente_rfc": "XAXX010101000",
        "contribuyente_nombre": "Juan Pérez García"
      }
    ],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 156,
      "total_pages": 16,
      "has_next_page": true,
      "has_prev_page": true
    },
    "filters_applied": {
      "rfc": "XAXX010101",
      "orden": "nombre_original",
      "direccion": "asc"
    }
  }
}
```

---

### 2. Subir Documento (POST)

```
POST /api/documentos
Content-Type: multipart/form-data
```

#### Body (FormData)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `archivo` | File | ✅ | Archivo a subir |
| `correo` | string | ✅ | Email del usuario |
| `organizacion` | string | ✅ | Nombre de la organización |
| `contribuyente_id` | number | ✅ | ID del contribuyente |
| `tipo_documento` | string | ❌ | Tipo (factura, recibo, etc.) |

#### Ejemplo de Implementación React

```typescript
const subirDocumento = async (file: File, contribuyenteId: number) => {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('correo', 'admin@empresa.com');
  formData.append('organizacion', 'MiEmpresa');
  formData.append('contribuyente_id', contribuyenteId.toString());
  formData.append('tipo_documento', 'factura');

  const response = await fetch('/api/documentos', {
    method: 'POST',
    body: formData
    // NO incluir Content-Type, el browser lo agrega automáticamente con boundary
  });

  return await response.json();
};
```

#### Respuesta Exitosa (201)

```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "id": 42,
    "contribuyente_id": 5,
    "nombre_original": "factura_enero_2024.pdf",
    "tipo_documento": "factura",
    "tamaño_bytes": 245678,
    "mime_type": "application/pdf",
    "created_at": "2024-01-18T15:30:22.000Z"
  }
}
```

---

### 3. Actualizar Documento (PATCH)

```
PATCH /api/documentos
Content-Type: application/json
```

#### Body

```json
{
  "correo": "admin@empresa.com",
  "organizacion": "MiEmpresa",
  "documento_id": 42,
  "tipo_documento": "comprobante",
  "nombre_original": "factura_corregida.pdf"
}
```

#### Campos Actualizables

| Campo | Descripción |
|-------|-------------|
| `tipo_documento` | Nuevo tipo de documento |
| `nombre_original` | Nuevo nombre para mostrar |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Documento actualizado exitosamente",
  "data": {
    "id": 42,
    "nombre_original": "factura_corregida.pdf",
    "tipo_documento": "comprobante",
    "updated_at": "2024-01-18T16:45:00.000Z"
  }
}
```

---

### 4. Eliminar Documento (DELETE)

```
DELETE /api/documentos?correo=admin@empresa.com&organizacion=MiEmpresa&documento_id=42
```

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Documento eliminado exitosamente"
}
```

---

### 5. Descargar/Previsualizar Archivo (GET /archivo)

```
GET /api/documentos/archivo?documento_id=42&correo=admin@empresa.com&organizacion=MiEmpresa&modo=preview
```

#### Parámetros

| Parámetro | Valores | Default | Descripción |
|-----------|---------|---------|-------------|
| `documento_id` | number | - | ID del documento |
| `modo` | `download`, `preview` | `download` | Modo de entrega |

- **download**: Headers para descargar archivo
- **preview**: Headers para mostrar en navegador (ideal para PDFs, imágenes)

#### Ejemplo: Preview en iframe

```typescript
const DocumentPreview = ({ documentoId }: { documentoId: number }) => {
  const url = `/api/documentos/archivo?documento_id=${documentoId}&correo=admin@empresa.com&organizacion=MiEmpresa&modo=preview`;

  return (
    <iframe
      src={url}
      className="w-full h-96 border rounded"
      title="Vista previa del documento"
    />
  );
};
```

#### Ejemplo: Botón de Descarga

```typescript
const DownloadButton = ({ documentoId, nombreArchivo }: Props) => {
  const handleDownload = () => {
    const url = `/api/documentos/archivo?documento_id=${documentoId}&correo=admin@empresa.com&organizacion=MiEmpresa&modo=download`;

    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  };

  return <button onClick={handleDownload}>Descargar</button>;
};
```

---

## Implementación de Tabla Paginada

### Hook de React para Documentos

```typescript
import { useState, useEffect, useCallback } from 'react';

interface Documento {
  id: number;
  contribuyente_id: number;
  nombre_original: string;
  tipo_documento: string | null;
  tamaño_bytes: number;
  mime_type: string;
  created_at: string;
  contribuyente_rfc: string;
  contribuyente_nombre: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

interface Filters {
  rfc?: string;
  tipo_documento?: string;
  nombre?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  contribuyente_id?: number;
}

interface UseDocumentosOptions {
  correo: string;
  organizacion: string;
  initialLimit?: number;
}

export function useDocumentos({ correo, organizacion, initialLimit = 20 }: UseDocumentosOptions) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        correo,
        organizacion,
        page: page.toString(),
        limit: initialLimit.toString(),
      });

      // Agregar filtros activos
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/documentos?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar documentos');
      }

      setDocumentos(data.data.documentos);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [correo, organizacion, initialLimit, filters]);

  // Cargar al montar y cuando cambian filtros
  useEffect(() => {
    fetchDocumentos(1);
  }, [fetchDocumentos]);

  const goToPage = (page: number) => {
    fetchDocumentos(page);
  };

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    documentos,
    pagination,
    loading,
    error,
    filters,
    goToPage,
    updateFilters,
    clearFilters,
    refresh: () => fetchDocumentos(pagination?.page || 1),
  };
}
```

### Componente de Tabla

```typescript
import { useDocumentos } from '@/hooks/useDocumentos';

export function DocumentosTable() {
  const {
    documentos,
    pagination,
    loading,
    error,
    filters,
    goToPage,
    updateFilters,
    clearFilters,
  } = useDocumentos({
    correo: 'admin@empresa.com',
    organizacion: 'MiEmpresa',
    initialLimit: 20,
  });

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por RFC..."
          value={filters.rfc || ''}
          onChange={(e) => updateFilters({ rfc: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filters.nombre || ''}
          onChange={(e) => updateFilters({ nombre: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <select
          value={filters.tipo_documento || ''}
          onChange={(e) => updateFilters({ tipo_documento: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Todos los tipos</option>
          <option value="factura">Factura</option>
          <option value="recibo">Recibo</option>
          <option value="comprobante">Comprobante</option>
          <option value="declaracion">Declaración</option>
        </select>
        <input
          type="date"
          value={filters.fecha_desde || ''}
          onChange={(e) => updateFilters({ fecha_desde: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={filters.fecha_hasta || ''}
          onChange={(e) => updateFilters({ fecha_hasta: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={clearFilters}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Nombre</th>
            <th className="border p-2 text-left">RFC</th>
            <th className="border p-2 text-left">Contribuyente</th>
            <th className="border p-2 text-left">Tipo</th>
            <th className="border p-2 text-left">Tamaño</th>
            <th className="border p-2 text-left">Fecha</th>
            <th className="border p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center p-4">Cargando...</td>
            </tr>
          ) : documentos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center p-4">No hay documentos</td>
            </tr>
          ) : (
            documentos.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="border p-2">{doc.nombre_original}</td>
                <td className="border p-2">{doc.contribuyente_rfc}</td>
                <td className="border p-2">{doc.contribuyente_nombre}</td>
                <td className="border p-2">{doc.tipo_documento || '-'}</td>
                <td className="border p-2">{formatBytes(doc.tamaño_bytes)}</td>
                <td className="border p-2">{formatDate(doc.created_at)}</td>
                <td className="border p-2">
                  <div className="flex gap-2">
                    <PreviewButton documentoId={doc.id} />
                    <DownloadButton
                      documentoId={doc.id}
                      nombreArchivo={doc.nombre_original}
                    />
                    <DeleteButton documentoId={doc.id} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {pagination && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Mostrando {documentos.length} de {pagination.total} documentos
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={!pagination.has_prev_page}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2">
              Página {pagination.page} de {pagination.total_pages}
            </span>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={!pagination.has_next_page}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Utilidades
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Parámetros faltantes o inválidos |
| 403 | Sin permiso para acceder al recurso |
| 404 | Documento o contribuyente no encontrado |
| 500 | Error interno del servidor |

### Ejemplo de Manejo de Errores

```typescript
const handleApiError = (response: any) => {
  if (!response.success) {
    switch (response.status) {
      case 403:
        toast.error('No tienes permiso para ver este documento');
        break;
      case 404:
        toast.error('Documento no encontrado');
        break;
      default:
        toast.error(response.error || 'Error desconocido');
    }
    return null;
  }
  return response.data;
};
```

---

## Tipos TypeScript

```typescript
// types/documentos.ts

export interface Documento {
  id: number;
  contribuyente_id: number;
  nombre_original: string;
  nombre_almacenado: string;
  ruta_archivo: string;
  tipo_documento: string | null;
  tamaño_bytes: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  contribuyente_rfc?: string;
  contribuyente_nombre?: string;
}

export interface DocumentosResponse {
  success: boolean;
  data: {
    documentos: Documento[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
    filters_applied: Record<string, string | number>;
  };
}

export interface DocumentoCreateResponse {
  success: boolean;
  message: string;
  data: Omit<Documento, 'nombre_almacenado' | 'ruta_archivo' | 'updated_at'>;
}

export interface DocumentoFilters {
  contribuyente_id?: number;
  rfc?: string;
  tipo_documento?: string;
  nombre?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  orden?: 'created_at' | 'nombre_original' | 'tamaño_bytes';
  direccion?: 'asc' | 'desc';
}
```

---

## Notas Importantes

1. **Permisos automáticos**: El backend filtra automáticamente los documentos según el rol del usuario. No es necesario implementar lógica de permisos en el frontend.

2. **Límite de paginación**: El máximo de documentos por página es 100. Si se solicita más, se ajusta automáticamente.

3. **Filtro de RFC**: La búsqueda es parcial y case-insensitive. Buscar "XAXX" encontrará "XAXX010101000".

4. **Tipos de documento**: El campo `tipo_documento` es libre. Se sugiere estandarizar: `factura`, `recibo`, `comprobante`, `declaracion`, `constancia`, `otro`.

5. **Archivos grandes**: Para archivos grandes, considerar mostrar un loader durante la descarga.
