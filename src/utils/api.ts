/**
 * Helper centralizado para llamadas API con autenticación basada en cookies httpOnly
 *
 * El backend maneja tokens JWT en cookies httpOnly para mayor seguridad.
 * Este módulo usa `credentials: 'include'` para enviar cookies automáticamente.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const handleAuthError = () => {
  if (typeof window !== 'undefined' && !['/auth', '/'].includes(window.location.pathname)) {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
};

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

  // 401 → intentar refresh y reintentar una vez
  // Excepción: los endpoints de auth no deben hacer redirect en 401
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    if (!isRefreshing) {
      try {
        await refreshToken();
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        if (retryResponse.status === 401) {
          handleAuthError();
          throw new Error('Sesión expirada');
        }
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.error || retryData.message || 'Error en la petición');
        }
        return retryData;
      } catch (err) {
        if (err instanceof Error && err.message === 'Sesión expirada') throw err;
        handleAuthError();
        throw new Error('Sesión expirada');
      }
    } else {
      // Hay un refresh en vuelo — esperarlo y reintentar en lugar de redirigir de inmediato
      if (refreshPromise) {
        try {
          await refreshPromise;
          const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
          if (retryResponse.status === 401) {
            handleAuthError();
            throw new Error('Sesión expirada');
          }
          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new Error(retryData.error || retryData.message || 'Error en la petición');
          }
          return retryData;
        } catch (err) {
          if (err instanceof Error && err.message === 'Sesión expirada') throw err;
          handleAuthError();
          throw new Error('Sesión expirada');
        }
      }
      handleAuthError();
      throw new Error('Sesión expirada');
    }
  }

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
let isRefreshing = false;

/**
 * Refresca el token de acceso usando el refresh token
 * Evita múltiples refreshes simultáneos
 */
export async function refreshToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = fetchAPI('/auth/refresh', { method: 'POST' })
    .then(() => {})
    .finally(() => {
      refreshPromise = null;
      isRefreshing = false;
    });

  return refreshPromise;
}

/**
 * Fetch con reintento automático si el token expiró (401)
 * Si el refresh también falla, redirige al login
 */
export async function fetchWithRefresh<T = unknown>(
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
    credentials: 'include',
  });

  // Primer intento de refresh ante 401
  if (response.status === 401 && !isRefreshing) {
    try {
      await refreshToken();
      // Reintentar la petición original con el nuevo token
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retryResponse.ok) {
        // Refresh no ayudó → sesión expirada
        handleAuthError();
        throw new Error('Sesión expirada');
      }
      return retryResponse.json();
    } catch {
      handleAuthError();
      throw new Error('Sesión expirada');
    }
  }

  if (response.status === 401) {
    handleAuthError();
    throw new Error('Sesión expirada');
  }

  const data = await response.json();

  if (response.status === 403) {
    if (data.upgradeRequired) {
      const limitError: LimitExceededError = {
        message: data.message || data.error || 'Has alcanzado el límite de tu plan',
        upgradeRequired: true,
        current: data.current ?? 0,
        limit: data.limit ?? 0,
        resource: data.resource,
      };
      notifyLimitExceeded(limitError);
      throw new ApiLimitExceededError(limitError);
    }
    throw new Error(data.message || 'No tienes acceso a este recurso');
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error en la petición');
  }

  return data;
}

// ==================== API URL EXPORT ====================

export { API_BASE as API_URL };
