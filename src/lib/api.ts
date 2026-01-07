// Utilidad para hacer fetch con fallback automático
const PRIMARY_API = 'https://dnxnc3qz-3000.use.devtunnels.ms/api';
const FALLBACK_API = 'http://localhost:3000/api';
const TIMEOUT_MS = 5000;

interface FetchWithFallbackOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithFallback(
  endpoint: string,
  options: FetchWithFallbackOptions = {}
): Promise<Response> {
  const { timeout = TIMEOUT_MS, ...fetchOptions } = options;
  
  // Función auxiliar para hacer fetch con timeout
  const fetchWithTimeout = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Intentar con la API primaria
  try {
    console.log(`🌐 Intentando conectar a: ${PRIMARY_API}${endpoint}`);
    const response = await fetchWithTimeout(`${PRIMARY_API}${endpoint}`);
    console.log(`✅ Conectado a primary API`);
    return response;
  } catch (primaryError) {
    console.warn(`⚠️ Primary API falló, intentando fallback...`, primaryError);
    
    // Si falla, intentar con el fallback
    try {
      console.log(`🌐 Intentando conectar a: ${FALLBACK_API}${endpoint}`);
      const response = await fetchWithTimeout(`${FALLBACK_API}${endpoint}`);
      console.log(`✅ Conectado a fallback API`);
      return response;
    } catch (fallbackError) {
      console.error(`❌ Ambas APIs fallaron`, fallbackError);
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
    }
  }
}

// Headers comunes para todas las peticiones
export const getCommonHeaders = (includeAuth = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};
