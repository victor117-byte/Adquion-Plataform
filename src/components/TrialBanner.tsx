import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * TrialBanner - Banner informativo sobre el estado del trial
 * 
 * Muestra:
 * - Días restantes del trial si está activo
 * - Mensaje de upgrade si el trial expiró
 * - Botón para actualizar plan
 */
export function TrialBanner() {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  // No mostrar si no hay usuario o no hay información de suscripción
  if (!user || !subscriptionStatus) return null;

  // Usuario con suscripción de pago activa (plan diferente de 'free')
  // NO mostrar banner si tiene un plan de pago (pro, premium, business, enterprise)
  // Verificar si tiene un plan de pago independientemente del estado de trial
  const paidPlans = ['pro', 'premium', 'business', 'enterprise'];
  const hasPaidPlan = paidPlans.includes(subscriptionStatus.plan) && 
                      subscriptionStatus.status === 'active';
  
  if (hasPaidPlan) {
    return null;
  }

  // Usuario con suscripción activa pero no en trial (ej: plan free después del trial)
  if (!subscriptionStatus.is_trial && subscriptionStatus.can_access_features) {
    return null;
  }

  // Trial activo (plan free con trial)
  if (subscriptionStatus.is_trial && subscriptionStatus.days_remaining > 0) {
    const daysLeft = subscriptionStatus.days_remaining;
    const isLowDays = daysLeft <= 7;

    return (
      <Alert className={`mb-6 ${isLowDays ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
        <div className="flex items-center w-full">
          <Clock className={`h-4 w-4 mr-3 flex-shrink-0 ${isLowDays ? 'text-orange-600' : 'text-blue-600'}`} />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className={isLowDays ? 'text-orange-800' : 'text-blue-800'}>
              <strong>Trial activo:</strong> {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes
            </span>
            <Button
              variant={isLowDays ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigate('/onboarding')}
              className={isLowDays ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Actualizar ahora
            </Button>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Trial expirado
  if (!subscriptionStatus.can_access_features) {
    return (
      <Alert className="mb-6 border-red-500 bg-red-50">
        <div className="flex items-center w-full">
          <Clock className="h-4 w-4 mr-3 flex-shrink-0 text-red-600" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="text-red-800">
              <strong>Tu período de prueba ha expirado.</strong> Actualiza tu plan para continuar usando todas las funcionalidades.
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/onboarding')}
              className="bg-red-600 hover:bg-red-700 ml-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ver planes
            </Button>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
}
