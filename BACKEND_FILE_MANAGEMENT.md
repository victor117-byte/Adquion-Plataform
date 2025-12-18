# Backend Requirements - File Management System

## Overview
Este documento describe los endpoints y funcionalidades necesarias en el backend para soportar el sistema de gestión de archivos del frontend.

## 1. Upload de Documentos

### Endpoint: `POST /api/documents/upload`

**Descripción**: Permite subir uno o más archivos PDF al sistema.

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
file: File (PDF, max 10MB)
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Archivo subido correctamente",
  "document": {
    "id": "uuid-v4",
    "filename": "factura_001.pdf",
    "original_filename": "factura_001.pdf",
    "size": 1245678,
    "mime_type": "application/pdf",
    "upload_date": "2024-01-15T10:30:00Z",
    "status": "processing",
    "user_id": "user-uuid",
    "storage_path": "/uploads/user-uuid/2024/01/uuid-v4.pdf"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": "Archivo no válido",
  "error_code": "INVALID_FILE_TYPE"
}
```

**Validaciones Backend**:
- Solo archivos PDF (MIME type: `application/pdf`)
- Tamaño máximo: 10MB
- El usuario debe estar autenticado
- Verificar espacio disponible en cuenta (según plan de suscripción)

**Procesamiento Asíncrono**:
1. Guardar archivo en almacenamiento (filesystem o S3)
2. Crear registro en base de datos con status `processing`
3. Encolar tarea para procesamiento OCR/extracción de datos
4. Actualizar status a `processed` o `error` cuando termine

---

## 2. Listado de Documentos

### Endpoint: `GET /api/documents`

**Descripción**: Obtiene el listado paginado de documentos del usuario con filtros y búsqueda.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
```
page: number (default: 1)
limit: number (default: 10, max: 100)
status: string (optional: "processed" | "processing" | "error")
search: string (optional: busca en filename)
sort_by: string (default: "date", options: "date" | "name" | "size")
order: string (default: "desc", options: "asc" | "desc")
```

**Ejemplo de Request**:
```
GET /api/documents?page=1&limit=10&status=processed&search=factura&sort_by=date&order=desc
```

**Response Success (200)**:
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid-1",
      "filename": "factura_001_2024.pdf",
      "size": 1245678,
      "upload_date": "2024-01-15T10:30:00Z",
      "status": "processed",
      "download_url": "/api/documents/uuid-1/download",
      "metadata": {
        "pages": 3,
        "extracted_data": {
          "rfc": "XAXX010101000",
          "total": 1500.00
        }
      }
    },
    {
      "id": "uuid-2",
      "filename": "comprobante_pago.pdf",
      "size": 856234,
      "upload_date": "2024-01-14T15:45:00Z",
      "status": "processing",
      "download_url": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

**Filtrado**:
- Por usuario autenticado (automático via JWT)
- Por status (opcional)
- Por búsqueda en filename (case-insensitive, LIKE)

**Ordenamiento**:
- `date`: Por fecha de carga (más recientes primero)
- `name`: Alfabético por nombre de archivo
- `size`: Por tamaño de archivo

---

## 3. Descarga de Documento

### Endpoint: `GET /api/documents/{document_id}/download`

**Descripción**: Descarga el archivo PDF original.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response Success (200)**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="factura_001.pdf"
Content-Length: 1245678

[Binary PDF content]
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": "Documento no encontrado",
  "error_code": "DOCUMENT_NOT_FOUND"
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "No tienes permiso para descargar este documento",
  "error_code": "FORBIDDEN"
}
```

**Validaciones**:
- El usuario debe ser propietario del documento
- El documento debe existir en el sistema
- El archivo debe existir en el almacenamiento

---

## 4. Eliminación de Documento

### Endpoint: `DELETE /api/documents/{document_id}`

**Descripción**: Elimina permanentemente un documento del sistema.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Documento eliminado correctamente"
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": "Documento no encontrado",
  "error_code": "DOCUMENT_NOT_FOUND"
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "No tienes permiso para eliminar este documento",
  "error_code": "FORBIDDEN"
}
```

**Acciones**:
1. Verificar permisos (owner o admin)
2. Eliminar archivo del almacenamiento
3. Eliminar registro de base de datos (o marcar como deleted)
4. Actualizar estadísticas del usuario

---

## 5. Modelo de Base de Datos

### Tabla: `documents`

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    storage_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'error')),
    error_message TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP,
    metadata JSONB,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date DESC),
    INDEX idx_filename (filename)
);
```

**Campos metadata (JSONB)**:
```json
{
  "pages": 3,
  "file_hash": "sha256-hash",
  "extracted_data": {
    "rfc": "XAXX010101000",
    "total": 1500.00,
    "fecha": "2024-01-15",
    "tipo_comprobante": "Factura"
  },
  "processing_time_ms": 2500
}
```

---

## 6. Almacenamiento de Archivos

### Opción 1: Sistema de Archivos Local

**Estructura de directorios**:
```
uploads/
  ├── user-uuid-1/
  │   ├── 2024/
  │   │   ├── 01/
  │   │   │   ├── document-uuid-1.pdf
  │   │   │   ├── document-uuid-2.pdf
  │   │   └── 02/
  │   └── 2023/
  └── user-uuid-2/
```

**Ventajas**:
- Simple de implementar
- Sin costos adicionales
- Control total

**Desventajas**:
- Escalabilidad limitada
- Sin CDN
- Backups manuales

### Opción 2: AWS S3 (Recomendado)

**Configuración**:
```python
import boto3

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

# Upload
s3_client.upload_fileobj(
    file,
    settings.S3_BUCKET,
    f"uploads/{user_id}/{year}/{month}/{document_id}.pdf",
    ExtraArgs={'ContentType': 'application/pdf'}
)

# Download URL (presigned)
url = s3_client.generate_presigned_url(
    'get_object',
    Params={'Bucket': settings.S3_BUCKET, 'Key': file_path},
    ExpiresIn=3600  # 1 hora
)
```

**Ventajas**:
- Escalabilidad infinita
- Backups automáticos
- CDN con CloudFront
- Durabilidad 99.999999999%

**Desventajas**:
- Costo por almacenamiento
- Dependencia de AWS

---

## 7. Seguridad

### Validación de Archivos

```python
import magic
from pathlib import Path

def validate_pdf(file) -> bool:
    # Verificar extensión
    if not file.filename.lower().endswith('.pdf'):
        return False
    
    # Verificar MIME type real (no confiar en Content-Type)
    file_magic = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)  # Reset file pointer
    
    return file_magic == 'application/pdf'

def sanitize_filename(filename: str) -> str:
    # Remover caracteres peligrosos
    safe_name = "".join(c for c in filename if c.isalnum() or c in (' ', '.', '_', '-'))
    return safe_name.strip()
```

### Control de Cuotas por Plan

```python
STORAGE_LIMITS = {
    'trial': 100 * 1024 * 1024,      # 100 MB
    'pro': 5 * 1024 * 1024 * 1024,   # 5 GB
    'premium': 20 * 1024 * 1024 * 1024,  # 20 GB
    'business': 100 * 1024 * 1024 * 1024, # 100 GB
}

def check_storage_quota(user_id: str, new_file_size: int) -> bool:
    user = get_user(user_id)
    current_usage = get_user_storage_usage(user_id)
    limit = STORAGE_LIMITS.get(user.subscription_plan, 0)
    
    return (current_usage + new_file_size) <= limit
```

---

## 8. Procesamiento Asíncrono

### Ejemplo con Celery

```python
from celery import shared_task
import PyPDF2
from pdf2image import convert_from_path
import pytesseract

@shared_task
def process_document(document_id: str):
    try:
        doc = Document.objects.get(id=document_id)
        
        # Abrir PDF
        pdf_path = doc.storage_path
        pdf_file = open(pdf_path, 'rb')
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extraer metadata básica
        num_pages = len(pdf_reader.pages)
        
        # OCR si es necesario
        if is_scanned_pdf(pdf_path):
            text = extract_text_with_ocr(pdf_path)
        else:
            text = extract_text_from_pdf(pdf_path)
        
        # Extraer datos fiscales
        extracted_data = extract_fiscal_data(text)
        
        # Actualizar documento
        doc.status = 'processed'
        doc.processed_date = timezone.now()
        doc.metadata = {
            'pages': num_pages,
            'extracted_data': extracted_data,
            'processing_time_ms': (timezone.now() - doc.upload_date).total_seconds() * 1000
        }
        doc.save()
        
        pdf_file.close()
        
    except Exception as e:
        doc.status = 'error'
        doc.error_message = str(e)
        doc.save()
        raise
```

---

## 9. Rate Limiting

### Protección contra Abuse

```python
from fastapi import HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/documents/upload")
@limiter.limit("10/minute")  # Máximo 10 uploads por minuto
async def upload_document(request: Request, file: UploadFile):
    # ... lógica de upload
    pass
```

---

## 10. Endpoints Adicionales (Opcional)

### Obtener Detalles de un Documento

```
GET /api/documents/{document_id}
```

### Actualizar Metadata de un Documento

```
PATCH /api/documents/{document_id}
Body: { "metadata": { "notes": "Factura del proveedor X" } }
```

### Estadísticas de Almacenamiento

```
GET /api/documents/stats
Response: {
  "total_documents": 127,
  "total_size": 1073741824,  // bytes
  "storage_used_percentage": 10.24,
  "documents_by_status": {
    "processed": 120,
    "processing": 5,
    "error": 2
  }
}
```

---

## Resumen de Implementación

**Prioridad Alta**:
1. ✅ `POST /api/documents/upload` - Upload básico con validación
2. ✅ `GET /api/documents` - Listado paginado con filtros
3. ✅ `GET /api/documents/{id}/download` - Descarga de archivos

**Prioridad Media**:
4. ✅ `DELETE /api/documents/{id}` - Eliminación de documentos
5. ✅ Procesamiento asíncrono con Celery
6. ✅ Control de cuotas por plan

**Prioridad Baja**:
7. Estadísticas de almacenamiento
8. OCR y extracción de datos fiscales
9. Webhooks para notificaciones de procesamiento
