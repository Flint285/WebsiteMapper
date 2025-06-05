import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startCrawlSchema, type StartCrawlRequest, type CrawlProgressResponse } from "@shared/schema";
import axios from "axios";
import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";

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
      startCrawling(session.id, url, maxPages || 1000, maxDepth);
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
      currentUrl: crawlState?.currentUrl || null
    };

    const response: CrawlProgressResponse = {
      session: sessionWithCurrentUrl,
      pages,
      stats: {
        totalFound: pages.length,
        successful,
        errors,
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
    
    if (pages.length === 0) {
      return res.status(404).json({ error: "No pages found" });
    }

    const csv = [
      "URL,Status Code,Content Type,Size (bytes),Load Time (ms),Depth",
      ...pages.map(page => 
        `"${page.url}",${page.statusCode || ''},${page.contentType || ''},${page.size || ''},${page.loadTime || ''},${page.depth}`
      )
    ].join('\n');

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
  const queue: Array<{ url: string; depth: number }> = [];
  let totalPages = 0;
  let successfulPages = 0;
  let errorPages = 0;

  // Add initial URL
  queue.push({ url: startUrl, depth: 0 });

  // Try to get sitemap first
  try {
    const sitemapUrls = await getSitemapUrls(startUrl);
    sitemapUrls.forEach(url => {
      if (!visited.has(url) && queue.length < maxPages) {
        queue.push({ url, depth: 1 });
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
        validateStatus: () => true, // Don't throw on 4xx/5xx
      });
      const loadTime = Date.now() - startTime;

      const page = await storage.createCrawledPage({
        sessionId,
        url: current.url,
        statusCode: response.status,
        contentType: response.headers['content-type']?.split(';')[0] || '',
        size: response.data?.length || 0,
        loadTime,
        depth: current.depth,
      });

      totalPages++;
      if (response.status >= 200 && response.status < 300) {
        successfulPages++;
        
        // Extract links if it's HTML and we haven't reached max depth
        if (current.depth < maxDepth && response.headers['content-type']?.includes('text/html')) {
          const links = extractLinks(response.data, startUrl);
          links.forEach(link => {
            if (!visited.has(link) && queue.length + totalPages < maxPages) {
              queue.push({ url: link, depth: current.depth + 1 });
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
  await storage.updateCrawlSession(sessionId, {
    status: finalStatus,
    completedAt: new Date(),
    totalPages,
    successfulPages,
    errorPages,
  });

  // Clean up active crawl tracking
  activeCrawls.delete(sessionId);

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

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const base = new URL(baseUrl);
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      try {
        const url = new URL(href, baseUrl);
        // Only include links from the same domain
        if (url.hostname === base.hostname) {
          links.push(url.toString());
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });
  
  return Array.from(new Set(links)); // Remove duplicates
}

function broadcastProgress(sessionId: number, data: any) {
  // Simplified - no WebSocket broadcasting for now
  console.log(`Progress for session ${sessionId}:`, data);
}
