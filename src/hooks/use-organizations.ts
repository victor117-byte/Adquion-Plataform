import { useAuth, Organizacion } from '@/contexts/AuthContext';

/**
 * Hook para manejar organizaciones del usuario
 * Encapsula la lógica de cambio de organización del AuthContext
 */
export function useOrganizations() {
  const { user, switchOrganization } = useAuth();

  const organizaciones: Organizacion[] = user?.organizaciones || [];
  const orgActiva = user?.organizacionActiva || null;
  const tieneMultiplesOrgs = organizaciones.length > 1;

  return {
    organizaciones,
    orgActiva,
    tieneMultiplesOrgs,
    switchOrganization,
    rolActual: user?.tipo_usuario,
  };
}
