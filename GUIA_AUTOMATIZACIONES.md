# 🚀 Guía Completa: Sistema de Automatizaciones

## 📖 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Nomenclatura de Scripts](#nomenclatura-de-scripts)
3. [API Endpoints](#api-endpoints)
4. [Ejemplos de Implementación](#ejemplos-de-implementación)
5. [Casos de Uso Reales](#casos-de-uso-reales)

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno

```bash
# .env
VITE_API_URL=http://localhost:3000
```

### 2. Cliente API

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

export default api;
```

---

## 📝 Nomenclatura de Scripts

### ✨ Regla Simple

| Patrón | Visibilidad | Ejemplo |
|--------|-------------|---------|
| `<nombre>.py` | **TODAS** las organizaciones | `sincronizacion_sat.py` |
| `<org>_<nombre>.py` | **SOLO** esa organización | `org_1_proceso.py` |

### 🎯 Ejemplos Reales

```bash
# Scripts GENERALES (todas las orgs)
sincronizacion_sat.py
sincronizacion_general.py
backup_diario.py
reporte_mensual.py

# Scripts ESPECÍFICOS (solo para esa org)
org_1_proceso_especial.py          # Solo Org_1
org_2_reporte_mensual.py           # Solo Org_2
empresa_grande_facturacion.py      # Solo Empresa_Grande
mi_empresa_integracion.py          # Solo Mi_Empresa
```

---

## 🌐 API Endpoints

### 1️⃣ Obtener Scripts Disponibles

```typescript
GET /api/automatizaciones/disponibles

// Query Params
{
  organizacion: string,  // "Org_1", "Mi Empresa", etc.
  correo: string         // Email del administrador
}

// Response
{
  "success": true,
  "data": {
    "scripts_disponibles": [
      {
        "script_path": "sincronizacion_sat.py",
        "nombre_sugerido": "sincronizacion_sat",
        "nombre_display": "sincronizacion sat",
        "descripcion_sugerida": "Automatización: sincronizacion sat",
        "es_especifico_org": false,     // false = para todas las orgs
        "configurado": false             // false = no está configurado aún
      },
      {
        "script_path": "org_1_proceso_especial.py",
        "nombre_display": "proceso especial",  // Sin prefijo "org_1_"
        "es_especifico_org": true,             // true = solo para esta org
        "configurado": true,                    // true = ya configurado
        "automatizacion_id": 5                  // ID si está configurado
      }
    ],
    "total": 2,
    "configurados": 1,
    "sin_configurar": 1
  }
}
```

### 2️⃣ Crear Automatización

```typescript
POST /api/automatizaciones

// Body
{
  "correo": "admin@org1.com",
  "organizacion": "Org_1",
  "nombre": "Sincronización Diaria SAT",
  "descripcion": "Sincroniza datos del SAT todos los días a las 2 AM",
  "script_path": "sincronizacion_sat.py",
  "cron_expresion": "0 2 * * *",
  "activo": true,
  "variables_personalizadas": {
    "RFC_PRINCIPAL": "ABC123456XYZ",
    "DIAS_RETROCESO": "30",
    "MODO_DEBUG": "false"
  }
}

// Response
{
  "success": true,
  "data": {
    "id": 5,
    "nombre": "Sincronización Diaria SAT",
    "script_path": "sincronizacion_sat.py",
    "activo": true,
    "proxima_ejecucion": "2026-01-08T02:00:00.000Z"
  }
}
```

### 3️⃣ Listar Automatizaciones Configuradas

```typescript
GET /api/automatizaciones?organizacion=Org_1&correo=admin@org1.com

// Response
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre": "Sincronización Diaria SAT",
      "descripcion": "Sincroniza datos del SAT...",
      "script_path": "sincronizacion_sat.py",
      "cron_expresion": "0 2 * * *",
      "activo": true,
      "variables_personalizadas": {
        "RFC_PRINCIPAL": "ABC123456XYZ",
        "DIAS_RETROCESO": "30"
      },
      "ultima_ejecucion": "2026-01-07T02:00:00.000Z",
      "proxima_ejecucion": "2026-01-08T02:00:00.000Z",
      "estado": "completado",
      "created_at": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

### 4️⃣ Ejecutar Manualmente

```typescript
POST /api/automatizaciones/ejecutar

// Body
{
  "correo": "admin@org1.com",
  "organizacion": "Org_1",
  "automatizacion_id": 5
}

// Response
{
  "success": true,
  "message": "Script ejecutado exitosamente",
  "data": {
    "codigo_salida": 0,
    "tiempo_ejecucion_ms": 2345,
    "salida": "Procesados 150 registros correctamente"
  }
}
```

---

## 💻 Ejemplos de Implementación

### Ejemplo 1: Hook para Scripts Disponibles

```typescript
// src/hooks/useScriptsDisponibles.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Script {
  script_path: string;
  nombre_display: string;
  descripcion_sugerida: string;
  es_especifico_org: boolean;
  configurado: boolean;
  automatizacion_id?: number;
}

export function useScriptsDisponibles(organizacion: string, correo: string) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get('/api/automatizaciones/disponibles', {
        params: { organizacion, correo },
      });

      if (data.success) {
        setScripts(data.data.scripts_disponibles);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar scripts');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizacion && correo) {
      cargar();
    }
  }, [organizacion, correo]);

  return { scripts, loading, error, recargar: cargar };
}
```

### Ejemplo 2: Componente de Lista de Scripts

```typescript
// src/components/AutomatizacionesLista.tsx
import { useScriptsDisponibles } from '@/hooks/useScriptsDisponibles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Globe, Plus, CheckCircle } from 'lucide-react';

interface Props {
  organizacion: string;
  correo: string;
  onConfigurar: (script: any) => void;
}

export function AutomatizacionesLista({ organizacion, correo, onConfigurar }: Props) {
  const { scripts, loading, error } = useScriptsDisponibles(organizacion, correo);

  if (loading) {
    return <div className="text-center py-8">Cargando scripts...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scripts de Automatización</h2>
        <p className="text-muted-foreground">
          {scripts.length} scripts disponibles para tu organización
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script) => (
          <Card key={script.script_path} className="p-4">
            {/* Header con título */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {script.nombre_display}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {script.descripcion_sugerida}
                </p>
              </div>
              {script.configurado && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>

            {/* Badge de tipo */}
            <div className="mb-3">
              {script.es_especifico_org ? (
                <Badge variant="default" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Específico de {organizacion}
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" />
                  General
                </Badge>
              )}
            </div>

            {/* Nombre del archivo */}
            <p className="text-xs text-muted-foreground mb-3">
              <code className="bg-muted px-1.5 py-0.5 rounded">
                {script.script_path}
              </code>
            </p>

            {/* Botón de acción */}
            <Button
              onClick={() => onConfigurar(script)}
              variant={script.configurado ? 'outline' : 'default'}
              className="w-full"
              size="sm"
            >
              {script.configurado ? (
                'Ver Configuración'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Configurar
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>

      {scripts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay scripts disponibles
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 3: Formulario de Configuración

```typescript
// src/components/ConfigurarAutomatizacion.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';

interface Props {
  script: {
    script_path: string;
    nombre_display: string;
  };
  organizacion: string;
  correo: string;
  onSuccess: () => void;
}

export function ConfigurarAutomatizacion({ script, organizacion, correo, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: script.nombre_display,
    descripcion: '',
    cron_expresion: '0 2 * * *', // 2 AM diario por defecto
    activo: true,
  });
  const [variables, setVariables] = useState<Record<string, string>>({});

  const agregarVariable = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key.toUpperCase()]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { data } = await api.post('/api/automatizaciones', {
        correo,
        organizacion,
        script_path: script.script_path,
        ...formData,
        variables_personalizadas: variables,
      });

      if (data.success) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error al configurar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre</Label>
        <Input
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label>Expresión Cron</Label>
        <Input
          value={formData.cron_expresion}
          onChange={(e) => setFormData({ ...formData, cron_expresion: e.target.value })}
          placeholder="0 2 * * *"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ejemplo: <code>0 2 * * *</code> = Todos los días a las 2 AM
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.activo}
          onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
        />
        <Label>Automatización activa</Label>
      </div>

      {/* Variables personalizadas */}
      <div className="border-t pt-4">
        <Label className="mb-2 block">Variables Personalizadas</Label>
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="flex gap-2 mb-2">
            <Input value={key} disabled className="flex-1 font-mono text-sm" />
            <Input
              value={value}
              onChange={(e) => agregarVariable(key, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newVars = { ...variables };
                delete newVars[key];
                setVariables(newVars);
              }}
            >
              X
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => agregarVariable('NUEVA_VARIABLE', '')}
          className="mt-2"
        >
          + Agregar Variable
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Sincronización General (Todas las Orgs)

```bash
# Archivo: sincronizacion_sat.py
# Visible para: TODAS las organizaciones
```

**Frontend:**
```typescript
// Al listar scripts para cualquier organización, este script aparecerá
{
  "script_path": "sincronizacion_sat.py",
  "nombre_display": "sincronizacion sat",
  "es_especifico_org": false,  // ← Indica que es para todas
  "configurado": false
}
```

**Configurar:**
```typescript
await api.post('/api/automatizaciones', {
  correo: 'admin@cualquier-org.com',
  organizacion: 'Cualquier_Org',
  nombre: 'Sincronización SAT',
  script_path: 'sincronizacion_sat.py',
  cron_expresion: '0 2 * * *',
  activo: true,
  variables_personalizadas: {
    RFC_PRINCIPAL: 'ABC123456XYZ',
    DIAS_RETROCESO: '30'
  }
});
```

### Caso 2: Proceso Específico de Organización

```bash
# Archivo: org_1_proceso_especial.py
# Visible para: SOLO "Org_1"
```

**Frontend para Org_1:**
```typescript
// Este script SOLO aparecerá para Org_1
{
  "script_path": "org_1_proceso_especial.py",
  "nombre_display": "proceso especial",  // ← Sin prefijo "org_1_"
  "es_especifico_org": true,             // ← Indica que es específico
  "configurado": false
}
```

**Frontend para Org_2:**
```typescript
// Este script NO aparecerá en la lista de Org_2
// La respuesta no incluirá org_1_proceso_especial.py
```

### Caso 3: Crear Script Personalizado para Cliente

**Escenario:** Cliente "Empresa Grande" necesita proceso especial de facturación

**1. Crear el script:**
```bash
# Archivo: empresa_grande_facturacion.py
# Automáticamente SOLO visible para "Empresa_Grande"
```

**2. El cliente lo verá automáticamente:**
```typescript
// Cuando "Empresa_Grande" consulte scripts disponibles
GET /api/automatizaciones/disponibles?organizacion=Empresa_Grande&correo=admin@...

// Respuesta incluirá:
{
  "script_path": "empresa_grande_facturacion.py",
  "nombre_display": "facturacion",  // Sin prefijo "empresa_grande_"
  "es_especifico_org": true,
  "configurado": false
}
```

**3. Configurar con variables específicas:**
```typescript
await api.post('/api/automatizaciones', {
  organizacion: 'Empresa_Grande',
  script_path: 'empresa_grande_facturacion.py',
  variables_personalizadas: {
    SERIE_FACTURAS: 'A',
    LIMITE_MENSUAL: '1000',
    NOTIFICAR_A: 'contabilidad@empresa.com'
  }
});
```

---

## 🔑 Tips y Mejores Prácticas

### 1. Nombres de Variables

```typescript
// ✅ BIEN - Usar mayúsculas y guiones bajos
variables_personalizadas: {
  RFC_PRINCIPAL: 'ABC123',
  DIAS_RETROCESO: '30',
  MODO_DEBUG: 'false'
}

// ❌ MAL - No usar camelCase ni minúsculas
variables_personalizadas: {
  rfcPrincipal: 'ABC123',  // No recomendado
  dias: '30'               // Muy genérico
}
```

### 2. Validación en Frontend

```typescript
// Validar antes de enviar
if (!formData.nombre || !formData.script_path) {
  throw new Error('Campos requeridos faltantes');
}

// Validar cron expression
const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

if (!cronRegex.test(formData.cron_expresion)) {
  throw new Error('Expresión cron inválida');
}
```

### 3. Manejo de Errores

```typescript
try {
  const { data } = await api.get('/api/automatizaciones/disponibles', {
    params: { organizacion, correo }
  });
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data.scripts_disponibles;
  
} catch (error: any) {
  if (error.response?.status === 403) {
    // No es administrador
    showError('Solo administradores pueden ver scripts');
  } else if (error.response?.status === 404) {
    // Organización no existe
    showError('Organización no encontrada');
  } else {
    showError(error.response?.data?.message || 'Error desconocido');
  }
}
```

---

## 📚 Referencias Rápidas

### Expresiones Cron Comunes

```
0 2 * * *      → Todos los días a las 2:00 AM
0 */6 * * *    → Cada 6 horas
0 0 * * 0      → Todos los domingos a medianoche
0 9 1 * *      → Día 1 de cada mes a las 9:00 AM
*/15 * * * *   → Cada 15 minutos
```

### Códigos de Estado HTTP

```
200 → OK - Solicitud exitosa
201 → Created - Recurso creado
400 → Bad Request - Datos inválidos
403 → Forbidden - Sin permisos
404 → Not Found - No encontrado
500 → Internal Server Error - Error del servidor
```

---

**Última actualización:** 7 de enero de 2026
