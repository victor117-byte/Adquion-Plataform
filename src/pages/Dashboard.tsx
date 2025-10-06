import { Link } from "react-router-dom";
import { BarChart3, FileText, Users, Upload, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Acquisitions</span>
        </div>
        
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard/documents">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard/clients">
              <Users className="mr-2 h-4 w-4" />
              Clientes
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Cargar Archivos
            </Link>
          </Button>
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" asChild>
            <Link to="/">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido a tu panel de control
          </p>
        </div>

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
      </main>
    </div>
  );
}
