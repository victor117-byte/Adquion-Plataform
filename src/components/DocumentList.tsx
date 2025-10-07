import { useState, useEffect, useRef, useCallback } from 'react';
import { useDocuments } from '@/contexts/DocumentContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControl } from '@/components/ui/pagination-control';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileText, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

/**
 * Interfaz para los documentos que maneja este componente
 */
interface Document {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  content_type: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  uploaded_at: string;
  processed_at: string | null;
  user_id: string;
  processing_result: unknown | null;
}

/**
 * Estados de la UI para controlar la visualización de forma estable
 */
enum UIState {
  INITIAL_LOADING = 'initial_loading',  // Primera carga, muestra skeleton
  LOADING_WITH_DATA = 'loading_with_data', // Cargando pero manteniendo datos anteriores
  SUCCESS = 'success',                  // Datos cargados exitosamente
  ERROR = 'error',                     // Error en la carga
  EMPTY = 'empty'                      // Sin datos
}

/**
 * Componente DocumentList - Maneja la visualización de documentos del usuario
 * 
 * Características principales:
 * - Paginación
 * - Filtros por estado
 * - Búsqueda por nombre
 * - Estado de carga estable sin parpadeos
 * - Manejo robusto de errores
 * 
 * @returns JSX.Element
 */

export const DocumentList = () => {
  // ========================================
  // HOOKS Y ESTADOS
  // ========================================
  
  const { documents, pagination, loading, fetchDocuments } = useDocuments();
  
  // Estados de filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  
  // Estado de la UI para controlar la visualización sin parpadeos
  const [uiState, setUIState] = useState<UIState>(UIState.INITIAL_LOADING);
  
  // Documentos estables que se muestran al usuario (evita parpadeos)
  const [displayDocuments, setDisplayDocuments] = useState<Document[]>([]);
  
  // Referencias para manejo de timeouts y control de carga
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);
  
  // ========================================
  // EFECTOS PARA MANEJO DE ESTADO DE UI
  // ========================================
  
  /**
   * Efecto principal que maneja las transiciones de estado de la UI
   * Evita parpadeos y mantiene una experiencia fluida
   */
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Determinar el nuevo estado de la UI basado en loading y documents
    if (loading) {
      // Si está cargando y es la primera vez, mostrar loading inicial
      if (isFirstLoadRef.current || displayDocuments.length === 0) {
        setUIState(UIState.INITIAL_LOADING);
      } else {
        // Si ya tenemos datos, mantenerlos mientras carga (evita parpadeo)
        setUIState(UIState.LOADING_WITH_DATA);
      }
    } else {
      // No está cargando
      if (documents.length > 0) {
        // Tenemos documentos - actualizar después de un pequeño delay para transición suave
        transitionTimeoutRef.current = setTimeout(() => {
          setDisplayDocuments(documents);
          setUIState(UIState.SUCCESS);
          isFirstLoadRef.current = false;
        }, 100); // Delay mínimo para transición suave
      } else {
        // No hay documentos
        setDisplayDocuments([]);
        setUIState(UIState.EMPTY);
        isFirstLoadRef.current = false;
      }
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [loading, documents, displayDocuments.length]);
  
  // ========================================
  // FUNCIONES DE CARGA Y MANEJO DE DATOS
  // ========================================
  
  /**
   * Función principal para cargar documentos con debounce
   * Evita múltiples llamadas simultáneas y controla el estado de error
   */
  const loadDocuments = useCallback(() => {
    // Evitar múltiples cargas si ya está en proceso
    if (loading) {
      console.log('DocumentList: Carga ya en progreso, evitando duplicación');
      return;
    }
    
    // Limpiar timeout de debounce anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Aplicar debounce para evitar múltiples llamadas rápidas
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('DocumentList: Iniciando carga de documentos', {
        page: currentPage,
        limit,
        status: status || 'todos',
        search: search || 'sin filtro'
      });
      
      // Resetear estado de error antes de cargar
      if (uiState === UIState.ERROR) {
        setUIState(isFirstLoadRef.current ? UIState.INITIAL_LOADING : UIState.LOADING_WITH_DATA);
      }
      
      // Realizar la carga
      fetchDocuments(currentPage, limit, status, search)
        .catch((error) => {
          console.error('DocumentList: Error al cargar documentos:', error);
          setUIState(UIState.ERROR);
          toast({
            title: "Error al cargar documentos",
            description: "No se pudieron cargar los documentos. Por favor, inténtelo de nuevo.",
            variant: "destructive",
          });
        });
    }, 300); // 300ms de debounce
    
  }, [currentPage, limit, status, search, fetchDocuments, loading, uiState]);
  
  /**
   * Efecto para cargar documentos cuando cambien los parámetros de filtro
   */
  useEffect(() => {
    loadDocuments();
    
    // Cleanup al desmontar el componente
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [loadDocuments]);

  
  // ========================================
  // MANEJADORES DE EVENTOS
  // ========================================
  
  /**
   * Maneja el cambio de página en la paginación
   */
  const handlePageChange = (page: number) => {
    console.log('DocumentList: Cambiando a página', page);
    setCurrentPage(page);
  };

  /**
   * Maneja el cambio en el límite de elementos por página
   */
  const handleLimitChange = (value: string) => {
    console.log('DocumentList: Cambiando límite a', value);
    setLimit(parseInt(value));
    setCurrentPage(1); // Resetear a la primera página
  };

  /**
   * Maneja el cambio de filtro por estado
   */
  const handleStatusChange = (value: string) => {
    console.log('DocumentList: Cambiando filtro de estado a', value);
    setStatus(value === 'all' ? undefined : value);
    setCurrentPage(1); // Resetear a la primera página
  };

  /**
   * Maneja el envío del formulario de búsqueda
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DocumentList: Aplicando búsqueda:', searchInput);
    setSearch(searchInput);
    setCurrentPage(1); // Resetear a la primera página
  };

  /**
   * Maneja la recarga manual de documentos
   */
  const handleManualRefresh = () => {
    if (loading) {
      console.log('DocumentList: Ignorando recarga manual, ya está cargando');
      return;
    }
    
    console.log('DocumentList: Recarga manual iniciada');
    toast({
      title: "Actualizando documentos",
      description: "Recargando lista de documentos...",
    });
    
    loadDocuments();
  };

  /**
   * Maneja el reintento después de un error
   */
  const handleRetry = () => {
    console.log('DocumentList: Reintentando carga después de error');
    loadDocuments();
  };
  
  // ========================================
  // FUNCIONES AUXILIARES PARA RENDERIZADO
  // ========================================
  
  /**
   * Genera el badge de estado apropiado para un documento
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Procesando</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Procesado</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Formatea el tamaño de archivo en bytes a una representación legible
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Formatea una fecha ISO string a formato legible en español
   */
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  /**
   * Renderiza el contenido de la tabla según el estado actual de la UI
   */
  const renderTableContent = () => {
    switch (uiState) {
      case UIState.INITIAL_LOADING:
        return (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando documentos...</p>
            </TableCell>
          </TableRow>
        );
        
      case UIState.ERROR:
        return (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <div className="flex justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <p className="mt-2 text-sm text-destructive">Error al cargar documentos</p>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Intentar de nuevo
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
        
      case UIState.EMPTY:
        return (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron documentos</p>
            </TableCell>
          </TableRow>
        );
        
      case UIState.SUCCESS:
      case UIState.LOADING_WITH_DATA:
        return displayDocuments.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[200px]" title={doc.original_name}>
                  {doc.original_name}
                </span>
              </div>
            </TableCell>
            <TableCell>{formatFileSize(doc.file_size)}</TableCell>
            <TableCell>{doc.content_type.split('/')[1].toUpperCase()}</TableCell>
            <TableCell>{getStatusBadge(doc.status)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {formatDate(doc.uploaded_at)}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ));
        
      default:
        return null;
    }
  };

  
  // ========================================
  // RENDERIZADO PRINCIPAL
  // ========================================
  
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar documentos..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Buscar</Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading && uiState === UIState.LOADING_WITH_DATA ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </form>
        
        {/* Filtros */}
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="processing">Procesando</SelectItem>
              <SelectItem value="processed">Procesado</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Mostrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de documentos */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </Card>
      
      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && uiState === UIState.SUCCESS && (
        <PaginationControl
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};