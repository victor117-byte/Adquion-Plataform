import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Contribuyente {
  id: number;
  rfc: string;
  nombre: string;
  tipo_persona: 'fisica' | 'moral';
  direccion_fiscal: string;
  telefonos: string[];
  correos: string[];
  contrasena_sat?: string;
  contrasena_firma?: string;
  contrasena_sipare?: string;
  cuenta_sipare?: string;
  estado: 'activo' | 'inactivo';
  estado_republica: string;
  usuario_asignado_id: number;
  usuario_asignado_nombre: string;
  usuario_asignado_correo: string;
  fecha_alta: string;
  fecha_actualizacion: string;
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

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán",
  "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro",
  "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco",
  "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export function ContributorsSection() {
  const { user: currentUser } = useAuth();
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<'administrador' | 'contador'>('contador');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contribuyente | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    rfc: '',
    nombre: '',
    tipo_persona: 'moral' as 'fisica' | 'moral',
    direccion_fiscal: '',
    telefonos: '',
    correos: '',
    contrasena_sat: '',
    contrasena_firma: '',
    contrasena_sipare: '',
    cuenta_sipare: '',
    estado: 'activo' as 'activo' | 'inactivo',
    estado_republica: '',
    usuario_asignado_id: 0,
  });

  useEffect(() => {
    fetchContribuyentes();
    if (currentUser?.tipo_usuario === 'administrador') {
      fetchUsuarios();
    }
  }, []);

  const fetchContribuyentes = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) {
        console.error('❌ Faltan datos del usuario actual');
        setLoading(false);
        return;
      }

      console.log('📤 Fetching contribuyentes para:', {
        correo: currentUser.correo,
        organizacion: currentUser.organizacion,
      });

      const response = await fetch(
        `${API_URL}/contribuyentes?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      );
      
      const result = await response.json();
      console.log('📥 Respuesta completa:', result);
      
      if (!result.success) {
        console.error('Error:', result.message);
        toast({
          title: "Error",
          description: result.message || "No se pudieron cargar los contribuyentes",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { role, contribuyentes: fetchedContribuyentes } = result.data;
      console.log('📥 Rol:', role);
      console.log('📥 Contribuyentes:', fetchedContribuyentes);
      
      setUserRole(role);
      setContribuyentes(fetchedContribuyentes || []);
      
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contribuyentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(
        `${API_URL}/auth/users?correo=${encodeURIComponent(currentUser?.correo || '')}&organizacion=${encodeURIComponent(currentUser?.organizacion || '')}`,
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

  const handleSaveContributor = async () => {
    try {
      // Validar RFC
      const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
      if (!rfcRegex.test(formData.rfc)) {
        toast({
          title: "RFC inválido",
          description: "El RFC no tiene un formato válido (Ej: XAXX010101000)",
          variant: "destructive",
        });
        return;
      }

      if (editingContributor) {
        // Editar contribuyente existente
        const payload: any = {
          correo_usuario: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_contribuyente: editingContributor.id,
          nombre: formData.nombre,
          tipo_persona: formData.tipo_persona,
          direccion_fiscal: formData.direccion_fiscal,
          telefonos: formData.telefonos.split(',').map(t => t.trim()).filter(t => t),
          correos: formData.correos.split(',').map(c => c.trim()).filter(c => c),
          contrasena_sat: formData.contrasena_sat,
          contrasena_firma: formData.contrasena_firma,
          contrasena_sipare: formData.contrasena_sipare,
          cuenta_sipare: formData.cuenta_sipare,
          estado: formData.estado,
          estado_republica: formData.estado_republica,
        };

        // Solo admin puede reasignar
        if (userRole === 'administrador' && formData.usuario_asignado_id) {
          payload.usuario_asignado_id = formData.usuario_asignado_id;
        }

        console.log('📤 Actualizando contribuyente:', payload);

        const response = await fetch(`${API_URL}/contribuyentes`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Contribuyente actualizado",
            description: "Los datos se actualizaron correctamente",
          });
          fetchContribuyentes();
          setDialogOpen(false);
          resetForm();
        } else {
          throw new Error(result.message || 'Error al actualizar');
        }
      } else {
        // Crear nuevo contribuyente
        if (!formData.nombre || !formData.direccion_fiscal || !formData.estado_republica) {
          toast({
            title: "Campos incompletos",
            description: "Por favor completa todos los campos requeridos",
            variant: "destructive",
          });
          return;
        }

        const payload = {
          correo_usuario: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          rfc: formData.rfc.toUpperCase(),
          nombre: formData.nombre,
          tipo_persona: formData.tipo_persona,
          direccion_fiscal: formData.direccion_fiscal,
          telefonos: formData.telefonos.split(',').map(t => t.trim()).filter(t => t),
          correos: formData.correos.split(',').map(c => c.trim()).filter(c => c),
          contrasena_sat: formData.contrasena_sat,
          contrasena_firma: formData.contrasena_firma,
          contrasena_sipare: formData.contrasena_sipare,
          cuenta_sipare: formData.cuenta_sipare,
          estado: formData.estado,
          estado_republica: formData.estado_republica,
        };

        console.log('📤 Creando contribuyente:', payload);

        const response = await fetch(`${API_URL}/contribuyentes`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Contribuyente creado",
            description: "El contribuyente fue creado exitosamente",
          });
          fetchContribuyentes();
          setDialogOpen(false);
          resetForm();
        } else {
          throw new Error(result.message || 'Error al crear contribuyente');
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar contribuyente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el contribuyente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContributor = async (idContribuyente: number) => {
    if (!confirm('¿Estás seguro de eliminar este contribuyente? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/contribuyentes`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_usuario: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_contribuyente: idContribuyente,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Contribuyente eliminado",
          description: "El contribuyente fue eliminado correctamente"
        });
        fetchContribuyentes();
      } else {
        throw new Error(result.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error al eliminar contribuyente:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el contribuyente",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ 
      rfc: '',
      nombre: '',
      tipo_persona: 'moral',
      direccion_fiscal: '',
      telefonos: '',
      correos: '',
      contrasena_sat: '',
      contrasena_firma: '',
      contrasena_sipare: '',
      cuenta_sipare: '',
      estado: 'activo',
      estado_republica: '',
      usuario_asignado_id: 0,
    });
    setEditingContributor(null);
  };

  const openEditDialog = (contribuyente: Contribuyente) => {
    setEditingContributor(contribuyente);
    setFormData({
      rfc: contribuyente.rfc,
      nombre: contribuyente.nombre,
      tipo_persona: contribuyente.tipo_persona,
      direccion_fiscal: contribuyente.direccion_fiscal,
      telefonos: contribuyente.telefonos.join(', '),
      correos: contribuyente.correos.join(', '),
      contrasena_sat: contribuyente.contrasena_sat || '',
      contrasena_firma: contribuyente.contrasena_firma || '',
      contrasena_sipare: contribuyente.contrasena_sipare || '',
      cuenta_sipare: contribuyente.cuenta_sipare || '',
      estado: contribuyente.estado,
      estado_republica: contribuyente.estado_republica,
      usuario_asignado_id: contribuyente.usuario_asignado_id,
    });
    setDialogOpen(true);
  };

  const filteredContribuyentes = contribuyentes.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (estado: string) => {
    if (estado === 'activo') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Activo</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Inactivo</Badge>;
  };

  const getTipoPersonaBadge = (tipo: string) => {
    if (tipo === 'moral') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Moral</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Física</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando contribuyentes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contribuyentes</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'administrador' 
              ? `Gestiona todos los contribuyentes de ${currentUser?.organizacion}`
              : 'Tus contribuyentes asignados'
            }
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contribuyente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContributor ? 'Editar Contribuyente' : 'Crear Nuevo Contribuyente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC *</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    disabled={!!editingContributor}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_persona">Tipo de Persona *</Label>
                  <Select
                    value={formData.tipo_persona}
                    onValueChange={(value: 'fisica' | 'moral') => 
                      setFormData({ ...formData, tipo_persona: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moral">Moral</SelectItem>
                      <SelectItem value="fisica">Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre / Razón Social *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Empresa SA de CV"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion_fiscal">Dirección Fiscal *</Label>
                <Textarea
                  id="direccion_fiscal"
                  value={formData.direccion_fiscal}
                  onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                  placeholder="Av. Reforma 123, Col. Centro, CP 06000"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado_republica">Estado *</Label>
                  <Select
                    value={formData.estado_republica}
                    onValueChange={(value) => 
                      setFormData({ ...formData, estado_republica: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_MEXICO.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado del Contribuyente</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonos">Teléfonos (separados por coma)</Label>
                <Input
                  id="telefonos"
                  value={formData.telefonos}
                  onChange={(e) => setFormData({ ...formData, telefonos: e.target.value })}
                  placeholder="5551234567, 5559876543"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correos">Correos (separados por coma)</Label>
                <Input
                  id="correos"
                  type="email"
                  value={formData.correos}
                  onChange={(e) => setFormData({ ...formData, correos: e.target.value })}
                  placeholder="contacto@empresa.com, facturacion@empresa.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contrasena_sat">Contraseña SAT</Label>
                  <Input
                    id="contrasena_sat"
                    type="password"
                    value={formData.contrasena_sat}
                    onChange={(e) => setFormData({ ...formData, contrasena_sat: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrasena_firma">Contraseña Firma</Label>
                  <Input
                    id="contrasena_firma"
                    type="password"
                    value={formData.contrasena_firma}
                    onChange={(e) => setFormData({ ...formData, contrasena_firma: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuenta_sipare">Cuenta SIPARE</Label>
                  <Input
                    id="cuenta_sipare"
                    value={formData.cuenta_sipare}
                    onChange={(e) => setFormData({ ...formData, cuenta_sipare: e.target.value })}
                    placeholder="CUENTA123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrasena_sipare">Contraseña SIPARE</Label>
                  <Input
                    id="contrasena_sipare"
                    type="password"
                    value={formData.contrasena_sipare}
                    onChange={(e) => setFormData({ ...formData, contrasena_sipare: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {userRole === 'administrador' && editingContributor && (
                <div className="space-y-2">
                  <Label htmlFor="usuario_asignado">Reasignar a Usuario</Label>
                  <Select
                    value={formData.usuario_asignado_id.toString()}
                    onValueChange={(value) => 
                      setFormData({ ...formData, usuario_asignado_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(usuario => (
                        <SelectItem key={usuario.id} value={usuario.id.toString()}>
                          {usuario.nombre} ({usuario.correo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Solo administradores pueden reasignar contribuyentes
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveContributor}>
                  {editingContributor ? 'Guardar Cambios' : 'Crear Contribuyente'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por RFC o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFC</TableHead>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado República</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContribuyentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No se encontraron contribuyentes' : 'No hay contribuyentes registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContribuyentes.map((contribuyente) => (
                <TableRow key={contribuyente.id}>
                  <TableCell className="font-mono font-medium">{contribuyente.rfc}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {contribuyente.nombre}
                    </div>
                  </TableCell>
                  <TableCell>{getTipoPersonaBadge(contribuyente.tipo_persona)}</TableCell>
                  <TableCell>{contribuyente.estado_republica}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div>{contribuyente.usuario_asignado_nombre}</div>
                        <div className="text-muted-foreground text-xs">{contribuyente.usuario_asignado_correo}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(contribuyente.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(contribuyente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === 'administrador' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContributor(contribuyente.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
