import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Building2, FileCheck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Contributor {
  id: string;
  rfc: string;
  business_name: string;
  legal_name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  documents_count: number;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

export function ContributorsSection() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    rfc: '',
    business_name: '',
    legal_name: '',
    email: '',
  });

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    try {
      const response = await fetch(`${API_URL}/contributors`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setContributors(data.contributors || []);
      }
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContributor = async () => {
    // RFC validation (basic Mexican RFC format)
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
    if (!rfcRegex.test(formData.rfc)) {
      toast({
        title: "RFC inválido",
        description: "El RFC no tiene un formato válido",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingContributor 
        ? `${API_URL}/contributors/${editingContributor.id}`
        : `${API_URL}/contributors`;
      
      const response = await fetch(url, {
        method: editingContributor ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: editingContributor ? "Contribuyente actualizado" : "Contribuyente creado",
          description: "Los cambios se guardaron correctamente",
        });
        fetchContributors();
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el contribuyente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContributor = async (contributorId: string) => {
    if (!confirm('¿Estás seguro de eliminar este contribuyente?')) return;

    try {
      const response = await fetch(`${API_URL}/contributors/${contributorId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        toast({ title: "Contribuyente eliminado" });
        fetchContributors();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el contribuyente",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ rfc: '', business_name: '', legal_name: '', email: '' });
    setEditingContributor(null);
  };

  const openEditDialog = (contributor: Contributor) => {
    setEditingContributor(contributor);
    setFormData({
      rfc: contributor.rfc,
      business_name: contributor.business_name,
      legal_name: contributor.legal_name,
      email: contributor.email,
    });
    setDialogOpen(true);
  };

  const filteredContributors = contributors.filter(contributor =>
    contributor.rfc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contributor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contributor.legal_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contribuyentes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los contribuyentes y sus documentos fiscales
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContributor ? 'Editar Contribuyente' : 'Nuevo Contribuyente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre Comercial</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Mi Empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razón Social</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  placeholder="Mi Empresa S.A. de C.V."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
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

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por RFC, nombre comercial o razón social..."
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
              <TableHead>RFC</TableHead>
              <TableHead>Nombre Comercial</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando contribuyentes...
                </TableCell>
              </TableRow>
            ) : filteredContributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron contribuyentes
                </TableCell>
              </TableRow>
            ) : (
              filteredContributors.map((contributor) => (
                <TableRow key={contributor.id}>
                  <TableCell className="font-mono font-medium">{contributor.rfc}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {contributor.business_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contributor.legal_name}</TableCell>
                  <TableCell>{getStatusBadge(contributor.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span>{contributor.documents_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(contributor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContributor(contributor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
