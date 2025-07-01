# WebsiteMapper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

**Professional SEO Analysis & Web Crawling Platform**

WebsiteMapper is a powerful, enterprise-grade web crawling application designed for comprehensive website analysis, duplicate content detection, and SEO insights. Built with modern web technologies, it provides real-time crawling capabilities with advanced content analysis features.

![WebsiteMapper Interface](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=WebsiteMapper+Interface)

## ✨ Features

### 🔍 **Advanced Web Crawling**
- **Intelligent Link Discovery**: Automatically discovers pages through link following and sitemap parsing
- **Configurable Depth Control**: Set crawl depth from 1-20 levels for precise site exploration
- **Scalable Page Limits**: Handle sites from small (10 pages) to enterprise-scale (10,000+ pages)
- **Smart URL Filtering**: Excludes non-page content while maintaining SEO-relevant variations

### 📊 **Content Analysis**
- **Duplicate Content Detection**: Advanced SHA-256 content hashing identifies duplicate pages
- **PDF Document Discovery**: Automatically finds and catalogs PDF files linked from web pages
- **Content Type Classification**: Categorizes discovered content (HTML, PDF, Images, etc.)
- **Status Code Monitoring**: Comprehensive HTTP status tracking with error categorization

### 📈 **Real-Time Insights**
- **Live Progress Tracking**: Real-time updates during crawling with current page information
- **Performance Metrics**: Load time analysis and response size measurement
- **Statistical Dashboard**: Comprehensive analytics with visual data representation
- **Export Capabilities**: CSV export with detailed crawl results and PDF link inventory

### 🎨 **Modern User Experience**
- **Glass-morphism Design**: Contemporary UI with gradient backgrounds and backdrop blur effects
- **Responsive Interface**: Mobile-optimized design that works across all device sizes
- **Interactive Controls**: Intuitive filters, pagination, and search functionality
- **Professional Branding**: Cohesive design system with consistent visual hierarchy

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **PostgreSQL** (optional - uses in-memory storage by default)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/websitemapper.git
   cd websitemapper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5000
   ```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📋 Usage

### Basic Crawling

1. **Enter Website URL**: Input the homepage URL you want to analyze
2. **Configure Settings**: 
   - Set maximum pages to crawl (1-10,000)
   - Choose crawl depth (1-20 levels)
3. **Start Analysis**: Click "Start Crawling" to begin the process
4. **Monitor Progress**: Watch real-time updates as pages are discovered
5. **Review Results**: Analyze the comprehensive results dashboard
6. **Export Data**: Download detailed CSV reports with all findings

### Advanced Features

#### Duplicate Content Analysis
- Toggle "Unique content only" to filter duplicate pages
- Review content uniqueness percentage in the statistics
- Identify pages with identical content using advanced hashing

#### PDF Document Discovery
- Automatically discovers PDF files linked from web pages
- Separate PDF statistics in the results summary
- PDF links included in CSV export for comprehensive reporting

#### Performance Monitoring
- Track average page load times
- Monitor response sizes and status codes
- Identify performance bottlenecks across the site

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized production builds
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for utility-first styling
- **TanStack Query** for efficient server state management
- **Wouter** for lightweight client-side routing

#### Backend
- **Node.js** with Express.js REST API
- **TypeScript** for end-to-end type safety
- **Zod** for runtime validation and schema definition
- **Axios & Cheerio** for web crawling and HTML parsing
- **In-memory storage** with optional PostgreSQL support

#### Development Tools
- **esbuild** for fast production bundling
- **Drizzle ORM** for type-safe database operations
- **React Hook Form** with Zod validation

### Project Structure

```
websitemapper/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Storage interface and implementations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Zod schemas and TypeScript types
└── dist/                  # Production build output
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional PostgreSQL database connection
DATABASE_URL=postgresql://username:password@localhost:5432/websitemapper

# Server configuration
PORT=5000
NODE_ENV=production
```

### Database Setup (Optional)

WebsiteMapper uses in-memory storage by default. For persistent storage:

1. **Install PostgreSQL**
2. **Set DATABASE_URL** environment variable
3. **Run migrations**
   ```bash
   npm run db:push
   ```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run check        # TypeScript type checking

# Production
npm run build        # Build for production
npm start           # Start production server

# Database (when using PostgreSQL)
npm run db:push     # Apply database migrations
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

### Crawling Capabilities
- **Speed**: 100ms delay between requests to respect server resources
- **Concurrency**: Single-threaded with efficient queue management
- **Memory**: Optimized Set-based duplicate detection for large sites
- **Limits**: Configurable request size limits (50MB) for stability

### Scalability Features
- **Efficient Storage**: In-memory caching with optional database persistence
- **Real-time Updates**: WebSocket-ready architecture for live progress tracking
- **Export Handling**: Streaming CSV generation for large datasets
- **Error Recovery**: Comprehensive error handling and session cleanup

## 🔒 Security

- **Input Validation**: Comprehensive Zod schema validation on all inputs
- **URL Filtering**: Protection against malicious URLs and protocol attacks
- **Request Limits**: Configurable size and timeout limits
- **Domain Restriction**: Crawler respects same-domain boundaries
- **Error Handling**: Secure error messages without information disclosure

## 📈 Roadmap

### Current Version (v1.0)
- ✅ Basic web crawling functionality
- ✅ Duplicate content detection
- ✅ PDF link discovery
- ✅ Real-time progress tracking
- ✅ CSV export capabilities
- ✅ Modern UI/UX design

### Upcoming Features
- 🔄 **Advanced SEO Analysis**: Meta tag analysis, heading structure, internal linking
- 🔄 **Performance Insights**: Core Web Vitals, page speed analysis
- 🔄 **Content Recommendations**: SEO improvement suggestions
- 🔄 **Scheduled Crawls**: Automated periodic site analysis
- 🔄 **Team Collaboration**: Multi-user support and shared reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: Comprehensive guides in the `/docs` folder
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/yourusername/websitemapper/issues)
- **Discussions**: Join the community in [GitHub Discussions](https://github.com/yourusername/websitemapper/discussions)

---

<div align="center">

**WebsiteMapper** - Professional SEO Analysis Made Simple

[Website](https://websitemapper.com) • [Documentation](https://docs.websitemapper.com) • [API Reference](https://api.websitemapper.com)

</div>