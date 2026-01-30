import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, BarChart3, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Reporte {
  id: number;
  titulo: string;
  descripcion: string;
  url_embed: string;
  visible_para: 'todos' | 'solo_admin' | 'contadores' | 'usuarios_especificos';
  usuarios_permitidos: number[];
  estado: 'activo' | 'inactivo';
  creado_por: number;
  creado_por_nombre: string;
  creado_por_correo: string;
  created_at: string;
}

interface User {
  id: number;
  nombre: string;
  correo: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

export function PowerBISection() {
  const { user: currentUser } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [reporteActivo, setReporteActivo] = useState<Reporte | null>(null);
  const [userRole, setUserRole] = useState<'administrador' | 'contador'>('contador');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReporte, setEditingReporte] = useState<Reporte | null>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    url_embed: '',
    visible_para: 'todos' as 'todos' | 'solo_admin' | 'contadores' | 'usuarios_especificos',
    usuarios_permitidos: [] as number[],
    estado: 'activo' as 'activo' | 'inactivo',
  });

  useEffect(() => {
    fetchReportes();
    if (currentUser?.tipo_usuario === 'administrador') {
      fetchUsuarios();
    }
  }, []);

  const fetchReportes = async () => {
    try {
      const response = await fetch(
        `${API_URL}/reportes`,
        {
          method: 'GET',
          credentials: 'include',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "No se pudieron cargar los reportes",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { role, reportes: fetchedReportes } = result.data;
      
      setUserRole(role);
      setReportes(fetchedReportes || []);
      
      if (fetchedReportes && fetchedReportes.length > 0) {
        setReporteActivo(fetchedReportes[0]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(
        `${API_URL}/auth/users`,
        {
          method: 'GET',
          credentials: 'include',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      if (result.success && result.data.users) {
        setUsuarios(result.data.users);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    }
  };

  const handleSaveReporte = async () => {
    try {
      if (!formData.titulo || !formData.url_embed) {
        toast({
          title: "Campos incompletos",
          description: "El título y la URL del reporte son obligatorios",
          variant: "destructive",
        });
        return;
      }

      if (editingReporte) {
        // Editar reporte existente
        const payload: any = {
          id_reporte: editingReporte.id,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          url_embed: formData.url_embed,
          visible_para: formData.visible_para,
          estado: formData.estado,
        };

        if (formData.visible_para === 'usuarios_especificos') {
          payload.usuarios_permitidos = formData.usuarios_permitidos;
        }

        const response = await fetch(`${API_URL}/reportes`, {
          method: 'PATCH',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Reporte actualizado",
            description: "El reporte se actualizó correctamente",
          });
          fetchReportes();
          setDialogOpen(false);
          resetForm();
        } else {
          throw new Error(result.message || 'Error al actualizar');
        }
      } else {
        // Crear nuevo reporte
        const payload: any = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          url_embed: formData.url_embed,
          visible_para: formData.visible_para,
        };

        if (formData.visible_para === 'usuarios_especificos') {
          payload.usuarios_permitidos = formData.usuarios_permitidos;
        }

        const response = await fetch(`${API_URL}/reportes`, {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Reporte creado",
            description: "El reporte fue creado exitosamente",
          });
          fetchReportes();
          setDialogOpen(false);
          resetForm();
        } else {
          throw new Error(result.message || 'Error al crear reporte');
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar reporte:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el reporte",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReporte = async (idReporte: number) => {
    if (!confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/reportes`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({
          id_reporte: idReporte,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Reporte eliminado",
          description: "El reporte fue eliminado correctamente"
        });
        
        if (reporteActivo?.id === idReporte) {
          setReporteActivo(null);
        }
        
        fetchReportes();
      } else {
        throw new Error(result.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error al eliminar reporte:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el reporte",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      url_embed: '',
      visible_para: 'todos',
      usuarios_permitidos: [],
      estado: 'activo',
    });
    setEditingReporte(null);
  };

  const openEditDialog = (reporte: Reporte) => {
    setEditingReporte(reporte);
    setFormData({
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      url_embed: reporte.url_embed,
      visible_para: reporte.visible_para,
      usuarios_permitidos: reporte.usuarios_permitidos || [],
      estado: reporte.estado,
    });
    setDialogOpen(true);
  };

  const getVisibilidadBadge = (visible_para: string) => {
    const badges = {
      'todos': <Badge className="bg-green-100 text-green-800 dark:bg-green-900">Todos</Badge>,
      'solo_admin': <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900">Solo Admin</Badge>,
      'contadores': <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900">Contadores</Badge>,
      'usuarios_especificos': <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900">Específicos</Badge>,
    };
    return badges[visible_para as keyof typeof badges] || badges['todos'];
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'activo') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900"><Eye className="h-3 w-3 mr-1" />Activo</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900"><EyeOff className="h-3 w-3 mr-1" />Inactivo</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando reportes...</div>;
  }

  if (reportes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground mt-1">
              Visualiza reportes embebidos (Power BI, Tableau, etc.)
            </p>
          </div>
          {userRole === 'administrador' && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Reporte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Reporte</DialogTitle>
                </DialogHeader>
                {renderFormulario()}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay reportes configurados</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'administrador' 
              ? 'Agrega tu primer reporte embebido de Power BI, Tableau u otra plataforma'
              : 'Aún no hay reportes disponibles para visualizar'
            }
          </p>
        </Card>
      </div>
    );
  }

  const renderFormulario = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título del Reporte *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Dashboard de Ventas 2026"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Análisis mensual de ventas y proyecciones"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url_embed">URL del Reporte (Embed) *</Label>
        <Input
          id="url_embed"
          value={formData.url_embed}
          onChange={(e) => setFormData({ ...formData, url_embed: e.target.value })}
          placeholder="https://app.powerbi.com/view?r=eyJr..."
          required
        />
        <p className="text-xs text-muted-foreground">
          Copia la URL del iframe desde Power BI, Tableau, Looker, etc.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visible_para">Visible Para</Label>
          <Select
            value={formData.visible_para}
            onValueChange={(value: any) => 
              setFormData({ ...formData, visible_para: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los usuarios</SelectItem>
              <SelectItem value="solo_admin">Solo administradores</SelectItem>
              <SelectItem value="contadores">Solo contadores</SelectItem>
              <SelectItem value="usuarios_especificos">Usuarios específicos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {editingReporte && (
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value: 'activo' | 'inactivo') => 
                setFormData({ ...formData, estado: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {formData.visible_para === 'usuarios_especificos' && (
        <div className="space-y-2">
          <Label>Usuarios Permitidos</Label>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {usuarios.map(usuario => (
              <label key={usuario.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={formData.usuarios_permitidos.includes(usuario.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        usuarios_permitidos: [...formData.usuarios_permitidos, usuario.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        usuarios_permitidos: formData.usuarios_permitidos.filter(id => id !== usuario.id)
                      });
                    }
                  }}
                />
                <span className="text-sm">{usuario.nombre} ({usuario.correo})</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {
          setDialogOpen(false);
          resetForm();
        }}>
          Cancelar
        </Button>
        <Button onClick={handleSaveReporte}>
          {editingReporte ? 'Guardar Cambios' : 'Crear Reporte'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Sidebar con lista de reportes */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Reportes</h2>
          {userRole === 'administrador' && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingReporte ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
                  </DialogTitle>
                </DialogHeader>
                {renderFormulario()}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {reportes.map((reporte) => (
            <Card
              key={reporte.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                reporteActivo?.id === reporte.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setReporteActivo(reporte)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{reporte.titulo}</h3>
                {userRole === 'administrador' && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(reporte);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReporte(reporte.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {reporte.descripcion && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {reporte.descripcion}
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
                {getVisibilidadBadge(reporte.visible_para)}
                {getEstadoBadge(reporte.estado)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Visualizador del reporte */}
      <div className="col-span-12 lg:col-span-9">
        {reporteActivo ? (
          <Card className="p-6 h-full">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{reporteActivo.titulo}</h1>
                  {reporteActivo.descripcion && (
                    <p className="text-muted-foreground mt-1">{reporteActivo.descripcion}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(reporteActivo.url_embed, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en ventana nueva
                </Button>
              </div>
              <div className="flex gap-2 items-center text-sm text-muted-foreground">
                <span>Creado por: {reporteActivo.creado_por_nombre}</span>
                <span>•</span>
                <span>{new Date(reporteActivo.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="relative w-full border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
              <iframe
                title={reporteActivo.titulo}
                src={reporteActivo.url_embed}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center h-full flex flex-col items-center justify-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un reporte</h3>
            <p className="text-muted-foreground">
              Elige un reporte de la lista para visualizarlo
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
