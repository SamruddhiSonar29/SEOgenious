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

### Feature 3: Rank Tracking Dashboard (COMPLETED)

The Rank Tracking Dashboard enables users to monitor keyword rankings over time with historical trend visualization.

**Core Service (`server/services/rankTracker.ts`):**
- **Simulated Rank Checking**: 70% chance of ranking 1-50, 20% chance of 51-100, 10% chance of not ranking
- **Snapshot Management**: Automatic initial snapshot creation when keywords are added
- **Trend Calculation**: Computes rank changes and trends over time
- **Manual Rank Checks**: Users can trigger on-demand rank updates

**Database Schema:**
- `keywords` table: Stores tracked keywords with target URL, search engine (default: google), location, device (desktop/mobile), user association
- `rank_snapshots` table: Historical rank positions with timestamp, page number, ranking URL
- Both tables use UUID primary keys with automatic generation

**API Endpoints:**
- `POST /api/rank-tracking/keywords` - Add new keyword to track (creates initial snapshot)
- `GET /api/rank-tracking/keywords` - Get all keywords for authenticated user
- `DELETE /api/rank-tracking/keywords/:id` - Delete keyword and all snapshots
- `POST /api/rank-tracking/keywords/:id/check` - Manually trigger rank check (creates new snapshot)
- `GET /api/rank-tracking/keywords/:id/history` - Get rank history with trend data

**Frontend UI (`/dashboard/rank-tracking`):**
- Add keyword form with fields: keyword, target URL, location, device (Desktop/Mobile)
- Keyword cards showing: keyword name, target URL, current rank, last checked time
- Manual "Check Rank" button on each card for on-demand updates
- Delete functionality with trash icon button
- Line chart visualization using recharts with reversed Y-axis (rank 1 at top, 100 at bottom)
- Chart displays historical rank positions over time
- Activity feed integration for rank tracking events
- Real-time updates using TanStack Query with proper cache invalidation

**Key Implementation Details:**
- Critical fix: `createInitialSnapshot` receives userId parameter to correctly fetch keyword and create initial snapshot
- Express route ordering: Specific routes (`/history`) defined before parameterized routes (`/:id`) to prevent shadowing
- TanStack Query: Conditional queryKey prevents requests when no keyword is selected
- Data persistence: PostgreSQL via Drizzle ORM with type-safe schema validation using Zod

### Feature 7: AI PDF Report Generator (COMPLETED)

The AI PDF Report Generator enables users to export professional PDF reports for SEO audits and rank tracking data with AI-powered summaries.

**Core Service (`server/services/pdfGenerator.ts`):**
- **Professional PDF Generation**: Uses jsPDF and jspdf-autotable libraries for report creation
- **AI-Powered Summaries**: Generates executive summaries using `aiWrapper.executiveSummary` function
- **Branded Layout**: Consistent header with SEOgenious branding, color-coded sections, professional formatting
- **Two Report Types**: SEO Audit reports and Rank Tracking reports with different layouts and content

**PDF Report Components:**
- **SEO Audit Report**: Website URL, audit date, color-coded score badge, AI executive summary, detailed findings table (category, severity, issue, element), actionable recommendations list, comprehensive metadata (page load time, size, resource count, links)
- **Rank Tracking Report**: Keyword, target URL, current rank position, AI-powered trend analysis, historical rank data table with dates and positions, visual rank trend indicator

**API Endpoints:**
- `POST /api/reports/seo-audit/:id` - Generate PDF for completed SEO audit (authenticated, CSRF protected)
- `POST /api/reports/rank-tracking/:keywordId` - Generate PDF for keyword rank history (authenticated, CSRF protected)

**Frontend Integration:**
- **SEO Audit Page**: Export PDF button in audit details header (data-testid="button-export-pdf")
- **Rank Tracking Page**: Export PDF button in chart header when keyword selected (data-testid="button-export-pdf")
- **Download Flow**: Fetch API → Blob creation → Automatic download trigger → Toast notifications (started → complete/failed)

**Key Implementation Details:**
- **jsPDF Import**: Uses named import `import { jsPDF } from 'jspdf'` for ESM compatibility
- **AI Fallback**: Static summary generation if AI service fails to ensure reports always generate
- **Binary Response**: Returns PDF as Buffer with `Content-Type: application/pdf` and `Content-Disposition: attachment` headers
- **Storage Integration**: Fixed audit update bug by adding `updateAudit` method to IStorage interface instead of creating duplicate records
- **Type Safety**: Explicit type casting for Drizzle ORM array fields to resolve TypeScript strict checking

**Bug Fixes During Implementation:**
- Fixed SEO audit stuck in "running" status: Added `updateAudit(id, updates)` method to storage interface to update existing audits instead of creating duplicates
- Fixed jsPDF import error: Changed from default export to named export for proper ESM module loading
- Fixed TypeScript strict types: Added explicit type casting for audit findings, recommendations, and metadata arrays

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