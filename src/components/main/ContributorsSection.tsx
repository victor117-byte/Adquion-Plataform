import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Edit, Trash2, Building2, UserCheck, User, Shield,
  FileKey, Upload, Eye, EyeOff, Phone, Mail, MapPin, Calendar,
  CheckCircle, AlertTriangle, XCircle, FileText, Key,
  Loader2, AlertCircle, ChevronRight, ChevronLeft, X, File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ==================== TIPOS ====================

type TipoPersona = 'fisica' | 'moral';
type EstadoContribuyente = 'activo' | 'inactivo';
type EstadoCertificado = 'vigente' | 'por_vencer' | 'vencido' | 'sin_certificado';

interface CertificadoEstado {
  estado: EstadoCertificado;
  dias_restantes: number | null;
  mensaje: string;
}

interface CertificadoInfo {
  tiene_certificado: boolean;
  estado: CertificadoEstado;
  fecha_emision: string | null;
  fecha_expiracion: string | null;
  numero_serie: string | null;
}

interface Contribuyente {
  id: number;
  rfc: string;
  nombre: string;
  tipo_persona: TipoPersona;
  direccion_fiscal: string;
  calle_numero: string | null;
  poblacion_municipio: string | null;
  cp: string | null;
  estado_republica: string;
  estado: EstadoContribuyente;
  telefonos: string[];
  correos: string[];
  contrasena_sat: string | null;
  contrasena_firma: string | null;
  cuenta_rtp: string | null;
  contrasena_rtp: string | null;
  cuenta_isn: string | null;
  contrasena_isn: string | null;
  cuenta_sipare: string | null;
  contrasena_sipare: string | null;
  usuario_asignado_id: number;
  usuario_asignado_nombre: string;
  usuario_asignado_correo: string;
  certificado_cer_path: string | null;
  certificado_key_path: string | null;
  certificado_pem_path: string | null;
  clave_pem_path: string | null;
  certificado_fecha_emision: string | null;
  certificado_fecha_expiracion: string | null;
  certificado_numero_serie: string | null;
  certificado_info: CertificadoInfo;
  created_at: string;
  updated_at?: string;
}

interface User {
  id: number;
  nombre: string;
  correo: string;
}

// ==================== CONSTANTES ====================

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

// ==================== COMPONENTES DE UI ====================

// Badge de estado de certificado (para el detalle)
function CertificadoBadge({ estado }: { estado: CertificadoEstado }) {
  const config = {
    vigente: {
      icon: CheckCircle,
      bg: 'bg-green-100 dark:bg-green-900/50',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    por_vencer: {
      icon: AlertTriangle,
      bg: 'bg-yellow-100 dark:bg-yellow-900/50',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    vencido: {
      icon: XCircle,
      bg: 'bg-red-100 dark:bg-red-900/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    sin_certificado: {
      icon: FileKey,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700'
    },
  };

  const { icon: Icon, bg, text, border } = config[estado.estado];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${bg} ${text} border ${border} gap-1 cursor-help`}>
            <Icon className="h-3 w-3" />
            {estado.estado === 'vigente' && 'Vigente'}
            {estado.estado === 'por_vencer' && 'Por vencer'}
            {estado.estado === 'vencido' && 'Vencido'}
            {estado.estado === 'sin_certificado' && 'Sin cert.'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{estado.mensaje}</p>
          {estado.dias_restantes !== null && estado.dias_restantes > 0 && (
            <p className="text-xs opacity-75">{estado.dias_restantes} días restantes</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para subir certificados (ahora con soporte .pem)
function CertificadoUploader({
  contribuyenteId,
  onSuccess
}: {
  contribuyenteId: number;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [archivoCer, setArchivoCer] = useState<File | null>(null);
  const [archivoKey, setArchivoKey] = useState<File | null>(null);
  const [archivoPemCert, setArchivoPemCert] = useState<File | null>(null);
  const [archivoPemKey, setArchivoPemKey] = useState<File | null>(null);
  const cerInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const pemCertInputRef = useRef<HTMLInputElement>(null);
  const pemKeyInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!archivoCer && !archivoKey && !archivoPemCert && !archivoPemKey) {
      toast({
        title: "Selecciona al menos un archivo",
        description: "Debes seleccionar algún archivo de certificado para subir",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('contribuyente_id', contribuyenteId.toString());

      if (archivoCer) formData.append('archivo_cer', archivoCer);
      if (archivoKey) formData.append('archivo_key', archivoKey);
      if (archivoPemCert) formData.append('archivo_pem_cert', archivoPemCert);
      if (archivoPemKey) formData.append('archivo_pem_key', archivoPemKey);

      const response = await fetch(`${API_URL}/contribuyentes/certificados`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Certificados actualizados",
          description: "Los archivos fueron subidos correctamente",
        });
        setArchivoCer(null);
        setArchivoKey(null);
        setArchivoPemCert(null);
        setArchivoPemKey(null);
        if (cerInputRef.current) cerInputRef.current.value = '';
        if (keyInputRef.current) keyInputRef.current.value = '';
        if (pemCertInputRef.current) pemCertInputRef.current.value = '';
        if (pemKeyInputRef.current) pemKeyInputRef.current.value = '';
        onSuccess();
      } else {
        throw new Error(result.message || 'Error al subir certificados');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron subir los certificados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const FileUploadItem = ({
    label,
    accept,
    file,
    inputRef,
    onFileChange,
    icon: IconComponent,
    iconColor
  }: {
    label: string;
    accept: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (file: File | null) => void;
    icon: typeof FileText;
    iconColor: string;
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {file ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600 dark:text-green-400 truncate">
              {file.name}
            </span>
            <button
              onClick={() => {
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin archivo</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="shrink-0"
      >
        <Upload className="h-4 w-4 mr-1" />
        Elegir
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Shield className="h-4 w-4" />
        Archivos de Certificado SAT
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Formato SAT (.cer / .key)
        </div>
        <FileUploadItem
          label="Certificado (.cer)"
          accept=".cer"
          file={archivoCer}
          inputRef={cerInputRef as React.RefObject<HTMLInputElement>}
          onFileChange={setArchivoCer}
          icon={FileText}
          iconColor="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
        />
        <FileUploadItem
          label="Clave Privada (.key)"
          accept=".key"
          file={archivoKey}
          inputRef={keyInputRef as React.RefObject<HTMLInputElement>}
          onFileChange={setArchivoKey}
          icon={Key}
          iconColor="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Formato PEM
        </div>
        <FileUploadItem
          label="Certificado PEM (.pem)"
          accept=".pem"
          file={archivoPemCert}
          inputRef={pemCertInputRef as React.RefObject<HTMLInputElement>}
          onFileChange={setArchivoPemCert}
          icon={File}
          iconColor="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
        />
        <FileUploadItem
          label="Clave Privada PEM (.pem)"
          accept=".pem"
          file={archivoPemKey}
          inputRef={pemKeyInputRef as React.RefObject<HTMLInputElement>}
          onFileChange={setArchivoPemKey}
          icon={Key}
          iconColor="bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400"
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={loading || (!archivoCer && !archivoKey && !archivoPemCert && !archivoPemKey)}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Subiendo archivos...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Subir Certificados
          </>
        )}
      </Button>
    </div>
  );
}

// Campo de contraseña con visibilidad toggle
function PasswordField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// Diálogo de detalle del contribuyente
function ContribuyenteDetailDialog({
  contribuyente,
  open,
  onClose,
  onEdit,
  onRefresh
}: {
  contribuyente: Contribuyente | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  if (!contribuyente) return null;

  const togglePassword = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderPassword = (value: string | null, key: string) => {
    if (!value) return <span className="text-muted-foreground italic">No configurada</span>;
    return (
      <div className="flex items-center gap-2">
        <code className="text-sm bg-muted px-2 py-1 rounded">
          {showPasswords[key] ? value : '••••••••'}
        </code>
        <button
          onClick={() => togglePassword(key)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  const certInfo = contribuyente.certificado_info;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {contribuyente.tipo_persona === 'moral' ? (
                  <Building2 className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
                {contribuyente.nombre}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{contribuyente.rfc}</code>
                <Badge variant={contribuyente.estado === 'activo' ? 'default' : 'secondary'}>
                  {contribuyente.estado}
                </Badge>
                <Badge variant="outline">
                  {contribuyente.tipo_persona === 'moral' ? 'Persona Moral' : 'Persona Física'}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="certificados">Certificados</TabsTrigger>
              <TabsTrigger value="credenciales">Credenciales</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
            </TabsList>

            {/* Tab General */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Información Fiscal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Dirección Fiscal</p>
                      <p className="text-sm font-medium">{contribuyente.direccion_fiscal}</p>
                    </div>
                    {contribuyente.calle_numero && (
                      <div>
                        <p className="text-xs text-muted-foreground">Calle y Número</p>
                        <p className="text-sm font-medium">{contribuyente.calle_numero}</p>
                      </div>
                    )}
                    {contribuyente.poblacion_municipio && (
                      <div>
                        <p className="text-xs text-muted-foreground">Municipio</p>
                        <p className="text-sm font-medium">{contribuyente.poblacion_municipio}</p>
                      </div>
                    )}
                    {contribuyente.cp && (
                      <div>
                        <p className="text-xs text-muted-foreground">Código Postal</p>
                        <p className="text-sm font-medium">{contribuyente.cp}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="text-sm font-medium">{contribuyente.estado_republica}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{contribuyente.usuario_asignado_nombre}</p>
                      <p className="text-sm text-muted-foreground">{contribuyente.usuario_asignado_correo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Creado: {new Date(contribuyente.created_at).toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
            </TabsContent>

            {/* Tab Certificados */}
            <TabsContent value="certificados" className="space-y-4">
              {/* Estado actual del certificado */}
              <Card className={`border-2 ${
                certInfo.estado.estado === 'vigente' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' :
                certInfo.estado.estado === 'por_vencer' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20' :
                certInfo.estado.estado === 'vencido' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' :
                'border-gray-200 dark:border-gray-700'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {certInfo.estado.estado === 'vigente' && <CheckCircle className="h-8 w-8 text-green-600" />}
                      {certInfo.estado.estado === 'por_vencer' && <AlertTriangle className="h-8 w-8 text-yellow-600" />}
                      {certInfo.estado.estado === 'vencido' && <XCircle className="h-8 w-8 text-red-600" />}
                      {certInfo.estado.estado === 'sin_certificado' && <FileKey className="h-8 w-8 text-gray-400" />}
                      <div>
                        <h4 className="font-semibold text-lg">{certInfo.estado.mensaje}</h4>
                        {certInfo.tiene_certificado && certInfo.estado.dias_restantes !== null && (
                          <p className="text-sm text-muted-foreground">
                            {certInfo.estado.dias_restantes > 0
                              ? `${certInfo.estado.dias_restantes} días restantes`
                              : 'Certificado vencido'}
                          </p>
                        )}
                      </div>
                    </div>
                    <CertificadoBadge estado={certInfo.estado} />
                  </div>

                  {certInfo.tiene_certificado && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Número de Serie</p>
                        <code className="text-sm font-mono">{certInfo.numero_serie}</code>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha de Emisión</p>
                        <p className="text-sm font-medium">
                          {certInfo.fecha_emision
                            ? new Date(certInfo.fecha_emision).toLocaleDateString('es-MX')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha de Expiración</p>
                        <p className="text-sm font-medium">
                          {certInfo.fecha_expiracion
                            ? new Date(certInfo.fecha_expiracion).toLocaleDateString('es-MX')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {certInfo.tiene_certificado && certInfo.estado.dias_restantes !== null && certInfo.estado.dias_restantes > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Vigencia</span>
                        <span>{Math.min(100, Math.round((certInfo.estado.dias_restantes / 1460) * 100))}%</span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.round((certInfo.estado.dias_restantes / 1460) * 100))}
                        className={`h-2 ${
                          certInfo.estado.estado === 'vigente' ? '[&>div]:bg-green-500' :
                          certInfo.estado.estado === 'por_vencer' ? '[&>div]:bg-yellow-500' :
                          '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Archivos del certificado */}
              {certInfo.tiene_certificado && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Archivos Cargados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {contribuyente.certificado_cer_path && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{contribuyente.rfc}.cer</p>
                            <p className="text-xs text-muted-foreground">Certificado SAT</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Cargado
                        </Badge>
                      </div>
                    )}
                    {contribuyente.certificado_key_path && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Key className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium">{contribuyente.rfc}.key</p>
                            <p className="text-xs text-muted-foreground">Clave privada SAT</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Cargado
                        </Badge>
                      </div>
                    )}
                    {contribuyente.certificado_pem_path && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <File className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">{contribuyente.rfc}_cert.pem</p>
                            <p className="text-xs text-muted-foreground">Certificado PEM</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Cargado
                        </Badge>
                      </div>
                    )}
                    {contribuyente.clave_pem_path && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Key className="h-5 w-5 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium">{contribuyente.rfc}_key.pem</p>
                            <p className="text-xs text-muted-foreground">Clave privada PEM</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Cargado
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Subir certificados */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Subir Certificados</CardTitle>
                  <CardDescription>Sube tus archivos de certificado SAT (.cer/.key) o formato PEM</CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificadoUploader
                    contribuyenteId={contribuyente.id}
                    onSuccess={onRefresh}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Credenciales */}
            <TabsContent value="credenciales" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Credenciales SAT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contraseña Portal SAT</p>
                      {renderPassword(contribuyente.contrasena_sat, 'sat')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contraseña e.Firma</p>
                      {renderPassword(contribuyente.contrasena_firma, 'firma')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileKey className="h-4 w-4" />
                    Otras Credenciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cuenta RTP</p>
                      <p className="text-sm">{contribuyente.cuenta_rtp || <span className="text-muted-foreground italic">No configurada</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contraseña RTP</p>
                      {renderPassword(contribuyente.contrasena_rtp, 'rtp')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cuenta ISN</p>
                      <p className="text-sm">{contribuyente.cuenta_isn || <span className="text-muted-foreground italic">No configurada</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contraseña ISN</p>
                      {renderPassword(contribuyente.contrasena_isn, 'isn')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cuenta SIPARE</p>
                      <p className="text-sm">{contribuyente.cuenta_sipare || <span className="text-muted-foreground italic">No configurada</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contraseña SIPARE</p>
                      {renderPassword(contribuyente.contrasena_sipare, 'sipare')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Contacto */}
            <TabsContent value="contacto" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfonos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contribuyente.telefonos && contribuyente.telefonos.length > 0 ? (
                    <div className="space-y-2">
                      {contribuyente.telefonos.map((tel, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{tel}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin teléfonos registrados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correos Electrónicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contribuyente.correos && contribuyente.correos.length > 0 ? (
                    <div className="space-y-2">
                      {contribuyente.correos.map((correo, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{correo}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin correos registrados</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== FORMULARIO WIZARD ====================

interface FormWizardProps {
  open: boolean;
  onClose: () => void;
  editingContributor: Contribuyente | null;
  onSave: () => void;
  usuarios: User[];
  isAdmin: boolean;
}

function ContribuyenteFormWizard({
  open,
  onClose,
  editingContributor,
  onSave,
  usuarios,
  isAdmin
}: FormWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    rfc: '',
    nombre: '',
    tipo_persona: 'moral' as TipoPersona,
    direccion_fiscal: '',
    calle_numero: '',
    poblacion_municipio: '',
    cp: '',
    estado_republica: '',
    telefonos: '',
    correos: '',
    contrasena_sat: '',
    contrasena_firma: '',
    cuenta_rtp: '',
    contrasena_rtp: '',
    cuenta_isn: '',
    contrasena_isn: '',
    cuenta_sipare: '',
    contrasena_sipare: '',
    estado: 'activo' as EstadoContribuyente,
    usuario_asignado_id: 0,
  });

  useEffect(() => {
    if (editingContributor) {
      setFormData({
        rfc: editingContributor.rfc,
        nombre: editingContributor.nombre,
        tipo_persona: editingContributor.tipo_persona,
        direccion_fiscal: editingContributor.direccion_fiscal,
        calle_numero: editingContributor.calle_numero || '',
        poblacion_municipio: editingContributor.poblacion_municipio || '',
        cp: editingContributor.cp || '',
        estado_republica: editingContributor.estado_republica,
        telefonos: editingContributor.telefonos?.join(', ') || '',
        correos: editingContributor.correos?.join(', ') || '',
        contrasena_sat: editingContributor.contrasena_sat || '',
        contrasena_firma: editingContributor.contrasena_firma || '',
        cuenta_rtp: editingContributor.cuenta_rtp || '',
        contrasena_rtp: editingContributor.contrasena_rtp || '',
        cuenta_isn: editingContributor.cuenta_isn || '',
        contrasena_isn: editingContributor.contrasena_isn || '',
        cuenta_sipare: editingContributor.cuenta_sipare || '',
        contrasena_sipare: editingContributor.contrasena_sipare || '',
        estado: editingContributor.estado,
        usuario_asignado_id: editingContributor.usuario_asignado_id,
      });
    } else {
      resetForm();
    }
    setStep(1);
  }, [editingContributor, open]);

  const resetForm = () => {
    setFormData({
      rfc: '',
      nombre: '',
      tipo_persona: 'moral',
      direccion_fiscal: '',
      calle_numero: '',
      poblacion_municipio: '',
      cp: '',
      estado_republica: '',
      telefonos: '',
      correos: '',
      contrasena_sat: '',
      contrasena_firma: '',
      cuenta_rtp: '',
      contrasena_rtp: '',
      cuenta_isn: '',
      contrasena_isn: '',
      cuenta_sipare: '',
      contrasena_sipare: '',
      estado: 'activo',
      usuario_asignado_id: 0,
    });
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
        if (!rfcRegex.test(formData.rfc)) {
          toast({
            title: "RFC inválido",
            description: "El RFC no tiene un formato válido",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.nombre.trim()) {
          toast({
            title: "Nombre requerido",
            description: "Ingresa el nombre o razón social",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.direccion_fiscal.trim()) {
          toast({
            title: "Dirección requerida",
            description: "Ingresa la dirección fiscal (colonia)",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.estado_republica) {
          toast({
            title: "Estado requerido",
            description: "Selecciona el estado de la república",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(Math.min(step + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setStep(Math.max(step - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);

    try {
      const payload: any = {
        nombre: formData.nombre,
        tipo_persona: formData.tipo_persona,
        direccion_fiscal: formData.direccion_fiscal,
        calle_numero: formData.calle_numero || undefined,
        poblacion_municipio: formData.poblacion_municipio || undefined,
        cp: formData.cp || undefined,
        estado_republica: formData.estado_republica,
        telefonos: formData.telefonos.split(',').map(t => t.trim()).filter(t => t),
        correos: formData.correos.split(',').map(c => c.trim()).filter(c => c),
        contrasena_sat: formData.contrasena_sat || undefined,
        contrasena_firma: formData.contrasena_firma || undefined,
        cuenta_rtp: formData.cuenta_rtp || undefined,
        contrasena_rtp: formData.contrasena_rtp || undefined,
        cuenta_isn: formData.cuenta_isn || undefined,
        contrasena_isn: formData.contrasena_isn || undefined,
        cuenta_sipare: formData.cuenta_sipare || undefined,
        contrasena_sipare: formData.contrasena_sipare || undefined,
        estado: formData.estado,
      };

      if (editingContributor) {
        payload.id_contribuyente = editingContributor.id;
        if (isAdmin && formData.usuario_asignado_id) {
          payload.usuario_asignado_id = formData.usuario_asignado_id;
        }

        const response = await fetch(`${API_URL}/contribuyentes`, {
          method: 'PATCH',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          toast({ title: "Contribuyente actualizado correctamente" });
          onSave();
          onClose();
        } else {
          throw new Error(result.message);
        }
      } else {
        payload.rfc = formData.rfc.toUpperCase();

        const response = await fetch(`${API_URL}/contribuyentes`, {
          method: 'POST',
          credentials: 'include',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          toast({ title: "Contribuyente creado correctamente" });
          onSave();
          onClose();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el contribuyente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    { title: 'Información Básica', description: 'RFC y datos generales' },
    { title: 'Dirección', description: 'Ubicación fiscal' },
    { title: 'Contacto', description: 'Teléfonos y correos' },
    { title: 'Credenciales', description: 'Accesos y contraseñas' },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingContributor ? (
              <>
                <Edit className="h-5 w-5 text-primary" />
                Editar Contribuyente
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Nuevo Contribuyente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {stepTitles[step - 1].title} - {stepTitles[step - 1].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {stepTitles.map((s, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index + 1 === step
                    ? 'bg-primary text-primary-foreground'
                    : index + 1 < step
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1 < step ? <CheckCircle className="h-5 w-5" /> : index + 1}
              </div>
              {index < stepTitles.length - 1 && (
                <div
                  className={`h-1 w-12 mx-2 rounded ${
                    index + 1 < step ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[320px]">
          {/* Step 1: Información Básica */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfc" className="flex items-center gap-1">
                    RFC <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    disabled={!!editingContributor}
                    className="font-mono text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    12 caracteres (persona moral) o 13 (persona física)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Persona <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_persona: 'moral' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.tipo_persona === 'moral'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <Building2 className={`h-8 w-8 mx-auto mb-2 ${formData.tipo_persona === 'moral' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">Moral</p>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_persona: 'fisica' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.tipo_persona === 'fisica'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                    >
                      <User className={`h-8 w-8 mx-auto mb-2 ${formData.tipo_persona === 'fisica' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">Física</p>
                      <p className="text-xs text-muted-foreground">Individuo</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">
                  {formData.tipo_persona === 'moral' ? 'Razón Social' : 'Nombre Completo'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder={formData.tipo_persona === 'moral' ? 'Empresa SA de CV' : 'Juan Pérez García'}
                  className="text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado del Contribuyente</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: EstadoContribuyente) =>
                      setFormData({ ...formData, estado: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Activo
                        </div>
                      </SelectItem>
                      <SelectItem value="inactivo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          Inactivo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isAdmin && editingContributor && (
                  <div className="space-y-2">
                    <Label>Reasignar a Usuario</Label>
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
                            {usuario.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Dirección */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">Domicilio Fiscal</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Colonia / Dirección Fiscal <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={formData.direccion_fiscal}
                      onChange={(e) => setFormData({ ...formData, direccion_fiscal: e.target.value })}
                      placeholder="Col. Centro, Calle Principal #123"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Calle y Número</Label>
                      <Input
                        value={formData.calle_numero}
                        onChange={(e) => setFormData({ ...formData, calle_numero: e.target.value })}
                        placeholder="Av. Reforma #123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Municipio / Delegación</Label>
                      <Input
                        value={formData.poblacion_municipio}
                        onChange={(e) => setFormData({ ...formData, poblacion_municipio: e.target.value })}
                        placeholder="Cuauhtémoc"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Código Postal</Label>
                      <Input
                        value={formData.cp}
                        onChange={(e) => setFormData({ ...formData, cp: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        placeholder="06600"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado <span className="text-destructive">*</span></Label>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contacto */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Teléfonos de Contacto</span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={formData.telefonos}
                    onChange={(e) => setFormData({ ...formData, telefonos: e.target.value })}
                    placeholder="5551234567, 5559876543"
                    className="bg-white dark:bg-gray-900"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separa múltiples teléfonos con comas
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">Correos Electrónicos</span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={formData.correos}
                    onChange={(e) => setFormData({ ...formData, correos: e.target.value })}
                    placeholder="contacto@empresa.com, facturacion@empresa.com"
                    className="bg-white dark:bg-gray-900"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separa múltiples correos con comas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Credenciales */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Las credenciales son opcionales y se guardarán de forma segura.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Credenciales SAT
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <PasswordField
                    label="Contraseña Portal SAT"
                    value={formData.contrasena_sat}
                    onChange={(v) => setFormData({ ...formData, contrasena_sat: v })}
                  />
                  <PasswordField
                    label="Contraseña e.Firma"
                    value={formData.contrasena_firma}
                    onChange={(v) => setFormData({ ...formData, contrasena_firma: v })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileKey className="h-4 w-4 text-primary" />
                  Otras Plataformas (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuenta RTP</Label>
                    <Input
                      value={formData.cuenta_rtp}
                      onChange={(e) => setFormData({ ...formData, cuenta_rtp: e.target.value })}
                      placeholder="usuario_rtp"
                    />
                  </div>
                  <PasswordField
                    label="Contraseña RTP"
                    value={formData.contrasena_rtp}
                    onChange={(v) => setFormData({ ...formData, contrasena_rtp: v })}
                  />
                  <div className="space-y-2">
                    <Label>Cuenta ISN</Label>
                    <Input
                      value={formData.cuenta_isn}
                      onChange={(e) => setFormData({ ...formData, cuenta_isn: e.target.value })}
                      placeholder="cuenta_isn"
                    />
                  </div>
                  <PasswordField
                    label="Contraseña ISN"
                    value={formData.contrasena_isn}
                    onChange={(v) => setFormData({ ...formData, contrasena_isn: v })}
                  />
                  <div className="space-y-2">
                    <Label>Cuenta SIPARE</Label>
                    <Input
                      value={formData.cuenta_sipare}
                      onChange={(e) => setFormData({ ...formData, cuenta_sipare: e.target.value })}
                      placeholder="sipare_user"
                    />
                  </div>
                  <PasswordField
                    label="Contraseña SIPARE"
                    value={formData.contrasena_sipare}
                    onChange={(v) => setFormData({ ...formData, contrasena_sipare: v })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handlePrev}
          >
            {step === 1 ? (
              'Cancelar'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </>
            )}
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingContributor ? 'Guardar Cambios' : 'Crear Contribuyente'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export function ContributorsSection() {
  const { user: currentUser } = useAuth();
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<'administrador' | 'contador'>('contador');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Diálogos
  const [dialogFormOpen, setDialogFormOpen] = useState(false);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contribuyente | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contribuyente | null>(null);

  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    fetchContribuyentes();
    if (currentUser?.tipo_usuario === 'administrador') {
      fetchUsuarios();
    }
  }, []);

  const fetchContribuyentes = async () => {
    try {
      const response = await fetch(
        `${API_URL}/contribuyentes`,
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
          description: result.message || "No se pudieron cargar los contribuyentes",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { role, contribuyentes: fetchedContribuyentes } = result.data;

      setUserRole(role);
      setContribuyentes(fetchedContribuyentes || []);

    } catch (error) {
      console.error('Error cargando contribuyentes:', error);
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
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleDeleteContributor = async (idContribuyente: number) => {
    if (!confirm('¿Estás seguro de eliminar este contribuyente? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/contribuyentes`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify({
          id_contribuyente: idContribuyente,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Contribuyente eliminado" });
        fetchContribuyentes();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el contribuyente",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (contribuyente: Contribuyente) => {
    setEditingContributor(contribuyente);
    setDialogFormOpen(true);
  };

  const openDetailDialog = (contribuyente: Contribuyente) => {
    setSelectedContributor(contribuyente);
    setDialogDetailOpen(true);
  };

  const filteredContribuyentes = contribuyentes.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (estado: string) => {
    if (estado === 'activo') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">Activo</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Inactivo</Badge>;
  };

  const getTipoPersonaBadge = (tipo: string) => {
    if (tipo === 'moral') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">Moral</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">Física</Badge>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando contribuyentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contribuyentes</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? `Gestiona todos los contribuyentes de ${currentUser?.organizacionActiva?.nombre}`
              : 'Tus contribuyentes asignados'
            }
          </p>
        </div>
        <Button onClick={() => { setEditingContributor(null); setDialogFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contribuyente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contribuyentes.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contribuyentes.filter(c => c.estado === 'activo').length}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contribuyentes.filter(c => c.tipo_persona === 'moral').length}</p>
              <p className="text-xs text-muted-foreground">Morales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contribuyentes.filter(c => c.tipo_persona === 'fisica').length}</p>
              <p className="text-xs text-muted-foreground">Físicas</p>
            </div>
          </div>
        </Card>
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
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFC</TableHead>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContribuyentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No se encontraron contribuyentes' : 'No hay contribuyentes registrados'}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => { setEditingContributor(null); setDialogFormOpen(true); }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar primero
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredContribuyentes.map((contribuyente) => (
                <TableRow
                  key={contribuyente.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetailDialog(contribuyente)}
                >
                  <TableCell className="font-mono font-medium">{contribuyente.rfc}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {contribuyente.tipo_persona === 'moral' ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="max-w-[200px] truncate">{contribuyente.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoPersonaBadge(contribuyente.tipo_persona)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="max-w-[120px] truncate">{contribuyente.usuario_asignado_nombre}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(contribuyente.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailDialog(contribuyente)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalle</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(contribuyente)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {isAdmin && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContributor(contribuyente.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Diálogo de Detalle */}
      <ContribuyenteDetailDialog
        contribuyente={selectedContributor}
        open={dialogDetailOpen}
        onClose={() => {
          setDialogDetailOpen(false);
          setSelectedContributor(null);
        }}
        onEdit={() => {
          setDialogDetailOpen(false);
          if (selectedContributor) {
            openEditDialog(selectedContributor);
          }
        }}
        onRefresh={() => {
          fetchContribuyentes();
          if (selectedContributor) {
            const updated = contribuyentes.find(c => c.id === selectedContributor.id);
            if (updated) setSelectedContributor(updated);
          }
        }}
      />

      {/* Formulario Wizard */}
      <ContribuyenteFormWizard
        open={dialogFormOpen}
        onClose={() => {
          setDialogFormOpen(false);
          setEditingContributor(null);
        }}
        editingContributor={editingContributor}
        onSave={fetchContribuyentes}
        usuarios={usuarios}
        isAdmin={isAdmin}
      />
    </div>
  );
}
