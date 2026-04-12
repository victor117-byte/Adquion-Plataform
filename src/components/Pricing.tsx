import { Check, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

const plans = [
  {
    name: "Basic",
    price: "$0",
    priceReal: null,
    period: "/mes",
    description: "Perfecto para comenzar",
    features: [
      "Límite de 50 archivos",
      "1 Ejecución de automatización (SAT)",
      "Acceso solo a Dashboard",
      "Acceso seguro",
      "Archivos de aclaración del contador",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Gratis",
    priceReal: "$49",
    period: "/mes",
    description: "Para contadores profesionales",
    features: [
      "1 GB de almacenamiento",
      "5 usuarios (Contadores)",
      "Reportes de clientes",
      "Dashboard completo",
      "Auto-refresh (Automatización)",
      "3 ejecuciones programadas por día",
      "Notificaciones (WhatsApp / Email)",
      "30 clientes",
      "Integraciones (SAT)",
    ],
    cta: "Comenzar Gratis",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Gratis",
    priceReal: "$99",
    period: "/mes",
    description: "Para equipos en crecimiento",
    features: [
      "7 GB de almacenamiento",
      "10 usuarios (Contadores)",
      "Reportes de clientes",
      "Dashboard con KPI Contadores",
      "Auto-refresh (Automatización)",
      "3 ejecuciones programadas por día",
      "Notificaciones (WhatsApp / Email)",
      "150 clientes",
      "Integraciones (SAT)",
      "Agente IA personalizado",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-block mb-3">
            <span className="text-sm font-semibold tracking-wider uppercase text-primary">Planes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Precios simples y transparentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde automatización básica hasta agentes IA personalizados.
            Elige el plan que mejor se adapte a tu negocio.
          </p>
        </div>

        {/* Banner de lanzamiento */}
        <div className="flex items-center justify-center gap-3 mb-10 p-4 rounded-2xl bg-primary/10 border border-primary/20 max-w-2xl mx-auto">
          <Rocket className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">
            <span className="font-bold">Lanzamiento gratuito</span> — Todos los planes son gratuitos durante el periodo de lanzamiento. Los precios reales se activarán próximamente.
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

                <div className="flex flex-col items-center gap-1">
                  {/* Precio real tachado */}
                  {plan.priceReal && (
                    <div className="flex items-baseline gap-1 text-muted-foreground">
                      <span className="text-xl line-through">{plan.priceReal}</span>
                      <span className="text-sm line-through">{plan.period}</span>
                    </div>
                  )}
                  {/* Precio de lanzamiento */}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    {plan.price !== "Gratis" && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  {plan.priceReal && (
                    <Badge variant="outline" className="text-primary border-primary/40 text-xs mt-1">
                      Durante el lanzamiento
                    </Badge>
                  )}
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

        <p className="text-center text-sm text-muted-foreground mt-8">
          Puedes registrarte sin tarjeta de crédito. Los precios reales se comunicarán con anticipación.
        </p>
      </div>
    </section>
  );
};
