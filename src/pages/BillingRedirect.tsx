import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * Componente que maneja las redirecciones desde Stripe Checkout
 *
 * URLs que maneja:
 * - /dashboard/billing?success=true&session_id=xxx -> Pago exitoso
 * - /dashboard/billing?canceled=true -> Pago cancelado
 */
export default function BillingRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Pago exitoso',
        description: 'Tu suscripción ha sido actualizada correctamente',
      });
    } else if (canceled === 'true') {
      toast({
        title: 'Pago cancelado',
        description: 'El proceso de pago fue cancelado',
        variant: 'destructive',
      });
    }

    // Redirigir a la sección de planes en /main
    // Usamos un pequeño delay para que el toast se muestre
    const timer = setTimeout(() => {
      navigate('/main?section=subscription', { replace: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Procesando...</p>
      </div>
    </div>
  );
}
