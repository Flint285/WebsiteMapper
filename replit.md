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

## Key Features

### Duplicate Content Detection
- **Content Hashing**: Uses SHA-256 hash of normalized HTML content to identify duplicate pages
- **Intelligent Filtering**: Removes scripts, styles, and comments before hashing for accurate content comparison
- **Statistics Tracking**: Shows total URLs found vs. unique pages vs. duplicate URLs
- **Filter Toggle**: Users can filter results to show only unique content
- **Visual Indicators**: Table displays duplicate status with badges showing count of duplicate URLs

### Smart URL Filtering
- Excludes anchor fragments (#section) and hash parameters
- Filters out non-page URLs (downloads, external links, etc.)
- Maintains SEO-relevant URL variations for analysis

## Changelog
- June 30, 2025: Final bug hunt completed - additional critical fixes:
  - Fixed sitemap URL depth assignment for proper crawl hierarchy
  - Added explicit contentHash field for error page records
  - Enhanced timer cleanup in progress component to prevent memory leaks
  - Fixed potential infinite re-render in pagination with useEffect
  - Improved form validation with detailed error messages
  - Added content hash to CSV export for complete duplicate analysis
  - Enhanced domain matching with www normalization
  - Added request size limits (10MB) for API security
  - Fixed subdomain handling to prevent unintended cross-domain crawling
- June 30, 2025: Major UX/UI improvements implemented:
  - Enhanced mobile responsiveness with flexible header layout and stacked controls
  - Added comprehensive loading states with skeleton UI for all components
  - Improved form guidance with descriptive labels and helpful tooltips
  - Reorganized table controls into clean grid layout with better spacing
  - Added informative empty states with actionable "Clear filters" button
  - Enhanced visual feedback with spinning loader and better button states
  - Added helpful info box explaining crawler functionality
  - Improved pagination handling with automatic reset on filter changes
  - Better visual hierarchy and content organization throughout
- June 30, 2025: Critical bug fixes implemented:
  - Enhanced content hash generation with proper error handling and encoding
  - Fixed race condition in link extraction to prevent duplicate queue entries
  - Improved CSV export with proper quote escaping for special characters
  - Added response size limits (50MB) to prevent memory issues with large pages
  - Enhanced pagination handling to reset when filters exceed available pages
  - Added proper cleanup handling for active crawl sessions with try/finally blocks
  - Optimized link extraction using Set for better performance on large pages
- June 27, 2025: Added duplicate content detection system with content hashing
- June 27, 2025: Enhanced results display with unique/duplicate content statistics
- June 27, 2025: Added page size selector (10-250 results per page)
- June 27, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.