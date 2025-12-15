import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import type { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, company: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyAndRestoreSession: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  subscriptionStatus: api.SubscriptionStatus | null;
  refreshSubscriptionStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<api.SubscriptionStatus | null>(null);
  const navigate = useNavigate();

  // Verificar y restaurar sesión desde localStorage
  const verifyAndRestoreSession = useCallback(async () => {
    setLoading(true);
    try {
      // Intentar obtener usuario del localStorage primero
      const storedUser = api.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Verificar sesión con el backend
      if (api.isAuthenticated()) {
        const userData = await api.verifySession();
        setUser(userData);
        api.saveAuthData(localStorage.getItem('token')!, userData);
        
        // Obtener estado de suscripción
        await refreshSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      // Si falla la verificación, limpiar datos
      setUser(null);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar token de autenticación
  const refreshAuthToken = useCallback(async () => {
    if (!api.isAuthenticated()) return;

    try {
      const data = await api.refreshToken();
      api.saveAuthData(data.token, data.user);
      setUser(data.user);
      console.log('✅ Token refrescado exitosamente');
    } catch (error) {
      console.error('Error refrescando token:', error);
      // Si falla el refresh, cerrar sesión
      await logout();
    }
  }, []);

  // Refrescar estado de suscripción
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!api.isAuthenticated()) return;

    try {
      const status = await api.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error obteniendo estado de suscripción:', error);
    }
  }, []);

  useEffect(() => {
    verifyAndRestoreSession();
  }, [verifyAndRestoreSession]);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      
      // Guardar token y datos de usuario
      api.saveAuthData(data.token, data.user);
      setUser(data.user);
      
      // Obtener estado de suscripción
      await refreshSubscriptionStatus();
      
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión exitosamente${data.user.subscription.is_trial ? ` - ${data.user.subscription.days_remaining} días de trial restantes` : ''}`,
      });
      
      // Verificar si el trial expiró
      if (!data.user.can_access_features) {
        toast({
          title: "Trial expirado",
          description: "Tu período de prueba ha finalizado. Por favor, actualiza tu plan.",
          variant: "destructive",
        });
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al iniciar sesión",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, company: string) => {
    try {
      const data = await api.register(email, password, fullName, company);
      
      // Guardar token y datos de usuario
      api.saveAuthData(data.token, data.user);
      setUser(data.user);
      
      // Obtener estado de suscripción
      await refreshSubscriptionStatus();
      
      toast({
        title: "¡Cuenta creada!",
        description: `Trial de ${data.user.subscription.days_remaining} días activado automáticamente`,
      });
      
      // Redirigir al dashboard (trial ya está activo)
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrarse",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    
    setUser(null);
    setSubscriptionStatus(null);
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    try {
      // TODO: Implementar endpoint de reset password cuando esté disponible en el backend
      toast({
        title: "Funcionalidad no disponible",
        description: "El reset de contraseña estará disponible próximamente",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar correo",
        variant: "destructive",
      });
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
        resetPassword,
        verifyAndRestoreSession,
        refreshAuthToken,
        subscriptionStatus,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
