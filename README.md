# WebsiteMapper 🔍

A professional SEO analysis tool that provides comprehensive web crawling capabilities with real-time progress tracking, duplicate content detection, and intelligent filtering. Built with modern web technologies for reliable website analysis and SEO insights.

![Status](https://img.shields.io/badge/status-production--ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Express](https://img.shields.io/badge/Express-latest-green)

## ✨ Key Features

### 🕷️ **Advanced Web Crawling**
- **Smart Link Discovery**: Follows internal links with configurable depth (3-20 levels)
- **Sitemap Integration**: Automatically discovers and processes XML sitemaps
- **Intelligent Filtering**: Excludes non-page content (images, downloads, anchor fragments)
- **Concurrent Processing**: Efficient crawling with built-in rate limiting
- **Large File Support**: Handles pages up to 50MB with proper error handling

### 🔍 **Duplicate Content Detection**
- **Content Hashing**: SHA-256 based analysis to identify identical content
- **Smart Comparison**: Normalizes HTML content for accurate duplicate detection
- **Visual Indicators**: Clear badges showing unique vs duplicate content
- **Filter Toggle**: View all URLs or unique content only
- **SEO Insights**: Understand true page count vs URL variations

### 📊 **Real-Time Analytics**
- **Live Progress Tracking**: See pages discovered in real-time
- **Performance Metrics**: Load times, response codes, content types
- **Status Code Analysis**: Comprehensive HTTP status tracking
- **Error Monitoring**: Detailed error reporting and handling
- **Content Type Detection**: HTML, PDF, images, and other file types

### 💻 **Professional UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Loading States**: Skeleton UI and progress indicators
- **Advanced Filtering**: Search, status code, and content filters
- **Pagination Control**: 10-250 results per page with smart navigation
- **Export Functionality**: Download results as properly formatted CSV

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd WebsiteMapper
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the application at [http://localhost:5000](http://localhost:5000)

3. **Start Crawling**
   - Enter a website URL (e.g., `https://example.com`)
   - Configure max pages (1-10,000) and crawl depth (3-20 levels)
   - Click "Start Crawling" and watch real-time progress
   - Filter and export results when complete

## 🏗️ Architecture

### **Frontend (React + TypeScript)**
```
/client/src/
├── components/          # UI components
│   ├── crawler-form.tsx     # Crawl configuration form
│   ├── crawl-progress.tsx   # Real-time progress display
│   ├── results-summary.tsx  # Statistics and export
│   ├── results-table.tsx    # Paginated results with filtering
│   └── ui/                  # Reusable UI components (shadcn/ui)
├── pages/               # Application pages
├── hooks/               # Custom React hooks
└── lib/                 # Utilities and query client
```

### **Backend (Express + TypeScript)**
```
/server/
├── index.ts             # Server entry point
├── routes.ts            # API endpoints and crawling logic
├── storage.ts           # Data storage interface (in-memory)
└── vite.ts              # Vite integration for development
```

### **Shared Types**
```
/shared/
└── schema.ts            # Zod schemas and TypeScript types
```

## 🛠️ Technical Stack

| **Frontend** | **Backend** | **Development** |
|--------------|-------------|-----------------|
| React 18 | Express.js | Vite |
| TypeScript | Node.js | TypeScript |
| TanStack Query | Axios | Tailwind CSS |
| shadcn/ui | Cheerio | Zod Validation |
| Wouter Router | Crypto API | Hot Reload |

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/crawl/start` | Start a new crawl session |
| `GET` | `/api/crawl/:sessionId` | Get crawl progress and results |
| `POST` | `/api/crawl/:sessionId/stop` | Stop an active crawl |
| `GET` | `/api/crawl/:sessionId/export` | Export results as CSV |

### **Sample API Request**
```javascript
// Start a crawl
const response = await fetch('/api/crawl/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    maxPages: 1000,
    maxDepth: 5
  })
});
```

## 💾 Data Storage

**Default**: In-memory storage for immediate use and testing
- No database setup required
- Data persists during application runtime
- Perfect for development and analysis sessions

**Optional**: PostgreSQL with Drizzle ORM
- Set `DATABASE_URL` environment variable
- Run `npm run db:push` for migrations
- Persistent storage across restarts

## 🔧 Configuration

### **Environment Variables**
```bash
# Optional: Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/websitemapper

# Development
NODE_ENV=development
```

### **Crawl Settings**
- **Max Pages**: 1-10,000 pages per crawl
- **Max Depth**: 1-20 levels deep from homepage
- **Timeout**: 10 seconds per request
- **Rate Limiting**: 100ms delay between requests
- **File Size**: Up to 50MB per page

## 🚀 Deployment

### **Production Build**
```bash
npm run build
npm start
```

### **Development**
```bash
npm run dev
```

### **Available Scripts**
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema (if using PostgreSQL) |

## 🔍 Use Cases

### **SEO Professionals**
- Audit website structure and page count
- Identify duplicate content issues
- Analyze page performance and load times
- Export data for client reports

### **Web Developers**
- Test website crawlability
- Identify broken links and error pages
- Analyze site architecture depth
- Monitor page performance metrics

### **Content Managers**
- Inventory all website pages
- Find duplicate content across different URLs
- Track content types and file sizes
- Export comprehensive site maps

## 🐛 Troubleshooting

### **Common Issues**

**Crawl not starting:**
- Verify the URL includes `http://` or `https://`
- Check if the website allows crawling (robots.txt)
- Ensure the domain is accessible

**Missing pages:**
- Increase max depth for deeper crawling
- Check if pages are linked from discoverable locations
- Some pages may require authentication

**Slow performance:**
- Large websites take time to crawl completely
- Use lower max pages setting for faster results
- Consider the 100ms delay between requests

### **Error Codes**
- **200**: Success - page crawled successfully
- **301/302**: Redirects - followed automatically
- **404**: Not found - broken or removed pages
- **500**: Server errors - website issues

## 📈 Performance

**Typical Performance:**
- ~10-50 pages per minute depending on site speed
- Memory usage scales with crawl size
- Optimized for sites up to 10,000 pages

**Optimizations:**
- Content hashing for duplicate detection
- Intelligent URL filtering
- Concurrent request handling
- Built-in rate limiting for server protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- Powered by [Vite](https://vitejs.dev/) for lightning-fast development
- Uses [TanStack Query](https://tanstack.com/query) for robust data fetching
- Styled with [Tailwind CSS](https://tailwindcss.com/) for responsive design

---

**WebsiteMapper** - Professional SEO analysis made simple. 🚀
