import { FileText, Users, Shield } from "lucide-react";
import { Card } from "./ui/card";

const features = [
  {
    icon: FileText,
    title: "Automatización SAT",
    description: "Scraping automático de documentos fiscales con ejecuciones programadas diarias.",
  },
  {
    icon: Users,
    title: "Gestión Multicliente",
    description: "Administra hasta 150 clientes con dashboards personalizados y KPIs en tiempo real.",
  },
  {
    icon: Shield,
    title: "Notificaciones Inteligentes",
    description: "Alertas por WhatsApp y Email. Mantén a tus clientes informados automáticamente.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-block mb-3">
            <span className="text-sm font-semibold tracking-wider uppercase text-primary">Características</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para automatizar
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 text-center hover-lift border-border bg-card"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-6">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
