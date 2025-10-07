import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from '@/hooks/use-toast';
import { useDocuments } from '@/contexts/DocumentContext';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUpload = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadDocument, fetchDocuments } = useDocuments();

  const uploadFiles = useCallback(async (filesToUpload: FileWithProgress[]) => {
    for (const fileItem of filesToUpload) {
      try {
        // Actualizar estado del archivo a 'uploading'
        setFiles(prev => prev.map(f => 
          f.file === fileItem.file ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        // Simulamos progreso con un intervalo
        const progressInterval = setInterval(() => {
          setFiles(prev => {
            const fileToUpdate = prev.find(f => f.file === fileItem.file);
            if (fileToUpdate && fileToUpdate.status === 'uploading' && fileToUpdate.progress < 90) {
              const newProgress = Math.min(90, fileToUpdate.progress + Math.floor(Math.random() * 10) + 5);
              return prev.map(f =>
                f.file === fileItem.file ? { ...f, progress: newProgress } : f
              );
            }
            return prev;
          });
        }, 300);

        // Usar el contexto para subir el documento
        console.log(`Intentando subir archivo: ${fileItem.file.name}`);
        const uploadedDoc = await uploadDocument(fileItem.file);
        console.log('Documento subido correctamente:', uploadedDoc);
        
        clearInterval(progressInterval);

        // Marcar como completado
        setFiles(prev => prev.map(f =>
          f.file === fileItem.file ? { ...f, status: 'success', progress: 100 } : f
        ));

        toast({
          title: "Archivo procesado",
          description: `${fileItem.file.name} se ha cargado exitosamente`,
        });

        // Actualizamos la lista de documentos
        await fetchDocuments();

      } catch (error) {
        console.error('Error al subir el archivo:', error);
        
        setFiles(prev => prev.map(f =>
          f.file === fileItem.file 
            ? { ...f, status: 'error', error: 'Error al subir archivo', progress: 0 } 
            : f
        ));
        
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : `No se pudo cargar ${fileItem.file.name}`,
          variant: "destructive",
        });
      }
    }
  }, [uploadDocument, fetchDocuments]);

  const addFiles = useCallback((newFiles: File[]) => {
    console.log('Archivos seleccionados:', newFiles);
    
    // Validar tipos de archivos aceptados
    const validFiles = newFiles.filter(file => {
      const validTypes = [
        'application/pdf',               // PDF
        'image/jpeg',                    // JPG
        'image/png',                     // PNG
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword',            // DOC
        'text/xml',                      // XML
        'application/xml'                // XML
      ];
      const isValidType = validTypes.includes(file.type);
      
      console.log(`Archivo ${file.name}, tipo: ${file.type}, válido: ${isValidType}`);
      
      if (!isValidType) {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es un tipo de archivo permitido (tipo detectado: ${file.type})`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      console.log('No hay archivos válidos para procesar');
      return;
    }
    
    console.log('Archivos válidos:', validFiles);

    const filesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...filesWithProgress]);
    uploadFiles(filesWithProgress);
  }, [uploadFiles]);

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
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, [addFiles]);

  const removeFile = useCallback((file: File) => {
    setFiles(prev => prev.filter(f => f.file !== file));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Drop Zone */}
      <Card
        className={`card-modern border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer group ${
          isDragging 
            ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg' 
            : 'border-border/30 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'bg-primary/20 scale-110' : 'group-hover:bg-primary/15 group-hover:scale-105'
          }`}>
            <Upload className={`h-8 w-8 text-primary transition-transform duration-300 ${
              isDragging ? 'scale-110' : 'group-hover:scale-105'
            }`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              o haz clic para seleccionar archivos
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos soportados: PDF, JPG, PNG, DOCX, DOC, XML
            </p>
          </div>

          <div className="pt-2">
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xml"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('file-input')?.click()}
              className="button-modern px-8 py-3 h-auto hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
            >
              Seleccionar archivos
            </Button>
          </div>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Archivos ({files.length})
          </h4>
          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <Card 
                key={index} 
                className="card-modern p-4 animate-slide-up transition-all duration-300 hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    fileItem.status === 'success' ? 'bg-success/10' :
                    fileItem.status === 'error' ? 'bg-destructive/10' :
                    fileItem.status === 'uploading' ? 'bg-info/10' :
                    'bg-primary/10'
                  }`}>
                    <File className={`h-6 w-6 ${
                      fileItem.status === 'success' ? 'text-success' :
                      fileItem.status === 'error' ? 'text-destructive' :
                      fileItem.status === 'uploading' ? 'text-info' :
                      'text-primary'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* File Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      
                      {/* Status and Actions */}
                      <div className="flex items-center gap-3">
                        {fileItem.status === 'success' && (
                          <div className="flex items-center gap-1 text-success">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Completado</span>
                          </div>
                        )}
                        {fileItem.status === 'error' && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Error</span>
                          </div>
                        )}
                        {fileItem.status === 'uploading' && (
                          <div className="flex items-center gap-1 text-info">
                            <div className="w-4 h-4 border-2 border-info/30 border-t-info rounded-full animate-spin"></div>
                            <span className="text-xs font-medium">Subiendo...</span>
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileItem.file)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="space-y-1">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {fileItem.progress}% completado
                        </p>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {fileItem.status === 'error' && fileItem.error && (
                      <p className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded-md">
                        {fileItem.error}
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