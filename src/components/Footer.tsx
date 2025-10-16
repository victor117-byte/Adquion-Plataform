import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Adquion</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Automatización fiscal con IA. Scraping SAT, notificaciones inteligentes 
              y reportes en tiempo real para contadores profesionales.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Compañía</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Adquion. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
