import { useState } from 'react';
import {
  Check,
  Loader2,
  Sparkles,
  Zap,
  Building2,
  CreditCard,
  ExternalLink,
  FileText,
  Users,
  HardDrive,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription, Plan } from '@/hooks/use-subscription';
import { useUsage, LimitStatus, FeatureStatus } from '@/hooks/use-usage';
import { cn } from '@/lib/utils';

// ==================== ICONOS ====================

const resourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  files: FileText,
  sat_automations: Zap,
  users: Users,
  clients: Building2,
  storage: HardDrive,
  scheduled_executions: Calendar,
};

export function SubscriptionSection() {
  const {
    subscription,
    plans,
    loading: subLoading,
    upgradePlan,
    openBillingPortal,
    cancelSubscription,
    reactivateSubscription,
    isFree,
  } = useSubscription();

  const { usage, loading: usageLoading } = useUsage();

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setProcessingPlan(planId);
    try {
      await upgradePlan(planId);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    setProcessingAction('portal');
    try {
      await openBillingPortal();
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancel = async () => {
    setProcessingAction('cancel');
    try {
      await cancelSubscription();
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReactivate = async () => {
    setProcessingAction('reactivate');
    try {
      await reactivateSubscription();
    } finally {
      setProcessingAction(null);
    }
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic_free':
        return Sparkles;
      case 'pro':
        return Zap;
      case 'business':
        return Building2;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isFree ? 'Planes y Suscripción' : 'Mi Suscripción'}
        </h2>
        <p className="text-muted-foreground">
          {isFree
            ? 'Elige el plan que mejor se adapte a las necesidades de tu empresa'
            : 'Gestiona tu suscripción y consulta el uso de tu cuenta'}
        </p>
      </div>

      {/* Estado actual de suscripción */}
      {subscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tu plan actual</CardTitle>
                <CardDescription>
                  {subscription.plan_name}
                  {subscription.cancel_at_period_end && (
                    <span className="text-warning ml-2">(Se cancelará pronto)</span>
                  )}
                </CardDescription>
              </div>
              <Badge
                variant={subscription.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {subscription.status === 'active' ? 'Activo' : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          {!isFree && subscription.current_period_end && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end
                  ? `Acceso hasta: ${new Date(subscription.current_period_end).toLocaleDateString('es-MX', { dateStyle: 'long' })}`
                  : `Próxima facturación: ${new Date(subscription.current_period_end).toLocaleDateString('es-MX', { dateStyle: 'long' })}`}
              </p>
            </CardContent>
          )}
          {!isFree && (
            <CardFooter className="gap-2 pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPortal}
                disabled={processingAction === 'portal'}
              >
                {processingAction === 'portal' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Gestionar facturación
              </Button>
              {subscription.cancel_at_period_end ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={processingAction === 'reactivate'}
                  className="text-success hover:text-success/80"
                >
                  {processingAction === 'reactivate' && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Reactivar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={processingAction === 'cancel'}
                  className="text-destructive hover:text-destructive"
                >
                  {processingAction === 'cancel' && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Cancelar suscripción
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {/* Sección de Uso y Límites - Solo para usuarios con suscripción de pago */}
      {!isFree && (
        <>
          <Separator />
          <UsageLimitsSection usage={usage} loading={usageLoading} />
        </>
      )}

      {/* Grid de planes - Solo mostrar para usuarios Free */}
      {isFree && (
        <>
          <Separator />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isProcessing={processingPlan === plan.id}
                onUpgrade={() => handleUpgrade(plan.id)}
                icon={getPlanIcon(plan.id)}
              />
            ))}
          </div>

          {/* Notas */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Todos los precios están en MXN e incluyen IVA.</p>
            <p>Puedes cancelar tu suscripción en cualquier momento.</p>
          </div>
        </>
      )}

      {/* Opción de cambiar de plan para usuarios de pago */}
      {!isFree && (
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">¿Necesitas más capacidad?</h3>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu plan para obtener más recursos y funcionalidades
                </p>
              </div>
              <Button variant="outline" onClick={handleOpenPortal} disabled={processingAction === 'portal'}>
                {processingAction === 'portal' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Ver opciones de plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== USO Y LÍMITES ====================

interface UsageLimitsSectionProps {
  usage: ReturnType<typeof useUsage>['usage'];
  loading: boolean;
}

function UsageLimitsSection({ usage, loading }: UsageLimitsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  // Separar límites con restricción y sin restricción
  const limitedResources = usage.limits.filter((l) => !l.isUnlimited);
  const unlimitedResources = usage.limits.filter((l) => l.isUnlimited);

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div>
        <h3 className="text-lg font-semibold">Uso de tu cuenta</h3>
        <p className="text-sm text-muted-foreground">
          Monitorea el consumo de recursos de tu organización
        </p>
      </div>

      {/* Advertencias si hay */}
      {usage.hasWarnings && usage.warnings.length > 0 && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-warning-foreground">Atención</p>
                <ul className="mt-1 text-sm text-warning-foreground/80 space-y-1">
                  {usage.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de recursos limitados */}
      {limitedResources.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {limitedResources.map((limit) => (
            <LimitCard key={limit.resource} limit={limit} />
          ))}
        </div>
      )}

      {/* Recursos ilimitados */}
      {unlimitedResources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recursos ilimitados</CardTitle>
            <CardDescription>Estos recursos no tienen restricción en tu plan</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {unlimitedResources.map((limit) => {
                const Icon = resourceIcons[limit.resource] || FileText;
                return (
                  <div
                    key={limit.resource}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="p-2 rounded-md bg-success/10">
                      <Icon className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{limit.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {limit.current} {limit.unit} usados
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-success border-success/30">
                      Ilimitado
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {usage.features.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Funcionalidades</CardTitle>
            <CardDescription>Características incluidas en tu plan</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {usage.features.map((feature) => (
                <FeatureItem key={feature.feature} feature={feature} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== LIMIT CARD ====================

interface LimitCardProps {
  limit: LimitStatus;
}

function LimitCard({ limit }: LimitCardProps) {
  const Icon = resourceIcons[limit.resource] || FileText;
  const showAlert = limit.isAtLimit || limit.isNearLimit;

  return (
    <Card className={cn(limit.isAtLimit && 'border-destructive/50')}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-md',
                limit.isAtLimit
                  ? 'bg-destructive/10'
                  : limit.isNearLimit
                    ? 'bg-warning/10'
                    : 'bg-primary/10'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  limit.isAtLimit
                    ? 'text-destructive'
                    : limit.isNearLimit
                      ? 'text-warning'
                      : 'text-primary'
                )}
              />
            </div>
            <div>
              <p className="font-medium text-sm">{limit.label}</p>
              <p className="text-xs text-muted-foreground">{limit.unit}</p>
            </div>
          </div>
          {showAlert && (
            <AlertTriangle
              className={cn('h-4 w-4', limit.isAtLimit ? 'text-destructive' : 'text-warning')}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usado</span>
            <span
              className={cn(
                'font-medium',
                limit.isAtLimit && 'text-destructive',
                limit.isNearLimit && !limit.isAtLimit && 'text-warning'
              )}
            >
              {limit.displayValue}
            </span>
          </div>
          <Progress
            value={limit.percentage}
            className={cn(
              'h-2',
              limit.isAtLimit && '[&>div]:bg-destructive',
              limit.isNearLimit && !limit.isAtLimit && '[&>div]:bg-warning'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limit.percentage}% usado</span>
            {limit.remaining > 0 && <span>{limit.remaining} disponibles</span>}
            {limit.isAtLimit && <span className="text-destructive font-medium">Límite alcanzado</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== FEATURE ITEM ====================

interface FeatureItemProps {
  feature: FeatureStatus;
}

function FeatureItem({ feature }: FeatureItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md',
        feature.enabled ? 'bg-success/5' : 'bg-muted/50'
      )}
    >
      {feature.enabled ? (
        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className={cn('text-sm', !feature.enabled && 'text-muted-foreground')}>
        {feature.label}
      </span>
    </div>
  );
}

// ==================== PLAN CARD ====================

interface PlanCardProps {
  plan: Plan;
  isProcessing: boolean;
  onUpgrade: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

function PlanCard({ plan, isProcessing, onUpgrade, icon: Icon }: PlanCardProps) {
  const isFree = plan.price === 0;
  const isCurrentPlan = plan.is_current;

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-200',
        plan.is_popular && 'border-primary shadow-lg scale-[1.02]',
        isCurrentPlan && 'ring-2 ring-primary/50'
      )}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-md">Más popular</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">${plan.price.toLocaleString('es-MX')}</span>
          {!isFree && (
            <span className="text-muted-foreground text-sm ml-1">{plan.currency}/mes</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : plan.is_popular ? 'default' : 'outline'}
          disabled={isCurrentPlan || isFree || isProcessing}
          onClick={onUpgrade}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Procesando...
            </>
          ) : isCurrentPlan ? (
            'Plan actual'
          ) : isFree ? (
            'Plan gratuito'
          ) : (
            <>
              Actualizar
              <ExternalLink className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}