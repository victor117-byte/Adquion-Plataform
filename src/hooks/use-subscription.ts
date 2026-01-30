import { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

// ==================== TIPOS ====================

export interface PlanLimits {
  max_files: number;
  max_sat_automations: number;
  max_users: number;
  max_clients: number;
  storage_mb: number;
  scheduled_executions_day: number;
  has_full_dashboard: boolean;
  has_whatsapp_notifications: boolean;
  has_ai_agent: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  stripe_price_id: string;
  limits: PlanLimits;
  features: string[];
  is_current: boolean;
  is_popular: boolean;
}

export interface Subscription {
  plan_id: string;
  plan_name: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  limits: PlanLimits;
  is_free: boolean;
  has_stripe_subscription: boolean;
}

interface PlansResponse {
  success: boolean;
  data: {
    plans: Plan[];
    billing_cycles: string[];
  };
}

interface SubscriptionResponse {
  success: boolean;
  data: Subscription;
}

interface CheckoutResponse {
  success: boolean;
  data: {
    checkout_url: string;
    session_id: string;
  };
}

interface PortalResponse {
  success: boolean;
  data: {
    portal_url: string;
  };
}

interface CancelResponse {
  success: boolean;
  message: string;
  data: {
    cancel_at_period_end: boolean;
    current_period_end: string;
  };
}

// ==================== HOOK ====================

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [subRes, plansRes] = await Promise.all([
        get<SubscriptionResponse>('/stripe/subscription'),
        get<PlansResponse>('/stripe/plans'),
      ]);

      if (subRes.success) {
        setSubscription(subRes.data);
      }
      if (plansRes.success) {
        setPlans(plansRes.data.plans);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando datos de suscripción';
      setError(message);
      console.error('Error cargando suscripción:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upgradePlan = async (planId: string) => {
    try {
      const response = await post<CheckoutResponse>('/stripe/checkout', { plan_id: planId });
      if (response.success && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const openBillingPortal = async () => {
    try {
      const response = await post<PortalResponse>('/stripe/portal');
      if (response.success && response.data.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al abrir el portal de facturación';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await post<CancelResponse>('/stripe/cancel');
      if (response.success) {
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                cancel_at_period_end: response.data.cancel_at_period_end,
              }
            : null
        );
        toast({
          title: 'Suscripción programada para cancelación',
          description: `Tu acceso continuará hasta ${new Date(response.data.current_period_end).toLocaleDateString()}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar la suscripción';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reactivateSubscription = async () => {
    try {
      const response = await post<CancelResponse>('/stripe/cancel', { reactivate: true });
      if (response.success) {
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                cancel_at_period_end: false,
              }
            : null
        );
        toast({
          title: 'Suscripción reactivada',
          description: 'Tu suscripción ha sido reactivada exitosamente',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reactivar la suscripción';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    subscription,
    plans,
    loading,
    error,
    upgradePlan,
    openBillingPortal,
    cancelSubscription,
    reactivateSubscription,
    refresh: loadData,
    isFree: subscription?.is_free ?? true,
    currentPlan: plans.find((p) => p.is_current),
  };
}

// ==================== UTILIDADES ====================

/**
 * Verifica si se puede realizar una acción según los límites del plan
 */
export function canPerformAction(
  limits: PlanLimits | undefined,
  action: keyof PlanLimits,
  currentCount?: number
): boolean {
  if (!limits) return false;

  const limit = limits[action];

  // Para booleanos (has_ai_agent, etc.)
  if (typeof limit === 'boolean') {
    return limit;
  }

  // Para números: -1 = ilimitado
  if (typeof limit === 'number') {
    if (limit === -1) return true;
    if (currentCount !== undefined) {
      return currentCount < limit;
    }
    return limit > 0;
  }

  return false;
}

/**
 * Calcula el porcentaje de uso de un límite
 */
export function getUsagePercentage(current: number, max: number): number {
  if (max === -1) return 0; // Ilimitado
  if (max === 0) return 100; // No permitido
  return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Determina si se debe mostrar una alerta de límite
 */
export function shouldShowLimitAlert(current: number, max: number, threshold = 80): boolean {
  if (max === -1) return false; // Ilimitado
  const percentage = getUsagePercentage(current, max);
  return percentage >= threshold;
}
