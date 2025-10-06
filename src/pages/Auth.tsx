import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar autenticación con Lovable Cloud
    console.log("Login:", { email, password });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar registro con Lovable Cloud
    console.log("Signup:", { name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">Acquisitions</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {mode === "signup" ? "Crear cuenta" : "Bienvenido de nuevo"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "signup"
              ? "Comienza a gestionar tu información fiscal"
              : "Ingresa a tu cuenta para continuar"}
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue={mode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <a href="#" className="text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg">
                  Iniciar Sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg">
                  Crear Cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Al continuar, aceptas nuestros{" "}
              <a href="#" className="text-primary hover:underline">
                Términos de Servicio
              </a>{" "}
              y{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidad
              </a>
            </p>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
