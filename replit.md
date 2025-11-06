# SEOgenious

## Overview

SEOgenious (rebranded from Smart SEO AI) is a professional SaaS dashboard application for digital marketing agencies and content creators. The platform provides AI-powered SEO tools including keyword research, content outline generation, on-page SEO analysis, keyword clustering, and SERP competitor analysis. 

**Key Features:**
- Modern marketing landing page with testimonials and before/after case studies
- Comprehensive dashboard with real-time user statistics and activity tracking
- User profile management with theme preferences (light/dark mode)
- AI chatbot assistant for SEO guidance
- Animated SEO health score widget
- Activity feed showing recent user actions
- Save/favorite functionality for keyword clusters and content analyses
- Dedicated Saved Items page with view and delete capabilities
- **Export to PDF/CSV** for keyword clusters, content analysis, and competitor reports
- Free public keyword density checker (no authentication required)
- **n8n webhook integration** for workflow automation and third-party integrations

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
- Custom color palette using CSS variables for theming (gradient: electric blue → purple → cyan)
- **Dark mode support**: Full light/dark theme system with localStorage and database persistence
- Typography using Inter or Poppins fonts from Google Fonts
- Gradient effects and glassmorphism for visual appeal
- Responsive layout system with mobile-first approach
- Component variants using class-variance-authority (CVA)
- Proper Avatar components (no emojis) following design guidelines
- Hover and active state elevations using custom Tailwind utilities

**Component Architecture:**
- Page-level components in `client/src/pages/` (Landing, Login, Register, Dashboard, Keywords, Content, Competitors, SavedItems, Profile)
- Reusable UI components in `client/src/components/ui/` (Shadcn UI components with Avatar, Card, Form, etc.)
- Dashboard components in `client/src/components/dashboard/`:
  - `StatsWidget` - Displays 4 metric cards showing user statistics (keywords, content, competitors, saved items)
  - `ActivityFeed` - Shows recent user actions with timestamps and icons
  - `SEOHealthScore` - Animated circular progress showing SEO score (0-100)
  - `DashboardLayout` - Sidebar navigation with user profile section
- Landing page components in `client/src/components/landing/`:
  - `Testimonials` - Customer testimonials with Avatar components
  - `BeforeAfter` - Case study results showing metrics improvements
  - `Hero`, `Features`, `Navbar`, `Footer`
- Feature-specific components (KeywordResearch, ContentOutline, OnPageSEO)
- `ThemeToggle` - Dark/light mode switcher with persistence
- Context-based authentication state management via `AuthContext`

**Routing Strategy:**
- Public routes: `/` (landing), `/login`, `/register`
- Protected routes: `/dashboard`, `/dashboard/keywords`, `/dashboard/content`, `/dashboard/competitors`, `/dashboard/chatbot`, `/dashboard/saved`, `/dashboard/profile`
- Route protection via ProtectedRoute wrapper component checking authentication status
- Dashboard uses sidebar navigation for easy access to all tools
- SavedItems page displays user's saved keyword clusters and content analyses with delete functionality

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Session-based authentication using express-session
- Bcrypt for password hashing
- In-memory storage with interface for future database integration
- n8n webhook integration for workflow automation (optional)

**API Design:**
RESTful API endpoints for:
- Authentication: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- User Management: 
  - `/api/user/profile` (PATCH) - Update user profile (name, email, theme)
  - `/api/user/stats` (GET) - Get user statistics (keywords, content, competitors, saved items)
  - `/api/user/activities` (GET) - Get recent user activities with pagination
- SEO Features: `/api/keyword_research`, `/api/content_outline`, `/api/onpage_seo`, `/api/keyword_clustering`, `/api/serp_analysis`, `/api/content_optimize`
- **AI Features (NEW - Feature 1 Complete):**
  - `/api/ai/rewrite` (POST) - AI-powered content rewriting with tone and keyword optimization
  - `/api/ai/executive-summary` (POST) - Generate executive summaries from reports
  - `/api/ai/outline-refine` (POST) - Refine content outlines with AI suggestions
  - `/api/ai/chat` (POST) - AI chatbot responses (direct wrapper endpoint)
  - `/api/ai/status` (GET) - Check AI service status and configuration
  - `/api/chat/send` (POST) - Chatbot messages (now uses AI wrapper internally)
- Saved Items: 
  - `/api/saved` (GET) - Get all saved items for current user
  - `/api/saved` (POST) - Save a new item (keyword cluster or content analysis)
  - `/api/saved/:id` (DELETE) - Delete a saved item

**AI Integration Wrapper (Feature 1 - COMPLETED):**
The application includes a production-ready AI integration system with dual-mode operation:

**Core Service (`server/services/aiWrapper.ts`):**
- **4 AI Functions**: contentRewrite, executiveSummary, contentOutlineRefine, chatbotResponse
- **Feature Flag Support**: ENABLE_REAL_AI (defaults to false), AI_MODE ('mock' or 'real')
- **Automatic Retry**: Exponential backoff using p-retry (up to 5 retries, 1s-30s delay)
- **Rate Limiting**: Max 5 concurrent requests using p-limit (prevents API abuse)
- **Dual Provider Support**: 
  - Replit AI Integration (automatic, billed to Replit credits)
  - Custom OpenAI API key (fallback for external deployments)
- **Mock Mode**: Free, instant responses with realistic data (default)
- **Real Mode**: GPT-5 powered responses when enabled
- **Comprehensive Error Handling**: Graceful degradation on failures

**Configuration:**
- `ENABLE_REAL_AI` - Master switch (default: false)
- `AI_MODE` - 'mock' or 'real' (default: 'mock')
- `OPENAI_API_KEY` - Optional custom key (Replit integration auto-configured)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Auto-set by Replit
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Auto-set by Replit

**Frontend Integration:**
- Content page (`/dashboard/content`) includes "AI Rewrite" button
- Chatbot page (`/dashboard/chatbot`) automatically uses AI wrapper
- Toast notifications indicate mock vs real mode
- Loading states during AI processing

**Documentation:**
- `docs/AI_INTEGRATION.md` - Comprehensive setup and usage guide (300+ lines)
- `.env.example` - Updated with all AI configuration variables
- `README.md` - AI features prominently listed

**Testing:**
- ✅ E2E tests passed (mock mode)
- ✅ All 5 AI endpoints validated
- ✅ UI integration confirmed
- ✅ Error handling verified
- ✅ Architect approved (no security issues)

**n8n Webhook Integration:**
Optional integration that sends real-time events to n8n workflows for automation:
- **Keyword Analysis** - Fires when user generates keyword clusters
- **Content Optimization** - Fires when user analyzes content
- **SERP Analysis** - Fires when user checks competitors
- **Item Saved** - Fires when user saves a cluster or analysis
- **User Registration** - Fires when new user signs up

Webhooks enable automation like:
- Sending email reports to clients
- Posting to Slack when analysis is done
- Saving data to Google Sheets
- Creating tasks in project management tools
- And 400+ other integrations via n8n

Configuration via environment variables (optional):
- `N8N_WEBHOOK_URL` - Base URL for n8n webhooks
- `N8N_AUTH_USER` - Basic auth username (optional)
- `N8N_AUTH_PASS` - Basic auth password (optional)

**Session Management:**
- HTTP-only cookies for security
- SameSite: 'lax' for CSRF protection
- 7-day session expiration
- Session secret from environment variable (production-ready)

**Storage Pattern:**
The application uses an interface-based storage pattern (`IStorage`) with a PostgreSQL implementation (`DatabaseStorage`). The abstraction allows easy switching between storage backends.

**Database Connection:**
- Connection managed via `server/db.ts`
- Uses Neon serverless driver with WebSocket support
- Drizzle ORM for type-safe queries
- Environment variables: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**Storage Methods (DatabaseStorage):**
- User CRUD: `createUser()`, `getUser()`, `getUserByEmail()`, `updateUserProfile()`
- User Stats: `getUserStats()` - Returns aggregated metrics from activities
- Activities: `createActivity()`, `getActivities()` - Track and retrieve user actions with pagination
- Saved Items: `createSavedItem()`, `getSavedItems()`, `deleteSavedItem()` - Manage favorites
- Chat Messages: `createChatMessage()`, `getChatMessages()` - AI chatbot message history

### Data Storage Solutions

**Current Implementation:**
- **PostgreSQL database** - Production-ready persistent storage
- Neon serverless PostgreSQL via Drizzle ORM
- All user data, activities, and saved items stored in database
- Automatic UUID generation for primary keys

**Database Schema (Active - PostgreSQL):**
The application uses the following Drizzle ORM schema:
- **users**: id (UUID), name, email (unique), password (hashed), theme ('light'|'dark'), onboardingCompleted (boolean), createdAt
- **chat_messages**: id (UUID), userId, role, content, createdAt
- **activities**: id (UUID), userId, type, description, metadata (JSONB), createdAt
- **saved_items**: id (UUID), userId, type, title, data (JSONB), createdAt

All tables use UUIDs as primary keys with automatic generation via `gen_random_uuid()`.

**Schema Validation:**
- Zod schemas for runtime validation (insertUserSchema, insertActivitySchema, insertSavedItemSchema, etc.)
- TypeScript types generated from Drizzle schema
- Insert types exclude auto-generated fields (id, createdAt)

**Database Management:**
- Schema syncing: `npm run db:push` - Automatically syncs schema changes to database
- No manual migrations needed - Drizzle handles schema changes
- Development and production databases managed separately

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

### Export and Reporting
- **jsPDF**: PDF document generation for client-side exports
- **jspdf-autotable**: Table formatting and layout in PDF documents

### Type Definitions
- TypeScript definitions for all major dependencies (@types/bcryptjs, @types/node, etc.)