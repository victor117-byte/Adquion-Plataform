import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from '@/hooks/use-toast';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'text/xml', 'application/xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es un PDF o XML`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const filesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...filesWithProgress]);
    uploadFiles(filesWithProgress);
  };

  const uploadFiles = async (filesToUpload: FileWithProgress[]) => {
    const token = localStorage.getItem('auth_token');

    for (const fileItem of filesToUpload) {
      try {
        setFiles(prev => prev.map(f => 
          f.file === fileItem.file ? { ...f, status: 'uploading' } : f
        ));

        const formData = new FormData();
        formData.append('file', fileItem.file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles(prev => prev.map(f =>
              f.file === fileItem.file ? { ...f, progress } : f
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setFiles(prev => prev.map(f =>
              f.file === fileItem.file ? { ...f, status: 'success', progress: 100 } : f
            ));
            toast({
              title: "Archivo procesado",
              description: `${fileItem.file.name} se ha cargado exitosamente`,
            });
          } else {
            throw new Error('Error al subir archivo');
          }
        });

        xhr.addEventListener('error', () => {
          setFiles(prev => prev.map(f =>
            f.file === fileItem.file 
              ? { ...f, status: 'error', error: 'Error de red' } 
              : f
          ));
        });

        xhr.open('POST', `${API_URL}/documents/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

      } catch (error) {
        setFiles(prev => prev.map(f =>
          f.file === fileItem.file 
            ? { ...f, status: 'error', error: 'Error al subir archivo' } 
            : f
        ));
        toast({
          title: "Error",
          description: `No se pudo cargar ${fileItem.file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Arrastra archivos aquí
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          o haz clic para seleccionar archivos PDF o XML
        </p>
        <label>
          <input
            type="file"
            multiple
            accept=".pdf,.xml"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button type="button" variant="outline">
            Seleccionar archivos
          </Button>
        </label>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {fileItem.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileItem.status === 'uploading' && (
                    <Progress value={fileItem.progress} className="h-2" />
                  )}
                  {fileItem.status === 'error' && (
                    <p className="text-xs text-destructive">
                      {fileItem.error}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
