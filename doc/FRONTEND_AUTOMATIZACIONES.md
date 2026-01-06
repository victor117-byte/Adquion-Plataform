# 🔗 Integración Frontend - Sistema de Automatizaciones

Guía completa para integrar el sistema de automatizaciones en el frontend.

---

## 📋 Variables de Contexto Requeridas

El frontend necesita mantener en el estado o contexto:

```typescript
interface UserSession {
  correo: string;           // Email del usuario logueado
  nombre: string;           // Nombre del usuario
  organizacion: string;     // Nombre de la organización
  tipo_usuario: 'administrador' | 'contador';
}
```

**Ejemplo con React Context:**

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: UserSession | null;
  login: (correo: string, password: string, org: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<UserSession | null>(null);
  
  const login = async (correo: string, password: string, organizacion: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña: password, organizacion })
    });
    
    const data = await response.json();
    if (data.success) {
      setUser({
        correo: data.data.correo,
        nombre: data.data.nombre,
        organizacion: organizacion,
        tipo_usuario: data.data.tipo_usuario
      });
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 🤖 1. Descubrir Scripts Disponibles

### Endpoint

```
GET /api/automatizaciones/disponibles
```

### Parámetros Requeridos

- `correo` - Email del admin (obtenido de `user.correo`)
- `organizacion` - Nombre de la organización (obtenido de `user.organizacion`)

### Implementación Frontend

```typescript
// hooks/useAvailableScripts.ts
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface AvailableScript {
  script_path: string;
  nombre_sugerido: string;
  nombre_display: string;
  descripcion_sugerida: string;
  configurado: boolean;
}

export function useAvailableScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<AvailableScript[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user || user.tipo_usuario !== 'administrador') return;
    
    fetch(`/api/automatizaciones/disponibles?correo=${user.correo}&organizacion=${user.organizacion}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setScripts(data.data.scripts_disponibles);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);
  
  return { scripts, loading };
}
```

### Componente de UI

```typescript
// components/ScriptDiscovery.tsx
import { useAvailableScripts } from '@/hooks/useAvailableScripts';

export function ScriptDiscovery() {
  const { scripts, loading } = useAvailableScripts();
  
  if (loading) return <div>Cargando scripts...</div>;
  
  return (
    <div className="space-y-4">
      <h2>Scripts Disponibles</h2>
      
      {scripts.map(script => (
        <div key={script.script_path} className="border p-4 rounded">
          <h3>{script.nombre_display}</h3>
          <p className="text-sm text-gray-600">{script.descripcion_sugerida}</p>
          <p className="text-xs text-gray-500">Archivo: {script.script_path}</p>
          
          {script.configurado ? (
            <span className="badge-success">✓ Configurado</span>
          ) : (
            <button onClick={() => handleConfigure(script)}>
              Configurar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ⚙️ 2. Crear Automatización

### Endpoint

```
POST /api/automatizaciones
```

### Body Requerido

```typescript
interface CreateAutomationRequest {
  correo_admin: string;      // user.correo
  organizacion: string;      // user.organizacion
  nombre: string;            // DEBE empezar con "prod_"
  descripcion?: string;
  script_path: string;
  cron_expresion: string;    // "0 9 * * *"
  activo?: boolean;          // Por defecto: false
  variables_personalizadas?: Record<string, string | number | boolean>;  // Variables personalizadas
}
```

### Variables Personalizadas

Puedes definir variables específicas para cada automatización. Estas se pasan al script Python como variables de entorno con el prefijo `SAT_VAR_`.

**Ejemplos de uso:**

```typescript
// Script que procesa un RFC específico
variables_personalizadas: {
  rfc_objetivo: "ABC123456DEF",
  modo_procesamiento: "completo"
}
// El script Python recibirá:
// SAT_VAR_RFC_OBJETIVO = "ABC123456DEF"
// SAT_VAR_MODO_PROCESAMIENTO = "completo"

// Script de notificaciones
variables_personalizadas: {
  email_destino: "admin@empresa.com",
  asunto: "Reporte Diario SAT"
}

// Script con límites
variables_personalizadas: {
  limite_registros: 1000,
  fecha_inicio: "2024-01-01"
}
```

### Implementación Frontend

```typescript
// components/CreateAutomation.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface CreateAutomationFormData {
  nombre: string;
  descripcion: string;
  script_path: string;
  cron_expresion: string;
}

export function CreateAutomation({ scriptPath }: { scriptPath: string }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateAutomationFormData>({
    nombre: scriptPath.replace('.py', ''),  // Ya tiene "prod_" del script
    descripcion: '',
    script_path: scriptPath,
    cron_expresion: '0 9 * * *'  // 9:00 AM diario por defecto
  });
  const [customVars, setCustomVars] = useState<Record<string, string>>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // IMPORTANTE: Incluir correo_admin y organizacion
    const response = await fetch('/api/automatizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo_admin: user.correo,        // ← Requerido
        organizacion: user.organizacion,  // ← Requerido
        ...formData,
        variables_personalizadas: customVars,  // ← Variables personalizadas
        activo: false  // Crear deshabilitada por defecto
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Automatización creada exitosamente');
      // Actualizar lista de automatizaciones
    } else {
      alert(`Error: ${data.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.nombre}
        onChange={e => setFormData({...formData, nombre: e.target.value})}
        placeholder="Nombre (debe empezar con prod_)"
        required
      />
      
      <textarea
        value={formData.descripcion}
        onChange={e => setFormData({...formData, descripcion: e.target.value})}
        placeholder="Descripción"
      />
      
      <input
        type="text"
        value={formData.cron_expresion}
        onChange={e => setFormData({...formData, cron_expresion: e.target.value})}
        placeholder="Expresión cron (ej: 0 9 * * *)"
        required
      />
      
      <p className="text-sm text-gray-600">
        Script: {formData.script_path}
      </p>
      div className="mt-4">
        <h4 className="font-bold mb-2">Variables Personalizadas (Opcional)</h4>
        <p className="text-xs text-gray-600 mb-2">
          Estas variables se pasarán al script como SAT_VAR_NOMBRE
        </p>
        
        <CustomVariablesEditor
          variables={customVars}
          onChange={setCustomVars}
        />
      </div>
      
      <button type="submit">Crear Automatización</button>
    </form>
  );
}

// Componente auxiliar para editar variables personalizadas
function CustomVariablesEditor({ 
  variables, 
  onChange 
}: { 
  variables: Record<string, string>;
  onChange: (vars: Record<string, string>) => void;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  const addVariable = () => {
    if (!newKey.trim()) return;
    onChange({ ...variables, [newKey]: newValue });
    setNewKey('');
    setNewValue('');
  };
  
  const removeVariable = (key: string) => {
    const { [key]: _, ...rest } = variables;
  variables_personalizadas: Record<string, string | number | boolean>;
    onChange(rest);
  };
  
  return (
    <div className="space-y-2">
      {Object.entries(variables).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            {key}: {value}
          </span>
          <button
            type="button"
            onClick={() => removeVariable(key)}
            className="text-red-500 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Variable (ej: rfc_objetivo)"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          className="text-sm"
        />
        <input
          type="text"
          placeholder="Valor"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="text-sm"
        />
        <button
          type="button"
          onClick={addVariable}
          className="btn-sm"
        >
          + Agregar
        </button>
      </div>
    </divton type="submit">Crear Automatización</button>
    </form>
  );
}
```

---

## 📋 3. Listar Automatizaciones

### Endpoint

```
GET /api/automatizaciones
```

### Parámetros Requeridos

- `correo` - user.correo
- `organizacion` - user.organizacion

### Implementación Frontend

```typescript
// hooks/useAutomations.ts
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface Automa
          
          {auto.variables_personalizadas && Object.keys(auto.variables_personalizadas).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-blue-600">
                Ver variables ({Object.keys(auto.variables_personalizadas).length})
              </summary>
              <div className="mt-1 text-xs space-y-1">
                {Object.entries(auto.variables_personalizadas).map(([key, value]) => (
                  <div key={key} className="font-mono bg-gray-50 px-2 py-1 rounded">
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            </details>
          )}tion {
  id: number;
  nombre: string;
  nombre_display: string;
  descripcion: string;
  script_path: string;
  cron_expresion: string;
  activo: boolean;
  ultima_ejecucion: string | null;
  ultima_estado: string | null;
  total_ejecuciones: number;
  ejecuciones_exitosas: number;
  ejecuciones_error: number;
}

export function useAutomations() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchAutomations = async () => {
    if (!user) return;
    
    const response = await fetch(
      `/api/automatizaciones?correo=${user.correo}&organizacion=${user.organizacion}`
    );
    const data = await response.json();
    
    if (data.success) {
      setAutomations(data.data.automatizaciones);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchAutomations();
  }, [user]);
  
  return { automations, loading, refetch: fetchAutomations };
}
```

### Componente de UI

```typescript
// components/AutomationsList.tsx
import { useAutomations } from '@/hooks/useAutomations';

export function AutomationsList() {
  const { automations, loading } = useAutomations();
  
  if (loading) return <div>Cargando automatizaciones...</div>;
  
  return (
    <div className="space-y-4">
      {automations.map(auto => (
        <div key={auto.id} className="border p-4 rounded">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{auto.nombre_display}</h3>
              <p className="text-sm text-gray-600">{auto.descripcion}</p>
              <p className="text-xs text-gray-500">Cron: {auto.cron_expresion}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={auto.activo ? 'badge-success' : 'badge-gray'}>
                {auto.activo ? 'Activo' : 'Inactivo'}
              </span>
              
              <ToggleButton
                automationId={auto.id}
                currentState={auto.activo}
              />
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            <div>Ejecuciones: {auto.total_ejecuciones}</div>
            <div className="text-green-600">✓ Exitosas: {auto.ejecuciones_exitosas}</div>
            <div className="text-red-600">✗ Errores: {auto.ejecuciones_error}</div>
          </div>
          
          {auto.ultima_ejecucion && (
            <div className="mt-2 text-xs">
              Última ejecución: {new Date(auto.ultima_ejecucion).toLocaleString()}
              <span className={`ml-2 ${auto.ultima_estado === 'exitoso' ? 'text-green-600' : 'text-red-600'}`}>
                ({auto.ultima_estado})
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔄 4. Activar/Desactivar Automatización

### Endpoint
  variables_personalizadas?: Record<string, string | number | boolean>;

```
PATCH /api/automatizaciones
```

### Body Requerido

```typescript
interface ToggleAutomationRequest {
  correo_admin: string;      // user.correo
  organizacion: string;      // user.organizacion
  id_automatizacion: number;
  activo: boolean;
  // Opcional: también se pueden modificar otros campos
  cron_expresion?: string;
  descripcion?: string;
}
```

### Implementación Frontend

```typescript
// components/ToggleButton.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function ToggleButton({ 
  automationId, 
  currentState,
  onSuccess 
}: { 
  automationId: number;
  currentState: boolean;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const handleToggle = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // IMPORTANTE: Incluir correo_admin y organizacion
    const response = await fetch('/api/automatizaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo_admin: user.correo,        // ← Requerido
        organizacion: user.organizacion,  // ← Requerido
        id_automatizacion: automationId,
        activo: !currentState
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`Automatización ${!currentState ? 'activada' : 'desactivada'}`);
      onSuccess?.();
    } else {
      alert(`Error: ${data.message}`);
    }
    
    setLoading(false);
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={currentState ? 'btn-danger' : 'btn-success'}
    >
      {loading ? 'Procesando...' : currentState ? 'Desactivar' : 'Activar'}
    </button>
  );
}
```

---

## ▶️ 5. Ejecutar Manualmente

### Endpoint

```
POST /api/automatizaciones/ejecutar
```

### Body Requerido

```typescript
interface ExecuteAutomationRequest {
  correo_admin: string;      // user.correo
  organizacion: string;      // user.organizacion
  id_automatizacion: number;
}
```

### Implementación Frontend

```typescript
// components/ExecuteButton.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function ExecuteButton({ 
  automationId,
  onComplete 
}: { 
  automationId: number;
  onComplete?: (result: any) => void;
}) {
  const { user } = useAuth();
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleExecute = async () => {
    if (!user) return;
    
    setExecuting(true);
    setResult(null);
    
    try {
      // IMPORTANTE: Este endpoint usa correo_admin y organizacion
      // para determinar a qué BD debe conectarse el script Python
      const response = await fetch('/api/automatizaciones/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo_admin: user.correo,        // ← Requerido
          organizacion: user.organizacion,  // ← Requerido (CRÍTICO)
          id_automatizacion: automationId
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('Ejecución completada');
        onComplete?.(data.data);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Error al ejecutar automatización');
    } finally {
      setExecuting(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleExecute}
        disabled={executing}
        className="btn-primary"
      >
        {executing ? 'Ejecutando...' : '▶️ Ejecutar Ahora'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-bold">Resultado:</h4>
          <p>Estado: {result.data?.estado}</p>
          <p>Duración: {result.data?.duracion_segundos}s</p>
          <pre className="text-xs overflow-auto max-h-40">
            {result.data?.output}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 6. Ver Logs de Ejecución

### Endpoint

```
GET /api/automatizaciones/logs
```

### Parámetros Requeridos

- `correo` - user.correo
- `organizacion` - user.organizacion
- `id_automatizacion` - ID de la automatización
- `limite` (opcional) - Número de logs a retornar (default: 50)

### Implementación Frontend

```typescript
// components/ExecutionLogs.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface ExecutionLog {
  id: number;
  estado: 'exitoso' | 'error' | 'advertencia' | 'en_ejecucion';
  mensaje: string;
  output: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_segundos: number;
}

export function ExecutionLogs({ automationId }: { automationId: number }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    if (!user) return;
    
    // IMPORTANTE: Incluir correo y organizacion
    fetch(
      `/api/automatizaciones/logs?correo=${user.correo}&organizacion=${user.organizacion}&id_automatizacion=${automationId}&limite=20`
    )
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.data.logs);
          setStats(data.data.estadisticas);
        }
      });
  }, [user, automationId]);
  
  return (
    <div>
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card text-green-600">
            <div className="stat-label">Exitosos</div>
            <div className="stat-value">{stats.exitosos}</div>
          </div>
          <div className="stat-card text-red-600">
            <div className="stat-label">Errores</div>
            <div className="stat-value">{stats.errores}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Promedio</div>
            <div className="stat-value">{stats.duracion_promedio?.toFixed(1)}s</div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="border p-3 rounded">
            <div className="flex justify-between items-start">
              <span className={`badge ${getEstadoColor(log.estado)}`}>
                {log.estado}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(log.fecha_inicio).toLocaleString()}
              </span>
            </div>
            
            <p className="text-sm mt-2">{log.mensaje}</p>
            
            {log.duracion_segundos && (
              <p className="text-xs text-gray-600">
                Duración: {log.duracion_segundos}s
              </p>
            )}
            
            {log.output && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Ver output</summary>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-40">
                  {log.output}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'exitoso': return 'bg-green-100 text-green-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'advertencia': return 'bg-yellow-100 text-yellow-800';
    case 'en_ejecucion': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
```

---

## 🎯 Resumen de Parámetros Críticos

### ⚠️ SIEMPRE INCLUIR EN TODAS LAS PETICIONES:

```typescript
{
  correo: user.correo,            // ← Email del usuario logueado
  organizacion: user.organizacion // ← Nombre de la organización
}

// O para endpoints de admin:
{
  correo_admin: user.correo,      // ← Email del admin
  organizacion: user.organizacion // ← Nombre de la organización
}
```

### ¿Por qué es crítico?

1. **Backend determina la BD correcta**: `org_${organizacion}`
2. **Scripts Python reciben variables de entorno**:
   - `SAT_DATABASE_NAME` = "org_mi_empresa"
   - `SAT_ORGANIZACION` = "Mi_Empresa"
3. **Aislamiento multi-tenant**: Cada org solo ve sus datos

---

## 🚀 Ejemplo Completo: Página de Automatizaciones

```typescript
// pages/Automations.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useAutomations } from '@/hooks/useAutomations';
import { useAvailableScripts } from '@/hooks/useAvailableScripts';
import { AutomationsList } from '@/components/AutomationsList';
import { ScriptDiscovery } from '@/components/ScriptDiscovery';

export default function AutomationsPage() {
  const { user } = useAuth();
  
  // Verificar que es administrador
  if (!user || user.tipo_usuario !== 'administrador') {
    return <div>Solo administradores pueden acceder a automatizaciones</div>;
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Automatizaciones</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p className="text-sm">
          Organización: <strong>{user.organizacion}</strong>
        </p>
        <p className="text-xs text-gray-600">
          Los scripts se ejecutarán en la base de datos de esta organización
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Automatizaciones Configuradas</h2>
          <AutomationsList />
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Scripts Disponibles</h2>
          <ScriptDiscovery />
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Integración

- [ ] Context de autenticación guarda `organizacion`
- [ ] Todos los endpoints incluyen `correo` y `organizacion`
- [ ] Scripts Python leen `SAT_DATABASE_NAME` y `SAT_ORGANIZACION`
- [ ] UI muestra la organización actual
- [ ] Validación de rol admin antes de mostrar automatizaciones
- [ ] Manejo de errores en todas las peticiones
- [ ] Loading states en todos los componentes
- [ ] Refresh automático después de crear/modificar

---

**Última actualización:** 6 de enero de 2026
