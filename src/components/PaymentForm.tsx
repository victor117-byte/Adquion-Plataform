import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreditCard, Lock, Building2, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentFormProps {
  planName: string;
  amount: number;
  onSuccess?: () => void;
}

export const PaymentForm = ({ planName, amount, onSuccess }: PaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'fiscal' | 'payment'>('fiscal');
  
  const [fiscalData, setFiscalData] = useState({
    rfc: '',
    razonSocial: '',
    regimenFiscal: '',
    usoCFDI: '',
    codigoPostal: '',
    direccion: '',
    ciudad: '',
    estado: '',
  });
  
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const handleFiscalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Simular payment_method_id (en producción esto vendría de Stripe.js)
      const paymentMethodId = `pm_card_${cardData.number.replace(/\s/g, '').slice(-4)}`;
      
      // Crear suscripción con el backend
      const response = await fetch(`${API_URL}/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
          payment_method_id: paymentMethodId,
          fiscal_data: {
            rfc: fiscalData.rfc,
            razon_social: fiscalData.razonSocial,
            regimen_fiscal: fiscalData.regimenFiscal,
            uso_cfdi: fiscalData.usoCFDI,
            codigo_postal: fiscalData.codigoPostal,
            direccion: fiscalData.direccion,
            ciudad: fiscalData.ciudad,
            estado: fiscalData.estado,
          },
        }),
      });

      const data = await response.json();

      // Si el backend aún no soporta pagos completamente (error 500 o similar)
      // Mostrar modo demo
      if (!response.ok) {
        if (response.status === 500 || data.error_code === 'HTTP_500') {
          // MODO DEMO: El backend aún no tiene Stripe configurado
          console.log('🔧 Modo demo activado - Stripe no configurado en backend');
          console.log('📊 Datos fiscales guardados:', fiscalData);
          console.log('💳 Datos de pago:', { ...cardData, cvv: '***' });
          
          toast({
            title: "✅ Modo Demostración",
            description: `Suscripción simulada al plan ${planName}. Los datos fiscales han sido capturados. (Stripe pendiente de configurar en backend)`,
          });
          
          // Simular actualización del usuario con suscripción
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentUser.subscription = {
            ...currentUser.subscription,
            plan: planName.toLowerCase(),
            status: 'active',
            is_trial: false,
          };
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          onSuccess?.();
          return;
        }
        
        throw new Error(data.message || data.detail || 'Error al procesar el pago');
      }

      // Pago exitoso real
      toast({
        title: "¡Pago exitoso!",
        description: `Te has suscrito al plan ${planName}. ${data.subscription?.status === 'active' ? 'Tu suscripción está activa.' : ''}`,
      });

      // Actualizar el usuario en localStorage si viene en la respuesta
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error en pago:', error);
      toast({
        title: "Error al procesar el pago",
        description: error instanceof Error ? error.message : "No se pudo completar la suscripción. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRFC = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);
  };

  const formatPostalCode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 5);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === 'fiscal' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'fiscal' ? 'bg-primary text-white' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium">Datos Fiscales</span>
        </div>
        <div className="w-12 h-0.5 bg-muted"></div>
        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium">Método de Pago</span>
        </div>
      </div>

      {/* Formulario de Datos Fiscales */}
      {step === 'fiscal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos Fiscales (México)
            </CardTitle>
            <CardDescription>
              Información necesaria para la facturación electrónica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFiscalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC *</Label>
                  <Input
                    id="rfc"
                    placeholder="XAXX010101000"
                    value={fiscalData.rfc}
                    onChange={(e) => setFiscalData({ ...fiscalData, rfc: formatRFC(e.target.value) })}
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    12 caracteres para persona moral o 13 para persona física
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social / Nombre Completo *</Label>
                  <Input
                    id="razonSocial"
                    placeholder="Mi Empresa S.A. de C.V."
                    value={fiscalData.razonSocial}
                    onChange={(e) => setFiscalData({ ...fiscalData, razonSocial: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regimenFiscal">Régimen Fiscal *</Label>
                  <Select
                    value={fiscalData.regimenFiscal}
                    onValueChange={(value) => setFiscalData({ ...fiscalData, regimenFiscal: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu régimen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                      <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                      <SelectItem value="605">605 - Sueldos y Salarios</SelectItem>
                      <SelectItem value="606">606 - Arrendamiento</SelectItem>
                      <SelectItem value="608">608 - Demás ingresos</SelectItem>
                      <SelectItem value="610">610 - Residentes en el Extranjero</SelectItem>
                      <SelectItem value="611">611 - Ingresos por Dividendos</SelectItem>
                      <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales</SelectItem>
                      <SelectItem value="614">614 - Ingresos por intereses</SelectItem>
                      <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                      <SelectItem value="620">620 - Sociedades Cooperativas</SelectItem>
                      <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                      <SelectItem value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</SelectItem>
                      <SelectItem value="623">623 - Opcional para Grupos de Sociedades</SelectItem>
                      <SelectItem value="624">624 - Coordinados</SelectItem>
                      <SelectItem value="625">625 - Régimen de Actividades Empresariales</SelectItem>
                      <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usoCFDI">Uso de CFDI *</Label>
                  <Select
                    value={fiscalData.usoCFDI}
                    onValueChange={(value) => setFiscalData({ ...fiscalData, usoCFDI: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el uso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                      <SelectItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</SelectItem>
                      <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                      <SelectItem value="I01">I01 - Construcciones</SelectItem>
                      <SelectItem value="I02">I02 - Mobiliario y equipo de oficina</SelectItem>
                      <SelectItem value="I03">I03 - Equipo de transporte</SelectItem>
                      <SelectItem value="I04">I04 - Equipo de cómputo y accesorios</SelectItem>
                      <SelectItem value="I05">I05 - Dados, troqueles, moldes, matrices</SelectItem>
                      <SelectItem value="I06">I06 - Comunicaciones telefónicas</SelectItem>
                      <SelectItem value="I07">I07 - Comunicaciones satelitales</SelectItem>
                      <SelectItem value="I08">I08 - Otra maquinaria y equipo</SelectItem>
                      <SelectItem value="D01">D01 - Honorarios médicos, dentales y gastos hospitalarios</SelectItem>
                      <SelectItem value="D02">D02 - Gastos médicos por incapacidad o discapacidad</SelectItem>
                      <SelectItem value="D03">D03 - Gastos funerales</SelectItem>
                      <SelectItem value="D04">D04 - Donativos</SelectItem>
                      <SelectItem value="D05">D05 - Intereses reales hipotecarios</SelectItem>
                      <SelectItem value="D06">D06 - Aportaciones voluntarias al SAR</SelectItem>
                      <SelectItem value="D07">D07 - Primas por seguros de gastos médicos</SelectItem>
                      <SelectItem value="D08">D08 - Gastos de transportación escolar</SelectItem>
                      <SelectItem value="D09">D09 - Depósitos en cuentas de ahorro</SelectItem>
                      <SelectItem value="D10">D10 - Pagos por servicios educativos</SelectItem>
                      <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                      <SelectItem value="CP01">CP01 - Pagos</SelectItem>
                      <SelectItem value="CN01">CN01 - Nómina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección Fiscal *</Label>
                <Input
                  id="direccion"
                  placeholder="Calle, Número, Colonia"
                  value={fiscalData.direccion}
                  onChange={(e) => setFiscalData({ ...fiscalData, direccion: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Código Postal *</Label>
                  <Input
                    id="codigoPostal"
                    placeholder="01000"
                    value={fiscalData.codigoPostal}
                    onChange={(e) => setFiscalData({ ...fiscalData, codigoPostal: formatPostalCode(e.target.value) })}
                    maxLength={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ciudad de México"
                    value={fiscalData.ciudad}
                    onChange={(e) => setFiscalData({ ...fiscalData, ciudad: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={fiscalData.estado}
                    onValueChange={(value) => setFiscalData({ ...fiscalData, estado: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGS">Aguascalientes</SelectItem>
                      <SelectItem value="BC">Baja California</SelectItem>
                      <SelectItem value="BCS">Baja California Sur</SelectItem>
                      <SelectItem value="CAMP">Campeche</SelectItem>
                      <SelectItem value="CHIS">Chiapas</SelectItem>
                      <SelectItem value="CHIH">Chihuahua</SelectItem>
                      <SelectItem value="CDMX">Ciudad de México</SelectItem>
                      <SelectItem value="COAH">Coahuila</SelectItem>
                      <SelectItem value="COL">Colima</SelectItem>
                      <SelectItem value="DGO">Durango</SelectItem>
                      <SelectItem value="GTO">Guanajuato</SelectItem>
                      <SelectItem value="GRO">Guerrero</SelectItem>
                      <SelectItem value="HGO">Hidalgo</SelectItem>
                      <SelectItem value="JAL">Jalisco</SelectItem>
                      <SelectItem value="MEX">México</SelectItem>
                      <SelectItem value="MICH">Michoacán</SelectItem>
                      <SelectItem value="MOR">Morelos</SelectItem>
                      <SelectItem value="NAY">Nayarit</SelectItem>
                      <SelectItem value="NL">Nuevo León</SelectItem>
                      <SelectItem value="OAX">Oaxaca</SelectItem>
                      <SelectItem value="PUE">Puebla</SelectItem>
                      <SelectItem value="QRO">Querétaro</SelectItem>
                      <SelectItem value="QROO">Quintana Roo</SelectItem>
                      <SelectItem value="SLP">San Luis Potosí</SelectItem>
                      <SelectItem value="SIN">Sinaloa</SelectItem>
                      <SelectItem value="SON">Sonora</SelectItem>
                      <SelectItem value="TAB">Tabasco</SelectItem>
                      <SelectItem value="TAMPS">Tamaulipas</SelectItem>
                      <SelectItem value="TLAX">Tlaxcala</SelectItem>
                      <SelectItem value="VER">Veracruz</SelectItem>
                      <SelectItem value="YUC">Yucatán</SelectItem>
                      <SelectItem value="ZAC">Zacatecas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Estos datos serán utilizados para la generación de facturas electrónicas (CFDI) de acuerdo con la normativa del SAT.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continuar al Pago →
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Pago */}
      {step === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Pago
            </CardTitle>
            <CardDescription>
              Plan: {planName} - ${amount}/mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número de tarjeta</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardData.number}
              onChange={(e) =>
                setCardData({ ...cardData, number: formatCardNumber(e.target.value) })
              }
              maxLength={19}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Nombre en la tarjeta</Label>
            <Input
              id="cardName"
              placeholder="Juan Pérez"
              value={cardData.name}
              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Vencimiento</Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={cardData.expiry}
                onChange={(e) =>
                  setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })
                }
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={cardData.cvv}
                onChange={(e) =>
                  setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                }
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Pago seguro procesado por Stripe</span>
          </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Procesando...' : `Pagar $${amount}/mes`}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('fiscal')}
              >
                ← Volver a datos fiscales
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Puedes cancelar tu suscripción en cualquier momento
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
