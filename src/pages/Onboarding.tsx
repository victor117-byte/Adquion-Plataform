import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentForm } from "@/components/PaymentForm";

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    priceId: 'free',
    description: 'Perfecto para empezar',
    icon: Zap,
    features: [
      'Límite de 50 archivos',
      '1 Ejecución de Automatización (SAT)',
      'Solo acceso al Dashboard',
      'Acceso seguro',
      'Archivos de aclaración contable'
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: 'price_pro_monthly',
    description: 'Para contadores profesionales',
    icon: TrendingUp,
    features: [
      '1 GB de almacenamiento',
      '5 Usuarios (Contadores)',
      'Reportes de clientes',
      'Dashboard completo',
      'Auto-actualización (Automatización)',
      '3 ejecuciones programadas por día',
      'Notificaciones (WhatsApp / Email)',
      '30 Clientes',
      'Integraciones (SAT)'
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    priceId: 'price_business_monthly',
    description: 'Para empresas en crecimiento',
    icon: Sparkles,
    features: [
      '7 GB de almacenamiento',
      '10 Usuarios (Contadores)',
      'Reportes de clientes',
      'Dashboard con KPIs',
      'Auto-actualización (Automatización)',
      '3 ejecuciones programadas por día',
      'Notificaciones (WhatsApp / Email)',
      '150 Clientes',
      'Integraciones (SAT)',
      'Agente IA personalizado'
    ],
    popular: false,
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    // Si es plan gratuito, ir directo al dashboard
    if (planId === 'basic') {
      navigate('/dashboard');
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    navigate('/dashboard');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        {!showPayment ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">
                ¡Bienvenido a <span className="text-gradient">Adquion</span>!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Selecciona el plan perfecto para tu negocio y comienza a automatizar tu gestión fiscal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.id}
                    className={`relative p-8 hover:shadow-xl transition-all ${
                      plan.popular
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-border'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Más Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-lg">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      className="w-full"
                      size="lg"
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {plan.price === 0 ? 'Comenzar Gratis' : 'Seleccionar Plan'}
                    </Button>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Decidir más tarde
              </Button>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Completa tu suscripción</h2>
              <p className="text-muted-foreground">
                Ingresa los datos de tu tarjeta para activar tu plan{' '}
                {plans.find(p => p.id === selectedPlan)?.name}
              </p>
            </div>

            <PaymentForm
              planName={plans.find(p => p.id === selectedPlan)?.name || 'Pro'}
              amount={plans.find(p => p.id === selectedPlan)?.price || 49}
              onSuccess={handlePaymentSuccess}
            />

            <div className="text-center mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowPayment(false)}
              >
                ← Volver a planes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
