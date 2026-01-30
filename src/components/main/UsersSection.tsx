import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserCheck, Shield, Loader2 } from "lucide-react";
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
import { get, post, patch, del } from "@/utils/api";

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_usuario: 'administrador' | 'contador';
  created_at?: string;
}

interface UsersResponse {
  success: boolean;
  data: {
    role: 'administrador' | 'contador';
    database: string;
    totalUsers: number;
    users: User[];
  };
}

export function UsersSection() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'administrador' | 'contador'>('contador');

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
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser?.organizacionActiva?.database) return;

    try {
      setLoading(true);
      const response = await get<UsersResponse>('/auth/users');

      if (response.success && response.data) {
        setUserRole(response.data.role);
        setUsers(response.data.users || []);

        if (response.data.role === 'contador') {
          toast({
            title: "Vista de Contador",
            description: "Solo puedes ver tu propia información",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    setSaving(true);

    try {
      if (editingUser) {
        // Actualizar rol de usuario existente (PATCH /api/auth/users)
        await patch('/auth/users', {
          id_usuario: editingUser.id,
          tipo_usuario: formData.tipo_usuario,
          database: currentUser?.organizacionActiva?.database,
        });

        toast({
          title: "Usuario actualizado",
          description: "El rol del usuario se actualizó correctamente",
        });
      } else {
        // Validar campos
        if (!formData.nombre || !formData.correo || !formData.telefono ||
            !formData.fecha_nacimiento || !formData.contraseña) {
          toast({
            title: "Campos incompletos",
            description: "Por favor completa todos los campos requeridos",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        if (formData.contraseña.length < 8) {
          toast({
            title: "Contraseña muy corta",
            description: "La contraseña debe tener al menos 8 caracteres",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        // Crear nuevo usuario (POST /api/auth/users)
        await post('/auth/users', {
          nombre: formData.nombre,
          correo: formData.correo,
          contraseña: formData.contraseña,
          fecha_nacimiento: formData.fecha_nacimiento,
          telefono: formData.telefono,
          tipo_usuario: formData.tipo_usuario,
          database: currentUser?.organizacionActiva?.database,
        });

        toast({
          title: "Usuario creado",
          description: "El nuevo usuario fue creado exitosamente",
        });
      }

      fetchUsers();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el usuario",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      await del('/auth/users', {
        id_usuario: userId,
        database: currentUser?.organizacionActiva?.database,
      });

      toast({
        title: "Usuario eliminado",
        description: "El usuario fue eliminado correctamente"
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
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
      contraseña: '',
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
              ? `Gestiona los usuarios de ${currentUser?.organizacionActiva?.nombre}`
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
                    <div className="grid grid-cols-2 gap-3">
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
                        <Label htmlFor="fecha_nacimiento">Fecha nac. *</Label>
                        <Input
                          id="fecha_nacimiento"
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                          required
                        />
                      </div>
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
                  <Button onClick={handleSaveUser} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Cargando usuarios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === 'administrador' ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
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
