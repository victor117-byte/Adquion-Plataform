import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - Componente para proteger rutas que requieren autenticación
 * 
 * Funcionalidades:
 * - Verifica si el usuario está autenticado
 * - Muestra loader mientras se verifica la sesión
 * - Redirige al login si no hay sesión
 * - Guarda la ruta original para redirigir después del login
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loader mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    // Guardar la ruta original para redirigir después del login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Usuario autenticado, mostrar el contenido
  return <>{children}</>;
}
