// Servicios de API para autenticación y suscripciones
// Basado en FRONTEND_FLOW.md

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Tipos de datos según la API del backend
export interface User {
  id: number;
  email: string;
  full_name: string;
  company: string;
  role: string;
  is_active: boolean;
  subscription: {
    plan: string;
    status: string;
    is_trial: boolean;
    trial_ends_at: string | null;
    days_remaining: number;
  };
  can_access_features: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SubscriptionStatus {
  active: boolean;
  plan: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  days_remaining: number;
  can_access_features: boolean;
}

// Obtener token del localStorage
const getToken = () => localStorage.getItem('token');

// Configurar headers con autenticación
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// ==================== AUTENTICACIÓN ====================

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
export async function register(
  email: string,
  password: string,
  fullName: string,
  company: string
): Promise<AuthResponse> {
  console.log('📝 Intentando registro:', { email, fullName, company });
  
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: fullName, // Según docs, puede ser 'name'
      full_name: fullName,
      company_name: company,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    console.error('❌ Error en registro:', response.status, error);
    throw new Error(error.message || error.detail || `Error ${response.status}: No se pudo crear la cuenta`);
  }

  const data = await response.json();
  console.log('✅ Registro exitoso:', data.user?.email);
  return data;
}

/**
 * Iniciar sesión
 * POST /api/auth/login
 * Nota: La API espera 'username' en lugar de 'email' (OAuth2 standard)
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('🔐 Intentando login:', email);
  
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: email, // ⚠️ Importante: se llama 'username' pero es el email
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    console.error('❌ Error en login:', response.status, error);
    throw new Error(error.message || error.detail || `Error ${response.status}: Credenciales inválidas`);
  }

  const data = await response.json();
  console.log('✅ Login exitoso. Token recibido:', data.token ? 'Sí' : 'No');
  console.log('✅ Usuario:', data.user?.email);
  return data;
}

/**
 * Verificar sesión activa
 * GET /api/auth/me
 */
export async function verifySession(): Promise<User> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado o inválido
      localStorage.clear();
      throw new Error('Sesión expirada');
    }
    const error = await response.json();
    throw new Error(error.message || error.detail || 'Error al verificar sesión');
  }

  return response.json();
}

/**
 * Refrescar token
 * POST /api/auth/refresh
 */
export async function refreshToken(): Promise<AuthResponse> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      throw new Error('Sesión expirada');
    }
    const error = await response.json();
    throw new Error(error.message || error.detail || 'Error al refrescar token');
  }

  return response.json();
}

/**
 * Cerrar sesión
 * POST /api/auth/logout
 */
export async function logout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    }
  }
  
  // Limpiar localStorage siempre
  localStorage.clear();
}

// ==================== SUSCRIPCIONES ====================

/**
 * Obtener estado de suscripción
 * GET /api/subscriptions/
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const response = await fetch(`${API_URL}/api/subscriptions/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesión expirada');
    }
    const error = await response.json();
    throw new Error(error.message || error.detail || 'Error al obtener estado de suscripción');
  }

  return response.json();
}

/**
 * Crear suscripción de pago
 * POST /api/payments/create-subscription
 */
export async function createSubscription(
  plan: string,
  paymentMethodId: string
): Promise<{ success: boolean; subscription: any }> {
  const response = await fetch(`${API_URL}/api/payments/create-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      plan,
      payment_method_id: paymentMethodId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.detail || 'Error al crear suscripción');
  }

  return response.json();
}

// ==================== UTILIDADES ====================

/**
 * Guardar datos de autenticación en localStorage
 */
export function saveAuthData(token: string, user: User): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Obtener usuario del localStorage
 */
export function getStoredUser(): User | null {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getStoredUser();
}
