import { useState, useEffect } from "react";
import { Plus, Play, Pause, Clock, CheckCircle, XCircle, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  name: string;
  type: 'sat_scraping' | 'notification' | 'report';
  schedule: string;
  enabled: boolean;
  last_run: string | null;
  last_status: 'success' | 'failed' | 'running' | null;
  next_run: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

const automationTypes = [
  { value: 'sat_scraping', label: 'Scraping SAT', description: 'Extrae documentos del portal SAT' },
  { value: 'notification', label: 'Notificación', description: 'Envía notificaciones automáticas' },
  { value: 'report', label: 'Reporte', description: 'Genera reportes periódicos' },
];

const scheduleOptions = [
  { value: '0 8 * * *', label: 'Diario a las 8:00 AM' },
  { value: '0 8 * * 1', label: 'Semanal (Lunes 8:00 AM)' },
  { value: '0 8 1 * *', label: 'Mensual (Día 1, 8:00 AM)' },
  { value: '0 */4 * * *', label: 'Cada 4 horas' },
];

export function AutomationsSection() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'sat_scraping' as const,
    schedule: '0 8 * * *',
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch(`${API_URL}/automations`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations || []);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutomation = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa un nombre para la automatización",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/automations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Automatización creada",
          description: "La automatización se creó correctamente",
        });
        fetchAutomations();
        setDialogOpen(false);
        setFormData({ name: '', type: 'sat_scraping', schedule: '0 8 * * *' });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la automatización",
        variant: "destructive",
      });
    }
  };

  const handleToggleAutomation = async (automationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_URL}/automations/${automationId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setAutomations(prev =>
          prev.map(a => a.id === automationId ? { ...a, enabled } : a)
        );
        toast({
          title: enabled ? "Automatización activada" : "Automatización pausada",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la automatización",
        variant: "destructive",
      });
    }
  };

  const handleRunNow = async (automationId: string) => {
    try {
      const response = await fetch(`${API_URL}/automations/${automationId}/run`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (response.ok) {
        toast({
          title: "Automatización ejecutada",
          description: "La automatización se está ejecutando",
        });
        fetchAutomations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo ejecutar la automatización",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta automatización?')) return;

    try {
      const response = await fetch(`${API_URL}/automations/${automationId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        toast({ title: "Automatización eliminada" });
        fetchAutomations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la automatización",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      sat_scraping: { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'SAT Scraping' },
      notification: { class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Notificación' },
      report: { class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Reporte' },
    };
    const variant = variants[type] || { class: 'bg-gray-100 text-gray-800', label: type };
    return <Badge className={variant.class}>{variant.label}</Badge>;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-muted-foreground mt-1">
            Configura y gestiona tus automatizaciones
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Automatización
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Automatización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mi automatización"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: typeof formData.type) => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {automationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p>{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Programación</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAutomation}>
                  Crear Automatización
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automations Grid */}
      {loading ? (
        <div className="text-center py-8">Cargando automatizaciones...</div>
      ) : automations.length === 0 ? (
        <Card className="p-8 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay automatizaciones</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera automatización para comenzar
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground truncate">{automation.name}</h3>
                  <div className="mt-1">{getTypeBadge(automation.type)}</div>
                </div>
                <Switch
                  checked={automation.enabled}
                  onCheckedChange={(checked) => handleToggleAutomation(automation.id, checked)}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Última ejecución</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(automation.last_status)}
                    <span>{automation.last_run || 'Nunca'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Próxima ejecución</span>
                  <span>{automation.next_run}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRunNow(automation.id)}
                  disabled={automation.last_status === 'running'}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Ejecutar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAutomation(automation.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
