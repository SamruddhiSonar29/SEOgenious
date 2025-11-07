# SEOgenious

## Overview
SEOgenious is a professional SaaS dashboard application offering AI-powered SEO tools for digital marketing agencies and content creators. It provides features like keyword research, content outline generation, on-page SEO analysis, keyword clustering, SERP competitor analysis, and comprehensive SEO health audits. The platform aims to be a comprehensive solution for enhancing online visibility and content performance, featuring a modern marketing landing page and a robust user dashboard with real-time statistics, report saving/exporting, and an AI chatbot assistant.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, and Vite. It uses Wouter for routing, TanStack Query for server state management, and Shadcn UI components (based on Radix UI) with Tailwind CSS for styling, supporting dark mode and responsive layouts. Authentication state is managed via `AuthContext`, and routes are protected based on user authentication.

### Backend
The backend uses Express.js with TypeScript, implementing session-based authentication with `express-session` and `bcrypt`. APIs follow RESTful principles. A production-ready AI integration wrapper supports mock/real AI (Replit AI or OpenAI), automatic retries, and rate limiting. An optional n8n webhook integration is available. Data is stored in PostgreSQL using Drizzle ORM, with an interface-based storage pattern and Zod for schema validation.

### Data Storage
PostgreSQL, specifically Neon serverless PostgreSQL via Drizzle ORM, is used for persistent storage of user data, activities, and saved items. The schema includes `users`, `chat_messages`, `activities`, and `saved_items` tables, with UUID primary keys. Drizzle Kit manages schema syncing.

### Authentication and Authorization
Form-based authentication uses email/password with `bcryptjs` hashing. Session-based authentication uses HTTP-only, SameSite 'lax' cookies, with session data stored in-memory (prepared for PostgreSQL persistence). Authorization relies on `req.session.userId` for protected API endpoints and a `ProtectedRoute` component on the frontend.

### Features
*   **SEO Health Audit**: Provides comprehensive technical SEO analysis with automated scoring, 15+ technical checks, AI-powered recommendations, and asynchronous execution.
*   **Rank Tracking Dashboard**: Monitors keyword rankings over time with historical trend visualization, snapshot management, and manual rank checks.
*   **AI PDF Report Generator**: Exports professional PDF reports for SEO audits and rank tracking data, featuring AI-powered summaries, branded layouts, and two report types (SEO Audit and Rank Tracking).
*   **Content Planner**: Offers a complete editorial workflow management system with Kanban board visualization and calendar scheduling, supporting full CRUD operations, status workflow management, and activity tracking.

## External Dependencies

### UI Component Libraries
*   Radix UI
*   Shadcn UI
*   Lucide React
*   cmdk

### Styling and Design
*   Tailwind CSS
*   class-variance-authority
*   clsx & tailwind-merge

### State Management and Data Fetching
*   TanStack Query
*   React Hook Form
*   Zod

### Database and ORM
*   Drizzle ORM
*   Drizzle Kit
*   @neondatabase/serverless
*   connect-pg-simple

### Backend Utilities
*   Express
*   express-session
*   bcryptjs
*   nanoid

### Development Tools
*   Vite
*   esbuild
*   tsx

### Date and Utility Libraries
*   date-fns

### Export and Reporting
*   jsPDF
*   jspdf-autotable