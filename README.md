# Sistema Electoral Perú 2025

Sistema de votación electoral moderno y seguro desarrollado para gestionar el proceso electoral del Perú 2025. Plataforma web completa con funcionalidades de votación, administración y análisis de resultados.

## 🚀 Características

- **Sistema de Votación**: Plataforma intuitiva para que los votantes emitan su voto de forma segura
- **Panel de Administración**: Dashboard completo con herramientas de gestión y análisis
- **Gestión de Candidatos**: Administración de candidatos por categoría (Presidencial, Distrital, Regional)
- **Gestión de Votantes**: Registro y validación de votantes mediante DNI
- **Análisis de Resultados**: Visualización en tiempo real de resultados electorales con gráficos interactivos
- **Limpieza de Datos**: Herramientas administrativas para mantener la integridad de los datos
- **Autenticación Segura**: Sistema de autenticación con roles (Admin, Votante)
- **Responsive Design**: Interfaz adaptativa para dispositivos móviles y escritorio

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 con TypeScript
- **Framework**: Vite
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Visualización**: Recharts
- **Routing**: React Router v6
- **Notificaciones**: Sonner
- **Validación**: Zod

## 📋 Requisitos Previos

- Node.js 18+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm o yarn
- Cuenta de Supabase (para base de datos y autenticación)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd elecciones-peru-pro
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_de_supabase
VITE_FACTILIZA_API_KEY=tu_clave_de_api_factiliza
```

**Nota sobre la API de Factiliza:**
- La API de Factiliza requiere una clave de API para funcionar
- Obtén tu clave de API en: https://www.factiliza.com/api-consulta
- Si usas el servidor proxy (`npm run proxy`), también necesitas configurar:
  ```env
  FACTILIZA_API_KEY=tu_clave_de_api_factiliza
  ```

4. **Configurar la base de datos**

Ejecuta las migraciones de Supabase ubicadas en `supabase/migrations/` para crear las tablas necesarias.

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

## 📦 Estructura del Proyecto

```
elecciones-peru-pro/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              # Componentes de shadcn/ui
│   │   ├── CandidateCard.tsx
│   │   ├── CandidateModal.tsx
│   │   └── VoteModal.tsx
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Index.tsx        # Página principal de votación
│   │   ├── Admin.tsx        # Página de login admin
│   │   └── AdminDashboard.tsx
│   ├── integrations/        # Integraciones externas
│   │   └── supabase/        # Cliente y tipos de Supabase
│   ├── hooks/               # Custom hooks
│   └── lib/                 # Utilidades
├── supabase/
│   └── migrations/          # Migraciones de base de datos
└── public/                  # Archivos estáticos
```

## 🗄️ Base de Datos

El sistema utiliza las siguientes tablas principales:

- **candidates**: Información de candidatos
- **voters**: Registro de votantes
- **votes**: Registro de votos emitidos
- **user_roles**: Roles de usuario (admin, voter)

Todas las tablas están protegidas con Row Level Security (RLS) para garantizar la seguridad de los datos.

## 🔐 Autenticación y Roles

- **Admin**: Acceso completo al panel de administración
- **Voter**: Capacidad de votar (sin autenticación requerida para votar, validación por DNI)

## 📊 Funcionalidades del Panel de Administración

- **Análisis**: Visualización de estadísticas y gráficos de resultados
- **Limpieza de Datos**: Herramientas para detectar valores nulos, eliminar duplicados, validar DNIs y normalizar datos
- **Entrenamiento**: Sistema de modelos predictivos (en desarrollo)

## 🚢 Despliegue

### Build de Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

### Guías de Despliegue

- **Frontend (Vercel)**: Consulta [`DEPLOY_FRONTEND.md`](./DEPLOY_FRONTEND.md) para instrucciones detalladas sobre cómo desplegar el frontend en Vercel.
- **Backend (Railway/Render)**: Consulta [`backend/DEPLOY.md`](./backend/DEPLOY.md) para instrucciones detalladas sobre cómo desplegar el backend en Railway o Render.

### Resumen Rápido

**Frontend en Vercel:**
1. Conecta tu repositorio a Vercel
2. Configura la variable de entorno `VITE_API_URL` con la URL de tu backend
3. El despliegue se realizará automáticamente

**Backend en Railway/Render:**
1. Conecta tu repositorio o sube el código
2. Configura todas las variables de entorno necesarias (Supabase, Factiliza, JWT, etc.)
3. El despliegue se realizará automáticamente

## 🤝 Contribución

Este es un proyecto privado. Para contribuciones, por favor contacta al equipo de desarrollo.

## 📝 Licencia

Este proyecto es privado y de uso exclusivo para el proceso electoral del Perú 2025.

## 📧 Contacto

Para más información, contacta al equipo de desarrollo del sistema electoral.

---

**Desarrollado con ❤️ para las Elecciones Perú 2025**
