# Zync - Local Development Environment

## Overview

Zync is a comprehensive local development environment that replicates Replit's functionality with full control over infrastructure, runtimes, and deployment pipeline. Built as an Electron desktop app with React frontend and Express backend, it provides complete project management, code editing, terminal access, and integrates with Fantasma Firewall and Zebulon Interface systems.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: 
- Black background interface with electric blue accents
- Premium Orbitron font for main title/branding
- No taglines or descriptions under logo
- Transparent PNG logos with no whitespace

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **Shadcn/UI** component library with Radix UI primitives
- **Tailwind CSS** for styling with CSS variables for theming (electric blue theme)
- **Monaco Editor** for code editing with syntax highlighting
- **Custom SVG logo** with 3D Z design and electric blue gradient

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design for client-server communication
- **PostgreSQL database** with Drizzle ORM as the primary data layer
- **DatabaseStorage class** implementing full CRUD operations
- **Session-based authentication** with JWT tokens stored in database
- **Service layer pattern** for business logic organization

### Desktop Application
- **Electron** main process for native desktop functionality
- **Auto-updater** integration with electron-updater
- **IPC communication** between main and renderer processes
- **Secure storage** using keytar for sensitive data
- **File system access** and terminal integration

## Key Components

### Authentication System
- JWT-based authentication with session management
- User registration and login functionality
- Password hashing with bcrypt
- Token-based API authorization

### Project Management
- Project creation with template selection (Node.js, Python, React, etc.)
- File and directory management
- Project-specific workspace isolation

### Code Editor
- Monaco Editor integration with multiple language support
- File explorer with context menu operations
- Syntax highlighting and code completion
- Real-time file saving and loading

### Terminal Integration
- Command execution with working directory context
- Multiple terminal session support
- Code execution for different programming languages (JavaScript, Python, TypeScript)

### Third-Party Integrations
- Fantasma Firewall service integration
- Zebulon Oracle Interface system integration (currently being built in Replit)
- Configurable API endpoints and authentication
- Integration status monitoring and management

## Data Flow

1. **User Authentication**: Users authenticate through the login form, receiving a JWT token stored in localStorage
2. **Project Operations**: Project CRUD operations flow through the Express API to the in-memory storage
3. **File Management**: File operations can use either the web API or direct Electron IPC for file system access
4. **Code Execution**: Code execution requests are processed by the executor service, spawning child processes
5. **Real-time Updates**: TanStack Query manages cache invalidation and real-time UI updates

## External Dependencies

### Core Dependencies
- **Electron** for desktop application framework
- **React ecosystem** (React, React DOM, React Hook Form)
- **Express.js** for backend API server
- **Drizzle ORM** with PostgreSQL adapter (configured but not actively used)
- **Monaco Editor** for code editing capabilities

### UI and Styling
- **Radix UI** primitives for accessible components
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography

### Development and Build
- **Vite** for fast development and optimized builds
- **TypeScript** for type safety across the stack
- **ESBuild** for backend bundling

### External Services
- **Neon Database** (configured for PostgreSQL hosting)
- **Custom integrations** (Fantasma Firewall, Zebulon Oracle Interface) with HTTP APIs
- **Zebulon Oracle Interface** - Oracle database connectivity system currently in development on Replit

## Deployment Strategy

### Development Environment
- Vite dev server for frontend hot reloading
- ts-node/tsx for backend development with auto-restart
- Electron in development mode with DevTools enabled

### Production Build
- Frontend builds to `dist/public` directory
- Backend bundles to `dist/index.js` with ESM format
- Electron packaging with auto-updater configuration

### Database Strategy
- **SQLite database** configured for offline-first operation using better-sqlite3
- **PostgreSQL database** available for cloud deployment (Neon serverless)
- **Dual schema support** with schema-sqlite.ts for SQLite and schema.ts for PostgreSQL
- **Complete tables** with users, projects, files, integrations, and sessions
- **Drizzle ORM** with relations and type-safe queries
- **DatabaseStorage** class with full CRUD operations
- Database schema migrated and working with camelCase column names

### Auto-Update System
- Electron-updater for automatic application updates
- GitHub Releases or custom server for update distribution
- Background update downloads with user prompts
- Platform-specific packaging (Windows NSIS, macOS signed, Linux AppImage)

The application is designed to work both as a standalone desktop IDE and as a connected application with cloud services, providing flexibility in deployment scenarios.

## Recent Changes

**July 20, 2025:**
- Fixed project creation authentication token issues
- Removed all hardcoded external endpoints for offline deployment  
- Implemented configurable integration dialogs for Fantasma Firewall and Zebulon Oracle Interface
- Added localStorage-based configuration persistence for offline use
- Created test admin user (username: admin, password: admin) for development
- All integration endpoints are now blank by default and user-configurable
- **Storage Optimization Completed**: Enhanced SQLite performance with connection pooling, memory-mapped I/O, optimized page sizes, and database indexing on all critical columns
- **Database Performance**: Implemented WAL mode, 2GB cache, prepared statements, and cascade delete constraints for data integrity  
- **Background Services**: Added storage optimizer with automatic session cleanup and periodic maintenance tasks
- **Caching Layer**: Implemented intelligent in-memory caching with automatic invalidation for users, projects, and files
- **Advanced Analytics**: Added storage statistics, database optimization routines, and health monitoring
- **Error Handling**: Enhanced all storage operations with comprehensive error handling and graceful fallbacks
- **UNLIMITED FEATURES**: Removed all system limits for enterprise deployment - unlimited users, projects, file sizes, concurrent connections, code execution timeouts, and storage capacity
- **Admin Controls**: Added comprehensive admin API with emergency overrides, limit bypasses, and real-time configuration management
- **Scalability Mode**: Implemented unlimited scalability with 8GB memory mapping, 2TB+ database support, and maximum performance optimizations

**July 21, 2025:**
- **Admin Approval System**: Implemented comprehensive approval system requiring admin authorization for ALL autonomous features - no operations run without approval
- **Advanced Encryption**: Added military-grade AES-256-GCM encryption with PBKDF2 key derivation for all sensitive data and communications
- **Fantasma Firewall Integration**: Seamless security integration with advanced encryption layer and automatic firewall rule management
- **Secure Authentication**: Enhanced password encryption and secure session management with encrypted storage
- **Emergency Controls**: Admin emergency override system with audit logging and automatic expiration
- **Comprehensive Documentation**: Created complete setup guides including Admin Setup Guide, Configuration How-To, IDE User Guide, Deployment Guide, and Admin Approval System documentation covering every aspect from project creation through enterprise deployment
- **Authorized User Access**: Modified system so authenticated/verified users can create and deploy projects immediately - security blocks unauthorized access while allowing legitimate users full functionality
- **Admin User Setup**: Created admin_dgn user with credentials (admin_dgn/admin123) and email devin@xoclonholdings.property for system administration
- **Configurable Settings System**: Implemented comprehensive user settings with server-side persistence including profile editing (username/email/password changes), editor preferences, integration toggles, and advanced system configurations
- **Storage Optimization Completed**: Final database optimization with userSettings table creation, performance tuning, and comprehensive error diagnostics
- **Export Package Prepared**: Created complete deployment package with zero external dependencies - verified offline-capable with local SQLite database, self-contained authentication, and independent operation for all core functions including login, project creation, file management, and deployment
- **Deployment Ready**: Confirmed 100% independence from external services with comprehensive diagnostic verification - ready for immediate deployment on any domain with complete standalone functionality

**July 26, 2025:**
- **Hybrid Local/Cloud AI Integration**: Implemented revolutionary hybrid AI system combining Anthropic Claude 4.0 with local AI processing to bypass quota limits and reduce costs
- **Local AI Engine**: Built comprehensive local AI processor with code generation templates, analysis patterns, and intelligent fallback systems for unlimited offline operation
- **Smart AI Routing**: Automatic switching between cloud and local AI based on usage limits, complexity, and availability - ensuring continuous operation
- **Quota Bypass System**: Intelligent request management with hourly limits and automatic local fallback when API limits are reached
- **Cost Optimization**: Hybrid system reduces API costs by using local processing for simple tasks and cloud AI only for complex operations
- **Unlimited Local Features**: Local AI provides unlimited code analysis, generation, debugging, and explanations without any usage restrictions
- **Real-time AI Status**: Live monitoring of AI availability, request counts, and automatic mode switching with user controls
- **Zero-Cost Operation**: System can operate entirely in local mode for complete independence from external AI services and costs