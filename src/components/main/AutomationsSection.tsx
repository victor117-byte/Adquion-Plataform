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
  es_especifico_org?: boolean;
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
  variables_personalizadas?: Record<string, string | number | boolean>;
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
  { label: '8:00am y 4:30pm', icon: Sun, cron: '0 8,16 * * *', desc: 'Dos veces al día (mañana y tarde)', veces: 2 },
  { label: '7:00am y 3:00pm', icon: Sun, cron: '0 7,15 * * *', desc: 'Dos veces al día (mañana y tarde)', veces: 2 },
  { label: '9:00 pm', icon: Moon, cron: '0 21 * * *', desc: 'Una vez al día en la noche', veces: 1 },
  { label: 'Cada 12 horas', icon: Timer, cron: '0 */12 * * *', desc: '2 veces al día (medianoche y mediodía)', veces: 2 },
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
    '0 8,16 * * *': '8:00am y 4:30pm (2 veces al día)',
    '0 7,15 * * *': '7:00am y 3:00pm (2 veces al día)',
    '0 21 * * *': '9:00 PM (una vez al día)',
    '0 */12 * * *': 'Cada 12 horas (2 veces al día)',
    '0 * * * *': 'Cada hora',
    '0 */8 * * *': 'Cada 8 horas (3 veces al día)',
    '0 2 * * *': 'Diario a las 2:00 AM',
    '0 9 * * *': 'Diario a las 9:00 AM',
    '0 18 * * *': 'Diario a las 6:00 PM',
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
    cron_expresion: '0 8,16 * * *',
    descripcion: '',
    cronMode: 'preset' as 'preset' | 'custom', // Modo selector visual o manual
    customHour: '09',
    customMinute: '00',
    variables_personalizadas: {} as Record<string, string | number | boolean>,
  });

  const [formEdit, setFormEdit] = useState({
    descripcion: '',
    cron_expresion: '',
    cronMode: 'preset' as 'preset' | 'custom',
    customHour: '09',
    customMinute: '00',
    variables_personalizadas: {} as Record<string, string | number | boolean>,
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
      cron_expresion: '0 8,16 * * *',
      descripcion: script.descripcion_sugerida,
      cronMode: 'preset',
      customHour: '09',
      customMinute: '00',
      variables_personalizadas: {},
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
      const payload = {
        correo_admin: currentUser?.correo,
        organizacion: currentUser?.organizacion,
        nombre: scriptSeleccionado.nombre_sugerido,
        descripcion: formConfig.descripcion,
        script_path: scriptSeleccionado.script_path,
        cron_expresion: formConfig.cron_expresion,
        ...(Object.keys(formConfig.variables_personalizadas || {}).length > 0 && {
          variables_personalizadas: formConfig.variables_personalizadas
        })
      };

      console.log('📤 Enviando configuración:', payload);

      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📥 Respuesta del servidor:', result);
      
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
    // Extraer hora y minuto del cron si es posible
    const cronParts = auto.cron_expresion.split(' ');
    const minute = cronParts[0] || '00';
    const hour = cronParts[1] || '09';
    setFormEdit({
      descripcion: auto.descripcion,
      cron_expresion: auto.cron_expresion,
      cronMode: 'preset',
      customHour: hour,
      customMinute: minute,
      variables_personalizadas: auto.variables_personalizadas || {},
    });
    setDialogEditOpen(true);
  };

  const closeDialog = () => {
    setDialogConfigOpen(false);
    setScriptSeleccionado(null);
    setFormConfig({
      cron_expresion: '0 8,16 * * *',
      descripcion: '',
      cronMode: 'preset',
      customHour: '09',
      customMinute: '00',
      variables_personalizadas: {},
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
      const payload = {
        correo_admin: currentUser?.correo,
        organizacion: currentUser?.organizacion,
        id_automatizacion: automatizacionSeleccionada.id,
        descripcion: formEdit.descripcion,
        cron_expresion: formEdit.cron_expresion,
        ...(Object.keys(formEdit.variables_personalizadas || {}).length > 0 && {
          variables_personalizadas: formEdit.variables_personalizadas
        })
      };

      console.log('📤 Editando automatización:', payload);

      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📥 Respuesta del servidor:', result);
      
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

  // Componente para editar variables personalizadas
  const CustomVariablesEditor = ({ 
    variables, 
    onChange 
  }: { 
    variables: Record<string, string | number | boolean>;
    onChange: (vars: Record<string, string | number | boolean>) => void;
  }) => {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    
    const addVariable = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newKey.trim() || !newValue.trim()) {
        toast({
          title: "Error",
          description: "Debes proporcionar tanto el nombre como el valor de la variable",
          variant: "destructive",
        });
        return;
      }
      if (variables.hasOwnProperty(newKey)) {
        toast({
          title: "Error",
          description: `La variable "${newKey}" ya existe`,
          variant: "destructive",
        });
        return;
      }
      onChange({ ...variables, [newKey]: newValue });
      setNewKey('');
      setNewValue('');
    };
    
    const removeVariable = (key: string) => {
      const { [key]: _, ...rest } = variables;
      onChange(rest);
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addVariable();
      }
    };
    
    return (
      <div className="space-y-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <p className="font-medium mb-1">Variables personalizadas</p>
              <p className="text-blue-700 dark:text-blue-300">
                Se pasan al script Python como variables de entorno con prefijo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">SAT_VAR_</code>
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Ejemplo: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">rfc_objetivo</code> → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">SAT_VAR_RFC_OBJETIVO</code>
              </p>
            </div>
          </div>
        </div>

        {Object.keys(variables).length > 0 && (
          <div className="space-y-2 mb-3">
            {Object.entries(variables).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                <span className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1">
                  <span className="text-primary font-semibold">{key}</span>: {String(value)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(key)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={addVariable} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Variable (ej: rfc_objetivo)"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm flex-1"
          />
          <Input
            type="text"
            placeholder="Valor (ej: ABC123456DEF)"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm flex-1"
          />
          <Button
            type="button"
            onClick={(e) => addVariable(e)}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            + Agregar
          </Button>
        </form>

        {Object.keys(variables).length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-2">
            No hay variables personalizadas. Agrega una si tu script las requiere.
          </p>
        )}
      </div>
    );
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
                  <div className="flex flex-col gap-1.5">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Nuevo
                    </Badge>
                    {script.es_especifico_org && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-[10px]">
                        <Zap className="h-3 w-3 mr-1" />
                        Exclusivo
                      </Badge>
                    )}
                  </div>
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

                  {/* Variables personalizadas */}
                  {auto.variables_personalizadas && Object.keys(auto.variables_personalizadas).length > 0 && (
                    <details className="bg-muted/30 rounded-lg border-2 border-dashed">
                      <summary className="text-xs cursor-pointer p-3 hover:bg-muted/50 transition-colors font-medium flex items-center gap-2">
                        <Settings2 className="h-3.5 w-3.5" />
                        Variables personalizadas ({Object.keys(auto.variables_personalizadas).length})
                      </summary>
                      <div className="px-3 pb-3 space-y-1.5">
                        {Object.entries(auto.variables_personalizadas).map(([key, value]) => (
                          <div key={key} className="text-xs font-mono bg-background px-2 py-1.5 rounded border flex items-center justify-between">
                            <span className="text-primary font-semibold">{key}</span>
                            <span className="text-muted-foreground">= {String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Acciones */}"
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
                          Máximo 3 ejecuciones por día
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

                {/* Input manual con time picker */}
                {formConfig.cronMode === 'custom' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Máximo 3 ejecuciones por día
                        </p>
                      </div>
                    </div>
                    
                    {/* Time Picker */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Selecciona la hora
                      </Label>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Hora</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={formConfig.customHour}
                            onChange={(e) => {
                              const hour = e.target.value.padStart(2, '0');
                              setFormConfig({ 
                                ...formConfig, 
                                customHour: hour,
                                cron_expresion: `0 ${hour} * * *`
                              });
                            }}
                            className="text-center text-2xl font-bold h-16"
                          />
                        </div>
                        <div className="text-3xl font-bold text-muted-foreground">:</div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Minuto</Label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={formConfig.customMinute}
                            onChange={(e) => {
                              const minute = e.target.value.padStart(2, '0');
                              setFormConfig({ 
                                ...formConfig, 
                                customMinute: minute,
                                cron_expresion: `${minute} ${formConfig.customHour} * * *`
                              });
                            }}
                            className="text-center text-2xl font-bold h-16"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">Se ejecutará:</p>
                          <p className="text-base font-bold text-green-900 dark:text-green-100">
                            Diario a las {formConfig.customHour}:{formConfig.customMinute}
                          </p>
                          <code className="text-[10px] bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded mt-1 inline-block">
                            {formConfig.cron_expresion}
                          </code>
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

              {/* Variables personalizadas */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Variables Personalizadas (Opcional)
                </Label>
                <CustomVariablesEditor
                  variables={formConfig.variables_personalizadas}
                  onChange={(vars) => setFormConfig({ ...formConfig, variables_personalizadas: vars })}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">"
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="edit-descripcion" className="text-base font-semibold">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formEdit.descripcion}
                  onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              {/* Selector de horario para edición */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  ¿Cuándo ejecutar?
                </Label>
                
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={formEdit.cronMode === 'preset' ? 'default' : 'ghost'}
                    className="flex-1 h-10"
                    onClick={() => setFormEdit({ ...formEdit, cronMode: 'preset' })}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Horarios Comunes
                  </Button>
                  <Button
                    type="button"
                    variant={formEdit.cronMode === 'custom' ? 'default' : 'ghost'}
                    className="flex-1 h-10"
                    onClick={() => setFormEdit({ ...formEdit, cronMode: 'custom' })}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Personalizado
                  </Button>
                </div>

                {/* Selector visual */}
                {formEdit.cronMode === 'preset' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Máximo 3 ejecuciones por día
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {HORARIOS_COMUNES.map((horario) => {
                        const IconComponent = horario.icon;
                        const isSelected = formEdit.cron_expresion === horario.cron;
                        return (
                          <Card
                            key={horario.cron}
                            className={`p-4 cursor-pointer transition-all hover:shadow-lg active:scale-95 ${
                              isSelected 
                                ? 'border-2 border-primary bg-primary/5 shadow-md' 
                                : 'border hover:border-primary/50'
                            }`}
                            onClick={() => setFormEdit({ ...formEdit, cron_expresion: horario.cron })}
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

                {/* Time Picker */}
                {formEdit.cronMode === 'custom' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          Máximo 3 ejecuciones por día
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Selecciona la hora
                      </Label>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Hora</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={formEdit.customHour}
                            onChange={(e) => {
                              const hour = e.target.value.padStart(2, '0');
                              setFormEdit({ 
                                ...formEdit, 
                                customHour: hour,
                                cron_expresion: `0 ${hour} * * *`
                              });
                            }}
                            className="text-center text-2xl font-bold h-16"
                          />
                        </div>
                        <div className="text-3xl font-bold text-muted-foreground">:</div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Minuto</Label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={formEdit.customMinute}
                            onChange={(e) => {
                              const minute = e.target.value.padStart(2, '0');
                              setFormEdit({ 
                                ...formEdit, 
                                customMinute: minute,
                                cron_expresion: `${minute} ${formEdit.customHour} * * *`
                              });
                            }}
                            className="text-center text-2xl font-bold h-16"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">Se ejecutará:</p>
                          <p className="text-base font-bold text-green-900 dark:text-green-100">
                            Diario a las {formEdit.customHour}:{formEdit.customMinute}
                          </p>
                          <code className="text-[10px] bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded mt-1 inline-block">
                            {formEdit.cron_expresion}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview de interpretación */}
                {formEdit.cronMode === 'preset' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">Se ejecutará:</p>
                        <p className="text-base font-bold text-green-900 dark:text-green-100">
                          {interpretarCron(formEdit.cron_expresion)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Variables personalizadas */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Variables Personalizadas (Opcional)
                </Label>
                <CustomVariablesEditor
                  variables={formEdit.variables_personalizadas}
                  onChange={(vars) => setFormEdit({ ...formEdit, variables_personalizadas: vars })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">"
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
