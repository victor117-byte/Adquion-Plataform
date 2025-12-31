import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-5xl text-center">
        <div className="inline-block mb-4 animate-fade-in">
          <span className="text-sm font-semibold tracking-wider uppercase text-primary">Adquion Platform</span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up leading-tight">
          Automatización Fiscal{" "}
          <span className="text-gradient">Inteligente</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in">
          Plataforma SaaS completa para contadores. Integraciones SAT, scraping automático, 
          notificaciones y reportes en tiempo real.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="lg" className="group">
              Comenzar Gratis
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => scrollToSection('pricing')}
          >
            Ver Planes
          </Button>
        </div>
      </div>
    </section>
  );
};
