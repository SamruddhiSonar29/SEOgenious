# SEOgenious

## Overview

SEOgenious is a professional SaaS dashboard application providing AI-powered SEO tools for digital marketing agencies and content creators. It offers features like keyword research, content outline generation, on-page SEO analysis, keyword clustering, SERP competitor analysis, and comprehensive SEO health audits. The platform aims to be a comprehensive solution for enhancing online visibility and content performance, featuring a modern marketing landing page and a robust user dashboard with real-time statistics. Key capabilities include saving and exporting reports, and an AI chatbot assistant for guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for fast development. Wouter handles client-side routing, and TanStack Query manages server state. The UI is constructed with Shadcn UI components (based on Radix UI) and styled using Tailwind CSS, implementing a custom design system with dark mode support, a responsive layout, and custom typography. Component architecture is organized into page-level, reusable UI, dashboard-specific, and landing page components. Authentication state is managed via `AuthContext`, and routes are protected based on user authentication status.

### Backend Architecture

The backend uses Express.js with TypeScript. It implements session-based authentication using `express-session` and `bcrypt` for password hashing. API design follows RESTful principles for authentication, user management, SEO features, AI functionalities, and saved items. A production-ready AI integration wrapper (`aiWrapper.ts`) supports dual-mode operation (mock/real AI, with Replit AI or OpenAI API), automatic retries, and rate limiting. An optional n8n webhook integration allows for workflow automation triggered by various user actions. Data is persistently stored in a PostgreSQL database using Drizzle ORM, with a flexible interface-based storage pattern. The database schema includes tables for users, chat messages, activities, and saved items, all using UUIDs as primary keys and Zod for schema validation.

### Data Storage Solutions

The application utilizes a PostgreSQL database as its primary persistent storage, specifically leveraging Neon serverless PostgreSQL via Drizzle ORM. This setup ensures all user data, activities, and saved items are stored reliably. The schema is type-safe and includes tables for `users`, `chat_messages`, `activities`, and `saved_items`, with automatic UUID generation. Drizzle Kit handles schema syncing, simplifying database management.

### Authentication and Authorization

Authentication is form-based using email/password, with passwords hashed via `bcryptjs`. Session-based authentication employs HTTP-only, SameSite 'lax' cookies for security, with session data stored in-memory (prepared for PostgreSQL persistence). Authorization relies on `req.session.userId` verification for protected API endpoints and a `ProtectedRoute` component on the frontend.

### Build and Development

The development environment uses Vite for the frontend and `tsx` for the backend, enabling hot module replacement and concurrent development. Production builds bundle the frontend to `dist/public` and the backend to `dist/index.js` using `esbuild`. Code quality is maintained through TypeScript strict mode and path aliases.

## New Features

### Feature 2: SEO Health Audit (COMPLETED)

The SEO Health Audit feature provides comprehensive technical SEO analysis with automated scoring (0-100 scale).

**Core Service (`server/services/seoAuditor.ts`):**
- **15+ Technical Checks**: Meta tags, headers (H1-H6 hierarchy), images (alt text, sizing), internal/external links, mobile-friendliness, page performance, structured data, canonical tags
- **Intelligent Scoring**: Weighted algorithm considering critical vs warning issues
- **AI-Powered Recommendations**: Generates actionable recommendations using AI wrapper integration
- **Async Audit Execution**: Non-blocking audit process with status tracking (running/completed/failed)

**Database Schema (`audits` table):**
- UUID primary keys with automatic generation
- Stores URL, score, status, findings array, recommendations array, metadata JSON
- User-scoped audits with PostgreSQL persistence via Drizzle ORM

**API Endpoints:**
- `POST /api/seo-audit` - Start new audit (returns audit ID, runs async)
- `GET /api/seo-audit/history` - Get user's audit history with pagination
- `GET /api/seo-audit/:id` - Get specific audit results with findings and recommendations

**Frontend UI (`/dashboard/seo-audit`):**
- URL input form with real-time validation
- Live polling (2-second intervals) for audit status updates using TanStack Query
- Color-coded score visualization (green ≥80, yellow ≥60, red <60)
- Three-tab interface: Overview (score metrics), Findings (categorized issues with severity badges), Recommendations (prioritized actions)
- Audit history view with clickable past audits
- Save to favorites and export to PDF functionality
- Activity feed integration for audit completions

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless primitives.
- **Shadcn UI**: Pre-styled components.
- **Lucide React**: Icon library.
- **cmdk**: Command palette.

### Styling and Design
- **Tailwind CSS**: Utility-first CSS.
- **class-variance-authority**: Component variants.
- **clsx & tailwind-merge**: Class name utilities.

### State Management and Data Fetching
- **TanStack Query**: Server state management.
- **React Hook Form**: Form management.
- **Zod**: Runtime type validation.

### Database and ORM
- **Drizzle ORM**: Type-safe SQL query builder.
- **Drizzle Kit**: Schema management.
- **@neondatabase/serverless**: PostgreSQL driver.
- **connect-pg-simple**: PostgreSQL session store.

### Backend Utilities
- **Express**: Web framework.
- **express-session**: Session middleware.
- **bcryptjs**: Password hashing.
- **nanoid**: Unique ID generation.

### Development Tools
- **Vite**: Build tool.
- **esbuild**: JS bundler.
- **tsx**: TypeScript execution.

### Date and Utility Libraries
- **date-fns**: Date utilities.

### Export and Reporting
- **jsPDF**: PDF generation.
- **jspdf-autotable**: PDF table formatting.