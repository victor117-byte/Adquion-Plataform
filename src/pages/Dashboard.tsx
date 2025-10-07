import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, FileText, Users, Upload, Settings, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useDocuments } from "@/contexts/DocumentContext";
import { FileUpload } from "@/components/FileUpload";
import { DocumentList } from "@/components/DocumentList";
import { UserManagement } from "@/components/UserManagement";
import { PaymentForm } from "@/components/PaymentForm";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { documents, pagination, fetchDocuments } = useDocuments();
  const [activeTab, setActiveTab] = useState("overview");

  // Simplemente cambiar la pestaña activa, DocumentList maneja su propia carga
  const handleTabChange = (tab: string) => {
    console.log(`Cambiando a la pestaña: ${tab}`);
    setActiveTab(tab);
    // Ya no cargamos documentos aquí, lo hace el componente DocumentList
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = user.role === 'admin';
  return (
      <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Acquisitions</span>
        </div>
        
        <nav className="space-y-2">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => handleTabChange("overview")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant={activeTab === "upload" ? "default" : "ghost"} 
            className="w-full justify-start"
            onClick={() => handleTabChange("upload")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Cargar Archivos
          </Button>
          <Button 
            variant={activeTab === "documents" ? "default" : "ghost"} 
            className="w-full justify-start"
            onClick={() => handleTabChange("documents")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Mis Documentos
          </Button>
          {isAdmin && (
            <Button 
              variant={activeTab === "users" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => handleTabChange("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Gestión de Usuarios
            </Button>
          )}
          <Button 
            variant={activeTab === "billing" ? "default" : "ghost"} 
            className="w-full justify-start"
            onClick={() => handleTabChange("billing")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Facturación
          </Button>
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {activeTab === "overview" && "Dashboard"}
            {activeTab === "upload" && "Cargar Archivos"}
            {activeTab === "documents" && "Mis Documentos"}
            {activeTab === "users" && "Gestión de Usuarios"}
            {activeTab === "billing" && "Facturación"}
          </h1>
          <p className="text-muted-foreground">
            Bienvenido, {user.name}
          </p>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Documentos Procesados
                  </h3>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">127</p>
                <p className="text-sm text-muted-foreground mt-2">
                  +12% vs mes anterior
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Clientes Activos
                  </h3>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">45</p>
                <p className="text-sm text-muted-foreground mt-2">
                  +5 nuevos este mes
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Documentos Pendientes
                  </h3>
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">8</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Por procesar
                </p>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Actividad Reciente</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Documento procesado: Factura-2025-001.pdf</p>
                    <p className="text-sm text-muted-foreground">Hace 2 horas</p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Completado</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Nuevo cliente agregado: Empresa ABC S.A.</p>
                    <p className="text-sm text-muted-foreground">Hace 5 horas</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Nuevo</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Reporte mensual generado</p>
                    <p className="text-sm text-muted-foreground">Ayer</p>
                  </div>
                  <span className="text-sm text-primary font-medium">Descargado</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === "upload" && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Cargar Documentos</h2>
            <FileUpload />
          </div>
        )}

        {activeTab === "users" && isAdmin && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gestión de Usuarios</h2>
            <UserManagement />
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Mis Documentos</h2>
            <DocumentList />
          </div>
        )}

        {activeTab === "billing" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Suscripción y Facturación</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Plan Actual: Gratuito</h3>
                <p className="text-muted-foreground mb-4">
                  Actualiza a un plan Pro o Empresarial para desbloquear más funciones
                </p>
                <Button variant="hero" asChild>
                  <Link to="/#pricing">Ver Planes</Link>
                </Button>
              </Card>
              
              <div className="p-6 border border-dashed border-border rounded-lg text-center">
                <p className="text-muted-foreground mb-4">
                  ¿Quieres probar el plan Pro?
                </p>
                <PaymentForm 
                  planName="Pro" 
                  amount={29}
                  onSuccess={() => {
                    alert("¡Suscripción activada!");
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
  );
}
