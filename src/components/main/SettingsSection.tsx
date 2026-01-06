import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, BarChart3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Reporte {
  id: number;
  titulo: string;
  descripcion: string;
  url_embed: string;
  visible_para: string;
  usuarios_permitidos: number[];
  estado: 'activo' | 'inactivo';
  creado_por: number;
  creado_por_nombre: string;
  creado_por_correo: string;
  created_at: string;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

export function SettingsSection() {
  const { user: currentUser } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReporte, setEditingReporte] = useState<Reporte | null>(null);

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
    fetchUsuarios();
  }, []);

  const fetchReportes = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/reportes?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setReportes(result.data.reportes || []);
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
      if (!currentUser?.correo || !currentUser?.organizacion) return;

      const response = await fetch(
        `${API_URL}/auth/users?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
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
      // Validaciones
      if (!formData.titulo || !formData.url_embed) {
        toast({
          title: "Campos incompletos",
          description: "El título y URL del reporte son requeridos",
          variant: "destructive",
        });
        return;
      }

      if (!formData.url_embed.startsWith('http')) {
        toast({
          title: "URL inválida",
          description: "La URL debe comenzar con http:// o https://",
          variant: "destructive",
        });
        return;
      }

      if (editingReporte) {
        // Editar reporte existente
        const response = await fetch(`${API_URL}/reportes`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            correo_admin: currentUser?.correo,
            organizacion: currentUser?.organizacion,
            id_reporte: editingReporte.id,
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            url_embed: formData.url_embed,
            visible_para: formData.visible_para,
            usuarios_permitidos: formData.usuarios_permitidos,
            estado: formData.estado,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Reporte actualizado",
            description: "El reporte se actualizó correctamente",
          });
          fetchReportes();
          closeDialog();
        } else {
          throw new Error(result.message || 'Error al actualizar');
        }
      } else {
        // Crear nuevo reporte
        const response = await fetch(`${API_URL}/reportes`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            correo_admin: currentUser?.correo,
            organizacion: currentUser?.organizacion,
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            url_embed: formData.url_embed,
            visible_para: formData.visible_para,
            usuarios_permitidos: formData.usuarios_permitidos,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Reporte creado",
            description: "El reporte fue creado exitosamente",
          });
          fetchReportes();
          closeDialog();
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
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_reporte: idReporte,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Reporte eliminado",
          description: "El reporte fue eliminado correctamente"
        });
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

  const openEditDialog = (reporte: Reporte) => {
    setEditingReporte(reporte);
    setFormData({
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      url_embed: reporte.url_embed,
      visible_para: reporte.visible_para as any,
      usuarios_permitidos: reporte.usuarios_permitidos || [],
      estado: reporte.estado,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReporte(null);
    setFormData({
      titulo: '',
      descripcion: '',
      url_embed: '',
      visible_para: 'todos',
      usuarios_permitidos: [],
      estado: 'activo',
    });
  };

  const getVisibilidadBadge = (visible: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      todos: { label: 'Todos', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      solo_admin: { label: 'Solo Admin', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      contadores: { label: 'Contadores', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      usuarios_especificos: { label: 'Específicos', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    };
    
    const config = badges[visible] || badges.todos;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'activo') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Activo</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Inactivo</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las configuraciones de tu organización
        </p>
      </div>

      <Tabs defaultValue="reportes" className="w-full">
        <TabsList>
          <TabsTrigger value="reportes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes Embebidos
          </TabsTrigger>
          {/* Aquí puedes agregar más tabs en el futuro */}
        </TabsList>

        <TabsContent value="reportes" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Reportes Embebidos</h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona los reportes de Power BI, Tableau u otras plataformas que se mostrarán a los usuarios
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Reporte
              </Button>
            </div>

            {reportes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-1">No hay reportes configurados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primer reporte embebido para que los usuarios puedan verlo
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Reporte
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Visibilidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell className="font-medium">{reporte.titulo}</TableCell>
                      <TableCell className="max-w-xs truncate">{reporte.descripcion || '-'}</TableCell>
                      <TableCell>{getVisibilidadBadge(reporte.visible_para)}</TableCell>
                      <TableCell>{getEstadoBadge(reporte.estado)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{reporte.creado_por_nombre}</div>
                          <div className="text-muted-foreground text-xs">{reporte.creado_por_correo}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(reporte)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReporte(reporte.id)}
                            className="text-destructive hover:text-destructive"
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
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar reporte */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
        else setDialogOpen(true);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReporte ? 'Editar Reporte' : 'Nuevo Reporte Embebido'}
            </DialogTitle>
          </DialogHeader>
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
                placeholder="Análisis mensual de ventas y métricas clave"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_embed">URL del Reporte *</Label>
              <Input
                id="url_embed"
                value={formData.url_embed}
                onChange={(e) => setFormData({ ...formData, url_embed: e.target.value })}
                placeholder="https://app.powerbi.com/view?r=eyJrIjoiXXX..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Pega la URL de embed de Power BI, Tableau, Looker o cualquier plataforma de BI
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visible_para">¿Quién puede verlo?</Label>
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
                <Label>Usuarios con Acceso</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {usuarios.map(usuario => (
                    <label key={usuario.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded">
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
                        className="rounded"
                      />
                      <span className="text-sm">{usuario.nombre} ({usuario.correo})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReporte}>
                <Save className="h-4 w-4 mr-2" />
                {editingReporte ? 'Guardar Cambios' : 'Crear Reporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
