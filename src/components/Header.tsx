import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Acquisitions</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/#features" className="text-sm font-medium hover:text-primary transition-colors">
            Características
          </Link>
          <Link to="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Planes
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
          )}
        </nav>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="sm">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
