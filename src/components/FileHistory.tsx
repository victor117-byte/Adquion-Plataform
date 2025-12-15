import { useState, useEffect } from 'react';
import { Search, FileText, Download, Trash2, Calendar, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface Document {
  id: string;
  filename: string;
  size: number;
  upload_date: string;
  status: 'processed' | 'processing' | 'error';
  download_url?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const FileHistory = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deletedDocIds, setDeletedDocIds] = useState<Set<string>>(new Set());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, statusFilter, sortBy]);

  const fetchDocuments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    // Si no hay token, ir directo a modo demo
    if (!token) {
      console.log('Sin token, activando modo demo');
      loadMockData();
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sort_by: sortBy,
        ...(searchTerm && { search: searchTerm }),
      });

      // Timeout para el fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Verificar que la respuesta tenga la estructura esperada
        if (data && Array.isArray(data.documents)) {
          setDocuments(data.documents);
          setPagination({
            page: data.page || 1,
            limit: data.limit || 10,
            total: data.total || 0,
            totalPages: data.total_pages || 0,
          });
        } else {
          // Si la estructura no es la esperada, usar modo demo
          console.log('Estructura de respuesta inesperada, activando modo demo');
          loadMockData();
        }
      } else {
        // Cualquier otro código de estado, activar modo demo
        console.log(`Respuesta ${response.status}, activando modo demo`);
        loadMockData();
      }
    } catch (error) {
      // Modo demo cuando hay error
      console.log('Error al cargar documentos, activando modo demo:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Datos de demostración
    const mockDocs: Document[] = [
      {
        id: '1',
        filename: 'factura_001_2024.pdf',
        size: 1245678,
        upload_date: '2024-01-15T10:30:00Z',
        status: 'processed',
        download_url: '#',
      },
      {
        id: '2',
        filename: 'comprobante_pago_diciembre.pdf',
        size: 856234,
        upload_date: '2024-01-14T15:45:00Z',
        status: 'processed',
        download_url: '#',
      },
      {
        id: '3',
        filename: 'declaracion_anual_2023.pdf',
        size: 3456789,
        upload_date: '2024-01-13T09:20:00Z',
        status: 'processing',
      },
      {
        id: '4',
        filename: 'cfdi_enero_2024.pdf',
        size: 678901,
        upload_date: '2024-01-12T14:10:00Z',
        status: 'processed',
        download_url: '#',
      },
      {
        id: '5',
        filename: 'recibo_honorarios.pdf',
        size: 445566,
        upload_date: '2024-01-11T11:00:00Z',
        status: 'error',
      },
    ];

    // Filtrar documentos eliminados primero
    let filtered = mockDocs.filter(doc => !deletedDocIds.has(doc.id));

    // Aplicar filtros locales
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      } else if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      } else {
        return b.size - a.size;
      }
    });

    // Simular paginación
    const start = (pagination.page - 1) * pagination.limit;
    const paginatedDocs = filtered.slice(start, start + pagination.limit);

    setDocuments(paginatedDocs);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDocuments();
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.download_url) {
      toast({
        title: "No disponible",
        description: "El archivo aún no está listo para descargar",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/documents/${doc.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "✅ Descarga iniciada",
          description: `${doc.filename}`,
        });
      } else {
        toast({
          title: "Modo Demo",
          description: "La descarga no está disponible. Endpoint pendiente.",
        });
      }
    } catch (error) {
      toast({
        title: "Modo Demo",
        description: "La descarga no está disponible. Endpoint pendiente.",
      });
    }
  };

  const confirmDelete = (docId: string) => {
    setDocumentToDelete(docId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/documents/${documentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "✅ Archivo eliminado",
          description: "El documento se eliminó correctamente",
        });
        // Agregar a eliminados y recargar
        setDeletedDocIds(prev => new Set(prev).add(documentToDelete));
        fetchDocuments();
      } else {
        toast({
          title: "✅ Archivo eliminado (Demo)",
          description: "Eliminación simulada. Endpoint pendiente.",
        });
        // Agregar a la lista de eliminados en modo demo
        setDeletedDocIds(prev => new Set(prev).add(documentToDelete));
        // Recargar para aplicar filtro
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: "✅ Archivo eliminado (Demo)",
        description: "Eliminación simulada. Endpoint pendiente.",
      });
      // Agregar a la lista de eliminados en modo demo
      setDeletedDocIds(prev => new Set(prev).add(documentToDelete));
      // Recargar para aplicar filtro
      fetchDocuments();
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-600">Procesado</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-600">Procesando</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre de archivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="processed">Procesados</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="error">Con error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha (recientes)</SelectItem>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="size">Tamaño</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </form>
      </Card>

      {/* Tabla de documentos */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Documentos ({pagination.total})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Cargando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                No se encontraron documentos
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Sube tu primer archivo en la pestaña "Cargar Archivos"'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-xs">{doc.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>{formatDate(doc.upload_date)}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={doc.status !== 'processed'}
                            title="Descargar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(doc.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="border-t p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Diálogo de confirmación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
