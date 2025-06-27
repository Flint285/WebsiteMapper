# WebsiteMapper

## Overview

WebsiteMapper is a professional SEO analysis tool that provides web crawling capabilities with real-time progress tracking. The application consists of a TypeScript Express backend and a React frontend built with Vite, offering a comprehensive solution for website analysis and SEO insights.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Storage**: In-memory storage by default (with optional PostgreSQL support)
- **Web Crawling**: Custom crawler implementation using Axios and Cheerio
- **Data Validation**: Zod schemas for request/response validation
- **Build**: esbuild for production bundling

## Key Components

### Server Components
- **API Routes** (`server/routes.ts`): RESTful endpoints for crawl management
  - POST `/api/crawl/start` - Initialize new crawl session
  - GET `/api/crawl/:sessionId` - Get crawl progress and results
  - POST `/api/crawl/:sessionId/stop` - Stop active crawl
  - GET `/api/crawl/:sessionId/export` - Export results as CSV

- **Storage Layer** (`server/storage.ts`): Abstracted storage interface
  - `IStorage` interface for data operations
  - `MemStorage` implementation for in-memory persistence
  - Support for crawl sessions and page data management

- **Crawler Engine**: Background crawling with configurable depth and page limits
  - Concurrent request handling
  - Status code tracking and error handling
  - Content type detection and response time measurement

### Client Components
- **CrawlerForm**: Input form for crawl configuration
- **CrawlStatus**: Real-time progress monitoring with live updates
- **ResultsTable**: Paginated display of crawled pages with filtering
- **ResultsSummary**: Statistical overview and export functionality

### Shared Components
- **Schema Definitions** (`shared/schema.ts`): Drizzle ORM schemas and Zod validation
- **Type Safety**: Shared TypeScript types between client and server

## Data Flow

1. **Crawl Initiation**: User submits URL and parameters through CrawlerForm
2. **Session Creation**: Server creates crawl session and returns session ID
3. **Background Processing**: Crawler processes URLs asynchronously
4. **Real-time Updates**: Client polls server every 1-2 seconds for progress
5. **Result Display**: Live updates show discovered pages, status codes, and statistics
6. **Export**: Users can download results as CSV when crawl completes

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **axios**: HTTP client for web crawling
- **cheerio**: Server-side HTML parsing and manipulation
- **drizzle-orm**: Type-safe database ORM (optional PostgreSQL support)
- **@radix-ui/***: Accessible UI component primitives
- **zod**: Runtime type validation and schema definition

### Development Dependencies
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Mode
- Vite development server with HMR
- Express server with middleware mode integration
- Single command startup: `npm run dev`
- Automatic TypeScript compilation and hot reloading

### Production Build
- Static asset generation with `vite build`
- Server bundling with esbuild
- Optimized client bundle served from `dist/public`
- Single Express server handles both API and static files

### Database Configuration
- Default: In-memory storage for immediate usage
- Optional: PostgreSQL with Drizzle migrations
- Environment variable: `DATABASE_URL` for database connection
- Migration command: `npm run db:push`

## Changelog
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.