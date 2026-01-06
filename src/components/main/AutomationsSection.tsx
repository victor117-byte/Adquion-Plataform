import { useState, useEffect } from "react";
import { Play, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, Settings2, FileCode, TrendingUp } from "lucide-react";
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
  });

  const [formEdit, setFormEdit] = useState({
    descripcion: '',
    cron_expresion: '',
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
    });
    setDialogConfigOpen(true);
  };

  const configurarAutomatizacion = async () => {
    if (!scriptSeleccionado) return;

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
        setDialogConfigOpen(false);
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
    });
    setDialogEditOpen(true);
  };

  const editarAutomatizacion = async () => {
    if (!automatizacionSeleccionada) return;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Automatizaciones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las automatizaciones productivas de tu organización
        </p>
      </div>

      {/* Scripts Disponibles */}
      {scriptsNoConfigurados.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Scripts Disponibles ({scriptsNoConfigurados.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Scripts productivos listos para configurar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scriptsNoConfigurados.map((script) => (
              <Card key={script.script_path} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <FileCode className="h-8 w-8 text-primary" />
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Sin configurar</Badge>
                </div>
                <h4 className="font-semibold mb-1 capitalize">{script.nombre_display}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  <code className="bg-muted px-1 py-0.5 rounded">{script.script_path}</code>
                </p>
                <Button
                  size="sm"
                  onClick={() => abrirDialogConfig(script)}
                  className="w-full"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Automatizaciones Configuradas */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Automatizaciones Configuradas ({automatizaciones.length})
          </h3>
        </div>

        {automatizaciones.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No hay automatizaciones configuradas</h3>
            <p className="text-sm text-muted-foreground">
              Configura un script disponible para comenzar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Automatización</TableHead>
                <TableHead>Cron</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Ejecución</TableHead>
                <TableHead>Estadísticas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automatizaciones.map((auto) => (
                <TableRow key={auto.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium capitalize">{auto.nombre_display}</div>
                      <div className="text-sm text-muted-foreground">{auto.descripcion}</div>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{auto.script_path}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <code className="text-xs">{auto.cron_expresion}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={auto.activo}
                        onCheckedChange={() => toggleActivo(auto.id, auto.activo)}
                      />
                      <Badge className={auto.activo ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"}>
                        {auto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {auto.ultima_ejecucion ? (
                      <div>
                        <div className="text-sm">{new Date(auto.ultima_ejecucion).toLocaleString()}</div>
                        {getEstadoBadge(auto.ultima_estado)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin ejecuciones</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>Total: {auto.total_ejecuciones}</div>
                      <div className="text-green-600">✓ {auto.ejecuciones_exitosas}</div>
                      <div className="text-red-600">✗ {auto.ejecuciones_error}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => ejecutarManual(auto.id, auto.nombre_display)}
                        title="Ejecutar ahora"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirDialogLogs(auto)}
                        title="Ver logs"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirDialogEdit(auto)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarAutomatizacion(auto.id, auto.nombre_display)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog Configurar */}
      <Dialog open={dialogConfigOpen} onOpenChange={setDialogConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Automatización</DialogTitle>
          </DialogHeader>
          {scriptSeleccionado && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold capitalize">{scriptSeleccionado.nombre_display}</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">{scriptSeleccionado.script_path}</code>
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

              <div className="space-y-2">
                <Label htmlFor="cron">Expresión Cron</Label>
                <Input
                  id="cron"
                  value={formConfig.cron_expresion}
                  onChange={(e) => setFormConfig({ ...formConfig, cron_expresion: e.target.value })}
                  placeholder="0 2 * * *"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplos: <code>0 2 * * *</code> (diario 2am), <code>0 */6 * * *</code> (cada 6 horas)
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ La automatización se creará <strong>deshabilitada por defecto</strong>. Actívala después de probarla.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={configurarAutomatizacion}>
                  Configurar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Logs */}
      <Dialog open={dialogLogsOpen} onOpenChange={setDialogLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historial de Ejecuciones - {automatizacionSeleccionada?.nombre_display}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay ejecuciones registradas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getEstadoBadge(log.estado)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Inicio: {new Date(log.fecha_inicio).toLocaleString()}</div>
                          <div className="text-muted-foreground">Fin: {new Date(log.fecha_fin).toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>{log.duracion_segundos}s</TableCell>
                      <TableCell>
                        {log.error_mensaje ? (
                          <div className="text-xs text-red-600 max-w-md">
                            <strong>Error:</strong> {log.error_mensaje}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground max-w-md truncate">
                            {log.output || 'Sin output'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Automatización</DialogTitle>
          </DialogHeader>
          {automatizacionSeleccionada && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold capitalize">{automatizacionSeleccionada.nombre_display}</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">{automatizacionSeleccionada.script_path}</code>
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

              <div className="space-y-2">
                <Label htmlFor="edit-cron">Expresión Cron</Label>
                <Input
                  id="edit-cron"
                  value={formEdit.cron_expresion}
                  onChange={(e) => setFormEdit({ ...formEdit, cron_expresion: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editarAutomatizacion}>
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
