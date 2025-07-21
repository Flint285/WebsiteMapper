import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const crawlSessions = pgTable("crawl_sessions", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  maxPages: integer("max_pages"),
  maxDepth: integer("max_depth").notNull(),
  status: text("status").notNull(), // 'pending', 'running', 'completed', 'stopped', 'error'
  totalPages: integer("total_pages").default(0),
  successfulPages: integer("successful_pages").default(0),
  errorPages: integer("error_pages").default(0),
  searchText: text("search_text"), // Text to search for on pages
  searchUrl: text("search_url"), // URL pattern to search for in links
  matchingPages: integer("matching_pages").default(0), // Number of pages containing the search text
  urlMatchingPages: integer("url_matching_pages").default(0), // Number of pages containing the search URL
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  currentUrl: text("current_url"),
});

export const crawledPages = pgTable("crawled_pages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  url: text("url").notNull(),
  statusCode: integer("status_code"),
  contentType: text("content_type"),
  size: integer("size"), // in bytes
  loadTime: integer("load_time"), // in milliseconds
  depth: integer("depth").notNull(),
  contentHash: text("content_hash"), // SHA-256 hash of page content for duplicate detection
  containsSearchText: boolean("contains_search_text").default(false), // Whether this page contains the search text
  textMatches: integer("text_matches").default(0), // Number of times the search text appears on this page
  containsSearchUrl: boolean("contains_search_url").default(false), // Whether this page contains links with the search URL
  urlMatches: integer("url_matches").default(0), // Number of links containing the search URL pattern
  discoveredAt: timestamp("discovered_at").defaultNow(),
});

export const insertCrawlSessionSchema = createInsertSchema(crawlSessions).pick({
  url: true,
  maxPages: true,
  maxDepth: true,
  searchText: true,
  searchUrl: true,
});

export const insertCrawledPageSchema = createInsertSchema(crawledPages).pick({
  sessionId: true,
  url: true,
  statusCode: true,
  contentType: true,
  size: true,
  loadTime: true,
  depth: true,
  contentHash: true,
  containsSearchText: true,
  textMatches: true,
  containsSearchUrl: true,
  urlMatches: true,
});

export type InsertCrawlSession = z.infer<typeof insertCrawlSessionSchema>;
export type CrawlSession = typeof crawlSessions.$inferSelect;
export type InsertCrawledPage = z.infer<typeof insertCrawledPageSchema>;
export type CrawledPage = typeof crawledPages.$inferSelect;

// API request/response types
export const startCrawlSchema = z.object({
  url: z.string().url(),
  maxPages: z.number().min(1).max(10000),
  maxDepth: z.number().min(1).max(20),
  searchText: z.string().optional(),
  searchUrl: z.string().optional(),
});

export type StartCrawlRequest = z.infer<typeof startCrawlSchema>;

export type CrawlProgressResponse = {
  session: CrawlSession;
  pages: CrawledPage[];
  stats: {
    totalFound: number;
    successful: number;
    errors: number;
    uniquePages: number;
    duplicateUrls: number;
    pdfLinks: number;
    matchingPages: number; // Pages containing search text
    urlMatchingPages: number; // Pages containing search URL
    statusCodes: Record<string, number>;
    pageTypes: Record<string, number>;
  };
};
