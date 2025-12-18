# 🎯 Guía de Integración Frontend - Flujo de Usuario

## 📋 Endpoints Esenciales vs Opcionales

### ✅ ENDPOINTS ESENCIALES (Mínimos necesarios)

#### 1. Autenticación (2 endpoints)
```
POST /api/auth/register  - Registro de nuevo usuario
POST /api/auth/login     - Login de usuario existente
```

#### 2. Suscripciones (1 endpoint)
```
GET /api/payments/subscription-status  - Estado de trial/suscripción
```

#### 3. Health Check (1 endpoint)
```
GET /health  - Verificar estado del servidor
```

### 🔧 ENDPOINTS OPCIONALES (Para funcionalidad completa)

#### Pagos (solo si implementas Stripe)
```
POST /api/payments/create-subscription  - Upgrade a plan de pago
POST /api/payments/webhook              - Webhooks de Stripe (backend only)
```

#### Funcionalidades de negocio
```
POST /api/documents/upload        - Subir documentos
GET  /api/documents               - Listar documentos
POST /api/automation/tasks        - Crear automatización
GET  /api/automation/tasks        - Listar automatizaciones
```

---

## 🚀 Flujo Completo para Cliente Nuevo

### **PASO 1: Registro** 
**Endpoint:** `POST /api/auth/register`

```javascript
// Frontend: Formulario de registro
async function registrarUsuario(email, password, nombre, empresa) {
  const response = await fetch('http://localhost:8000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      full_name: nombre,
      company: empresa
    })
  });
  
  const data = await response.json();
  
  // ✅ Respuesta exitosa
  if (response.ok) {
    // Guardar token en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // ✨ TRIAL ACTIVADO AUTOMÁTICAMENTE
    console.log('Trial activo hasta:', data.user.subscription.trial_ends_at);
    console.log('Días restantes:', data.user.subscription.days_remaining);
    
    // Redirigir a dashboard
    window.location.href = '/dashboard';
  }
}
```

**Respuesta del servidor:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "cliente@empresa.com",
    "full_name": "Juan Pérez",
    "company": "Mi Empresa SA",
    "subscription": {
      "plan": "free",
      "status": "trialing",
      "is_trial": true,
      "trial_ends_at": "2026-01-01T12:00:00Z",
      "days_remaining": 30
    },
    "can_access_features": true  // ✅ Puede usar el sistema
  }
}
```

---

### **PASO 2: Verificar Estado (en cada carga de página)**
**Endpoint:** `GET /api/payments/subscription-status`

```javascript
// Frontend: Verificar estado al cargar dashboard
async function verificarEstado() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/api/payments/subscription-status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const estado = await response.json();
  
  // Mostrar información al usuario
  if (estado.is_trial) {
    mostrarBanner(`Trial activo: ${estado.days_remaining} días restantes`);
  } else if (!estado.can_access_features) {
    // Trial expirado - mostrar modal de upgrade
    mostrarModalUpgrade();
  }
}
```

**Respuesta del servidor:**
```json
{
  "active": true,
  "plan": "free",
  "status": "trialing",
  "is_trial": true,
  "trial_ends_at": "2026-01-01T12:00:00Z",
  "days_remaining": 25,
  "can_access_features": true
}
```

---

### **PASO 3: Verificar Sesión Activa (al cargar la app)**
**Endpoint:** `GET /api/auth/me`

```javascript
// Frontend: Verificar si el token sigue válido al cargar la página
async function verificarSesion() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // No hay token, redirigir a login
    window.location.href = '/login';
    return null;
  }
  
  const response = await fetch('http://localhost:8000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.clear();
    window.location.href = '/login';
    return null;
  }
  
  const userData = await response.json();
  
  // Actualizar datos del usuario en localStorage
  localStorage.setItem('user', JSON.stringify(userData));
  
  return userData;
}

// Llamar en cada carga de página
window.addEventListener('load', async () => {
  await verificarSesion();
});
```

**Respuesta del servidor:**
```json
{
  "id": 1,
  "email": "demo@demo.com",
  "full_name": "Demo Victor Hernandez",
  "company": "Empresa Dummy",
  "role": "user",
  "is_active": true,
  "subscription": {
    "plan": "free",
    "status": "trialing",
    "is_trial": true,
    "trial_ends_at": "2026-01-01T12:00:00Z",
    "days_remaining": 24
  },
  "can_access_features": true
}
```

---

### **PASO 4: Login (usuarios que ya tienen cuenta)**
**Endpoint:** `POST /api/auth/login`

```javascript
// Frontend: Formulario de login
async function loginUsuario(email, password) {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: email,  // ⚠️ Importante: se llama 'username' pero es el email
      password: password
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Verificar si el trial expiró
    if (!data.user.can_access_features) {
      mostrarModalUpgrade('Tu período de prueba ha expirado');
    } else {
      window.location.href = '/dashboard';
    }
  }
}
```

---

### **PASO 4: Upgrade a Plan de Pago (cuando expire el trial)**
**Endpoint:** `POST /api/payments/create-subscription`

```javascript
// Frontend: Modal de upgrade con datos fiscales
async function upgradePlan(plan, paymentMethodId, fiscalData) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/api/payments/create-subscription', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan: plan,  // 'basic', 'pro', 'premium', 'business', 'enterprise'
      payment_method_id: paymentMethodId,  // De Stripe Elements
      fiscal_data: {  // ⭐ NUEVO: Datos fiscales opcionales
        rfc: fiscalData.rfc,
        razon_social: fiscalData.razonSocial,
        regimen_fiscal: fiscalData.regimenFiscal,  // "601", "612", etc.
        uso_cfdi: fiscalData.usoCfdi,  // "G03", "P01", etc.
        codigo_postal: fiscalData.codigoPostal,
        direccion: fiscalData.direccion,
        ciudad: fiscalData.ciudad,
        estado: fiscalData.estado
      }
    })
  });
  
  const resultado = await response.json();
  
  if (resultado.success) {
    // Actualizar estado local
    verificarEstado();
    mostrarMensaje('¡Suscripción activada!');
  }
}

// Ejemplo de uso con formulario completo
const formData = {
  rfc: 'SEB180915HG3',
  razonSocial: 'Mi Empresa SA de CV',
  regimenFiscal: '601',  // General de Ley Personas Morales
  usoCfdi: 'G03',  // Gastos en general
  codigoPostal: '37000',
  direccion: 'Av Principal 123',
  ciudad: 'León',
  estado: 'GTO'
};

await upgradePlan('pro', 'pm_card_visa', formData);
```

---

## 🎨 Componentes de UI Sugeridos

### 0. **Gestión de Sesión Automática** (implementar en App.jsx o layout principal)
```jsx
import { useEffect } from 'react';

function SessionManager({ children }) {
  useEffect(() => {
    // Verificar sesión al cargar
    verificarSesion();
    
    // Refrescar token cada 25 minutos
    const refreshInterval = setInterval(refrescarToken, 25 * 60 * 1000);
    
    // Refrescar al detectar actividad después de 5 min de inactividad
    let activityTimer;
    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(refrescarToken, 5 * 60 * 1000);
    };
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      clearInterval(refreshInterval);
      clearTimeout(activityTimer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);
  
  async function verificarSesion() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    }
  }
  
  async function refrescarToken() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Token refrescado');
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
    }
  }
  
  return children;
}

// Uso en App.jsx:
function App() {
  return (
    <SessionManager>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <RequireAuth><Dashboard /></RequireAuth>
          } />
        </Routes>
      </Router>
    </SessionManager>
  );
}
```

### 1. **Banner de Trial** (mostrar en todas las páginas)
```jsx
function TrialBanner({ diasRestantes, trialEndsAt }) {
  if (diasRestantes === null) return null;
  
  return (
    <div className="bg-blue-100 border-blue-500 p-4">
      ⏰ Trial activo: {diasRestantes} días restantes
      <button onClick={() => window.location.href = '/upgrade'}>
        Upgrade ahora
      </button>
    </div>
  );
}
```

### 2. **Modal de Upgrade** (cuando expire el trial)
```jsx
function UpgradeModal({ show, onClose }) {
  if (!show) return null;
  
  return (
    <div className="modal">
      <h2>Tu período de prueba ha expirado</h2>
      <p>Elige un plan para continuar usando el servicio</p>
      
      <div className="planes">
        <PlanCard name="Pro" price="$29.99/mes" />
        <PlanCard name="Premium" price="$79.99/mes" />
        <PlanCard name="Business" price="$199.99/mes" />
      </div>
      
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
```

### 3. **Guard de Rutas** (proteger páginas que requieren suscripción)
```jsx
function RequireAuth({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!user.can_access_features) {
    return <UpgradeModal show={true} />;
  }
  
  return children;
}

// Uso:
<Route path="/dashboard" element={
  <RequireAuth>
    <Dashboard />
  </RequireAuth>
} />
```

---

## 📊 Diagrama de Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    NUEVO USUARIO                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  POST /api/auth/register │
            │  - email                 │
            │  - password              │
            │  - full_name             │
            │  - company               │
            └──────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │ ✅ Trial de 30 días      │
            │    activado              │
            │ - token guardado         │
            │ - can_access = true      │
            └──────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   Redirigir a Dashboard  │
            └──────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ GET /api/payments/subscription- │
         │           status                │
         │ (cada vez que carga página)     │
         └─────────────────────────────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
         is_trial = true      is_trial = false
         days > 0             can_access = false
                 │                   │
                 ▼                   ▼
         ┌───────────────┐   ┌──────────────┐
         │ Mostrar banner│   │ Mostrar modal│
         │ "X días"      │   │ de upgrade   │
         └───────────────┘   └──────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ POST /api/payments/   │
                         │ create-subscription   │
                         │ - plan: "pro"         │
                         │ - payment_method_id   │
                         └───────────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ ✅ Suscripción activa │
                         │    can_access = true  │
                         └───────────────────────┘
```

---

## 🔑 Manejo de Tokens

### Guardar token después de login/registro:
```javascript
localStorage.setItem('token', data.token);
```

### Usar token en todas las peticiones:
```javascript
fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Verificar expiración del token:
```javascript
// El token expira en 30 minutos
// Si recibes 401 Unauthorized, redirigir a login
if (response.status === 401) {
  localStorage.clear();
  window.location.href = '/login';
}
```

---

## ⚡ Endpoints que NO necesitas al inicio

Estos endpoints son para funcionalidad avanzada, **puedes ignorarlos al principio**:

```
❌ POST /api/auth/password-reset
❌ POST /api/payments/webhook (solo backend)
❌ GET /api/payments/subscription (endpoint antiguo)
❌ POST /api/payments/create-setup-intent
❌ GET /api/payments/invoices
❌ POST /api/automation/* (hasta que implementes automatizaciones)
❌ POST /api/documents/* (hasta que implementes documentos)
```

---

## 📝 Ejemplo Completo: Aplicación React

```jsx
// App.js
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  
  useEffect(() => {
    // Cargar usuario del localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      verificarSuscripcion();
    }
  }, []);
  
  async function verificarSuscripcion() {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/payments/subscription-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setSubscriptionStatus(data);
  }
  
  async function registrar(email, password, nombre, empresa) {
    const res = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, full_name: nombre, company: empresa
      })
    });
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }
  
  if (!user) {
    return <RegistroForm onSubmit={registrar} />;
  }
  
  return (
    <div>
      {subscriptionStatus?.is_trial && (
        <TrialBanner dias={subscriptionStatus.days_remaining} />
      )}
      
      {!subscriptionStatus?.can_access_features && (
        <UpgradeModal />
      )}
      
      <Dashboard user={user} />
    </div>
  );
}
```

---

## 🎯 Resumen: Endpoints por Funcionalidad

### **Fase 1: Autenticación Básica (MÍNIMO VIABLE)**
```
✅ POST /api/auth/register              → Registrar usuario + trial 30 días
✅ POST /api/auth/login                 → Login (devuelve token + user data)
✅ GET  /api/payments/subscription-status → Verificar estado trial/suscripción
```

### **Fase 2: Gestión de Sesión (NECESARIO PARA PRODUCCIÓN)**
```
🔴 GET  /api/auth/me                    → Verificar sesión activa (validar token)
🔴 POST /api/auth/refresh               → Renovar token antes de expirar
🔴 POST /api/auth/logout                → Cerrar sesión (invalidar token)
```

### **Fase 3: Pagos y Suscripciones (CUANDO STRIPE ESTÉ CONFIGURADO)**
```
⚠️  POST /api/payments/create-setup-intent     → Preparar formulario de tarjeta
⚠️  POST /api/payments/attach-payment-method   → Guardar tarjeta del usuario
⚠️  POST /api/payments/create-subscription     → Crear suscripción de pago
⚠️  POST /api/payments/cancel-subscription     → Cancelar suscripción
⚠️  GET  /api/payments/payment-methods         → Listar tarjetas guardadas
```

### **Fase 4: Funcionalidad de Negocio (OPCIONAL)**
```
📄 POST /api/documents/upload           → Subir documentos
📄 GET  /api/documents                  → Listar documentos
🤖 POST /api/automation/tasks           → Crear automatización
🤖 GET  /api/automation/tasks           → Listar automatizaciones
```

**⚠️ IMPORTANTE:** Faltan los endpoints de gestión de sesión (Fase 2). Voy a crearlos.

---

## 🚦 Estados del Usuario

```javascript
// Estado 1: Trial activo (0-30 días)
{
  is_trial: true,
  days_remaining: 25,
  can_access_features: true
}
→ Mostrar banner "25 días restantes"

// Estado 2: Trial expirado, sin suscripción
{
  is_trial: false,
  days_remaining: 0,
  can_access_features: false
}
→ Mostrar modal de upgrade (bloquear acceso)

// Estado 3: Suscripción activa
{
  is_trial: false,
  plan: "pro",
  can_access_features: true
}
→ Acceso completo sin restricciones
```

---

**Última actualización:** 2025-12-02  
**Versión:** 1.0.0
