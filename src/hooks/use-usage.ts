import { useState, useEffect, useCallback } from 'react';
import { get } from '@/utils/api';

// ==================== TIPOS ====================

export interface LimitStatus {
  resource: string;
  label: string;
  unit: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean;
  remaining: number;
  displayValue: string;
}

export interface FeatureStatus {
  feature: string;
  label: string;
  enabled: boolean;
}

export interface QuickStats {
  totalLimits: number;
  atLimit: number;
  nearLimit: number;
  unlimited: number;
  enabledFeatures: number;
  totalFeatures: number;
}

export interface UsageData {
  organization: string;
  database: string;
  planId: string;
  planName: string;
  limits: LimitStatus[];
  features: FeatureStatus[];
  warnings: string[];
  hasWarnings: boolean;
  quickStats: QuickStats;
}

interface UsageResponse {
  success: boolean;
  data: UsageData;
}

interface UsageSummary {
  resource: string;
  current: number;
  limit: number;
  percentage: number;
}

interface UsageSummaryResponse {
  success: boolean;
  data: {
    organization: string;
    database: string;
    summary: UsageSummary[];
  };
}

// ==================== HOOK ====================

export function useUsage(options?: { summary?: boolean }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = options?.summary ? '/usage?summary=true' : '/usage';
      const response = await get<UsageResponse | UsageSummaryResponse>(endpoint);

      if (response.success) {
        // Si es summary, convertimos a formato completo para mantener consistencia
        if (options?.summary && 'summary' in response.data) {
          const summaryData = response.data as UsageSummaryResponse['data'];
          setUsage({
            organization: summaryData.organization,
            database: summaryData.database,
            planId: '',
            planName: '',
            limits: summaryData.summary.map((s) => ({
              resource: s.resource,
              label: s.resource,
              unit: '',
              current: s.current,
              limit: s.limit,
              percentage: s.percentage,
              isUnlimited: s.limit === -1,
              isAtLimit: s.limit !== -1 && s.current >= s.limit,
              isNearLimit: s.percentage >= 80,
              remaining: s.limit === -1 ? -1 : s.limit - s.current,
              displayValue: s.limit === -1 ? `${s.current} (ilimitado)` : `${s.current} / ${s.limit}`,
            })),
            features: [],
            warnings: [],
            hasWarnings: false,
            quickStats: {
              totalLimits: summaryData.summary.length,
              atLimit: 0,
              nearLimit: 0,
              unlimited: 0,
              enabledFeatures: 0,
              totalFeatures: 0,
            },
          });
        } else {
          setUsage(response.data as UsageData);
        }
      } else {
        setError('Error al cargar datos de uso');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos de uso';
      setError(message);
      console.error('Error fetching usage:', err);
    } finally {
      setLoading(false);
    }
  }, [options?.summary]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // ==================== HELPERS ====================

  /**
   * Verifica si se puede crear un recurso (no está en el límite)
   */
  const canCreate = useCallback(
    (resource: string): boolean => {
      const limit = usage?.limits.find((l) => l.resource === resource);
      if (!limit) return true; // Si no hay límite definido, permitir
      return !limit.isAtLimit;
    },
    [usage]
  );

  /**
   * Obtiene el estado de un límite específico
   */
  const getLimit = useCallback(
    (resource: string): LimitStatus | undefined => {
      return usage?.limits.find((l) => l.resource === resource);
    },
    [usage]
  );

  /**
   * Verifica si una feature está habilitada
   */
  const hasFeature = useCallback(
    (feature: string): boolean => {
      return usage?.features.find((f) => f.feature === feature)?.enabled ?? false;
    },
    [usage]
  );

  /**
   * Obtiene todos los límites que están cerca o en el límite
   */
  const getCriticalLimits = useCallback((): LimitStatus[] => {
    return usage?.limits.filter((l) => l.isAtLimit || l.isNearLimit) ?? [];
  }, [usage]);

  /**
   * Verifica si hay algún recurso en el límite
   */
  const hasAnyAtLimit = useCallback((): boolean => {
    return usage?.limits.some((l) => l.isAtLimit) ?? false;
  }, [usage]);

  /**
   * Verifica si hay algún recurso cerca del límite
   */
  const hasAnyNearLimit = useCallback((): boolean => {
    return usage?.limits.some((l) => l.isNearLimit && !l.isAtLimit) ?? false;
  }, [usage]);

  return {
    usage,
    loading,
    error,
    refresh: fetchUsage,
    // Helpers
    canCreate,
    getLimit,
    hasFeature,
    getCriticalLimits,
    hasAnyAtLimit,
    hasAnyNearLimit,
  };
}

// ==================== RESOURCE MAPPING ====================

/**
 * Mapeo de recursos a iconos y colores para UI
 */
export const resourceConfig: Record<
  string,
  {
    icon: string;
    color: string;
    description: string;
  }
> = {
  files: {
    icon: 'FileText',
    color: 'text-blue-500',
    description: 'Archivos subidos',
  },
  sat_automations: {
    icon: 'Zap',
    color: 'text-yellow-500',
    description: 'Automatizaciones del SAT configuradas',
  },
  users: {
    icon: 'Users',
    color: 'text-green-500',
    description: 'Usuarios en tu organización',
  },
  clients: {
    icon: 'Building2',
    color: 'text-purple-500',
    description: 'Contribuyentes registrados',
  },
  storage: {
    icon: 'HardDrive',
    color: 'text-orange-500',
    description: 'Espacio de almacenamiento usado',
  },
  scheduled_executions: {
    icon: 'Calendar',
    color: 'text-cyan-500',
    description: 'Ejecuciones programadas del día',
  },
};

// ==================== FEATURE MAPPING ====================

/**
 * Mapeo de features a descripciones para UI
 */
export const featureConfig: Record<
  string,
  {
    icon: string;
    description: string;
    upgradePlan: string;
  }
> = {
  full_dashboard: {
    icon: 'LayoutDashboard',
    description: 'Acceso al dashboard completo con métricas avanzadas',
    upgradePlan: 'Pro',
  },
  whatsapp_notifications: {
    icon: 'MessageCircle',
    description: 'Recibe notificaciones por WhatsApp',
    upgradePlan: 'Pro',
  },
  ai_agent: {
    icon: 'Bot',
    description: 'Asistente de IA para automatizar tareas',
    upgradePlan: 'Business',
  },
};