import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'accountant';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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
  const API_URL = 'http://localhost:8000/api';
  console.log('AuthContext - API URL:', API_URL);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      console.log('Verificando sesión, token:', token ? 'presente' : 'ausente');
      
      if (token) {
        try {
          console.log('Verificando token con la API...');
          // Verificar el token con la API usando el formato correcto Bearer con espacio
          const response = await fetch(`${API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Respuesta de verificación:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('Usuario verificado:', userData);
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          } else {
            console.log('Token no válido, eliminando datos');
            // Si tenemos datos de usuario en localStorage, podemos usarlos temporalmente
            const cachedUserData = localStorage.getItem('user_data');
            if (cachedUserData) {
              try {
                const parsedUserData = JSON.parse(cachedUserData);
                setUser(parsedUserData);
                console.log('Usando datos de usuario en caché:', parsedUserData);
              } catch (e) {
                console.error('Error al parsear datos de usuario en caché');
              }
            }
            
            // Token no válido, eliminar datos
            // localStorage.removeItem('auth_token');
            // localStorage.removeItem('user_data');
          }
        } catch (error) {
          console.error('Error al verificar sesión:', error);
          // localStorage.removeItem('auth_token');
          // localStorage.removeItem('user_data');
          
          // Si tenemos datos de usuario en localStorage, podemos usarlos temporalmente
          const cachedUserData = localStorage.getItem('user_data');
          if (cachedUserData) {
            try {
              const parsedUserData = JSON.parse(cachedUserData);
              setUser(parsedUserData);
              console.log('Usando datos de usuario en caché durante error:', parsedUserData);
            } catch (e) {
              console.error('Error al parsear datos de usuario en caché');
            }
          }
        }
      }
      
      setLoading(false);
    };

    checkSession();
  }, [API_URL]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      console.log('Login exitoso, datos recibidos:', data);
      
      // Guardar token y datos de usuario
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
      } else if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else {
        console.error('No se encontró un token en la respuesta', data);
        throw new Error('No se recibió un token de autenticación válido');
      }
      
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      setUser(data.user);
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al iniciar sesión",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // El endpoint de registro según las instrucciones espera: email, password y role
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          role: 'user' // Asignamos rol por defecto
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Error al registrarse');
      }

      const data = await response.json();
      
      // Si la API devuelve token en el registro, lo guardamos
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }
      
      setUser(data.user);
      
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada exitosamente",
      });
      
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
    console.log('Cerrando sesión, eliminando token y datos de usuario');
    localStorage.removeItem('auth_token');
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
        headers: {
          'Content-Type': 'application/json',
        },
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
