import { useState } from 'react';
import { Check, Loader2, Sparkles, Zap, Building2, CreditCard, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription, Plan } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

export function SubscriptionSection() {
  const {
    subscription,
    plans,
    loading,
    upgradePlan,
    openBillingPortal,
    cancelSubscription,
    reactivateSubscription,
    isFree,
  } = useSubscription();

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

  if (loading) {
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
        <h2 className="text-2xl font-bold tracking-tight">Planes y Suscripción</h2>
        <p className="text-muted-foreground">
          Elige el plan que mejor se adapte a las necesidades de tu empresa
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
                    <span className="text-warning ml-2">
                      (Se cancelará pronto)
                    </span>
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

      <Separator />

      {/* Grid de planes */}
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
          <Badge className="bg-primary text-primary-foreground shadow-md">
            Más popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">
            ${plan.price.toLocaleString('es-MX')}
          </span>
          {!isFree && (
            <span className="text-muted-foreground text-sm ml-1">
              {plan.currency}/mes
            </span>
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
