import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onLimitExceeded, LimitExceededError } from '@/utils/api';
import { useSubscription } from '@/hooks/use-subscription';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, Sparkles } from 'lucide-react';

// ==================== TIPOS ====================

interface UpgradeModalState {
  isOpen: boolean;
  message: string;
  current: number;
  limit: number;
  resource?: string;
}

interface UpgradePlanContextValue {
  showUpgradeModal: (data: Omit<UpgradeModalState, 'isOpen'>) => void;
  hideUpgradeModal: () => void;
  isModalOpen: boolean;
}

// ==================== CONTEXTO ====================

const UpgradePlanContext = createContext<UpgradePlanContextValue | null>(null);

// ==================== PROVIDER ====================

interface UpgradePlanProviderProps {
  children: ReactNode;
}

export function UpgradePlanProvider({ children }: UpgradePlanProviderProps) {
  const { upgradePlan, plans, subscription } = useSubscription();
  const [modalState, setModalState] = useState<UpgradeModalState>({
    isOpen: false,
    message: '',
    current: 0,
    limit: 0,
  });
  const [upgrading, setUpgrading] = useState(false);

  // Suscribirse a eventos de límite excedido desde la API
  useEffect(() => {
    const unsubscribe = onLimitExceeded((error: LimitExceededError) => {
      setModalState({
        isOpen: true,
        message: error.message,
        current: error.current,
        limit: error.limit,
        resource: error.resource,
      });
    });

    return unsubscribe;
  }, []);

  const showUpgradeModal = useCallback((data: Omit<UpgradeModalState, 'isOpen'>) => {
    setModalState({
      isOpen: true,
      ...data,
    });
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Encontrar el siguiente plan disponible para upgrade
  const getNextPlan = () => {
    if (!subscription || !plans.length) return null;

    const currentPlanIndex = plans.findIndex((p) => p.id === subscription.plan_id);
    if (currentPlanIndex === -1 || currentPlanIndex >= plans.length - 1) {
      // Ya está en el plan más alto o no se encontró
      return plans.find((p) => p.id !== subscription.plan_id && !p.is_current);
    }
    return plans[currentPlanIndex + 1];
  };

  const handleUpgrade = async () => {
    const nextPlan = getNextPlan();
    if (!nextPlan) return;

    setUpgrading(true);
    try {
      await upgradePlan(nextPlan.id);
    } finally {
      setUpgrading(false);
    }
  };

  const nextPlan = getNextPlan();
  const percentage = modalState.limit > 0 ? Math.min(100, (modalState.current / modalState.limit) * 100) : 100;

  return (
    <UpgradePlanContext.Provider value={{ showUpgradeModal, hideUpgradeModal, isModalOpen: modalState.isOpen }}>
      {children}

      {/* Modal de Upgrade */}
      <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && hideUpgradeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Límite alcanzado</span>
            </div>
            <DialogTitle className="text-xl">{modalState.message}</DialogTitle>
            <DialogDescription className="pt-2">
              Has alcanzado el límite de tu plan actual. Actualiza tu plan para continuar creando recursos.
            </DialogDescription>
          </DialogHeader>

          {/* Barra de progreso visual */}
          <div className="py-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Uso actual</span>
              <span className="font-medium text-destructive">
                {modalState.current} / {modalState.limit}
              </span>
            </div>
            <Progress value={percentage} className="h-2 [&>div]:bg-destructive" />
          </div>

          {/* Info del plan recomendado */}
          {nextPlan && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-semibold">Plan {nextPlan.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Obtén más capacidad y desbloquea nuevas funcionalidades
              </p>
              <ul className="text-sm space-y-1">
                {nextPlan.limits.max_users > 0 && nextPlan.limits.max_users !== -1 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Hasta {nextPlan.limits.max_users} usuarios
                  </li>
                )}
                {nextPlan.limits.max_clients > 0 && nextPlan.limits.max_clients !== -1 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Hasta {nextPlan.limits.max_clients} contribuyentes
                  </li>
                )}
                {nextPlan.limits.storage_mb > 0 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {nextPlan.limits.storage_mb >= 1024
                      ? `${(nextPlan.limits.storage_mb / 1024).toFixed(0)} GB`
                      : `${nextPlan.limits.storage_mb} MB`}{' '}
                    de almacenamiento
                  </li>
                )}
                {nextPlan.limits.max_files === -1 && (
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Archivos ilimitados
                  </li>
                )}
              </ul>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={hideUpgradeModal}>
              Ahora no
            </Button>
            {nextPlan && (
              <Button onClick={handleUpgrade} disabled={upgrading}>
                {upgrading ? (
                  'Procesando...'
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Actualizar a {nextPlan.name}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradePlanContext.Provider>
  );
}

// ==================== HOOK ====================

export function useUpgradePlan() {
  const context = useContext(UpgradePlanContext);
  if (!context) {
    throw new Error('useUpgradePlan debe usarse dentro de UpgradePlanProvider');
  }
  return context;
}