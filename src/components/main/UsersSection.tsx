import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserCheck, Shield } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_usuario: 'administrador' | 'contador';
  organizacion: string;
  database: string;
  created_at?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

export function UsersSection() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'administrador' | 'contador'>('contador');

  // Form state para crear usuario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    fecha_nacimiento: '',
    contraseña: '',
    tipo_usuario: 'contador' as 'administrador' | 'contador',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      if (!currentUser?.correo || !currentUser?.organizacion) {
        console.error('❌ Faltan datos del usuario actual');
        return;
      }

      console.log('📤 Fetching users para:', {
        correo: currentUser.correo,
        organizacion: currentUser.organizacion,
      });

      const response = await fetch(
        `${API_URL}/auth/users?correo=${encodeURIComponent(currentUser.correo)}&organizacion=${encodeURIComponent(currentUser.organizacion)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📥 Respuesta status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📥 Respuesta completa:', result);
        
        if (result.success && result.data) {
          const { role, users: fetchedUsers } = result.data;
          console.log('📥 Rol del usuario:', role);
          console.log('📥 Usuarios recibidos:', fetchedUsers);
          
          setUserRole(role);
          setUsers(fetchedUsers || []);
          
          // Mostrar mensaje si es contador
          if (role === 'contador') {
            toast({
              title: "Vista de Contador",
              description: "Solo puedes ver tu propia información",
            });
          }
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } else {
        const error = await response.json();
        console.error('❌ Error:', error);
        toast({
          title: "Error",
          description: error.error || "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Actualizar rol de usuario existente
        const response = await fetch(`${API_URL}/auth/users`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            correo_admin: currentUser?.correo,
            organizacion: currentUser?.organizacion,
            id_usuario: editingUser.id,
            tipo_usuario: formData.tipo_usuario,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Usuario actualizado",
            description: "El rol del usuario se actualizó correctamente",
          });
          fetchUsers();
          setDialogOpen(false);
          resetForm();
        } else {
          throw new Error(result.message || 'Error al actualizar');
        }
      } else {
        // Validar que todos los campos estén completos
        if (!formData.nombre || !formData.correo || !formData.telefono || 
            !formData.fecha_nacimiento || !formData.contraseña) {
          toast({
            title: "Campos incompletos",
            description: "Por favor completa todos los campos requeridos",
            variant: "destructive",
          });
          return;
        }

        // Crear nuevo usuario
        const payload = {
          organizacion: currentUser?.organizacion,
          nombre: formData.nombre,
          correo: formData.correo,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento,
          contraseña: formData.contraseña,
        };

        console.log('📤 Creando usuario:', payload);

        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        console.log('📥 Respuesta status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Usuario creado:', data);
          toast({
            title: "Usuario creado",
            description: "El nuevo usuario fue creado exitosamente",
          });
          fetchUsers();
          setDialogOpen(false);
          resetForm();
        } else {
          const error = await response.json();
          console.error('❌ Error:', error);
          throw new Error(error.error || error.message || 'Error al crear usuario');
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          correo_admin: currentUser?.correo,
          organizacion: currentUser?.organizacion,
          id_usuario: userId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Usuario eliminado",
          description: "El usuario fue eliminado correctamente"
        });
        fetchUsers();
      } else {
        throw new Error(result.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ 
      nombre: '', 
      correo: '', 
      telefono: '',
      fecha_nacimiento: '',
      contraseña: '',
      tipo_usuario: 'contador',
    });
    setEditingUser(null);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
      contraseña: '', // No mostramos la contraseña
      tipo_usuario: user.tipo_usuario,
    });
    setDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (tipo: string) => {
    if (tipo === 'administrador') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <Shield className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <UserCheck className="h-3 w-3 mr-1" />
        Contador
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'administrador' ? 'Gestionar Usuarios' : 'Mi Perfil'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'administrador' 
              ? `Gestiona los usuarios de tu organización: ${currentUser?.organizacion}`
              : 'Información de tu cuenta'
            }
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
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo electrónico *</Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="5551234567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha de nacimiento *</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contraseña">Contraseña *</Label>
                    <Input
                      id="contraseña"
                      type="password"
                      value={formData.contraseña}
                      onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="tipo_usuario">Tipo de Usuario *</Label>
                <Select
                  value={formData.tipo_usuario}
                  onValueChange={(value: 'administrador' | 'contador') => 
                    setFormData({ ...formData, tipo_usuario: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {editingUser && (
                  <p className="text-xs text-muted-foreground">
                    Solo puedes cambiar el rol del usuario
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveUser}>
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              {userRole === 'administrador' && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={userRole === 'administrador' ? 5 : 4} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span>Cargando usuarios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === 'administrador' ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nombre}</TableCell>
                  <TableCell>{user.correo}</TableCell>
                  <TableCell>{user.telefono}</TableCell>
                  <TableCell>{getRoleBadge(user.tipo_usuario)}</TableCell>
                  {userRole === 'administrador' && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.correo !== currentUser?.correo ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              title="Editar rol"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive hover:text-destructive"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Tu cuenta</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}