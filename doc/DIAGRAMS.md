# 📐 Diagramas del Sistema - Fiscal Nexus Pro

## 🏗️ Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "Frontend - React + Vite"
        UI[Interface de Usuario]
        Router[React Router]
        Auth[AuthContext]
        Query[TanStack Query]
        
        UI --> Router
        UI --> Auth
        UI --> Query
    end
    
    subgraph "Páginas"
        Landing[Landing Page]
        Login[Autenticación]
        Onboard[Onboarding]
        Dashboard[Dashboard Principal]
        
        Router --> Landing
        Router --> Login
        Router --> Onboard
        Router --> Dashboard
    end
    
    subgraph "Backend API"
        API[API REST]
        AuthAPI[Auth Endpoints]
        DataAPI[Data Endpoints]
        
        API --> AuthAPI
        API --> DataAPI
    end
    
    subgraph "Base de Datos"
        DB[(Database Multi-tenant)]
        Org1[(Org 1 Schema)]
        Org2[(Org 2 Schema)]
        OrgN[(Org N Schema)]
        
        DB --> Org1
        DB --> Org2
        DB --> OrgN
    end
    
    subgraph "Servicios Externos"
        PowerBI[Power BI]
        SAT[SAT API]
    end
    
    Query -.HTTP.-> API
    AuthAPI -.-> DB
    DataAPI -.-> DB
    Dashboard -.-> PowerBI
    DataAPI -.-> SAT
    
    style Frontend fill:#e1f5ff
    style Backend fill:#ffe1e1
    style "Base de Datos" fill:#e1ffe1
    style "Servicios Externos" fill:#fff4e1
```

## 🔐 Flujo de Autenticación

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as Frontend
    participant Auth as AuthContext
    participant API as Backend API
    participant DB as Database
    
    Usuario->>UI: Ingresa credenciales
    UI->>Auth: login(org, correo, contraseña)
    Auth->>API: POST /auth/login
    API->>DB: Valida credenciales
    DB-->>API: Usuario encontrado
    API-->>Auth: {success: true, data: user}
    Auth->>Auth: Guarda en localStorage
    Auth->>Auth: setUser(userData)
    Auth-->>UI: Login exitoso
    UI->>UI: Navigate('/main')
    UI-->>Usuario: Dashboard Principal
    
    Note over Usuario,DB: Sesión establecida
```

## 🗺️ Mapa de Navegación

```mermaid
graph LR
    Start([Inicio]) --> Landing[Landing Page]
    Landing --> |"Iniciar Sesión"| Auth[Auth Page]
    Landing --> |"Registrarse"| Auth
    
    Auth --> |"Login exitoso"| Onboard{¿Primera vez?}
    Onboard --> |"Sí"| OnboardPage[Onboarding]
    Onboard --> |"No"| Main[Dashboard Main]
    OnboardPage --> Main
    
    Main --> Dashboard[Dashboard]
    Main --> Users[Usuarios*]
    Main --> Contributors[Contribuyentes]
    Main --> Documents[Documentos]
    Main --> Automations[Automatizaciones]
    Main --> Notifications[Notificaciones]
    Main --> PowerBI[Reportes]
    Main --> Settings[Configuración*]
    
    Main --> |"Logout"| Landing
    
    style Users fill:#ff9999
    style Settings fill:#ff9999
    
    Note1[* Solo Administradores]
```

## 🎯 Arquitectura de Componentes

```mermaid
graph TB
    subgraph "App.tsx - Root"
        App[App Component]
        Providers[Providers Setup]
        
        App --> Providers
    end
    
    subgraph "Providers"
        QueryProvider[QueryClientProvider]
        TooltipProvider[TooltipProvider]
        BrowserRouter[BrowserRouter]
        AuthProvider[AuthProvider]
        
        Providers --> QueryProvider
        Providers --> TooltipProvider
        Providers --> BrowserRouter
        Providers --> AuthProvider
    end
    
    subgraph "Routes"
        Routes[Routes Config]
        Index[/ - Index]
        AuthRoute[/auth - Auth]
        OnboardRoute[/onboarding - Onboarding]
        MainRoute[/main - Main]
        NotFoundRoute[/* - NotFound]
        
        BrowserRouter --> Routes
        Routes --> Index
        Routes --> AuthRoute
        Routes --> OnboardRoute
        Routes --> MainRoute
        Routes --> NotFoundRoute
    end
    
    subgraph "Main Dashboard Structure"
        MainComp[Main Component]
        Sidebar[Sidebar Navigation]
        Content[Content Area]
        
        MainRoute --> MainComp
        MainComp --> Sidebar
        MainComp --> Content
    end
    
    subgraph "Dashboard Sections"
        DashSec[DashboardSection]
        UsersSec[UsersSection]
        ContribSec[ContributorsSection]
        DocsSec[DocumentsSection]
        AutoSec[AutomationsSection]
        NotifSec[NotificationsSection]
        PowerSec[PowerBISection]
        SettSec[SettingsSection]
        
        Content --> DashSec
        Content --> UsersSec
        Content --> ContribSec
        Content --> DocsSec
        Content --> AutoSec
        Content --> NotifSec
        Content --> PowerSec
        Content --> SettSec
    end
    
    style Providers fill:#e1f5ff
    style Routes fill:#ffe1e1
    style "Main Dashboard Structure" fill:#e1ffe1
    style "Dashboard Sections" fill:#fff4e1
```

## 🔄 Flujo de Estado de Autenticación

```mermaid
stateDiagram-v2
    [*] --> Loading: App Init
    Loading --> CheckingSession: Verificar localStorage
    
    CheckingSession --> Authenticated: Usuario encontrado
    CheckingSession --> Unauthenticated: No hay sesión
    
    Unauthenticated --> LoginForm: Mostrar login
    LoginForm --> Authenticating: Submit credenciales
    
    Authenticating --> Authenticated: Login exitoso
    Authenticating --> LoginError: Login fallido
    LoginError --> LoginForm: Mostrar error
    
    Authenticated --> Main: Navegar a /main
    Main --> Loading: Logout
    
    state Authenticated {
        [*] --> UserDataLoaded
        UserDataLoaded --> CheckingPermissions
        CheckingPermissions --> AdminView: Es admin
        CheckingPermissions --> UserView: Es contador
    }
```

## 📊 Modelo de Datos

```mermaid
erDiagram
    ORGANIZACION ||--o{ USUARIO : tiene
    ORGANIZACION ||--o{ CONTRIBUYENTE : gestiona
    USUARIO ||--o{ DOCUMENTO : carga
    CONTRIBUYENTE ||--o{ DOCUMENTO : pertenece
    ORGANIZACION ||--o{ REPORTE : genera
    USUARIO ||--o{ NOTIFICACION : recibe
    ORGANIZACION ||--o{ AUTOMATIZACION : configura
    
    ORGANIZACION {
        int id PK
        string nombre
        string database
        datetime created_at
    }
    
    USUARIO {
        int id PK
        int organizacion_id FK
        string nombre
        string correo UK
        string telefono
        date fecha_nacimiento
        string tipo_usuario
        string contraseña_hash
        datetime created_at
    }
    
    CONTRIBUYENTE {
        int id PK
        int organizacion_id FK
        string rfc UK
        string razon_social
        string regimen_fiscal
        string estatus
        datetime created_at
    }
    
    DOCUMENTO {
        int id PK
        int contribuyente_id FK
        int usuario_id FK
        string tipo
        string nombre_archivo
        string url_almacenamiento
        datetime fecha_emision
        datetime created_at
    }
    
    REPORTE {
        int id PK
        int organizacion_id FK
        string nombre
        string powerbi_url
        string tipo
        datetime created_at
    }
    
    NOTIFICACION {
        int id PK
        int usuario_id FK
        string titulo
        string mensaje
        boolean leida
        datetime created_at
    }
    
    AUTOMATIZACION {
        int id PK
        int organizacion_id FK
        string nombre
        string tipo
        string configuracion
        boolean activa
        datetime created_at
    }
```

## 🔌 Diagrama de Integración de API

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant Query as TanStack Query
    participant API as Backend API
    participant DB as Database
    participant SAT as SAT API
    participant PBI as Power BI
    
    Note over UI,PBI: Flujo de Carga de Documento
    
    UI->>UI: Usuario selecciona archivo
    UI->>Query: uploadDocument(file, data)
    Query->>API: POST /documentos
    API->>DB: INSERT documento
    DB-->>API: Documento guardado
    API->>SAT: Validar con SAT
    SAT-->>API: Documento válido
    API-->>Query: {success: true, documento}
    Query-->>UI: Actualiza cache
    UI-->>UI: Muestra confirmación
    
    Note over UI,PBI: Flujo de Visualización de Reporte
    
    UI->>Query: getReportes()
    Query->>API: GET /reportes?org=...
    API->>DB: SELECT reportes
    DB-->>API: Lista de reportes
    API->>PBI: Verificar acceso
    PBI-->>API: URLs de embed
    API-->>Query: {reportes: [...]}
    Query-->>UI: Renderiza reportes
    UI->>PBI: iframe embed
    PBI-->>UI: Dashboard interactivo
```

## 🎨 Estructura de Componentes UI

```mermaid
graph TB
    subgraph "Layout Components"
        Header[Header]
        Sidebar[Sidebar]
        Footer[Footer]
    end
    
    subgraph "Feature Components"
        Hero[Hero]
        Features[Features]
        Pricing[Pricing]
        FileUpload[FileUpload]
        PaymentForm[PaymentForm]
        UserManagement[UserManagement]
    end
    
    subgraph "Base UI Components - shadcn/ui"
        Button[Button]
        Card[Card]
        Dialog[Dialog]
        Form[Form]
        Table[Table]
        Input[Input]
        Select[Select]
        Toast[Toast]
        Badge[Badge]
        Tabs[Tabs]
        etc[... +30 componentes]
    end
    
    Header -.usa.-> Button
    Header -.usa.-> Dialog
    
    FileUpload -.usa.-> Button
    FileUpload -.usa.-> Card
    FileUpload -.usa.-> Badge
    
    PaymentForm -.usa.-> Form
    PaymentForm -.usa.-> Input
    PaymentForm -.usa.-> Button
    
    UserManagement -.usa.-> Table
    UserManagement -.usa.-> Dialog
    UserManagement -.usa.-> Form
    
    style "Layout Components" fill:#e1f5ff
    style "Feature Components" fill:#ffe1e1
    style "Base UI Components - shadcn/ui" fill:#e1ffe1
```

## 🔐 Matriz de Permisos

```mermaid
graph TB
    subgraph "Módulos del Sistema"
        M1[Dashboard]
        M2[Usuarios]
        M3[Contribuyentes]
        M4[Documentos]
        M5[Automatizaciones]
        M6[Notificaciones]
        M7[Reportes]
        M8[Configuración]
    end
    
    subgraph "Roles"
        Admin[Administrador]
        Contador[Contador]
    end
    
    Admin -->|"✅ Acceso Total"| M1
    Admin -->|"✅ CRUD"| M2
    Admin -->|"✅ CRUD"| M3
    Admin -->|"✅ CRUD"| M4
    Admin -->|"✅ Config"| M5
    Admin -->|"✅ Ver/Gestionar"| M6
    Admin -->|"✅ Ver/Crear"| M7
    Admin -->|"✅ Configurar"| M8
    
    Contador -->|"✅ Ver"| M1
    Contador -->|"❌ Sin acceso"| M2
    Contador -->|"✅ CRUD"| M3
    Contador -->|"✅ CRUD"| M4
    Contador -->|"✅ Ver"| M5
    Contador -->|"✅ Ver"| M6
    Contador -->|"✅ Ver"| M7
    Contador -->|"❌ Sin acceso"| M8
    
    style Admin fill:#90EE90
    style Contador fill:#FFD700
```

## 🚀 Flujo de Deployment

```mermaid
graph LR
    Dev[Desarrollo Local] -->|"git push"| GitHub[GitHub Repository]
    GitHub -->|"webhook"| CI[CI/CD Pipeline]
    CI -->|"npm run build"| Build[Build Process]
    Build -->|"tests pass"| Deploy[Deploy to Lovable]
    Deploy --> Prod[Production]
    
    Prod -->|"monitoring"| Metrics[Métricas]
    Prod -->|"errors"| Logs[Logs]
    
    style Dev fill:#e1f5ff
    style GitHub fill:#ffe1e1
    style CI fill:#fff4e1
    style Prod fill:#e1ffe1
```

## 🔄 Ciclo de Vida de una Petición

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Comp as Componente React
    participant Hook as Custom Hook
    participant Query as TanStack Query
    participant API as API Client
    participant Backend as Backend
    participant Cache as Cache Local
    
    User->>Comp: Interacción
    Comp->>Hook: useQuery/useMutation
    Hook->>Query: query/mutate
    
    alt Datos en cache
        Query->>Cache: Verificar cache
        Cache-->>Query: Datos disponibles
        Query-->>Comp: Retorna datos
    else Cache expirado/No existe
        Query->>API: fetch request
        API->>Backend: HTTP Request
        Backend-->>API: Response
        API-->>Query: Datos procesados
        Query->>Cache: Actualiza cache
        Query-->>Comp: Retorna datos
    end
    
    Comp->>Comp: Re-render
    Comp-->>User: UI actualizada
```

## 📱 Responsive Design Breakpoints

```mermaid
graph LR
    Mobile[📱 Mobile<br/>< 768px] -->|"Tablet"| Tablet[📱 Tablet<br/>768px - 1024px]
    Tablet -->|"Desktop"| Desktop[🖥️ Desktop<br/>1024px - 1440px]
    Desktop -->|"Large"| Large[🖥️ Large<br/>> 1440px]
    
    Mobile -.->|"Stack vertical<br/>Menu hamburguesa"| MobileLayout[Layout Mobile]
    Tablet -.->|"Sidebar colapsable<br/>2 columnas"| TabletLayout[Layout Tablet]
    Desktop -.->|"Sidebar fijo<br/>3 columnas"| DesktopLayout[Layout Desktop]
    Large -.->|"Sidebar amplio<br/>Grid complejo"| LargeLayout[Layout Large]
    
    style Mobile fill:#FF6B6B
    style Tablet fill:#4ECDC4
    style Desktop fill:#45B7D1
    style Large fill:#96CEB4
```

## 🎯 Flujo de Onboarding

```mermaid
graph TB
    Start([Usuario Registrado]) --> Welcome[Pantalla de Bienvenida]
    Welcome --> Step1[Paso 1: Información de Organización]
    Step1 --> Step2[Paso 2: Configuración Inicial]
    Step2 --> Step3[Paso 3: Tour de Funcionalidades]
    Step3 --> Decision{¿Tipo de usuario?}
    
    Decision -->|Administrador| AdminSetup[Configurar Usuarios y Permisos]
    Decision -->|Contador| ContadorSetup[Configurar Contribuyentes]
    
    AdminSetup --> Complete[Completar Onboarding]
    ContadorSetup --> Complete
    
    Complete --> Dashboard[Ir al Dashboard]
    
    style Start fill:#90EE90
    style Complete fill:#90EE90
    style Dashboard fill:#4169E1,color:#fff
```

---

## 📝 Notas sobre los Diagramas

### Herramientas Utilizadas
- **Mermaid** - Todos los diagramas están en formato Mermaid para fácil visualización en GitHub y editores compatibles

### Cómo Visualizar
1. **GitHub**: Los diagramas se renderizan automáticamente
2. **VS Code**: Instalar extensión "Markdown Preview Mermaid Support"
3. **Online**: Usar [Mermaid Live Editor](https://mermaid.live/)

### Actualización
Estos diagramas deben actualizarse cuando:
- Se agreguen nuevos módulos
- Cambien los flujos de autenticación
- Se modifique la arquitectura
- Se añadan nuevas integraciones

---

**Versión:** 1.0  
**Última actualización:** Enero 2026  
**Autor:** Victor117-byte
