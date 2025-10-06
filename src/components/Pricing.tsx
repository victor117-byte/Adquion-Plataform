import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const plans = [
  {
    name: "Gratuito",
    price: "$0",
    period: "/mes",
    description: "Ideal para empezar",
    features: [
      "10 documentos por mes",
      "1 usuario",
      "Soporte por email",
      "Almacenamiento básico",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mes",
    description: "Para contadores profesionales",
    features: [
      "500 documentos por mes",
      "5 usuarios",
      "Soporte prioritario",
      "Almacenamiento ampliado",
      "Integraciones API",
      "Reportes avanzados",
    ],
    cta: "Comenzar Prueba",
    highlighted: true,
  },
  {
    name: "Empresarial",
    price: "$199",
    period: "/mes",
    description: "Para equipos grandes",
    features: [
      "Documentos ilimitados",
      "Usuarios ilimitados",
      "Soporte 24/7",
      "Almacenamiento ilimitado",
      "Integraciones personalizadas",
      "Gestor de cuenta dedicado",
      "SLA garantizado",
    ],
    cta: "Contactar Ventas",
    highlighted: false,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Planes que se adaptan a ti
          </h2>
          <p className="text-lg text-muted-foreground">
            Elige el plan perfecto para tus necesidades
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative hover-lift ${
                plan.highlighted
                  ? "border-2 border-primary shadow-lg"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/auth?mode=signup">
                <Button
                  variant={plan.highlighted ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
