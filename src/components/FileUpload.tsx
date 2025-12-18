import { useState } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '@/hooks/use-toast';

interface FileWithProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);  const [clienteName, setClienteName] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
      e.target.value = ''; // Reset input
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Validar archivos
    const validFiles = newFiles.filter(file => {
      // Solo PDFs
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es un PDF`,
          variant: "destructive",
        });
        return false;
      }

      // Máximo 10MB
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} supera 10MB`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Crear objetos con metadata
    const filesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...filesWithProgress]);

    // Subir archivos
    filesWithProgress.forEach(fileItem => {
      uploadFile(fileItem);
    });
  };

  const uploadFile = async (fileItem: FileWithProgress) => {
    const token = localStorage.getItem('token');

    // Validar que se haya ingresado el nombre del cliente
    if (!clienteName || clienteName.trim() === '') {
      toast({
        title: "⚠️ Nombre del cliente requerido",
        description: "Por favor ingresa el nombre del cliente antes de subir archivos",
        variant: "destructive",
      });
      setFiles(prev => prev.filter(f => f.id !== fileItem.id));
      return;
    }

    // Actualizar estado a "uploading"
    setFiles(prev =>
      prev.map(f => (f.id === fileItem.id ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);
      // El backend requiere el campo 'cliente' (nombre del cliente específico del documento)
      formData.append('cliente', clienteName.trim());
      
      console.log('📤 Subiendo archivo con cliente:', clienteName.trim());

      const xhr = new XMLHttpRequest();
      let completed = false;

      // Progreso de carga
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setFiles(prev =>
            prev.map(f => (f.id === fileItem.id ? { ...f, progress: percentComplete } : f))
          );
        }
      });

      // Respuesta del servidor
      xhr.addEventListener('load', () => {
        completed = true;
        if (xhr.status === 200 || xhr.status === 201) {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id ? { ...f, status: 'success' as const, progress: 100 } : f
            )
          );
          
          toast({
            title: "✅ Archivo cargado",
            description: `${fileItem.file.name} se subió correctamente`,
          });
        } else {
          // Error del servidor
          setFiles(prev =>
            prev.map(f =>
              f.id === fileItem.id ? { ...f, status: 'error' as const } : f
            )
          );
          toast({
            title: "❌ Error al subir archivo",
            description: `Error del servidor: ${xhr.status}`,
            variant: "destructive",
          });
        }
      });

      // Error de red
      xhr.addEventListener('error', () => {
        completed = true;
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error' as const } : f
          )
        );
        toast({
          title: "❌ Error de conexión",
          description: "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.",
          variant: "destructive",
        });
      });

      // Timeout de 30 segundos para archivos grandes
      xhr.timeout = 30000;
      xhr.addEventListener('timeout', () => {
        completed = true;
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'error' as const } : f
          )
        );
        toast({
          title: "⏱️ Tiempo de espera agotado",
          description: "El servidor tardó demasiado en responder",
          variant: "destructive",
        });
      });

      xhr.open('POST', `${API_URL}/api/documents/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    } catch (error) {
      console.error('Error al subir archivo:', error);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'error' as const } : f
        )
      );
      toast({
        title: "❌ Error inesperado",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const hasCompletedFiles = files.some(f => f.status === 'success');

  return (
    <div className="space-y-6">
      {/* Campo de nombre del cliente */}
      <Card className="p-6">
        <div className="space-y-2">
          <Label htmlFor="cliente-name" className="text-base font-semibold">
            Nombre del Cliente <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cliente-name"
            type="text"
            placeholder="Ej: ACME Corporation, Cliente XYZ, etc."
            value={clienteName}
            onChange={(e) => setClienteName(e.target.value)}
            className="text-base"
            required
          />
          <p className="text-sm text-muted-foreground">
            Ingresa el nombre del cliente para quien subes estos documentos
          </p>
        </div>
      </Card>

      {/* Zona de arrastre */}
      <Card
        className={`border-2 border-dashed p-12 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border hover:border-primary/50'
        } ${!clienteName ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          Arrastra tus archivos PDF aquí
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          o selecciona archivos desde tu computadora (máximo 10MB por archivo)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!clienteName}
        />
        <Button
          type="button"
          variant="hero"
          size="lg"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={!clienteName}
        >
          <Upload className="mr-2 h-5 w-5" />
          Seleccionar Archivos
        </Button>
      </Card>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Archivos ({files.length})
            </h3>
            {hasCompletedFiles && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
              >
                Limpiar completados
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((fileItem) => (
              <Card key={fileItem.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <FileIcon className="h-10 w-10 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {fileItem.status === 'uploading' && (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        )}
                        {fileItem.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {fileItem.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileItem.id)}
                          disabled={fileItem.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {fileItem.status === 'uploading' && (
                      <div className="space-y-1">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Subiendo... {fileItem.progress}%
                        </p>
                      </div>
                    )}

                    {fileItem.status === 'error' && fileItem.error && (
                      <p className="text-sm text-destructive">
                        Error: {fileItem.error}
                      </p>
                    )}

                    {fileItem.status === 'success' && (
                      <p className="text-sm text-green-600">
                        Archivo subido correctamente
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
