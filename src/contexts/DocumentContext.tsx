import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

// Tipos de datos que maneja la API
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
  processing_result: any | null;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_documents: number;
  documents_per_page: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

interface DocumentsResponse {
  documents: Document[];
  pagination: PaginationInfo;
  filters: {
    status?: string;
    search?: string;
  };
}

interface DocumentContextType {
  documents: Document[];
  pagination: PaginationInfo | null;
  filters: {
    status?: string;
    search?: string;
  };
  loading: boolean;
  fetchDocuments: (page?: number, limit?: number, status?: string, search?: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<Document>;
  getDocumentById: (id: number) => Promise<Document>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider = ({ children }: DocumentProviderProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({});
  const [loading, setLoading] = useState(false);

  // URL base de la API - asegurarnos de que sea la correcta
  const API_URL = 'http://localhost:8000/api';
  console.log('API URL configurada:', API_URL);

  // Función mejorada para obtener headers de autorización siguiendo la guía
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    console.log('Token recuperado:', token ? 'Token presente' : 'Token ausente');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  };
  
  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  // Almacenar la última solicitud para cancelar peticiones duplicadas
  let lastRequestController = null;
  
  const fetchDocuments = async (page = 1, limit = 10, status?: string, search?: string) => {
    // Cancelar cualquier solicitud pendiente anterior
    if (lastRequestController) {
      console.log('Cancelando solicitud anterior pendiente');
      lastRequestController.abort();
    }
    
    // Crear un nuevo controlador para esta solicitud
    lastRequestController = new AbortController();
    const signal = lastRequestController.signal;
    
    setLoading(true);
    console.log(`Fetcheando documentos: página ${page}, límite ${limit}, estado ${status || 'todos'}, búsqueda: ${search || 'ninguna'}`);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      
      const url = `${API_URL}/documents?${params}`;
      console.log('URL de petición:', url);
      
      // Obtener el token para debugging
      const token = getAuthToken();
      console.log('Token para la petición:', token ? `${token.substring(0, 15)}...` : 'No hay token');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal // Asociar la señal del AbortController
      });
      
      // Si la solicitud fue cancelada, no continuar
      if (signal.aborted) {
        console.log('La solicitud fue cancelada');
        return;
      }
      
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch (e) {
          // Si no es JSON, intentamos obtener el texto
          const text = await response.text();
          if (text) errorMessage += ` - ${text}`;
        }
        throw new Error(errorMessage);
      }
      
      // Si la solicitud fue cancelada, no continuar procesando
      if (signal.aborted) {
        console.log('La solicitud fue cancelada durante el procesamiento');
        return;
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      // Verificar la estructura de datos
      if (!data.documents || !Array.isArray(data.documents)) {
        console.error('Formato de respuesta inesperado:', data);
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }
      
      // Si la solicitud fue cancelada, no actualizar el estado
      if (signal.aborted) {
        console.log('Solicitud cancelada antes de actualizar el estado');
        return;
      }
      
      setDocuments(data.documents);
      
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        console.warn('No se encontró información de paginación en la respuesta');
        setPagination(null);
      }
      
      setFilters({
        status: data.filters?.status,
        search: data.filters?.search
      });
      
      console.log(`Se cargaron ${data.documents.length} documentos`);
    } catch (error) {
      // No mostrar errores si la solicitud fue cancelada intencionalmente
      if (error.name === 'AbortError') {
        console.log('Solicitud cancelada:', error.message);
        return;
      }
      
      console.error('Error al obtener documentos:', error);
      setDocuments([]);
      setPagination(null);
      
      toast({
        title: "Error al cargar documentos",
        description: error instanceof Error ? error.message : "Error desconocido al cargar documentos",
        variant: "destructive",
      });
    } finally {
      // Solo actualizar el estado de carga si esta solicitud no fue cancelada
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };
  
  const uploadDocument = async (file: File): Promise<Document> => {
    console.log('Comenzando subida de archivo:', file.name);
    
    // Validar archivo
    if (!file) {
      throw new Error('No se seleccionó ningún archivo');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // IMPORTANTE: NO incluir Content-Type en headers para multipart/form-data
      // FormData se encarga automáticamente del Content-Type
      
      console.log('Enviando solicitud a:', `${API_URL}/documents/upload`);
      
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: getAuthHeaders(), // Solo incluimos los headers de autorización
        body: formData
      });
      
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        // Intentamos obtener información detallada del error
        const text = await response.text();
        let errorMessage = `Error al subir archivo. Estado: ${response.status}`;
        
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.detail || errorData.message || errorMessage;
          console.error('Error en respuesta:', errorData);
        } catch (parseError) {
          console.error('Error al parsear respuesta:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Datos de documento recibidos:', data);
      return data;
    } catch (error) {
      console.error('Error en uploadDocument:', error);
      throw error;
    }
  };
  
  const getDocumentById = async (id: number): Promise<Document> => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener documento');
    }
    
    return await response.json();
  };

  return (
    <DocumentContext.Provider value={{ 
      documents, 
      pagination, 
      filters, 
      loading, 
      fetchDocuments, 
      uploadDocument, 
      getDocumentById 
    }}>
      {children}
    </DocumentContext.Provider>
  );
};