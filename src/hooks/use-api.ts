/**
 * Hook centralizado para llamadas API con manejo automático de organización
 *
 * Características:
 * - Incluye credenciales automáticamente (cookies httpOnly)
 * - Maneja errores 401 (sesión expirada) y 403 (sin acceso a organización)
 * - Añade organización a las peticiones automáticamente si está disponible
 */

import { useAuth } from '@/contexts/AuthContext';
import { getHeaders, API_URL } from '@/utils/api';

interface ApiError extends Error {
  status?: number;
}

export function useApi() {
  const { user } = useAuth();
  const currentOrganization = user?.organizacionActiva?.database;

  const fetchApi = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Construir URL con organización si está disponible
    const url = new URL(endpoint, API_URL.startsWith('http') ? API_URL : window.location.origin + API_URL);

    // Añadir organizacion a query params si no está presente
    if (!url.searchParams.has('organizacion') && currentOrganization) {
      url.searchParams.set('organizacion', currentOrganization);
    }

    const headers = {
      ...getHeaders(!(options.body instanceof FormData)),
      ...options.headers,
    };

    const response = await fetch(url.toString(), {
      ...options,
      headers,
      credentials: 'include',
    });

    // Manejar errores de autenticación/autorización
    if (response.status === 401) {
      window.location.href = '/auth';
      const error: ApiError = new Error('Sesión expirada');
      error.status = 401;
      throw error;
    }

    if (response.status === 403) {
      const data = await response.json();
      const error: ApiError = new Error(data.message || 'No tienes acceso a este recurso');
      error.status = 403;
      throw error;
    }

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = new Error(data.error || data.message || 'Error en la petición');
      error.status = response.status;
      throw error;
    }

    return data;
  };

  const get = <T = unknown>(endpoint: string): Promise<T> =>
    fetchApi<T>(endpoint, { method: 'GET' });

  const post = <T = unknown>(endpoint: string, body?: object): Promise<T> =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }) : undefined,
    });

  const patch = <T = unknown>(endpoint: string, body?: object): Promise<T> =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }) : undefined,
    });

  const del = <T = unknown>(endpoint: string, body?: object): Promise<T> =>
    fetchApi<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify({
        organizacion: currentOrganization,
        ...body,
      }) : undefined,
    });

  const postFormData = async <T = unknown>(endpoint: string, formData: FormData): Promise<T> => {
    // Añadir organizacion al FormData si no está presente
    if (!formData.has('organizacion') && currentOrganization) {
      formData.append('organizacion', currentOrganization);
    }

    return fetchApi<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  };

  return {
    get,
    post,
    patch,
    del,
    postFormData,
    fetchApi,
    currentOrganization,
  };
}
