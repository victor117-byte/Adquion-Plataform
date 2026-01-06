# 📡 Ejemplos de Uso de la API de Automatizaciones

Guía práctica con ejemplos reales de cómo hacer peticiones desde el frontend.

---

## 🔧 Configuración Inicial

```typescript
// Configurar la URL base de tu backend
const API_BASE_URL = 'http://localhost:3000'; // Desarrollo
// const API_BASE_URL = 'https://tudominio.com'; // Producción

// Obtener datos del usuario (desde contexto de autenticación)
const user = {
  correo: 'admin@empresa.com',
  organizacion: 'Mi_Empresa',
  tipo_usuario: 'administrador'
};
```

---

## 📋 1. Listar Automatizaciones

```typescript
const fetchAutomations = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/automatizaciones?` +
      `correo=${encodeURIComponent(user.correo)}&` +
      `organizacion=${encodeURIComponent(user.organizacion)}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Automatizaciones:', data.data.automatizaciones);
      return data.data.automatizaciones;
    } else {
      console.error('Error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return [];
  }
};

// Llamar función
const automations = await fetchAutomations();
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "automatizaciones": [
      {
        "id": 1,
        "nombre": "prod_sincronizar_sat",
        "nombre_display": "sincronizar_sat",
        "descripcion": "Sincroniza datos del SAT",
        "script_path": "prod_sincronizacion_sat.py",
        "cron_expresion": "0 9 * * *",
        "activo": true,
        "variables_personalizadas": {
          "rfc_objetivo": "ABC123456DEF",
          "limite_registros": 500
        },
        "ultima_ejecucion": "2026-01-06T09:00:00.000Z",
        "ultima_estado": "exitoso",
        "total_ejecuciones": 10,
        "ejecuciones_exitosas": 9,
        "ejecuciones_error": 1
      }
    ]
  }
}
```

---

## ➕ 2. Crear Automatización CON Variables Personalizadas

```typescript
const createAutomation = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/automatizaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // REQUERIDO: Datos del usuario
        correo_admin: user.correo,
        organizacion: user.organizacion,
        
        // REQUERIDO: Datos de la automatización
        nombre: 'prod_procesar_facturas',  // DEBE empezar con "prod_"
        descripcion: 'Procesa facturas pendientes',
        script_path: 'prod_procesar_facturas.py',
        cron_expresion: '0 */4 * * *',  // Cada 4 horas
        
        // OPCIONAL: Estado inicial
        activo: false,  // Por defecto: deshabilitada
        
        // OPCIONAL: Variables personalizadas
        variables_personalizadas: {
          limite_registros: 1000,
          modo_procesamiento: 'completo',
          email_destino: 'reportes@empresa.com',
          reintentar_errores: true
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Automatización creada:', data.data);
      alert('Automatización creada exitosamente');
      return data.data;
    } else {
      console.error('Error:', data.message);
      alert(`Error: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    alert('Error al crear automatización');
    return null;
  }
};

// Llamar función
const newAutomation = await createAutomation();
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Automatización creada exitosamente",
  "data": {
    "id": 2,
    "nombre": "prod_procesar_facturas",
    "nombre_display": "procesar_facturas",
    "descripcion": "Procesa facturas pendientes",
    "script_path": "prod_procesar_facturas.py",
    "cron_expresion": "0 */4 * * *",
    "activo": false,
    "variables_personalizadas": {
      "limite_registros": 1000,
      "modo_procesamiento": "completo",
      "email_destino": "reportes@empresa.com",
      "reintentar_errores": true
    }
  }
}
```

---

## 🔄 3. Actualizar Variables Personalizadas

```typescript
const updateAutomationVariables = async (automationId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/automatizaciones`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        correo_admin: user.correo,
        organizacion: user.organizacion,
        id_automatizacion: automationId,
        
        // Solo actualizar variables (no tocar otros campos)
        variables_personalizadas: {
          limite_registros: 2000,  // Cambiar valor
          modo_procesamiento: 'rapido',  // Cambiar valor
          email_destino: 'nuevo@empresa.com',  // Cambiar valor
          nueva_variable: 'nuevo_valor'  // Agregar nueva
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Variables actualizadas:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return null;
  }
};

// Llamar función
const updated = await updateAutomationVariables(2);
```

---

## ▶️ 4. Ejecutar Automatización Manualmente

```typescript
const executeAutomation = async (automationId: number) => {
  // Confirmar con usuario
  if (!confirm('¿Ejecutar esta automatización ahora?')) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/automatizaciones/ejecutar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo_admin: user.correo,
          organizacion: user.organizacion,
          id_automatizacion: automationId
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Ejecución completada:', data.data);
      
      // Mostrar resultado
      alert(`
        Estado: ${data.data.estado}
        Duración: ${data.data.duracion_segundos}s
        ${data.data.output ? '\nOutput:\n' + data.data.output : ''}
      `);
      
      return data.data;
    } else {
      console.error('Error:', data.message);
      alert(`Error: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    alert('Error al ejecutar automatización');
    return null;
  }
};

// Llamar función
const result = await executeAutomation(2);
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "automatizacion_id": 2,
    "estado": "exitoso",
    "mensaje": "Ejecución completada exitosamente",
    "output": "[2026-01-06 10:00:00] Iniciando procesamiento...\nProcesando 150 facturas...\n✓ Completado",
    "fecha_inicio": "2026-01-06T10:00:00.000Z",
    "fecha_fin": "2026-01-06T10:02:30.000Z",
    "duracion_segundos": 150
  }
}
```

---

## 🔀 5. Activar/Desactivar Automatización

```typescript
const toggleAutomation = async (
  automationId: number, 
  currentState: boolean
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/automatizaciones`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        correo_admin: user.correo,
        organizacion: user.organizacion,
        id_automatizacion: automationId,
        activo: !currentState  // Invertir estado actual
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const newState = !currentState ? 'activada' : 'desactivada';
      alert(`Automatización ${newState}`);
      return data.data;
    } else {
      alert(`Error: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    alert('Error al actualizar automatización');
    return null;
  }
};

// Llamar función
const toggled = await toggleAutomation(2, false);  // false = actualmente desactivada
```

---

## 📊 6. Ver Logs de Ejecución

```typescript
const fetchExecutionLogs = async (automationId: number, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/automatizaciones/logs?` +
      `correo=${encodeURIComponent(user.correo)}&` +
      `organizacion=${encodeURIComponent(user.organizacion)}&` +
      `id_automatizacion=${automationId}&` +
      `limite=${limit}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Logs:', data.data.logs);
      console.log('Estadísticas:', data.data.estadisticas);
      return data.data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return null;
  }
};

// Llamar función
const logs = await fetchExecutionLogs(2, 10);  // Últimos 10 logs
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 15,
        "automatizacion_id": 2,
        "estado": "exitoso",
        "mensaje": "Ejecución completada exitosamente",
        "output": "[2026-01-06] Procesamiento completo",
        "fecha_inicio": "2026-01-06T10:00:00.000Z",
        "fecha_fin": "2026-01-06T10:02:30.000Z",
        "duracion_segundos": 150
      }
    ],
    "estadisticas": {
      "total": 10,
      "exitosos": 9,
      "errores": 1,
      "advertencias": 0,
      "duracion_promedio": 145.5
    }
  }
}
```

---

## 🔍 7. Descubrir Scripts Disponibles

```typescript
const fetchAvailableScripts = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/automatizaciones/disponibles?` +
      `correo=${encodeURIComponent(user.correo)}&` +
      `organizacion=${encodeURIComponent(user.organizacion)}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Scripts disponibles:', data.data.scripts_disponibles);
      return data.data.scripts_disponibles;
    } else {
      console.error('Error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return [];
  }
};

// Llamar función
const availableScripts = await fetchAvailableScripts();
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "scripts_disponibles": [
      {
        "script_path": "prod_sincronizacion_sat.py",
        "nombre_sugerido": "prod_sincronizacion_sat",
        "nombre_display": "sincronizacion_sat",
        "descripcion_sugerida": "Sincronización de datos SAT",
        "configurado": true
      },
      {
        "script_path": "prod_generar_reporte.py",
        "nombre_sugerido": "prod_generar_reporte",
        "nombre_display": "generar_reporte",
        "descripcion_sugerida": "Generación de reportes",
        "configurado": false
      }
    ]
  }
}
```

---

## 🗑️ 8. Eliminar Automatización

```typescript
const deleteAutomation = async (
  automationId: number, 
  nombre: string
) => {
  // Confirmar con usuario
  if (!confirm(`¿Eliminar la automatización "${nombre}"?`)) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/automatizaciones`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        correo_admin: user.correo,
        organizacion: user.organizacion,
        id_automatizacion: automationId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Automatización eliminada exitosamente');
      return true;
    } else {
      alert(`Error: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    alert('Error al eliminar automatización');
    return false;
  }
};

// Llamar función
const deleted = await deleteAutomation(2, 'procesar_facturas');
```

---

## 🎯 Componente React Completo de Ejemplo

Ver archivo: [src/pages/Automations.tsx](src/pages/Automations.tsx)

Este archivo contiene un ejemplo completo y funcional con:
- ✅ Listado de automatizaciones
- ✅ Creación con variables personalizadas
- ✅ Edición de variables
- ✅ Activar/desactivar
- ✅ Ejecutar manualmente
- ✅ Ver logs
- ✅ Eliminar

---

## ⚠️ Puntos Importantes

1. **SIEMPRE incluir `correo_admin` y `organizacion`** en TODAS las peticiones
2. Los nombres deben empezar con `"prod_"`
3. Las variables personalizadas se guardan como objeto JSON
4. El backend pasa las variables al script Python con prefijo `SAT_VAR_`
5. Manejar errores apropiadamente con try/catch
6. Confirmar acciones destructivas (eliminar, ejecutar)

---

**Última actualización:** 6 de enero de 2026
