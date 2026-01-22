import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2,
  Settings2, FileCode, TrendingUp, Sun, Zap,
  AlertCircle, Loader2, StopCircle, Info, Database, Upload,
  Variable, Plus, X, Eye, RefreshCw,
  RotateCcw, Lightbulb, MessageSquare, Activity,
  Circle, ArrowDown, PlayCircle, History, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ==================== INTERFACES ====================

type PhaseStatus = 'pending' | 'running' | 'completed' | 'error';

interface ScriptFase {
  id: string;
  nombre: string;
  descripcion?: string;
  peso: number;
}

interface ScriptVariable {
  nombre: string;
  descripcion: string;
  requerida: boolean;
  default?: string;
  tipo?: 'texto' | 'fecha' | 'numero' | 'opcion';
  opciones?: string[];
}

interface ScriptMetadata {
  nombre: string;
  descripcion: string;
  version?: string;
  autor?: string;
  fases?: ScriptFase[];
  variables_requeridas?: ScriptVariable[];
}

interface ScriptDisponible {
  script_path: string;
  nombre_sugerido: string;
  nombre_display: string;
  descripcion_sugerida?: string;
  configurado: boolean;
  es_especifico_org?: boolean;
  tiene_metadata?: boolean;
  metadata?: ScriptMetadata;
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
  ultima_estado: 'exitoso' | 'error' | 'advertencia' | 'en_ejecucion' | null;
  total_ejecuciones: number | string;
  ejecuciones_exitosas: number | string;
  ejecuciones_error: number | string;
  variables_personalizadas?: Record<string, string | number | boolean>;
  creado_por?: number;
  creado_por_nombre?: string;
  creado_por_correo?: string;
  created_at?: string;
  updated_at?: string;
}

interface PhaseState {
  id: string;
  nombre: string;
  descripcion?: string;
  status: PhaseStatus;
  progress?: number;
  started_at?: string;
  completed_at?: string;
  logs?: { timestamp: string; level: string; message: string }[];
}

interface ExecutionStatus {
  execution_id: string;
  organizacion: string;
  started_at: string;
  updated_at: string;
  status: 'running' | 'completed' | 'error';
  current_phase: {
    id: string;
    nombre: string;
    descripcion?: string;
    started_at: string;
  } | null;
  progress: {
    percentage: number;
    items_processed: number;
    items_total: number;
  };
  phases_completed: string[];
  messages: {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }[];
  error: string | null;
}

interface LogEjecucion {
  id: number;
  estado: 'exitoso' | 'error' | 'advertencia' | 'en_ejecucion';
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_segundos: number | null;
  output: string | null;
  error_mensaje: string | null;
  ejecutado_por?: string;
  ejecutado_por_correo?: string;
  es_programado?: boolean;
}

// ==================== CONSTANTES ====================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

// Modos de programación
type ScheduleMode = 'manual' | 'hourly' | 'daily' | 'weekly' | 'cron';

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual', desc: 'Solo cuando yo lo ejecute', icon: PlayCircle },
  { value: 'hourly', label: 'Cada X horas', desc: 'Repetir cada cierto número de horas', icon: RefreshCw },
  { value: 'daily', label: 'Diario', desc: 'Una vez al día a una hora específica', icon: Sun },
  { value: 'weekly', label: 'Semanal', desc: 'Ciertos días de la semana', icon: Calendar },
  { value: 'cron', label: 'Avanzado', desc: 'Expresión cron personalizada', icon: Settings2 },
];

const WEEKDAYS = [
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
  { value: '0', label: 'Dom' },
];

// Diccionario de errores técnicos a mensajes amigables
const ERROR_TRANSLATIONS: Record<string, { message: string; recommendation: string }> = {
  'connection refused': {
    message: 'No se pudo conectar con el servidor de datos',
    recommendation: 'Verifica que el servicio esté disponible o contacta al administrador'
  },
  'timeout': {
    message: 'La operación tardó demasiado tiempo',
    recommendation: 'Intenta de nuevo en unos minutos o reduce el volumen de datos'
  },
  'authentication failed': {
    message: 'Error de autenticación',
    recommendation: 'Verifica que las credenciales configuradas sean correctas'
  },
  'permission denied': {
    message: 'No tienes permisos para realizar esta operación',
    recommendation: 'Contacta al administrador para solicitar acceso'
  },
  'file not found': {
    message: 'No se encontró el archivo solicitado',
    recommendation: 'Verifica que el archivo exista en la ubicación especificada'
  },
  'invalid data': {
    message: 'Los datos recibidos tienen un formato incorrecto',
    recommendation: 'Revisa que los datos de origen estén en el formato esperado'
  },
  'rate limit': {
    message: 'Se excedió el límite de solicitudes',
    recommendation: 'Espera unos minutos antes de ejecutar de nuevo'
  },
  'out of memory': {
    message: 'La operación requiere más recursos de los disponibles',
    recommendation: 'Intenta procesar menos datos o contacta al administrador'
  },
  'network error': {
    message: 'Error de conexión a internet',
    recommendation: 'Verifica tu conexión a internet e intenta de nuevo'
  },
  'sat_error': {
    message: 'Error al comunicarse con el SAT',
    recommendation: 'El portal del SAT puede estar en mantenimiento. Intenta más tarde'
  },
  'database error': {
    message: 'Error al acceder a la base de datos',
    recommendation: 'El sistema se recuperará automáticamente. Si persiste, contacta soporte'
  },
};

// ==================== UTILIDADES ====================

const translateError = (technicalError: string): { message: string; recommendation: string } => {
  const errorLower = technicalError.toLowerCase();

  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (errorLower.includes(key)) {
      return translation;
    }
  }

  return {
    message: 'Ocurrió un error durante la ejecución',
    recommendation: 'Si el problema persiste, contacta al equipo de soporte técnico'
  };
};

const validarCron = (cron: string): { valido: boolean; mensaje: string } => {
  const partes = cron.trim().split(' ');
  if (partes.length !== 5) {
    return { valido: false, mensaje: 'Formato inválido. Debe tener 5 campos.' };
  }
  return { valido: true, mensaje: 'Válido' };
};

const interpretarCron = (cron: string): string => {
  if (cron === 'manual') return 'Ejecución manual';
  // Cron imposible usado para "manual" en backend
  if (cron === '0 0 31 2 *') return 'Ejecución manual';

  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [min, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Formatear hora
  const formatHour = (h: string, m: string) => {
    const hourNum = parseInt(h);
    const minStr = m.padStart(2, '0');
    if (hourNum === 0) return `12:${minStr} AM`;
    if (hourNum === 12) return `12:${minStr} PM`;
    if (hourNum < 12) return `${hourNum}:${minStr} AM`;
    return `${hourNum - 12}:${minStr} PM`;
  };

  // Cada X minutos
  if (min.startsWith('*/')) {
    return `Cada ${min.slice(2)} minutos`;
  }

  // Cada X horas
  if (hour.startsWith('*/')) {
    return `Cada ${hour.slice(2)} horas`;
  }

  // Días específicos de la semana
  if (dayOfWeek !== '*' && dayOfMonth === '*' && month === '*') {
    const dayNames = dayOfWeek.split(',').map(d => {
      if (d === '1-5') return 'Lun-Vie';
      return WEEKDAYS.find(w => w.value === d)?.label || d;
    });

    if (dayOfWeek === '1-5') {
      return `Lun-Vie a las ${formatHour(hour, min)}`;
    }

    return `${dayNames.join(', ')} a las ${formatHour(hour, min)}`;
  }

  // Primer día de cada mes
  if (dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
    return `Primer día de cada mes a las ${formatHour(hour, min)}`;
  }

  // Múltiples horas en el día
  if (hour.includes(',') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const hours = hour.split(',').map(h => formatHour(h, min));
    return `Diario a las ${hours.join(' y ')}`;
  }

  // Diario a una hora específica
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Diario a las ${formatHour(hour, min)}`;
  }

  return `Cron: ${cron}`;
};

const generateCronFromSchedule = (
  mode: ScheduleMode,
  config: {
    hour?: string;
    minute?: string;
    interval?: string;
    weekdays?: string[];
  }
): string => {
  const { hour = '9', minute = '0', interval = '8', weekdays = [] } = config;

  switch (mode) {
    case 'manual':
      return 'manual';
    case 'hourly':
      return `0 */${interval} * * *`;
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${weekdays.join(',')}`;
    default:
      return `${minute} ${hour} * * *`;
  }
};

// ==================== COMPONENTES DE UI ====================

// Icono de fase según tipo
const getPhaseIcon = (phaseId: string) => {
  const id = phaseId.toLowerCase();
  if (id.includes('inicio') || id.includes('init')) return PlayCircle;
  if (id.includes('extrac')) return Database;
  if (id.includes('transfor')) return RefreshCw;
  if (id.includes('carga') || id.includes('load')) return Upload;
  if (id.includes('fin') || id.includes('end')) return CheckCircle;
  return Circle;
};

// Nodo visual de fase (sin interactividad)
function PhaseNode({
  phase,
  status,
  progress,
  isLast,
}: {
  phase: ScriptFase;
  status: PhaseStatus;
  progress?: number;
  isLast: boolean;
}) {
  const Icon = getPhaseIcon(phase.id);

  const statusColors = {
    pending: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500',
    running: 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400',
    completed: 'bg-green-50 dark:bg-green-950 border-green-400 dark:border-green-500 text-green-600 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-950 border-red-400 dark:border-red-500 text-red-600 dark:text-red-400',
  };

  const connectorColors = {
    pending: 'bg-gray-300 dark:bg-gray-600',
    running: 'bg-blue-400 dark:bg-blue-500',
    completed: 'bg-green-400 dark:bg-green-500',
    error: 'bg-red-400 dark:bg-red-500',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Nodo */}
      <div
        className={`
          relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center
          transition-all duration-300
          ${statusColors[status]}
          ${status === 'running' ? 'animate-pulse' : ''}
        `}
      >
        {status === 'running' ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : status === 'completed' ? (
          <CheckCircle className="h-6 w-6" />
        ) : status === 'error' ? (
          <XCircle className="h-6 w-6" />
        ) : (
          <Icon className="h-6 w-6" />
        )}

        {/* Progreso circular */}
        {status === 'running' && progress !== undefined && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {progress}%
          </div>
        )}
      </div>

      {/* Label */}
      <span className={`mt-2 text-xs font-medium text-center max-w-20 line-clamp-2 ${
        status === 'pending' ? 'text-muted-foreground' : ''
      }`}>
        {phase.nombre}
      </span>

      {/* Conector */}
      {!isLast && (
        <div className="flex flex-col items-center mt-2 mb-2">
          <div className={`w-0.5 h-4 ${connectorColors[status === 'completed' ? 'completed' : 'pending']}`} />
          <ArrowDown className={`h-4 w-4 ${status === 'completed' ? 'text-green-500' : 'text-gray-400'}`} />
          <div className={`w-0.5 h-4 ${connectorColors[status === 'completed' ? 'completed' : 'pending']}`} />
        </div>
      )}
    </div>
  );
}

// Diagrama de flujo visual (solo visualización)
function FlowDiagram({
  phases,
  phasesStatus,
}: {
  phases: ScriptFase[];
  phasesStatus: Record<string, PhaseState>;
}) {
  return (
    <div className="flex flex-col items-center py-4">
      {phases.map((phase, index) => {
        const state = phasesStatus[phase.id] || { status: 'pending' as PhaseStatus, progress: 0 };
        return (
          <PhaseNode
            key={phase.id}
            phase={phase}
            status={state.status}
            progress={state.progress}
            isLast={index === phases.length - 1}
          />
        );
      })}
    </div>
  );
}

// Panel de error amigable
function ErrorPanel({ error }: { error: string }) {
  const translated = translateError(error);

  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 dark:text-red-200">
            {translated.message}
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {translated.recommendation}
          </p>
        </div>
      </div>

      {/* Detalle técnico colapsable */}
      <Accordion type="single" collapsible>
        <AccordionItem value="tech" className="border-0">
          <AccordionTrigger className="py-2 text-xs text-red-600 dark:text-red-400 hover:no-underline">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Ver detalle técnico
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <code className="text-xs font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded block break-all">
              {error}
            </code>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Configurador de programación mejorado
function ScheduleConfigurator({
  value,
  onChange
}: {
  value: string;
  onChange: (cron: string) => void;
}) {
  const [mode, setMode] = useState<ScheduleMode>('daily');
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('0');
  const [interval, setInterval] = useState('8');
  const [weekdays, setWeekdays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [customCron, setCustomCron] = useState(value);

  // Actualizar cron cuando cambian los valores
  useEffect(() => {
    if (mode === 'cron') {
      onChange(customCron);
    } else {
      const newCron = generateCronFromSchedule(mode, { hour, minute, interval, weekdays });
      onChange(newCron);
    }
  }, [mode, hour, minute, interval, weekdays, customCron, onChange]);

  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as ScheduleMode)} className="space-y-2">
        {SCHEDULE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                mode === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Icon className={`h-5 w-5 ${mode === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.desc}</p>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      <Separator />

      {/* Configuración según modo */}
      {mode === 'hourly' && (
        <div className="space-y-2">
          <Label>Ejecutar cada</Label>
          <div className="flex items-center gap-2">
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 6, 8, 12].map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">horas</span>
          </div>
        </div>
      )}

      {mode === 'daily' && (
        <div className="space-y-2">
          <Label>Hora de ejecución</Label>
          <div className="flex items-center gap-2">
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-bold">:</span>
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 15, 30, 45].map((m) => (
                  <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {mode === 'weekly' && (
        <div className="space-y-3">
          <Label>Días de la semana</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => {
                  setWeekdays(prev =>
                    prev.includes(day.value)
                      ? prev.filter(d => d !== day.value)
                      : [...prev, day.value]
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  weekdays.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Hora de ejecución</Label>
            <div className="flex items-center gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-lg font-bold">:</span>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((m) => (
                    <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {mode === 'cron' && (
        <div className="space-y-2">
          <Label>Expresión Cron</Label>
          <Input
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            placeholder="0 9 * * *"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Formato: minuto hora día mes día-semana
          </p>
        </div>
      )}

      {/* Preview */}
      {mode !== 'manual' && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              {interpretarCron(generateCronFromSchedule(mode, { hour, minute, interval, weekdays }))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Editor de variables mejorado
function VariablesEditor({
  variables,
  onChange,
  requiredVariables = []
}: {
  variables: Record<string, string | number | boolean>;
  onChange: (vars: Record<string, string | number | boolean>) => void;
  requiredVariables?: ScriptVariable[];
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addVariable = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    onChange({ ...variables, [newKey]: newValue });
    setNewKey('');
    setNewValue('');
  };

  const removeVariable = (key: string) => {
    const { [key]: _, ...rest } = variables;
    onChange(rest);
  };

  const updateVariable = (key: string, value: string) => {
    onChange({ ...variables, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Las variables personalizan cómo se ejecuta la automatización.
            Define fechas, identificadores o cualquier parámetro que necesite el proceso.
          </p>
        </div>
      </div>

      {/* Variables del script */}
      {requiredVariables.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Variables del Script</Label>
          {requiredVariables.map((reqVar) => {
            const currentValue = variables[reqVar.nombre] ?? reqVar.default ?? '';
            return (
              <div key={reqVar.nombre} className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{reqVar.nombre}</span>
                    {reqVar.requerida && (
                      <Badge variant="outline" className="text-[10px] h-5 border-orange-300 text-orange-600">
                        Requerida
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{reqVar.descripcion}</p>

                {reqVar.tipo === 'fecha' ? (
                  <Input
                    type="date"
                    value={String(currentValue)}
                    onChange={(e) => updateVariable(reqVar.nombre, e.target.value)}
                    className="h-9"
                  />
                ) : reqVar.tipo === 'opcion' && reqVar.opciones ? (
                  <Select value={String(currentValue)} onValueChange={(v) => updateVariable(reqVar.nombre, v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {reqVar.opciones.map((op) => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={reqVar.tipo === 'numero' ? 'number' : 'text'}
                    placeholder={reqVar.default || `Valor para ${reqVar.nombre}`}
                    value={String(currentValue)}
                    onChange={(e) => updateVariable(reqVar.nombre, e.target.value)}
                    className="h-9"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Variables adicionales */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Variables Adicionales</Label>

        {Object.entries(variables)
          .filter(([key]) => !requiredVariables.some(rv => rv.nombre === key))
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
              <code className="text-xs font-mono bg-background px-2 py-1 rounded border flex-1 truncate">
                <span className="text-primary font-semibold">{key}</span>
                <span className="text-muted-foreground"> = </span>
                <span>{String(value)}</span>
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariable(key)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

        <form onSubmit={addVariable} className="flex flex-col sm:flex-row gap-2 pt-1">
          <Input
            type="text"
            placeholder="Nombre"
            value={newKey}
            onChange={e => setNewKey(e.target.value.toUpperCase().replace(/\s/g, '_'))}
            className="text-sm flex-1 h-9"
          />
          <Input
            type="text"
            placeholder="Valor"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="text-sm flex-1 h-9"
          />
          <Button type="submit" variant="outline" size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </form>
      </div>
    </div>
  );
}

// Panel de ejecución en tiempo real con diagrama de flujo
function ExecutionMonitor({
  executionId,
  automatizacion,
  phases,
  onClose,
  onCancel
}: {
  executionId: string;
  automatizacion: Automatizacion;
  phases?: ScriptFase[];
  onClose: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [phasesStatus, setPhasesStatus] = useState<Record<string, PhaseState>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Construir estado de fases a partir del status
  useEffect(() => {
    if (!phases || !status) return;

    const newPhasesStatus: Record<string, PhaseState> = {};

    phases.forEach((phase) => {
      const isCompleted = status.phases_completed.includes(phase.id);
      const isCurrent = status.current_phase?.id === phase.id;

      // Filtrar mensajes de esta fase (simplificado)
      const phaseLogs = status.messages.filter(m =>
        m.message.toLowerCase().includes(phase.nombre.toLowerCase()) ||
        m.message.toLowerCase().includes(phase.id.toLowerCase())
      );

      newPhasesStatus[phase.id] = {
        id: phase.id,
        nombre: phase.nombre,
        descripcion: phase.descripcion,
        status: status.status === 'error' && isCurrent ? 'error' :
                isCompleted ? 'completed' :
                isCurrent ? 'running' : 'pending',
        progress: isCurrent ? status.progress.percentage : isCompleted ? 100 : 0,
        started_at: isCurrent ? status.current_phase?.started_at : undefined,
        logs: phaseLogs,
      };
    });

    setPhasesStatus(newPhasesStatus);
  }, [phases, status]);

  const pollStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        execution_id: executionId,
        correo: user?.correo || '',
        organizacion: user?.organizacion || '',
      });

      const response = await fetch(`${API_URL}/automatizaciones/status?${params}`, {
        headers: getHeaders()
      });

      const result = await response.json();

      if (result.success) {
        setStatus(result.data);

        if (result.data.status !== 'running') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  }, [executionId, user?.correo, user?.organizacion]);

  useEffect(() => {
    pollStatus();
    pollRef.current = setInterval(pollStatus, 1500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [pollStatus]);

  const handleCancel = async () => {
    try {
      const response = await fetch(`${API_URL}/automatizaciones/ejecutar`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: user?.correo,
          organizacion: user?.organizacion,
          execution_id: executionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Ejecución cancelada" });
        onCancel();
      }
    } catch (err) {
      toast({
        title: "Error al cancelar",
        variant: "destructive",
      });
    }
  };

  const isRunning = status?.status === 'running';
  const isCompleted = status?.status === 'completed';
  const isError = status?.status === 'error';

  return (
    <div className="space-y-6">
      {/* Header con estado global */}
      <div className={`rounded-xl p-4 ${
        isCompleted ? 'bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700' :
        isError ? 'bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700' :
        'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isRunning && <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}
            {isCompleted && <CheckCircle className="h-6 w-6 text-green-600" />}
            {isError && <XCircle className="h-6 w-6 text-red-600" />}
            <div>
              <h3 className="font-semibold text-lg">{automatizacion.nombre_display}</h3>
              <p className="text-sm text-muted-foreground">
                {isRunning && `Ejecutando: ${status?.current_phase?.nombre || 'Iniciando...'}`}
                {isCompleted && 'Proceso completado exitosamente'}
                {isError && 'El proceso finalizó con errores'}
              </p>
            </div>
          </div>
          {isRunning && (
            <Button variant="outline" size="sm" onClick={handleCancel} className="text-destructive border-destructive">
              <StopCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>

        {/* Progreso global */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progreso total</span>
            <span className="text-muted-foreground">{status?.progress?.percentage || 0}%</span>
          </div>
          <Progress
            value={status?.progress?.percentage || 0}
            className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : isError ? '[&>div]:bg-red-500' : ''}`}
          />
          {(status?.progress?.items_total ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              {status?.progress?.items_processed} de {status?.progress?.items_total} elementos procesados
            </p>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Diagrama de flujo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Flujo del Proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {phases && phases.length > 0 ? (
              <FlowDiagram
                phases={phases}
                phasesStatus={phasesStatus}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin información de fases</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log de actividad */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Log de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded border bg-muted/30 p-3">
                {status?.messages && status.messages.length > 0 ? (
                  <div className="space-y-1.5">
                    {status.messages.map((msg, i) => (
                      <div key={i} className={`text-xs font-mono flex gap-2 ${
                        msg.level === 'error' ? 'text-red-600' :
                        msg.level === 'warning' ? 'text-yellow-600' :
                        'text-muted-foreground'
                      }`}>
                        <span className="opacity-50 shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                        <span>{msg.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Esperando mensajes...
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Error amigable */}
          {isError && status?.error && (
            <ErrorPanel error={status.error} />
          )}
        </div>
      </div>

      {/* Botón de cerrar */}
      {!isRunning && (
        <Button onClick={onClose} className="w-full h-11">
          {isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Cerrar
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Entendido
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export function AutomationsSection() {
  const { user: currentUser } = useAuth();
  const [scriptsDisponibles, setScriptsDisponibles] = useState<ScriptDisponible[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);
  const [logs, setLogs] = useState<LogEjecucion[]>([]);
  const [loading, setLoading] = useState(true);

  // Diálogos
  const [dialogConfigOpen, setDialogConfigOpen] = useState(false);
  const [dialogLogsOpen, setDialogLogsOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [dialogExecutionOpen, setDialogExecutionOpen] = useState(false);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);

  // Selecciones
  const [scriptSeleccionado, setScriptSeleccionado] = useState<ScriptDisponible | null>(null);
  const [automatizacionSeleccionada, setAutomatizacionSeleccionada] = useState<Automatizacion | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  // Formularios
  const [formConfig, setFormConfig] = useState({
    cron_expresion: '0 9 * * *',
    descripcion: '',
    variables_personalizadas: {} as Record<string, string | number | boolean>,
  });

  const [formEdit, setFormEdit] = useState({
    descripcion: '',
    cron_expresion: '',
    variables_personalizadas: {} as Record<string, string | number | boolean>,
  });

  const isAdmin = currentUser?.tipo_usuario === 'administrador';

  // ==================== EFECTOS ====================

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==================== FUNCIONES DE CARGA ====================

  const cargarDatos = async () => {
    await Promise.all([cargarScriptsDisponibles(), cargarAutomatizaciones()]);
    setLoading(false);
  };

  const cargarScriptsDisponibles = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) return;

      const params = new URLSearchParams({
        organizacion: currentUser.organizacion,
        correo: currentUser.correo,
      });

      const response = await fetch(`${API_URL}/automatizaciones/disponibles?${params}`, {
        headers: getHeaders()
      });

      const result = await response.json();

      if (result.success) {
        setScriptsDisponibles(result.data.scripts_disponibles || []);
      }
    } catch (error) {
      console.error('Error cargando scripts:', error);
    }
  };

  const cargarAutomatizaciones = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) return;

      const params = new URLSearchParams({
        organizacion: currentUser.organizacion,
        correo: currentUser.correo,
      });

      const response = await fetch(`${API_URL}/automatizaciones?${params}`, {
        headers: getHeaders()
      });

      const result = await response.json();

      if (result.success) {
        setAutomatizaciones(result.data.automatizaciones || []);
      }
    } catch (error) {
      console.error('Error cargando automatizaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las automatizaciones",
        variant: "destructive",
      });
    }
  };

  const cargarLogs = async (idAutomatizacion: number) => {
    try {
      const params = new URLSearchParams({
        organizacion: currentUser?.organizacion || '',
        correo: currentUser?.correo || '',
        id_automatizacion: String(idAutomatizacion),
      });

      const response = await fetch(`${API_URL}/automatizaciones/logs?${params}`, {
        headers: getHeaders()
      });

      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  };

  // ==================== ACCIONES ====================

  const abrirDialogConfig = (script: ScriptDisponible) => {
    setScriptSeleccionado(script);

    const varsIniciales: Record<string, string> = {};
    if (script.metadata?.variables_requeridas) {
      script.metadata.variables_requeridas.forEach(v => {
        if (v.default) {
          varsIniciales[v.nombre] = v.default;
        }
      });
    }

    setFormConfig({
      cron_expresion: '0 9 * * *',
      descripcion: script.metadata?.descripcion || script.descripcion_sugerida || '',
      variables_personalizadas: varsIniciales,
    });
    setDialogConfigOpen(true);
  };

  const abrirDialogDetail = (script: ScriptDisponible) => {
    setScriptSeleccionado(script);
    setDialogDetailOpen(true);
  };

  const configurarAutomatizacion = async () => {
    if (!scriptSeleccionado) return;

    if (formConfig.cron_expresion !== 'manual') {
      const validacion = validarCron(formConfig.cron_expresion);
      if (!validacion.valido) {
        toast({
          title: "Configuración inválida",
          description: validacion.mensaje,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const nombreBase = scriptSeleccionado.script_path.replace('.py', '');
      const nombreConPrefijo = nombreBase.startsWith('prod_') ? nombreBase : `prod_${nombreBase}`;

      const payload = {
        correo_admin: currentUser?.correo,
        organizacion: currentUser?.organizacion,
        nombre: nombreConPrefijo,
        descripcion: formConfig.descripcion,
        script_path: scriptSeleccionado.script_path,
        cron_expresion: formConfig.cron_expresion === 'manual' ? '0 0 31 2 *' : formConfig.cron_expresion,
        ...(Object.keys(formConfig.variables_personalizadas).length > 0 && {
          variables_personalizadas: formConfig.variables_personalizadas
        })
      };

      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Automatización configurada",
          description: "Se creó deshabilitada. Actívala cuando estés listo.",
        });
        cargarDatos();
        setDialogConfigOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo configurar",
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
        toast({ title: !estadoActual ? "Activada" : "Desactivada" });
        cargarAutomatizaciones();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar estado",
        variant: "destructive",
      });
    }
  };

  const ejecutarManual = async (auto: Automatizacion) => {
    try {
      const response = await fetch(`${API_URL}/automatizaciones/ejecutar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_automatizacion: auto.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAutomatizacionSeleccionada(auto);
        setCurrentExecutionId(result.data.execution_id);
        setDialogExecutionOpen(true);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo ejecutar",
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
      variables_personalizadas: auto.variables_personalizadas || {},
    });
    setDialogEditOpen(true);
  };

  const editarAutomatizacion = async () => {
    if (!automatizacionSeleccionada) return;

    try {
      const payload = {
        correo_admin: currentUser?.correo,
        organizacion: currentUser?.organizacion,
        id_automatizacion: automatizacionSeleccionada.id,
        descripcion: formEdit.descripcion,
        cron_expresion: formEdit.cron_expresion,
        ...(Object.keys(formEdit.variables_personalizadas).length > 0 && {
          variables_personalizadas: formEdit.variables_personalizadas
        })
      };

      const response = await fetch(`${API_URL}/automatizaciones`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Cambios guardados" });
        cargarAutomatizaciones();
        setDialogEditOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  const eliminarAutomatizacion = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

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
        toast({ title: "Eliminada correctamente" });
        cargarDatos();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  // ==================== RENDERS ====================

  const getEstadoBadge = (estado: 'exitoso' | 'error' | 'advertencia' | 'en_ejecucion' | null) => {
    if (!estado) return <Badge variant="secondary">Sin ejecuciones</Badge>;

    switch (estado) {
      case 'exitoso':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />Exitoso
          </Badge>
        );
      case 'advertencia':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />Con advertencias
          </Badge>
        );
      case 'en_ejecucion':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />En ejecución
          </Badge>
        );
      case 'error':
      default:
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />Error
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando automatizaciones...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  const scriptsNoConfigurados = scriptsDisponibles.filter(s => !s.configurado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Automatizaciones</h1>
        <p className="text-muted-foreground mt-1">
          Configura y monitorea procesos automatizados para tu organización
        </p>
      </div>

      {/* Scripts Disponibles */}
      {scriptsNoConfigurados.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Scripts Disponibles</h2>
            <Badge variant="secondary">{scriptsNoConfigurados.length}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scriptsNoConfigurados.map((script) => (
              <Card key={script.script_path} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="p-4 pb-3 border-b bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FileCode className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base capitalize truncate">
                          {script.metadata?.nombre || script.nombre_display}
                        </h3>
                        <code className="text-[10px] text-muted-foreground">{script.script_path}</code>
                      </div>
                    </div>
                    {script.es_especifico_org && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 shrink-0">
                        <Zap className="h-3 w-3 mr-1" />Exclusivo
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {(script.metadata?.descripcion || script.descripcion_sugerida) && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {script.metadata?.descripcion || script.descripcion_sugerida}
                    </p>
                  )}

                  {/* Preview de fases */}
                  {script.metadata?.fases && script.metadata.fases.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {script.metadata.fases.slice(0, 4).map((fase) => {
                          const Icon = getPhaseIcon(fase.id);
                          return (
                            <div key={fase.id} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {script.metadata.fases.length} fases
                      </span>
                    </div>
                  )}

                  {script.metadata?.variables_requeridas && script.metadata.variables_requeridas.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Variable className="h-3 w-3" />
                      <span>{script.metadata.variables_requeridas.filter(v => v.requerida).length} variables requeridas</span>
                    </div>
                  )}
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  {script.tiene_metadata && (
                    <Button variant="ghost" size="sm" onClick={() => abrirDialogDetail(script)} className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />Ver detalles
                    </Button>
                  )}
                  <Button size="sm" onClick={() => abrirDialogConfig(script)} className="flex-1">
                    <Settings2 className="h-4 w-4 mr-1" />Configurar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Automatizaciones Configuradas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Mis Automatizaciones</h2>
          <Badge variant="secondary">{automatizaciones.length}</Badge>
        </div>

        {automatizaciones.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <div className="inline-block p-6 bg-muted rounded-full mb-4">
              <Zap className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay automatizaciones configuradas</h3>
            <p className="text-muted-foreground mb-4">
              Configura un script disponible para comenzar a automatizar procesos
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {automatizaciones.map((auto) => (
              <Card key={auto.id} className="overflow-hidden">
                <div className={`p-4 border-b ${auto.activo ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-muted/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl ${auto.activo ? 'bg-green-100 dark:bg-green-900/50' : 'bg-muted'}`}>
                        <Zap className={`h-6 w-6 ${auto.activo ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base capitalize truncate">{auto.nombre_display}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{auto.descripcion}</p>
                      </div>
                    </div>
                    <Switch
                      checked={auto.activo}
                      onCheckedChange={() => toggleActivo(auto.id, auto.activo)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={auto.activo ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}>
                      {auto.activo ? (
                        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />Activo</>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5" />Inactivo</>
                      )}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {interpretarCron(auto.cron_expresion)}
                    </Badge>
                  </div>

                  {auto.ultima_ejecucion ? (
                    <div className={`rounded-lg p-3 ${auto.ultima_estado === 'exitoso' ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Última ejecución</p>
                          <p className="text-sm font-medium">
                            {new Date(auto.ultima_ejecucion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {getEstadoBadge(auto.ultima_estado)}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg p-3 bg-muted/30 border-2 border-dashed text-center">
                      <p className="text-sm text-muted-foreground">Sin ejecuciones aún</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{auto.total_ejecuciones}</p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300">Total</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{auto.ejecuciones_exitosas}</p>
                      <p className="text-[10px] text-green-700 dark:text-green-300">Exitosas</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{auto.ejecuciones_error}</p>
                      <p className="text-[10px] text-red-700 dark:text-red-300">Errores</p>
                    </div>
                  </div>

                  {auto.variables_personalizadas && Object.keys(auto.variables_personalizadas).length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="vars" className="border rounded-lg">
                        <AccordionTrigger className="px-3 py-2 hover:no-underline">
                          <span className="flex items-center gap-2 text-sm">
                            <Variable className="h-4 w-4" />
                            Variables ({Object.keys(auto.variables_personalizadas).length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="space-y-1.5">
                            {Object.entries(auto.variables_personalizadas).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between text-xs font-mono bg-muted/50 px-2 py-1.5 rounded">
                                <span className="text-primary font-medium">{key}</span>
                                <span className="text-muted-foreground truncate ml-2">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <Button variant="default" size="sm" onClick={() => ejecutarManual(auto)} className="h-10">
                    <Play className="h-4 w-4 mr-1" />Ejecutar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => abrirDialogLogs(auto)} className="h-10">
                    <History className="h-4 w-4 mr-1" />Historial
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => abrirDialogEdit(auto)} className="h-10">
                    <Edit className="h-4 w-4 mr-1" />Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminarAutomatizacion(auto.id, auto.nombre_display)} className="h-10 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ==================== DIÁLOGOS ==================== */}

      {/* Detalle de Script */}
      <Dialog open={dialogDetailOpen} onOpenChange={setDialogDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              {scriptSeleccionado?.metadata?.nombre || scriptSeleccionado?.nombre_display}
            </DialogTitle>
            <DialogDescription>{scriptSeleccionado?.script_path}</DialogDescription>
          </DialogHeader>

          {scriptSeleccionado?.metadata && (
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-sm font-medium mb-1">Descripción</h4>
                <p className="text-sm text-muted-foreground">{scriptSeleccionado.metadata.descripcion}</p>
              </div>

              {scriptSeleccionado.metadata.fases && scriptSeleccionado.metadata.fases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Flujo del Proceso
                  </h4>
                  <div className="flex flex-col items-center py-2">
                    {scriptSeleccionado.metadata.fases.map((fase, i) => {
                      const Icon = getPhaseIcon(fase.id);
                      return (
                        <div key={fase.id} className="flex flex-col items-center">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 w-full">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{fase.nombre}</p>
                              {fase.descripcion && <p className="text-xs text-muted-foreground">{fase.descripcion}</p>}
                            </div>
                            <Badge variant="outline" className="text-[10px]">{fase.peso}%</Badge>
                          </div>
                          {i < scriptSeleccionado.metadata!.fases!.length - 1 && (
                            <ArrowDown className="h-4 w-4 text-muted-foreground my-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {scriptSeleccionado.metadata.variables_requeridas && scriptSeleccionado.metadata.variables_requeridas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Variable className="h-4 w-4" />Variables
                  </h4>
                  <div className="space-y-2">
                    {scriptSeleccionado.metadata.variables_requeridas.map((v) => (
                      <div key={v.nombre} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-medium text-primary">{v.nombre}</code>
                          <Badge variant={v.requerida ? "outline" : "secondary"} className="text-[10px]">
                            {v.requerida ? 'Requerida' : 'Opcional'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => { setDialogDetailOpen(false); if (scriptSeleccionado) abrirDialogConfig(scriptSeleccionado); }} className="w-full h-11">
                <Settings2 className="h-4 w-4 mr-2" />Configurar este script
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Configurar Script */}
      <Dialog open={dialogConfigOpen} onOpenChange={setDialogConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Configurar Automatización
            </DialogTitle>
          </DialogHeader>

          {scriptSeleccionado && (
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="schedule">Programación</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="info">Información</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <ScheduleConfigurator
                  value={formConfig.cron_expresion}
                  onChange={(cron) => setFormConfig({ ...formConfig, cron_expresion: cron })}
                />
              </TabsContent>

              <TabsContent value="variables" className="space-y-4 mt-4">
                <VariablesEditor
                  variables={formConfig.variables_personalizadas}
                  onChange={(vars) => setFormConfig({ ...formConfig, variables_personalizadas: vars })}
                  requiredVariables={scriptSeleccionado.metadata?.variables_requeridas}
                />
              </TabsContent>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <FileCode className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{scriptSeleccionado.metadata?.nombre || scriptSeleccionado.nombre_display}</h4>
                      <code className="text-xs text-muted-foreground">{scriptSeleccionado.script_path}</code>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formConfig.descripcion}
                    onChange={(e) => setFormConfig({ ...formConfig, descripcion: e.target.value })}
                    placeholder="Describe qué hace esta automatización"
                    rows={3}
                  />
                </div>

                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      La automatización se creará <strong>deshabilitada</strong>. Actívala manualmente después de verificar la configuración.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <div className="flex gap-3 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setDialogConfigOpen(false)} className="flex-1 h-11">
                  Cancelar
                </Button>
                <Button onClick={configurarAutomatizacion} className="flex-1 h-11">
                  <Zap className="h-4 w-4 mr-2" />Configurar
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Ejecución en Tiempo Real */}
      <Dialog open={dialogExecutionOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogExecutionOpen(false);
          setCurrentExecutionId(null);
          cargarAutomatizaciones();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monitor de Ejecución
            </DialogTitle>
          </DialogHeader>

          {currentExecutionId && automatizacionSeleccionada && (
            <ExecutionMonitor
              executionId={currentExecutionId}
              automatizacion={automatizacionSeleccionada}
              phases={scriptsDisponibles.find(s => s.script_path === automatizacionSeleccionada.script_path)?.metadata?.fases}
              onClose={() => {
                setDialogExecutionOpen(false);
                setCurrentExecutionId(null);
                cargarAutomatizaciones();
              }}
              onCancel={() => {
                setDialogExecutionOpen(false);
                setCurrentExecutionId(null);
                cargarAutomatizaciones();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Historial de Logs */}
      <Dialog open={dialogLogsOpen} onOpenChange={setDialogLogsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Historial de Ejecuciones
            </DialogTitle>
            <DialogDescription>{automatizacionSeleccionada?.nombre_display}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay ejecuciones registradas</p>
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.fecha_inicio).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {getEstadoBadge(log.estado)}
                        {log.duracion_segundos != null && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />{log.duracion_segundos}s
                          </Badge>
                        )}
                        {log.es_programado === false && (
                          <Badge variant="secondary" className="text-xs">Manual</Badge>
                        )}
                      </div>
                      {log.ejecutado_por && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {log.ejecutado_por}
                        </p>
                      )}
                    </div>
                  </div>

                  {log.error_mensaje && (
                    <ErrorPanel error={log.error_mensaje} />
                  )}

                  {log.output && !log.error_mensaje && (
                    <ScrollArea className="h-20 w-full rounded border bg-muted/30 p-2">
                      <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{log.output}</p>
                    </ScrollArea>
                  )}
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editar Automatización */}
      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Automatización
            </DialogTitle>
          </DialogHeader>

          {automatizacionSeleccionada && (
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="schedule">Programación</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="info">Información</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <ScheduleConfigurator
                  value={formEdit.cron_expresion}
                  onChange={(cron) => setFormEdit({ ...formEdit, cron_expresion: cron })}
                />
              </TabsContent>

              <TabsContent value="variables" className="space-y-4 mt-4">
                <VariablesEditor
                  variables={formEdit.variables_personalizadas}
                  onChange={(vars) => setFormEdit({ ...formEdit, variables_personalizadas: vars })}
                  requiredVariables={scriptsDisponibles.find(s => s.script_path === automatizacionSeleccionada.script_path)?.metadata?.variables_requeridas}
                />
              </TabsContent>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h4 className="font-semibold capitalize">{automatizacionSeleccionada.nombre_display}</h4>
                  <code className="text-xs text-muted-foreground">{automatizacionSeleccionada.script_path}</code>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-descripcion">Descripción</Label>
                  <Textarea
                    id="edit-descripcion"
                    value={formEdit.descripcion}
                    onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <div className="flex gap-3 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setDialogEditOpen(false)} className="flex-1 h-11">
                  Cancelar
                </Button>
                <Button onClick={editarAutomatizacion} className="flex-1 h-11">
                  Guardar Cambios
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
