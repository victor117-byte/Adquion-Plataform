# 📊 Fiscal Nexus Pro - Documentación del Proyecto

## 🎯 Descripción General

**Fiscal Nexus Pro** es una plataforma moderna de gestión fiscal y contable diseñada para facilitar la administración de contribuyentes, documentos fiscales, reportes y automatizaciones. El sistema implementa una arquitectura multi-tenant que permite a múltiples organizaciones gestionar sus datos de forma independiente y segura.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Frontend
- **React 18.3** - Biblioteca principal de UI
- **TypeScript** - Tipado estático
- **Vite 7.1** - Build tool y dev server
- **React Router DOM 6.30** - Enrutamiento
- **TanStack Query 5.83** - Gestión de estado del servidor
- **Tailwind CSS 3.4** - Framework de CSS
- **shadcn/ui** - Componentes de UI
- **Radix UI** - Componentes primitivos accesibles
- **Recharts 2.15** - Visualización de datos
- **Zod 3.25** - Validación de esquemas
- **React Hook Form 7.61** - Gestión de formularios

#### Backend (Esperado)
- API RESTful
- Base de datos relacional (multi-tenant)
- Autenticación basada en sesión

## 🎨 Estructura del Proyecto

```
fiscal-nexus-pro/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes base de shadcn/ui
│   │   ├── main/           # Secciones del dashboard principal
│   │   └── *.tsx           # Componentes de features
│   ├── contexts/           # Contextos de React
│   │   └── AuthContext.tsx # Gestión de autenticación
│   ├── pages/              # Páginas principales
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Autenticación
│   │   ├── Main.tsx        # Dashboard principal
│   │   ├── Onboarding.tsx  # Proceso de bienvenida
│   │   └── NotFound.tsx    # Página 404
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilidades
├── doc/                    # Documentación
└── public/                 # Archivos estáticos
```

## 👥 Roles y Permisos

### Tipos de Usuario

1. **Administrador**
   - Gestión completa de usuarios
   - Configuración del sistema
   - Acceso a todas las funcionalidades
   - Configuración de automatizaciones

2. **Contador**
   - Gestión de contribuyentes
   - Carga y consulta de documentos
   - Visualización de reportes
   - Gestión de notificaciones

## 🔐 Sistema de Autenticación

### Modelo de Datos del Usuario

```typescript
interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_usuario: 'administrador' | 'contador';
  organizacion: string;
  database: string;
}
```

### Flujo de Autenticación

1. Usuario ingresa credenciales (organización, correo, contraseña)
2. El sistema valida contra la base de datos correspondiente
3. Se almacenan los datos del usuario en localStorage
4. Se establece el contexto de autenticación
5. Redirección al dashboard principal

## 📱 Módulos Principales

### 1. Dashboard
- Vista general de métricas clave
- Resumen de actividades recientes
- Acceso rápido a funciones principales

### 2. Gestión de Usuarios
- Listado de usuarios de la organización
- Creación y edición de usuarios
- Asignación de roles y permisos
- **Solo accesible para administradores**

### 3. Gestión de Contribuyentes
- Registro de contribuyentes
- Información fiscal completa
- Historial de documentos
- Estados de cumplimiento

### 4. Gestión de Documentos
- Carga de documentos fiscales
- Organización por contribuyente
- Búsqueda y filtrado
- Almacenamiento seguro

### 5. Automatizaciones
- Configuración de tareas automáticas
- Notificaciones programadas
- Sincronización con SAT
- Procesamiento batch

### 6. Notificaciones
- Alertas de vencimientos
- Actualizaciones del sistema
- Notificaciones personalizadas
- Centro de mensajes

### 7. Reportes (Power BI)
- Dashboards interactivos
- Análisis de datos fiscales
- Exportación de reportes
- Visualizaciones personalizadas

### 8. Configuración
- Ajustes de la organización
- Preferencias del usuario
- Configuración de integraciones
- **Solo accesible para administradores**

## 🔄 Flujos de Usuario Principales

### Flujo de Registro
1. Acceso a la página de autenticación
2. Selección de "Crear cuenta"
3. Formulario de registro (organización, datos personales)
4. Validación de datos
5. Creación de cuenta
6. Redirección a onboarding

### Flujo de Login
1. Ingreso a la aplicación
2. Formulario de login (organización, correo, contraseña)
3. Validación de credenciales
4. Establecimiento de sesión
5. Redirección a dashboard principal

### Flujo de Onboarding
1. Bienvenida al nuevo usuario
2. Configuración inicial
3. Tour de funcionalidades
4. Acceso al dashboard

## 🎨 Sistema de Diseño

### Temas
- Soporte para modo claro y oscuro (next-themes)
- Paleta de colores consistente
- Tokens de diseño centralizados

### Componentes UI
- Basados en Radix UI y shadcn/ui
- Totalmente accesibles (ARIA)
- Responsive por defecto
- Altamente personalizables

### Tipografía
- Sistema de escalado consistente
- Jerarquía clara
- Optimizada para legibilidad

## 🔌 Integraciones

### API Backend
- Endpoint base: `VITE_API_URL` (configurable)
- Autenticación mediante credenciales
- Headers personalizados (ngrok-skip-browser-warning)
- Manejo de errores estandarizado

### Power BI
- Embedido de reportes
- Autenticación delegada
- Actualización automática de datos

## 📊 Gestión de Estado

### Estado Global
- **AuthContext**: Estado de autenticación del usuario
- **TanStack Query**: Cache y sincronización con servidor

### Estado Local
- React useState para UI local
- React Hook Form para formularios

## 🚀 Características Principales

### Seguridad
- Autenticación robusta
- Protección de rutas
- Separación de datos por organización (multi-tenant)
- Validación de inputs con Zod

### Performance
- Code splitting automático (Vite)
- Carga diferida de componentes
- Optimización de imágenes
- Cache inteligente (TanStack Query)

### Responsive
- Diseño mobile-first
- Sidebar colapsable
- Menú móvil adaptativo
- Breakpoints consistentes

### Accesibilidad
- Navegación por teclado
- Screen readers compatible
- Contraste adecuado
- Focus management

## 🔧 Configuración y Deployment

### Variables de Entorno
```env
VITE_API_URL=https://tu-backend-url.com/api
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run build:dev    # Build de desarrollo
npm run preview      # Preview del build
npm run lint         # Linting del código
```

### Deployment
- Plataforma recomendada: Lovable
- Soporte para dominios personalizados
- CI/CD automático desde GitHub

## 📈 Métricas y Analytics

### Monitoreo
- Tracking de errores
- Métricas de performance
- Analytics de uso

## 🔮 Roadmap y Mejoras Futuras

### Próximas Funcionalidades
- [ ] Integración directa con SAT
- [ ] App móvil nativa
- [ ] OCR para documentos
- [ ] IA para predicción fiscal
- [ ] API pública para integraciones
- [ ] Multi-idioma
- [ ] Exportación masiva de datos
- [ ] Módulo de facturación

## 📝 Convenciones de Código

### TypeScript
- Tipado estricto habilitado
- Interfaces para props de componentes
- Enums para valores fijos

### React
- Functional components con hooks
- Props destructuring
- Naming consistente (PascalCase para componentes)

### Estilos
- Tailwind CSS utilities
- Clases en orden: layout → spacing → typography → colors → effects
- Uso de cn() helper para composición de clases

## 🤝 Contribución

### Flujo de Trabajo
1. Clone el repositorio
2. Cree una rama feature
3. Implemente cambios
4. Ejecute linting
5. Commit con mensaje descriptivo
6. Push a su rama
7. Cree Pull Request

### Estándares de Código
- ESLint configurado
- TypeScript strict mode
- Prettier para formateo consistente

## 📞 Soporte y Contacto

### Documentación Adicional
- [Guía de API](./API_GUIDE.md) - Endpoints y ejemplos
- [Diagramas del Sistema](./DIAGRAMS.md) - Arquitectura visual
- [Manual de Usuario](./USER_MANUAL.md) - Guía paso a paso

---

**Versión:** 0.0.0  
**Última actualización:** Enero 2026  
**Autor:** Victor117-byte
