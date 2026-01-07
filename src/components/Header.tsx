import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Adquion
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">
                  {user.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.organizacion}
                </span>
              </div>
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
