import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startCrawlSchema, type StartCrawlRequest, type CrawlProgressResponse } from "@shared/schema";
import axios from "axios";
import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import { createHash } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start a new crawl session
  app.post("/api/crawl/start", async (req, res) => {
    try {
      const { url, maxPages, maxDepth } = startCrawlSchema.parse(req.body);
      
      const session = await storage.createCrawlSession({
        url,
        maxPages,
        maxDepth,
      });

      res.json({ sessionId: session.id });

      // Start crawling in background
      startCrawling(session.id, url, maxPages, maxDepth);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Get crawl session progress
  app.get("/api/crawl/:sessionId", async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const session = await storage.getCrawlSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const pages = await storage.getCrawledPagesBySession(sessionId);
    
    // Calculate stats
    const successful = pages.filter(p => p.statusCode && p.statusCode >= 200 && p.statusCode < 300).length;
    const errors = pages.filter(p => p.statusCode && p.statusCode >= 400).length;
    
    const statusCodes: Record<string, number> = {};
    const pageTypes: Record<string, number> = {};
    
    pages.forEach(page => {
      if (page.statusCode) {
        statusCodes[page.statusCode.toString()] = (statusCodes[page.statusCode.toString()] || 0) + 1;
      }
      if (page.contentType) {
        const type = page.contentType.includes('html') ? 'HTML' : 
                    page.contentType.includes('pdf') ? 'PDF' :
                    page.contentType.includes('image') ? 'Image' : 'Other';
        pageTypes[type] = (pageTypes[type] || 0) + 1;
      }
    });

    // Get current URL from active crawl state
    const crawlState = activeCrawls.get(sessionId);
    const sessionWithCurrentUrl = {
      ...session,
      currentUrl: crawlState?.currentUrl || session.currentUrl || null
    };

    // Calculate duplicate content statistics
    const uniqueHashes = await storage.getUniqueContentHashes(sessionId);
    const uniquePages = uniqueHashes.length;
    const duplicateUrls = pages.length - uniquePages;
    
    // Get PDF link count
    const pdfLinks = await storage.getPdfLinkCount(sessionId);

    const response: CrawlProgressResponse = {
      session: sessionWithCurrentUrl,
      pages,
      stats: {
        totalFound: pages.length,
        successful,
        errors,
        uniquePages,
        duplicateUrls,
        pdfLinks,
        statusCodes,
        pageTypes,
      },
    };

    res.json(response);
  });

  // Stop a crawl session
  app.post("/api/crawl/:sessionId/stop", async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    
    // Signal the crawl to stop
    const crawlState = activeCrawls.get(sessionId);
    if (crawlState) {
      crawlState.shouldStop = true;
    }
    
    const session = await storage.updateCrawlSession(sessionId, {
      status: 'stopped',
      completedAt: new Date(),
    });
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true });
  });

  // Export crawl results as CSV
  app.get("/api/crawl/:sessionId/export", async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const pages = await storage.getCrawledPagesBySession(sessionId);
    const pdfLinks = await storage.getPdfLinks(sessionId);
    
    if (pages.length === 0 && pdfLinks.length === 0) {
      return res.status(404).json({ error: "No pages found" });
    }

    const csvSections = [
      "CRAWLED PAGES",
      "URL,Status Code,Content Type,Size (bytes),Load Time (ms),Depth,Content Hash",
      ...pages.map(page => 
        `"${page.url.replace(/"/g, '""')}",${page.statusCode || ''},"${(page.contentType || '').replace(/"/g, '""')}",${page.size || ''},${page.loadTime || ''},${page.depth},"${page.contentHash || ''}"`
      ),
      "",
      "PDF LINKS DISCOVERED",
      "PDF URL",
      ...pdfLinks.map(url => `"${url.replace(/"/g, '""')}"`)
    ];

    const csv = csvSections.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crawl-results.csv"');
    res.send(csv);
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Global session state for tracking active crawls
const activeCrawls = new Map<number, { shouldStop: boolean; currentUrl: string }>();

// Crawling logic
async function startCrawling(sessionId: number, startUrl: string, maxPages: number, maxDepth: number) {
  const session = await storage.updateCrawlSession(sessionId, { 
    status: 'running',
    startedAt: new Date()
  });
  
  if (!session) return;
  
  // Initialize crawl tracking
  activeCrawls.set(sessionId, { shouldStop: false, currentUrl: startUrl });

  const visited = new Set<string>();
  const queued = new Set<string>(); // Track queued URLs for O(1) lookup
  const queue: Array<{ url: string; depth: number }> = [];
  let totalPages = 0;
  let successfulPages = 0;
  let errorPages = 0;

  // Add initial URL
  queue.push({ url: startUrl, depth: 0 });
  queued.add(startUrl);

  // Try to get sitemap first
  try {
    const sitemapUrls = await getSitemapUrls(startUrl);
    sitemapUrls.forEach(url => {
      if (!visited.has(url) && !queued.has(url) && queue.length < maxPages) {
        // Sitemap URLs should be treated as depth 0 since they're direct site content
        queue.push({ url, depth: 0 });
        queued.add(url);
      }
    });
  } catch (e) {
    console.log('No sitemap found or error parsing sitemap');
  }

  while (queue.length > 0 && totalPages < maxPages) {
    // Check if crawl should stop
    const crawlState = activeCrawls.get(sessionId);
    if (crawlState?.shouldStop) {
      console.log(`Stopping crawl for session ${sessionId} by user request`);
      break;
    }

    const current = queue.shift();
    if (!current || visited.has(current.url) || current.depth > maxDepth) continue;

    visited.add(current.url);
    
    // Update current URL being crawled
    if (crawlState) {
      crawlState.currentUrl = current.url;
    }
    
    try {
      const startTime = Date.now();
      const response = await axios.get(current.url, {
        timeout: 10000,
        maxRedirects: 5,
        maxContentLength: 50 * 1024 * 1024, // 50MB limit
        maxBodyLength: 50 * 1024 * 1024, // 50MB limit
        validateStatus: () => true, // Don't throw on 4xx/5xx
      });
      const loadTime = Date.now() - startTime;

      // Generate content hash for duplicate detection
      let contentHash = null;
      if (response.data && response.status >= 200 && response.status < 300) {
        try {
          // For HTML content, extract meaningful content without scripts/styles
          if (response.headers['content-type']?.includes('text/html')) {
            const $ = cheerio.load(response.data);
            // Remove script, style, and comment nodes for better content comparison
            $('script, style, noscript').remove();
            // Get normalized text content
            const normalizedContent = $('body').text().replace(/\s+/g, ' ').trim();
            if (normalizedContent) {
              contentHash = createHash('sha256').update(normalizedContent, 'utf8').digest('hex');
            }
          } else {
            // For non-HTML content, hash the entire response safely
            let content = '';
            if (typeof response.data === 'string') {
              content = response.data;
            } else if (Buffer.isBuffer(response.data)) {
              content = response.data.toString('base64');
            } else {
              content = JSON.stringify(response.data);
            }
            if (content) {
              contentHash = createHash('sha256').update(content, 'utf8').digest('hex');
            }
          }
        } catch (error) {
          console.warn(`Failed to generate content hash for ${current.url}:`, error);
          contentHash = null;
        }
      }

      const page = await storage.createCrawledPage({
        sessionId,
        url: current.url,
        statusCode: response.status,
        contentType: response.headers['content-type']?.split(';')[0] || '',
        size: response.data ? (typeof response.data === 'string' ? response.data.length : Buffer.byteLength(JSON.stringify(response.data))) : 0,
        loadTime,
        depth: current.depth,
        contentHash,
      });

      totalPages++;
      if (response.status >= 200 && response.status < 300) {
        successfulPages++;
        
        // Extract links if it's HTML and we haven't reached max depth
        if (current.depth < maxDepth && response.headers['content-type']?.includes('text/html')) {
          const { links, pdfLinks } = extractLinksAndPdfs(response.data, startUrl);
          
          // Track PDF links
          for (const pdfLink of pdfLinks) {
            await storage.addPdfLink(sessionId, pdfLink);
          }
          
          // Add regular links to queue
          links.forEach(link => {
            if (!visited.has(link) && !queued.has(link) && queue.length + totalPages < maxPages) {
              queue.push({ url: link, depth: current.depth + 1 });
              queued.add(link);
            }
          });
        }
      } else {
        errorPages++;
      }

      // Update session stats
      await storage.updateCrawlSession(sessionId, {
        totalPages,
        successfulPages,
        errorPages,
      });

      // Broadcast progress via WebSocket
      broadcastProgress(sessionId, { totalPages, successfulPages, errorPages, currentUrl: current.url });

      // Small delay to prevent overwhelming the target server
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errorPages++;
      totalPages++;
      
      await storage.createCrawledPage({
        sessionId,
        url: current.url,
        statusCode: 0,
        contentType: '',
        size: 0,
        loadTime: 0,
        depth: current.depth,
        contentHash: null,
      });

      await storage.updateCrawlSession(sessionId, {
        totalPages,
        successfulPages,
        errorPages,
      });
    }
  }

  // Mark as completed and cleanup
  const finalStatus = activeCrawls.get(sessionId)?.shouldStop ? 'stopped' : 'completed';
  
  try {
    await storage.updateCrawlSession(sessionId, {
      status: finalStatus,
      completedAt: new Date(),
      totalPages,
      successfulPages,
      errorPages,
    });
  } catch (error) {
    console.error(`Failed to update session ${sessionId}:`, error);
  } finally {
    // Always clean up active crawl tracking
    activeCrawls.delete(sessionId);
  }

  broadcastProgress(sessionId, { 
    totalPages, 
    successfulPages, 
    errorPages, 
    currentUrl: '', 
    completed: true 
  });
}

async function getSitemapUrls(baseUrl: string): Promise<string[]> {
  const urls: string[] = [];
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
  
  try {
    const response = await axios.get(sitemapUrl, { timeout: 5000 });
    const result = await parseStringPromise(response.data);
    
    if (result.urlset?.url) {
      result.urlset.url.forEach((entry: any) => {
        if (entry.loc?.[0]) {
          urls.push(entry.loc[0]);
        }
      });
    }
  } catch (e) {
    // Sitemap not found or invalid
  }
  
  return urls;
}

function extractLinksAndPdfs(html: string, baseUrl: string): { links: string[], pdfLinks: string[] } {
  const $ = cheerio.load(html);
  const linkSet = new Set<string>();
  const pdfLinkSet = new Set<string>();
  const base = new URL(baseUrl);
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && href.trim()) {
      try {
        // Skip javascript:, mailto:, tel:, and other non-http protocols
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('ftp:')) {
          return;
        }
        
        const url = new URL(href.trim(), baseUrl);
        
        // Only include links from the exact same hostname (with www normalization)
        const baseHost = base.hostname.replace(/^www\./, '');
        const urlHost = url.hostname.replace(/^www\./, '');
        if (urlHost !== baseHost) {
          return;
        }
        
        // Filter out anchor fragments (URLs that only differ by hash)
        const urlWithoutHash = url.origin + url.pathname + url.search;
        const baseWithoutHash = base.origin + base.pathname + base.search;
        
        // Skip if it's just an anchor on the same page
        if (urlWithoutHash === baseWithoutHash && url.hash) {
          return;
        }
        
        // Skip if it's just a hash fragment without a path
        if (url.hash && (!url.pathname || url.pathname === '/' || url.pathname === base.pathname)) {
          return;
        }
        
        // Check for PDF links
        const pathname = url.pathname.toLowerCase();
        if (pathname.endsWith('.pdf')) {
          url.hash = '';
          pdfLinkSet.add(url.toString());
          return;
        }
        
        // Skip other non-page file extensions
        const skipExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.doc', '.docx', '.zip', '.mp3', '.mp4', '.avi'];
        if (skipExtensions.some(ext => pathname.endsWith(ext))) {
          return;
        }
        
        // Remove hash fragment for consistency
        url.hash = '';
        linkSet.add(url.toString());
        
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });
  
  return {
    links: Array.from(linkSet),
    pdfLinks: Array.from(pdfLinkSet)
  };
}

function extractLinks(html: string, baseUrl: string): string[] {
  return extractLinksAndPdfs(html, baseUrl).links;
}

function broadcastProgress(sessionId: number, data: any) {
  // Simplified - no WebSocket broadcasting for now
  console.log(`Progress for session ${sessionId}:`, data);
}
