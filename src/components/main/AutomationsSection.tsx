import { useState, useEffect } from "react";
import { Play, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, Settings2, FileCode, TrendingUp, Sun, Moon, Timer, Repeat, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ScriptDisponible {
  script_path: string;
  nombre_sugerido: string;
  nombre_display: string;
  descripcion_sugerida: string;
  configurado: boolean;
}

interface Automatizacion {
  id: number;
  nombre: string;
  nombre_display: string;
  descripcion: string;
  script_path: string;
  cron_expresion: string;
  activo: boolean;
  ultima_ejecucion: string | null;
  ultima_estado: 'exitoso' | 'error' | null;
  total_ejecuciones: string;
  ejecuciones_exitosas: string;
  ejecuciones_error: string;
}

interface LogEjecucion {
  id: number;
  estado: 'exitoso' | 'error';
  fecha_inicio: string;
  fecha_fin: string;
  duracion_segundos: number;
  output: string;
  error_mensaje: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

// Opciones predefinidas de horarios (máximo 3 ejecuciones diarias)
const HORARIOS_COMUNES = [
  { label: 'Diario 2am', icon: Moon, cron: '0 2 * * *', desc: 'Una vez al día en la madrugada', veces: 1 },
  { label: 'Diario 9am', icon: Sun, cron: '0 9 * * *', desc: 'Una vez al día en la mañana', veces: 1 },
  { label: 'Diario 6pm', icon: Moon, cron: '0 18 * * *', desc: 'Una vez al día en la tarde', veces: 1 },
  { label: 'Cada 8 horas', icon: Repeat, cron: '0 */8 * * *', desc: '3 veces al día (00:00, 08:00, 16:00)', veces: 3 },
  { label: 'Cada 12 horas', icon: Timer, cron: '0 */12 * * *', desc: '2 veces al día (medianoche y mediodía)', veces: 2 },
  { label: 'Lunes 9am', icon: Calendar, cron: '0 9 * * 1', desc: 'Una vez por semana', veces: 1 },
];

// Función para validar expresión cron (máximo 3 ejecuciones diarias)
const validarCron = (cron: string): { valido: boolean; mensaje: string } => {
  // Patrones peligrosos que se ejecutan muy frecuentemente
  const patronesProhibidos = [
    { regex: /^\*\/([1-9]|[1-5][0-9]) \* \* \* \*$/, mensaje: 'No se permiten intervalos menores a 1 hora' },
    { regex: /^\* \* \* \* \*$/, mensaje: 'No se permite ejecución cada minuto' },
    { regex: /^0 \*\/[1-2] \* \* \*$/, mensaje: 'Intervalos de 1-2 horas exceden el límite de 3 ejecuciones diarias' },
  ];

  for (const patron of patronesProhibidos) {
    if (patron.regex.test(cron)) {
      return { valido: false, mensaje: patron.mensaje };
    }
  }

  // Validar formato básico
  const partes = cron.trim().split(' ');
  if (partes.length !== 5) {
    return { valido: false, mensaje: 'Formato inválido. Debe tener 5 campos: minuto hora día mes día-semana' };
  }

  // Si pasa las validaciones
  return { valido: true, mensaje: 'Expresión válida' };
};

// Función para interpretar expresión cron
const interpretarCron = (cron: string): string => {
  const ejemplos: Record<string, string> = {
    '0 * * * *': 'Cada hora',
    '0 */8 * * *': 'Cada 8 horas (3 veces al día)',
    '0 */12 * * *': 'Cada 12 horas (2 veces al día)',
    '0 2 * * *': 'Diario a las 2:00 AM',
    '0 9 * * *': 'Diario a las 9:00 AM',
    '0 18 * * *': 'Diario a las 6:00 PM',
    '0 9 * * 1': 'Cada lunes a las 9:00 AM',
    '*/30 * * * *': 'Cada 30 minutos',
    '0 0 * * *': 'Diario a medianoche',
    '0 12 * * *': 'Diario a las 12:00 PM',
  };
  return ejemplos[cron] || 'Horario personalizado';
};

export function AutomationsSection() {
  const { user: currentUser } = useAuth();
  const [scriptsDisponibles, setScriptsDisponibles] = useState<ScriptDisponible[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);
  const [logs, setLogs] = useState<LogEjecucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogConfigOpen, setDialogConfigOpen] = useState(false);
  const [dialogLogsOpen, setDialogLogsOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [scriptSeleccionado, setScriptSeleccionado] = useState<ScriptDisponible | null>(null);
  const [automatizacionSeleccionada, setAutomatizacionSeleccionada] = useState<Automatizacion | null>(null);

  const [formConfig, setFormConfig] = useState({
    cron_expresion: '0 2 * * *',
    descripcion: '',
    cronMode: 'preset' as 'preset' | 'custom', // Modo selector visual o manual
  });

  const [formEdit, setFormEdit] = useState({
    descripcion: '',
    cron_expresion: '',
    cronMode: 'preset' as 'preset' | 'custom',
  });

  const isAdmin = currentUser?.tipo_usuario === 'administrador';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await Promise.all([cargarScriptsDisponibles(), cargarAutomatizaciones()]);
    setLoading(false);
  };

  const cargarScriptsDisponibles = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) return;

      const response = await fetch(
        `${API_URL}/automatizaciones/disponibles?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setScriptsDisponibles(result.data.scripts_disponibles || []);
      }
    } catch (error) {
      console.error('❌ Error cargando scripts disponibles:', error);
    }
  };

  const cargarAutomatizaciones = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) return;

      const response = await fetch(
        `${API_URL}/automatizaciones?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setAutomatizaciones(result.data.automatizaciones || []);
      }
    } catch (error) {
      console.error('❌ Error cargando automatizaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las automatizaciones",
        variant: "destructive",
      });
    }
  };

  const cargarLogs = async (idAutomatizacion: number) => {
    try {
      const response = await fetch(
        `${API_URL}/automatizaciones/logs?correo=${encodeURIComponent(currentUser?.correo || '')}&organizacion=${encodeURIComponent(currentUser?.organizacion || '')}&id_automatizacion=${idAutomatizacion}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('❌ Error cargando logs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs",
        variant: "destructive",
      });
    }
  };

  const abrirDialogConfig = (script: ScriptDisponible) => {
    setScriptSeleccionado(script);
    setFormConfig({
      cron_expresion: '0 2 * * *',
      descripcion: script.descripcion_sugerida,
      cronMode: 'preset',
    });
    setDialogConfigOpen(true);
  };

  const configurarAutomatizacion = async () => {
    if (!scriptSeleccionado) return;

    // Validar expresión cron
    const validacion = validarCron(formConfig.cron_expresion);
    if (!validacion.valido) {
      toast({
        title: "Horario no permitido",
        description: validacion.mensaje,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          nombre: scriptSeleccionado.nombre_sugerido,
          descripcion: formConfig.descripcion,
          script_path: scriptSeleccionado.script_path,
          cron_expresion: formConfig.cron_expresion,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Automatización configurada",
          description: `${result.data.nombre_display} fue configurada (deshabilitada por defecto)`,
        });
        cargarDatos();
        closeDialog();
      } else {
        throw new Error(result.message || 'Error al configurar');
      }
    } catch (error) {
      console.error('❌ Error configurando automatización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo configurar la automatización",
        variant: "destructive",
      });
    }
  };

  const toggleActivo = async (id: number, estadoActual: boolean) => {
    try {
      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_automatizacion: id,
          activo: !estadoActual,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: !estadoActual ? "Automatización activada" : "Automatización desactivada",
          description: result.message,
        });
        cargarAutomatizaciones();
      } else {
        throw new Error(result.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const ejecutarManual = async (id: number, nombre: string) => {
    if (!confirm(`¿Ejecutar "${nombre}" manualmente ahora?`)) return;

    try {
      const response = await fetch(`${API_URL}/automatizaciones/ejecutar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_automatizacion: id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Ejecución iniciada",
          description: "La automatización se está ejecutando en segundo plano",
        });
        // Recargar después de unos segundos
        setTimeout(() => cargarAutomatizaciones(), 3000);
      } else {
        throw new Error(result.message || 'Error al ejecutar');
      }
    } catch (error) {
      console.error('❌ Error ejecutando automatización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo ejecutar la automatización",
        variant: "destructive",
      });
    }
  };

  const abrirDialogLogs = async (auto: Automatizacion) => {
    setAutomatizacionSeleccionada(auto);
    await cargarLogs(auto.id);
    setDialogLogsOpen(true);
  };

  const abrirDialogEdit = (auto: Automatizacion) => {
    setAutomatizacionSeleccionada(auto);
    setFormEdit({
      descripcion: auto.descripcion,
      cron_expresion: auto.cron_expresion,
      cronMode: 'preset',
    });
    setDialogEditOpen(true);
  };

  const closeDialog = () => {
    setDialogConfigOpen(false);
    setScriptSeleccionado(null);
    setFormConfig({
      cron_expresion: '0 2 * * *',
      descripcion: '',
      cronMode: 'preset',
    });
  };

  const editarAutomatizacion = async () => {
    if (!automatizacionSeleccionada) return;

    // Validar expresión cron
    const validacion = validarCron(formEdit.cron_expresion);
    if (!validacion.valido) {
      toast({
        title: "Horario no permitido",
        description: validacion.mensaje,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_automatizacion: automatizacionSeleccionada.id,
          descripcion: formEdit.descripcion,
          cron_expresion: formEdit.cron_expresion,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Automatización actualizada",
          description: "Los cambios se guardaron correctamente",
        });
        cargarAutomatizaciones();
        setDialogEditOpen(false);
      } else {
        throw new Error(result.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error('❌ Error actualizando automatización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  const eliminarAutomatizacion = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_automatizacion: id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Automatización eliminada",
          description: "La automatización fue eliminada correctamente",
        });
        cargarDatos();
      } else {
        throw new Error(result.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error eliminando automatización:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (estado: 'exitoso' | 'error' | null) => {
    if (!estado) return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Sin ejecuciones</Badge>;
    if (estado === 'exitoso') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Exitoso</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando automatizaciones...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const scriptsNoConfigurados = scriptsDisponibles.filter(s => !s.configurado);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Automatizaciones</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Gestiona las automatizaciones productivas de tu organización
        </p>
      </div>

      {/* Scripts Disponibles */}
      {scriptsNoConfigurados.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Scripts Disponibles ({scriptsNoConfigurados.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {scriptsNoConfigurados.map((script) => (
              <Card 
                key={script.script_path} 
                className="p-4 md:p-5 hover:shadow-lg transition-all cursor-pointer active:scale-95"
                onClick={() => abrirDialogConfig(script)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileCode className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Nuevo
                  </Badge>
                </div>
                <h4 className="font-semibold text-base md:text-lg mb-2 capitalize">
                  {script.nombre_display}
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                    {script.script_path}
                  </code>
                </p>
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirDialogConfig(script);
                  }}
                  className="w-full h-11 md:h-12 text-base"
                >
                  <Settings2 className="h-5 w-5 mr-2" />
                  Configurar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Automatizaciones Configuradas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Automatizaciones Activas ({automatizaciones.length})
          </h3>
        </div>

        {automatizaciones.length === 0 ? (
          <Card className="p-8 md:p-12 text-center border-2 border-dashed">
            <div className="inline-block p-6 bg-muted rounded-full mb-4">
              <Settings2 className="h-16 w-16 md:h-20 md:w-20 text-muted-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-medium mb-2">No hay automatizaciones configuradas</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Configura un script disponible para comenzar
            </p>
            {scriptsNoConfigurados.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {scriptsNoConfigurados.length} scripts disponibles
              </Badge>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {automatizaciones.map((auto) => (
              <Card key={auto.id} className="p-4 md:p-6 hover:shadow-xl transition-all border-2">
                <div className="space-y-4">
                  {/* Header con icono grande */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl ${auto.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Zap className={`h-7 w-7 ${auto.activo ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base md:text-lg capitalize truncate">
                          {auto.nombre_display}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                          {auto.descripcion}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Switch
                        checked={auto.activo}
                        onCheckedChange={() => toggleActivo(auto.id, auto.activo)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>

                  {/* Estado con icono animado */}
                  <div className="flex items-center gap-2">
                    <Badge className={auto.activo 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs md:text-sm px-3 py-1.5 flex items-center gap-1.5" 
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-xs md:text-sm px-3 py-1.5 flex items-center gap-1.5"
                    }>
                      {auto.activo ? (
                        <>
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Activo
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />
                          Inactivo
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="font-medium">{interpretarCron(auto.cron_expresion)}</span>
                    </div>
                  </div>

                  {/* Última Ejecución con iconos */}
                  {auto.ultima_ejecucion ? (
                    <div className={`rounded-lg p-3 border-2 ${
                      auto.ultima_estado === 'exitoso' 
                        ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                        : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground font-medium">Última ejecución</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-medium">
                          {new Date(auto.ultima_ejecucion).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {getEstadoBadge(auto.ultima_estado)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3 text-center border-2 border-dashed">
                      <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs md:text-sm text-muted-foreground">Sin ejecuciones aún</span>
                    </div>
                  )}

                  {/* Estadísticas con iconos mejorados */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {auto.total_ejecuciones}
                      </div>
                      <div className="text-[10px] md:text-xs text-blue-700 dark:text-blue-300 font-medium">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                        {auto.ejecuciones_exitosas}
                      </div>
                      <div className="text-[10px] md:text-xs text-green-700 dark:text-green-300 font-medium">Exitosas</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                        {auto.ejecuciones_error}
                      </div>
                      <div className="text-[10px] md:text-xs text-red-700 dark:text-red-300 font-medium">Errores</div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => ejecutarManual(auto.id, auto.nombre_display)}
                      className="h-11 md:h-12 active:scale-95 transition-transform"
                    >
                      <Play className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Ejecutar
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => abrirDialogLogs(auto)}
                      className="h-11 md:h-12 active:scale-95 transition-transform"
                    >
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Logs
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => abrirDialogEdit(auto)}
                      className="h-11 md:h-12 active:scale-95 transition-transform"
                    >
                      <Edit className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => eliminarAutomatizacion(auto.id, auto.nombre_display)}
                      className="h-11 md:h-12 text-destructive hover:text-destructive active:scale-95 transition-transform"
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Configurar */}
      <Dialog open={dialogConfigOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
        else setDialogConfigOpen(true);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Configurar Automatización
            </DialogTitle>
          </DialogHeader>
          {scriptSeleccionado && (
            <div className="space-y-5 py-2">
              {/* Info del script */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border-2 border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-primary/20 rounded-lg">
                    <FileCode className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg capitalize">{scriptSeleccionado.nombre_display}</h4>
                    <code className="text-xs bg-background/50 px-2 py-1 rounded border">
                      {scriptSeleccionado.script_path}
                    </code>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-base font-semibold flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  value={formConfig.descripcion}
                  onChange={(e) => setFormConfig({ ...formConfig, descripcion: e.target.value })}
                  placeholder="Describe qué hace esta automatización"
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              {/* Selector de horario */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  ¿Cuándo ejecutar?
                </Label>
                
                {/* Tabs para selector visual o manual */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={formConfig.cronMode === 'preset' ? 'default' : 'ghost'}
                    className="flex-1 h-10"
                    onClick={() => setFormConfig({ ...formConfig, cronMode: 'preset' })}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Horarios Comunes
                  </Button>
                  <Button
                    type="button"
                    variant={formConfig.cronMode === 'custom' ? 'default' : 'ghost'}
                    className="flex-1 h-10"
                    onClick={() => setFormConfig({ ...formConfig, cronMode: 'custom' })}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Personalizado
                  </Button>
                </div>

                {/* Selector visual de horarios */}
                {formConfig.cronMode === 'preset' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Máximo 3 ejecuciones por día para proteger el backend
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {HORARIOS_COMUNES.map((horario) => {
                        const IconComponent = horario.icon;
                        const isSelected = formConfig.cron_expresion === horario.cron;
                        return (
                          <Card
                            key={horario.cron}
                            className={`p-4 cursor-pointer transition-all hover:shadow-lg active:scale-95 ${
                              isSelected 
                                ? 'border-2 border-primary bg-primary/5 shadow-md' 
                                : 'border hover:border-primary/50'
                            }`}
                            onClick={() => setFormConfig({ ...formConfig, cron_expresion: horario.cron })}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold text-sm">{horario.label}</h5>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 ${
                                      horario.veces === 1 
                                        ? 'border-green-300 text-green-700 dark:text-green-400' 
                                        : horario.veces === 2 
                                        ? 'border-blue-300 text-blue-700 dark:text-blue-400'
                                        : 'border-yellow-300 text-yellow-700 dark:text-yellow-400'
                                    }`}
                                  >
                                    {horario.veces}x/día
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{horario.desc}</p>
                              </div>
                            </div>
                            <code className="text-[10px] bg-muted px-2 py-1 rounded block text-center">
                              {horario.cron}
                            </code>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input manual */}
                {formConfig.cronMode === 'custom' && (
                  <div className="space-y-3">
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div className="text-sm text-red-900 dark:text-red-200">
                          <p className="font-medium">⚠️ Restricciones de seguridad</p>
                          <ul className="text-xs mt-1 space-y-0.5">
                            <li>• Máximo 3 ejecuciones por día</li>
                            <li>• Intervalo mínimo de 3 horas entre ejecuciones</li>
                            <li>• No se permiten intervalos de minutos</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        value={formConfig.cron_expresion}
                        onChange={(e) => setFormConfig({ ...formConfig, cron_expresion: e.target.value })}
                        placeholder="0 9 * * *"
                        className={`text-base h-12 font-mono pr-10 ${
                          formConfig.cron_expresion && !validarCron(formConfig.cron_expresion).valido
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : 'border-green-500 focus-visible:ring-green-500'
                        }`}
                      />
                      {formConfig.cron_expresion && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validarCron(formConfig.cron_expresion).valido ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {formConfig.cron_expresion && !validarCron(formConfig.cron_expresion).valido && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                          {validarCron(formConfig.cron_expresion).mensaje}
                        </p>
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Formato: minuto hora día mes día-semana
                        </p>
                      </div>
                      <div className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">0 2 * * *</code> = Diario a las 2:00 AM
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">0 */8 * * *</code> = Cada 8 horas (3x día)
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">*/30 * * * *</code> = Cada 30 min (bloqueado)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview de interpretación */}
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">Se ejecutará:</p>
                      <p className="text-base font-bold text-green-900 dark:text-green-100">
                        {interpretarCron(formConfig.cron_expresion)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Importante</p>
                    <p>La automatización se creará <strong>deshabilitada por defecto</strong>. Deberás activarla manualmente después de probarla.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogConfigOpen(false)}
                  className="h-12 text-base order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={configurarAutomatizacion}
                  className="h-12 text-base order-1 sm:order-2 flex-1"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Configurar Automatización
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Logs */}
      <Dialog open={dialogLogsOpen} onOpenChange={setDialogLogsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Historial - {automatizacionSeleccionada?.nombre_display}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay ejecuciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm text-muted-foreground mb-1">
                            {new Date(log.fecha_inicio).toLocaleString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getEstadoBadge(log.estado)}
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {log.duracion_segundos}s
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {log.error_mensaje && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">Error:</div>
                          <div className="text-xs text-red-800 dark:text-red-300 break-words">
                            {log.error_mensaje}
                          </div>
                        </div>
                      )}
                      
                      {log.output && !log.error_mensaje && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground break-words font-mono">
                            {log.output}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Automatización</DialogTitle>
          </DialogHeader>
          {automatizacionSeleccionada && (
            <div className="space-y-5 py-2">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg capitalize mb-2">
                  {automatizacionSeleccionada.nombre_display}
                </h4>
                <code className="text-xs bg-background px-2 py-1 rounded border">
                  {automatizacionSeleccionada.script_path}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descripcion" className="text-base">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formEdit.descripcion}
                  onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                  rows={4}
                  className="text-base resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cron" className="text-base">Expresión Cron</Label>
                <Input
                  id="edit-cron"
                  value={formEdit.cron_expresion}
                  onChange={(e) => setFormEdit({ ...formEdit, cron_expresion: e.target.value })}
                  className="text-base h-12"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogEditOpen(false)}
                  className="h-12 text-base order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editarAutomatizacion}
                  className="h-12 text-base order-1 sm:order-2 flex-1"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
