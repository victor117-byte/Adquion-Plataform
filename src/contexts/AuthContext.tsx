import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_usuario: 'administrador' | 'contador';
  organizacion: string;
  database: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (organizacion: string, correo: string, contraseña: string) => Promise<void>;
  register: (organizacion: string, nombre: string, correo: string, contraseña: string, telefono: string, fecha_nacimiento: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const navigate = useNavigate();

  // CONFIGURACIÓN DEL BACKEND
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Headers comunes para todas las peticiones (incluye bypass de ngrok)
  const getHeaders = (includeAuth = false) => {
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

  useEffect(() => {
    // Verificar sesión guardada localmente
    const checkSession = async () => {
      const userData = localStorage.getItem('user_data');
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error al parsear datos de usuario:', error);
          localStorage.removeItem('user_data');
        }
      }
      
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (organizacion: string, correo: string, contraseña: string) => {
    try {
      const payload = { organizacion, correo, contraseña };
      console.log('📤 Enviando login:', payload);
      console.log('🔗 URL:', `${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('📥 Respuesta status:', response.status);
      console.log('📥 Respuesta headers:', response.headers.get('content-type'));
      
      // Verificar si hay contenido en la respuesta
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        // Respuesta sin contenido o no es JSON
        console.log('⚠️ Respuesta sin contenido JSON');
        if (!response.ok) {
          throw new Error('Error al iniciar sesión: el servidor no devolvió datos');
        }
      } else {
        const text = await response.text();
        console.log('📥 Respuesta text:', text);
        
        if (text) {
          data = JSON.parse(text);
          console.log('📥 Respuesta data:', data);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Credenciales inválidas');
      }
      
      if (data && !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      if (!data || !data.data) {
        throw new Error('El servidor no devolvió los datos del usuario. Verifica que el backend esté funcionando correctamente.');
      }
      
      // Guardar datos de usuario (el backend no devuelve token, solo datos)
      localStorage.setItem('user_data', JSON.stringify(data.data));
      
      setUser(data.data);
      
      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${data.data.nombre}`,
      });
      
      // Redirigir al dashboard principal
      navigate('/main');
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Error al iniciar sesión",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (organizacion: string, nombre: string, correo: string, contraseña: string, telefono: string, fecha_nacimiento: string) => {
    try {
      const payload = { organizacion, nombre, correo, contraseña, telefono, fecha_nacimiento };
      console.log('📤 Enviando registro:', payload);
      console.log('🔗 URL:', `${API_URL}/auth/register`);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('📥 Respuesta status:', response.status);
      console.log('📥 Respuesta headers:', response.headers.get('content-type'));
      
      // Verificar si hay contenido en la respuesta
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        // Respuesta sin contenido o no es JSON
        console.log('⚠️ Respuesta sin contenido JSON');
        if (!response.ok) {
          throw new Error('Error al registrarse: el servidor no devolvió datos');
        }
      } else {
        const text = await response.text();
        console.log('📥 Respuesta text:', text);
        
        if (text) {
          data = JSON.parse(text);
          console.log('📥 Respuesta data:', data);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Error al registrarse');
      }
      
      if (data && !data.success) {
        throw new Error(data.message || 'Error al crear la cuenta');
      }
      
      if (!data || !data.data) {
        throw new Error('El servidor no devolvió los datos del usuario. Verifica que el backend esté funcionando correctamente.');
      }
      
      // Guardar datos de usuario
      localStorage.setItem('user_data', JSON.stringify(data.data));
      
      setUser(data.data);
      
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: `Bienvenido ${data.data.nombre}, tu organización ha sido creada`,
      });
      
      // Redirigir al dashboard principal
      navigate('/main');
    } catch (error) {
      console.error('❌ Error en registro:', error);
      toast({
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Error al crear la cuenta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('user_data');
    setUser(null);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar correo de recuperación');
      }

      toast({
        title: "Correo enviado",
        description: "Revisa tu correo para restablecer tu contraseña",
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
