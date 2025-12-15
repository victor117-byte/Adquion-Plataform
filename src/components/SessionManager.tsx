import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * SessionManager - Gestión automática de sesión
 * 
 * Funcionalidades:
 * - Verifica sesión al cargar la aplicación
 * - Refresca el token automáticamente cada 25 minutos
 * - Refresca el token después de 5 minutos de inactividad
 * - Maneja errores de sesión y redirige al login si es necesario
 */
export function SessionManager({ children }: { children: React.ReactNode }) {
  const { verifyAndRestoreSession, refreshAuthToken } = useAuth();

  useEffect(() => {
    // Verificar sesión al montar el componente
    verifyAndRestoreSession();

    // Refrescar token cada 25 minutos (tokens expiran en 30 min)
    const refreshInterval = setInterval(() => {
      refreshAuthToken();
    }, 25 * 60 * 1000);

    // Refrescar al detectar actividad después de inactividad
    let activityTimer: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        refreshAuthToken();
      }, 5 * 60 * 1000); // 5 minutos de inactividad
    };

    // Escuchar eventos de actividad del usuario
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Iniciar timer de actividad
    handleActivity();

    // Cleanup al desmontar
    return () => {
      clearInterval(refreshInterval);
      clearTimeout(activityTimer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [verifyAndRestoreSession, refreshAuthToken]);

  return <>{children}</>;
}
