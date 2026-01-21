import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Search,
  FileText,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  File,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  HardDrive,
  RotateCw,
  X,
  MoreHorizontal,
  Grid3X3,
  List,
  SortDesc,
  FileUp,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ==================== TIPOS ====================

interface Documento {
  id: number;
  contribuyente_id: number;
  nombre_original: string;
  nombre_almacenado?: string;
  ruta_archivo?: string;
  tipo_documento: string | null;
  tamaño_bytes: number;
  mime_type: string;
  created_at: string;
  updated_at?: string;
  contribuyente_rfc?: string;
  contribuyente_nombre?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

interface Contribuyente {
  id: number;
  rfc: string;
  nombre: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

// ==================== HELPERS ====================

function formatFileSize(bytes: number): string {
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

// ==================== VISOR PDF SIMPLE ====================

interface PDFViewerProps {
  documento: Documento | null;
  open: boolean;
  onClose: () => void;
  getPreviewUrl: (doc: Documento) => string;
}

function PDFViewer({ documento, open, onClose, getPreviewUrl }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (documento) {
      setIsLoading(true);
      setLoadError(false);
    }
  }, [documento?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!documento) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header simple */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate max-w-[400px]" title={documento.nombre_original}>
                {documento.nombre_original}
              </h3>
              <p className="text-xs text-muted-foreground">
                {documento.contribuyente_nombre && `${documento.contribuyente_nombre} • `}
                {formatFileSize(documento.tamaño_bytes)}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 relative bg-[#525659]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando documento...</p>
              </div>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No se pudo cargar el documento</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intenta abrirlo en una nueva pestaña
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.open(getPreviewUrl(documento), '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </div>
          )}

          <iframe
            src={getPreviewUrl(documento)}
            className="w-full h-full"
            title={`Vista previa de ${documento.nombre_original}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== PAGINACIÓN PROFESIONAL ====================

interface PaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function PaginationControl({ pagination, onPageChange, loading }: PaginationProps) {
  const { page, total_pages, total, limit } = pagination;
  const [jumpToPage, setJumpToPage] = useState('');

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (total_pages <= maxVisible) {
      return Array.from({ length: total_pages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (page > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(total_pages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < total_pages - 2) {
      pages.push('ellipsis');
    }

    if (total_pages > 1) {
      pages.push(total_pages);
    }

    return pages;
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const handleJumpToPage = () => {
    const val = parseInt(jumpToPage);
    if (val >= 1 && val <= total_pages && val !== page) {
      onPageChange(val);
      setJumpToPage('');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{startItem}</span> - <span className="font-semibold text-foreground">{endItem}</span> de{' '}
          <span className="font-semibold text-foreground">{total}</span> documentos
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Primera página</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página anterior</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {getVisiblePages().map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground select-none">
                  •••
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className={`h-9 w-9 font-medium ${p === page ? 'pointer-events-none' : ''}`}
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                >
                  {p}
                </Button>
              )
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === total_pages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página siguiente</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onPageChange(total_pages)}
                  disabled={page === total_pages || loading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Última página</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quick jump */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ir a página:</span>
          <Input
            type="number"
            min={1}
            max={total_pages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJumpToPage();
              }
            }}
            placeholder={page.toString()}
            className="w-16 h-9 text-center"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToPage}
            disabled={!jumpToPage || loading}
          >
            Ir
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export function DocumentsSection() {
  const { user: currentUser } = useAuth();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([]);
  const [selectedContribuyente, setSelectedContribuyente] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Documento | null>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedContribuyenteForUpload, setSelectedContribuyenteForUpload] = useState<string>("");

  const isInitialMount = useRef(true);

  const fetchDocumentos = useCallback(async (page = 1, filters?: { search?: string; contribuyente?: string }) => {
    if (!currentUser?.correo || !currentUser?.organizacion) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        correo: currentUser.correo,
        organizacion: currentUser.organizacion,
        page: page.toString(),
        limit: '12',
        orden: 'created_at',
        direccion: 'desc',
      });

      const search = filters?.search ?? searchQuery;
      const contribuyente = filters?.contribuyente ?? selectedContribuyente;

      if (search) params.append('nombre', search);
      if (contribuyente !== 'all') params.append('contribuyente_id', contribuyente);

      const response = await fetch(`${API_URL}/documentos?${params}`, {
        headers: getHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        setDocumentos(result.data?.documentos || []);
        setPagination(result.data?.pagination || null);
      } else {
        throw new Error(result.error || 'Error al cargar documentos');
      }
    } catch (err) {
      console.error('Error cargando documentos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.correo, currentUser?.organizacion, searchQuery, selectedContribuyente]);

  const fetchContribuyentes = useCallback(async () => {
    if (!currentUser?.correo || !currentUser?.organizacion) return;

    try {
      const params = new URLSearchParams({
        correo: currentUser.correo,
        organizacion: currentUser.organizacion,
      });

      const response = await fetch(`${API_URL}/contribuyentes?${params}`, {
        headers: getHeaders(),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const lista = result.data.contribuyentes || result.data || [];
        setContribuyentes(Array.isArray(lista) ? lista : []);
      }
    } catch (err) {
      console.error('Error cargando contribuyentes:', err);
    }
  }, [currentUser?.correo, currentUser?.organizacion]);

  useEffect(() => {
    if (currentUser?.correo && currentUser?.organizacion) {
      fetchDocumentos(1);
      fetchContribuyentes();
    }
  }, [currentUser?.correo, currentUser?.organizacion]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (currentUser?.correo && currentUser?.organizacion) {
        fetchDocumentos(1, { search: searchQuery, contribuyente: selectedContribuyente });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedContribuyente]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Solo se permiten archivos PDF' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo no puede superar los 10MB' };
    }

    return { valid: true };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast({
        title: "Archivo no válido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedContribuyenteForUpload || !currentUser) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('archivo', selectedFile);
    formData.append('correo', currentUser.correo);
    formData.append('organizacion', currentUser.organizacion);
    formData.append('contribuyente_id', selectedContribuyenteForUpload);
    formData.append('tipo_documento', 'pdf');

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_URL}/documentos`, {
        method: 'POST',
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      const text = await response.text();
      let result: { success: boolean; error?: string; message?: string; data?: unknown };
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }

      if (result.success) {
        toast({
          title: "¡Documento subido!",
          description: `${selectedFile.name} se ha guardado correctamente`,
        });
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setSelectedContribuyenteForUpload("");
        setTimeout(() => fetchDocumentos(1), 500);
      } else {
        throw new Error(result.error || result.message || 'Error al subir documento');
      }
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Error subiendo documento:', err);
      toast({
        title: "Error al subir",
        description: err instanceof Error ? err.message : 'No se pudo subir el documento',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete || !currentUser) return;

    try {
      const response = await fetch(`${API_URL}/documentos`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          correo: currentUser.correo,
          organizacion: currentUser.organizacion,
          documento_id: docToDelete.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Documento eliminado",
          description: "El documento ha sido eliminado correctamente",
        });
        setDeleteDialogOpen(false);
        setDocToDelete(null);
        fetchDocumentos();
      } else {
        throw new Error(result.error || 'Error al eliminar');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'No se pudo eliminar el documento',
        variant: "destructive",
      });
    }
  };

  const getPreviewUrl = (doc: Documento) => {
    if (!currentUser) return '';
    return `${API_URL}/documentos/archivo?documento_id=${doc.id}&correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}&modo=preview`;
  };

  const getDownloadUrl = (doc: Documento) => {
    if (!currentUser) return '';
    return `${API_URL}/documentos/archivo?documento_id=${doc.id}&correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}&modo=download`;
  };

  // ==================== SUB-COMPONENTES ====================

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No tienes documentos aún
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Comienza subiendo tu primer documento PDF
      </p>
      <Button onClick={() => fileInputRef.current?.click()} size="lg">
        <Upload className="h-5 w-5 mr-2" />
        Subir mi primer documento
      </Button>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Algo salió mal
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {error || 'No pudimos cargar tus documentos'}
      </p>
      <Button onClick={() => fetchDocumentos()} variant="outline">
        <RotateCw className="h-4 w-4 mr-2" />
        Intentar de nuevo
      </Button>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Cargando documentos...</p>
    </div>
  );

  const UploadZone = () => (
    <Card
      className={`
        relative border-2 border-dashed transition-all duration-200 cursor-pointer
        ${isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
          ${isDragging ? 'bg-primary/20' : 'bg-muted'}
        `}>
          <FileUp className={`h-7 w-7 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">
          {isDragging ? '¡Suelta tu archivo aquí!' : 'Arrastra tu PDF aquí'}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          o haz clic para seleccionar
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-normal">PDF</Badge>
          <Badge variant="outline" className="font-normal">Máx. 10MB</Badge>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,application/pdf"
        className="hidden"
      />
    </Card>
  );

  const DocumentGridCard = ({ doc }: { doc: Documento }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div
        className="h-36 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 flex items-center justify-center cursor-pointer relative"
        onClick={() => setPreviewDoc(doc)}
      >
        <File className="h-14 w-14 text-red-500/50" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="shadow-lg">
            <Eye className="h-4 w-4 mr-1" />
            Ver PDF
          </Button>
        </div>
        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
          PDF
        </Badge>
      </div>

      <CardContent className="p-4">
        <h4 className="font-medium text-sm truncate mb-1" title={doc.nombre_original}>
          {doc.nombre_original}
        </h4>
        {doc.contribuyente_nombre && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 truncate">
            <User className="h-3 w-3 shrink-0" />
            {doc.contribuyente_nombre}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatFileSize(doc.tamaño_bytes)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(doc.created_at)}
          </span>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => setPreviewDoc(doc)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Ver
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = getDownloadUrl(doc);
                    link.download = doc.nombre_original;
                    link.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Descargar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDocToDelete(doc);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );

  const DocumentListRow = ({ doc }: { doc: Documento }) => (
    <Card
      className="group hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => setPreviewDoc(doc)}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
          <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate" title={doc.nombre_original}>
            {doc.nombre_original}
          </h4>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {doc.contribuyente_nombre && (
              <span className="flex items-center gap-1 truncate">
                <User className="h-3.5 w-3.5 shrink-0" />
                {doc.contribuyente_nombre}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5" />
              {formatFileSize(doc.tamaño_bytes)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(doc.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver documento</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = getDownloadUrl(doc);
                    link.download = doc.nombre_original;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Descargar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver documento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(getPreviewUrl(doc), '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en nueva pestaña
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const link = document.createElement('a');
                link.href = getDownloadUrl(doc);
                link.download = doc.nombre_original;
                link.click();
              }}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setDocToDelete(doc);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y visualiza tus documentos PDF
          </p>
        </div>
        {documentos.length > 0 && (
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Subir PDF
          </Button>
        )}
      </div>

      {/* Stats */}
      {!loading && !error && pagination && pagination.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-xs text-muted-foreground">Documentos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <File className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-xs text-muted-foreground">PDFs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contribuyentes.length}</p>
                <p className="text-xs text-muted-foreground">Contribuyentes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <SortDesc className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total_pages}</p>
                <p className="text-xs text-muted-foreground">Páginas</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Zone */}
      {!loading && !error && documentos.length > 0 && (
        <UploadZone />
      )}

      {/* Filters */}
      {!loading && !error && documentos.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre del documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedContribuyente} onValueChange={setSelectedContribuyente}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Contribuyente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los contribuyentes</SelectItem>
                  {contribuyentes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-8 hidden lg:block" />

              <div className="flex items-center border rounded-lg p-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Vista de cuadrícula</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Vista de lista</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : documentos.length === 0 && !searchQuery && selectedContribuyente === 'all' ? (
        <>
          <UploadZone />
          <EmptyState />
        </>
      ) : documentos.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin resultados</h3>
          <p className="text-muted-foreground mb-4">
            No encontramos documentos con los filtros seleccionados
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSelectedContribuyente("all");
          }}>
            Limpiar filtros
          </Button>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documentos.map((doc) => (
                <DocumentGridCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((doc) => (
                <DocumentListRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <PaginationControl
              pagination={pagination}
              onPageChange={(page) => fetchDocumentos(page)}
              loading={loading}
            />
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploading) {
          setUploadDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            setSelectedContribuyenteForUpload("");
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Subir documento</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona el contribuyente para este documento
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <File className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Contribuyente</label>
              <Select
                value={selectedContribuyenteForUpload}
                onValueChange={setSelectedContribuyenteForUpload}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un contribuyente" />
                </SelectTrigger>
                <SelectContent>
                  {contribuyentes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre} ({c.rfc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subiendo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedContribuyenteForUpload || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento "{docToDelete?.nombre_original}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer */}
      <PDFViewer
        documento={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        getPreviewUrl={getPreviewUrl}
      />
    </div>
  );
}