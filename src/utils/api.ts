/**
 * Helper centralizado para llamadas API con autenticación basada en cookies httpOnly
 *
 * El backend maneja tokens JWT en cookies httpOnly para mayor seguridad.
 * Este módulo usa `credentials: 'include'` para enviar cookies automáticamente.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV;

// ==================== TIPOS DE ERROR ====================

export interface LimitExceededError {
  message: string;
  upgradeRequired: boolean;
  current: number;
  limit: number;
  resource?: string;
}

export class ApiLimitExceededError extends Error {
  upgradeRequired: boolean;
  current: number;
  limit: number;
  resource?: string;

  constructor(data: LimitExceededError) {
    super(data.message);
    this.name = 'ApiLimitExceededError';
    this.upgradeRequired = data.upgradeRequired;
    this.current = data.current;
    this.limit = data.limit;
    this.resource = data.resource;
  }
}

// ==================== EVENTOS DE LÍMITE ====================

type LimitExceededCallback = (error: LimitExceededError) => void;
const limitExceededListeners: LimitExceededCallback[] = [];

/**
 * Suscribirse a eventos de límite excedido
 * @returns Función para desuscribirse
 */
export function onLimitExceeded(callback: LimitExceededCallback): () => void {
  limitExceededListeners.push(callback);
  return () => {
    const index = limitExceededListeners.indexOf(callback);
    if (index > -1) {
      limitExceededListeners.splice(index, 1);
    }
  };
}

/**
 * Notifica a todos los listeners sobre un límite excedido
 */
function notifyLimitExceeded(error: LimitExceededError): void {
  limitExceededListeners.forEach((callback) => callback(error));
}

// ==================== HEADERS ====================

/**
 * Genera los headers para las peticiones
 * @param includeContentType - Si incluir Content-Type JSON (default: true)
 */
export function getHeaders(includeContentType: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};

  // Incluir ngrok header en desarrollo y test (evita error CORS en producción)
  if (!import.meta.env.PROD) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

// ==================== FETCH BASE ====================

/**
 * Realiza un fetch con cookies incluidas automáticamente
 * El backend usa cookies httpOnly para autenticación
 *
 * Manejo de errores:
 * - 401: Token no presente o inválido (lanza error, el componente decide si redirigir)
 * - 403: No tienes acceso a esta organización
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    ...getHeaders(!(options.body instanceof FormData)),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Importante: envía cookies httpOnly
  });

  const data = await response.json();

  // Manejar error 403 - puede ser límite excedido o sin acceso
  if (response.status === 403) {
    // Verificar si es un error de límite excedido
    if (data.upgradeRequired) {
      const limitError: LimitExceededError = {
        message: data.message || data.error || 'Has alcanzado el límite de tu plan',
        upgradeRequired: true,
        current: data.current ?? 0,
        limit: data.limit ?? 0,
        resource: data.resource,
      };
      // Notificar a los listeners (modal de upgrade)
      notifyLimitExceeded(limitError);
      throw new ApiLimitExceededError(limitError);
    }
    // Error 403 normal (sin acceso)
    throw new Error(data.message || 'No tienes acceso a este recurso');
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error en la petición');
  }

  return data;
}

// ==================== HTTP METHODS ====================

/**
 * GET request con autenticación por cookies
 */
export async function get<T = unknown>(url: string): Promise<T> {
  return fetchAPI<T>(url, { method: 'GET' });
}

/**
 * POST request con autenticación por cookies
 */
export async function post<T = unknown>(url: string, data?: unknown): Promise<T> {
  return fetchAPI<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request con autenticación por cookies
 */
export async function patch<T = unknown>(url: string, data?: unknown): Promise<T> {
  return fetchAPI<T>(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request con autenticación por cookies
 */
export async function del<T = unknown>(url: string, data?: unknown): Promise<T> {
  return fetchAPI<T>(url, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * POST FormData con autenticación (para subir archivos)
 */
export async function postFormData<T = unknown>(url: string, formData: FormData): Promise<T> {
  return fetchAPI<T>(url, {
    method: 'POST',
    body: formData,
  });
}

// ==================== TOKEN REFRESH ====================

let refreshPromise: Promise<void> | null = null;

/**
 * Refresca el token de acceso usando el refresh token
 * Evita múltiples refreshes simultáneos
 */
export async function refreshToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetchAPI('/auth/refresh', { method: 'POST' })
    .then(() => {})
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Fetch con reintento automático si el token expiró
 */
export async function fetchWithRefresh<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    return await fetchAPI<T>(endpoint, options);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('Token inválido') || errorMessage.includes('expirado')) {
      await refreshToken();
      return await fetchAPI<T>(endpoint, options);
    }
    throw error;
  }
}

// ==================== API URL EXPORT ====================

export { API_BASE as API_URL };
