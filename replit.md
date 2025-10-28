# Smart SEO AI Agent

## Overview

Smart SEO AI Agent is a professional SaaS dashboard application for digital marketing agencies and content creators. The platform provides AI-powered SEO tools including keyword research, content outline generation, on-page SEO analysis, keyword clustering, and SERP competitor analysis. The application features a modern marketing landing page and a comprehensive dashboard interface with real-time analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript using Vite as the build tool
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System:**
The application implements a utility-focused dashboard design with:
- Custom color palette using CSS variables for theming (primary blues: #2563EB, #3B82F6, #60A5FA)
- Typography using Inter or Poppins fonts from Google Fonts
- Gradient effects and glassmorphism for visual appeal
- Responsive layout system with mobile-first approach
- Component variants using class-variance-authority (CVA)

**Component Architecture:**
- Page-level components in `client/src/pages/` (Landing, Login, Register, Dashboard, Keywords, Content, Competitors)
- Reusable UI components in `client/src/components/ui/` (Shadcn UI components)
- Feature-specific components (KeywordResearch, ContentOutline, OnPageSEO)
- Dashboard layout with sidebar navigation
- Context-based authentication state management

**Routing Strategy:**
- Public routes: `/` (landing), `/login`, `/register`
- Protected routes: `/dashboard`, `/dashboard/keywords`, `/dashboard/content`, `/dashboard/competitors`
- Route protection via ProtectedRoute wrapper component checking authentication status

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Session-based authentication using express-session
- Bcrypt for password hashing
- In-memory storage with interface for future database integration

**API Design:**
RESTful API endpoints for:
- Authentication: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- SEO Features: `/api/keyword_research`, `/api/content_outline`, `/api/onpage_seo`, `/api/keyword_clustering`, `/api/serp_analysis`, `/api/content_optimize`

**Mock Data Strategy:**
All AI features currently return realistic mock data to demonstrate functionality. The architecture is designed to easily swap mock implementations with real AI/ML services.

**Session Management:**
- HTTP-only cookies for security
- SameSite: 'lax' for CSRF protection
- 7-day session expiration
- Session secret from environment variable (production-ready)

**Storage Pattern:**
The application uses an interface-based storage pattern (`IStorage`) with a current in-memory implementation (`MemStorage`). This design allows seamless migration to a database without changing business logic.

### Data Storage Solutions

**Current Implementation:**
- In-memory storage using JavaScript Maps
- User data stored with unique IDs generated via crypto.randomUUID()

**Database Schema (Prepared for Migration):**
The application includes a Drizzle ORM schema definition for PostgreSQL:
- Users table with fields: id (UUID), name, email (unique), password (hashed), createdAt
- Schema uses Drizzle with Neon serverless PostgreSQL driver
- Zod schemas for validation (insertUserSchema)

**Migration Strategy:**
The codebase is structured to support adding PostgreSQL by:
1. Implementing a new `DbStorage` class that implements `IStorage`
2. Running `npm run db:push` to sync schema
3. Updating the storage instance in server initialization

### Authentication and Authorization

**Authentication Flow:**
- Form-based login with email/password
- Password hashing using bcryptjs (10 rounds)
- Session-based authentication (no JWT)
- Protected routes check session userId

**Authorization Pattern:**
- Session middleware validates user identity
- Protected API endpoints verify req.session.userId
- Frontend ProtectedRoute component redirects unauthenticated users
- AuthContext provides user state across components

**Security Measures:**
- HTTP-only cookies prevent XSS attacks
- SameSite cookie policy prevents CSRF
- Bcrypt password hashing (irreversible)
- Secure cookies in production environment

### Build and Development

**Development Environment:**
- Vite dev server with HMR for frontend
- tsx for running TypeScript backend in development
- Concurrent development with proxy configuration
- Replit-specific plugins for enhanced development experience

**Production Build:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Single-command build process
- ESM module format throughout

**Code Quality:**
- TypeScript strict mode enabled
- Path aliases for clean imports (@/, @shared/, @assets/)
- Shared schema types between frontend and backend

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless component primitives (accordion, dialog, dropdown, select, tabs, etc.)
- **Shadcn UI**: Pre-styled components built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **cmdk**: Command palette component

### Styling and Design
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional class name utilities

### State Management and Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation and schema definition

### Database and ORM
- **Drizzle ORM**: Type-safe SQL query builder
- **Drizzle Kit**: Migration and schema management
- **@neondatabase/serverless**: PostgreSQL driver for Neon (serverless-optimized)
- **connect-pg-simple**: PostgreSQL session store (prepared for use)

### Backend Utilities
- **Express**: Web application framework
- **express-session**: Session middleware
- **bcryptjs**: Password hashing library
- **nanoid**: Unique ID generation

### Development Tools
- **Vite**: Fast build tool and dev server
- **esbuild**: JavaScript bundler for production backend
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Date and Utility Libraries
- **date-fns**: Modern date utility library

### Type Definitions
- TypeScript definitions for all major dependencies (@types/bcryptjs, @types/node, etc.)