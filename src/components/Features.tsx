import { FileText, Users, Shield } from "lucide-react";
import { Card } from "./ui/card";

const features = [
  {
    icon: FileText,
    title: "Procesamiento Inteligente",
    description: "Carga PDFs y XMLs. Extrae información fiscal automáticamente.",
  },
  {
    icon: Users,
    title: "Gestión de Clientes",
    description: "Organiza la información de tus contribuyentes de forma eficiente.",
  },
  {
    icon: Shield,
    title: "Seguridad Garantizada",
    description: "Protección de datos con los más altos estándares de seguridad.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
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
