import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { fetchAPI, refreshToken } from '@/utils/api';

// ==================== TIPOS ====================

export interface Organizacion {
  nombre: string;
  database: string;
  rol: 'administrador' | 'contador';
}

export interface User {
  userId: number;
  nombre: string;
  correo: string;
  tipo_usuario: 'administrador' | 'contador';
  organizaciones: Organizacion[];
  organizacionActiva: {
    nombre: string;
    database: string;
  };
}

interface RegisterData {
  organizacion: string;
  nombre: string;
  fecha_nacimiento: string;
  contraseña: string;
  telefono: string;
  correo: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (correo: string, contraseña: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (database: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ==================== PROVIDER ====================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar sesión al cargar
  const checkSession = useCallback(async () => {
    try {
      const response = await fetchAPI<{ success: boolean; data: User }>('/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Configurar refresh automático cada 10 minutos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [user]);

  const login = async (correo: string, contraseña: string) => {
    try {
      const response = await fetchAPI<{ success: boolean; data: User; message: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ correo, contraseña }),
        }
      );

      if (!response.success || !response.data) {
        throw new Error('El servidor no devolvió los datos del usuario');
      }

      setUser(response.data);

      toast({
        title: '¡Bienvenido!',
        description: `Has iniciado sesión como ${response.data.nombre}`,
      });

      navigate('/main');
    } catch (error) {
      console.error('Error en login:', error);
      toast({
        title: 'Error de autenticación',
        description: error instanceof Error ? error.message : 'Credenciales inválidas',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetchAPI<{ success: boolean; data: User; message: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (!response.success || !response.data) {
        throw new Error('El servidor no devolvió los datos del usuario');
      }

      setUser({
        userId: response.data.userId,
        nombre: response.data.nombre,
        correo: response.data.correo,
        tipo_usuario: response.data.tipo_usuario,
        organizaciones: [{
          nombre: response.data.organizacionActiva?.nombre || data.organizacion,
          database: response.data.organizacionActiva?.database || '',
          rol: response.data.tipo_usuario,
        }],
        organizacionActiva: response.data.organizacionActiva,
      });

      toast({
        title: '¡Cuenta creada exitosamente!',
        description: `Bienvenido ${response.data.nombre}, tu organización ha sido creada`,
      });

      navigate('/main');
    } catch (error) {
      console.error('Error en registro:', error);
      toast({
        title: 'Error de registro',
        description: error instanceof Error ? error.message : 'Error al crear la cuenta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUser(null);
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
      navigate('/');
    }
  };

  const switchOrganization = async (database: string) => {
    try {
      const response = await fetchAPI<{
        success: boolean;
        message: string;
        data: { organizacionActiva: { nombre: string; database: string } };
      }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ database }),
      });

      if (response.success && response.data) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                organizacionActiva: response.data.organizacionActiva,
                tipo_usuario: prev.organizaciones.find(o => o.database === database)?.rol || prev.tipo_usuario,
              }
            : null
        );

        toast({
          title: 'Organización cambiada',
          description: `Ahora estás en ${response.data.organizacionActiva.nombre}`,
        });
      }
    } catch (error) {
      console.error('Error cambiando organización:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar de organización',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchOrganization,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
