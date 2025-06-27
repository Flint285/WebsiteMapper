import { crawlSessions, crawledPages, type CrawlSession, type InsertCrawlSession, type CrawledPage, type InsertCrawledPage } from "@shared/schema";

export interface IStorage {
  // Crawl sessions
  createCrawlSession(session: InsertCrawlSession): Promise<CrawlSession>;
  getCrawlSession(id: number): Promise<CrawlSession | undefined>;
  updateCrawlSession(id: number, updates: Partial<CrawlSession>): Promise<CrawlSession | undefined>;
  
  // Crawled pages
  createCrawledPage(page: InsertCrawledPage): Promise<CrawledPage>;
  getCrawledPagesBySession(sessionId: number): Promise<CrawledPage[]>;
  getCrawledPageCount(sessionId: number): Promise<number>;
  getPagesBySessionAndStatus(sessionId: number, statusCode?: number): Promise<CrawledPage[]>;
  
  // Duplicate content detection
  getUniqueContentHashes(sessionId: number): Promise<string[]>;
  getPagesByContentHash(sessionId: number, contentHash: string): Promise<CrawledPage[]>;
  
  // Session tracking
  setCurrentUrl(sessionId: number, url: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private crawlSessions: Map<number, CrawlSession>;
  private crawledPages: Map<number, CrawledPage>;
  private currentSessionId: number;
  private currentPageId: number;

  constructor() {
    this.crawlSessions = new Map();
    this.crawledPages = new Map();
    this.currentSessionId = 1;
    this.currentPageId = 1;
  }

  async createCrawlSession(insertSession: InsertCrawlSession): Promise<CrawlSession> {
    const id = this.currentSessionId++;
    const session: CrawlSession = {
      ...insertSession,
      id,
      status: 'pending',
      totalPages: 0,
      successfulPages: 0,
      errorPages: 0,
      startedAt: new Date(),
      completedAt: null,
      error: null,
      maxPages: insertSession.maxPages || null,
      currentUrl: null,
    };
    this.crawlSessions.set(id, session);
    return session;
  }

  async getCrawlSession(id: number): Promise<CrawlSession | undefined> {
    return this.crawlSessions.get(id);
  }

  async updateCrawlSession(id: number, updates: Partial<CrawlSession>): Promise<CrawlSession | undefined> {
    const session = this.crawlSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.crawlSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createCrawledPage(insertPage: InsertCrawledPage): Promise<CrawledPage> {
    const id = this.currentPageId++;
    const page: CrawledPage = {
      ...insertPage,
      id,
      discoveredAt: new Date(),
      size: insertPage.size || null,
      statusCode: insertPage.statusCode || null,
      contentType: insertPage.contentType || null,
      loadTime: insertPage.loadTime || null,
    };
    this.crawledPages.set(id, page);
    return page;
  }

  async getCrawledPagesBySession(sessionId: number): Promise<CrawledPage[]> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId
    );
  }

  async getCrawledPageCount(sessionId: number): Promise<number> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId
    ).length;
  }

  async getPagesBySessionAndStatus(sessionId: number, statusCode?: number): Promise<CrawledPage[]> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && (!statusCode || page.statusCode === statusCode)
    );
  }

  async getUniqueContentHashes(sessionId: number): Promise<string[]> {
    const pages = Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && page.contentHash
    );
    const uniqueHashes = new Set(pages.map(page => page.contentHash!));
    return Array.from(uniqueHashes);
  }

  async getPagesByContentHash(sessionId: number, contentHash: string): Promise<CrawledPage[]> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && page.contentHash === contentHash
    );
  }

  async setCurrentUrl(sessionId: number, url: string): Promise<void> {
    const session = this.crawlSessions.get(sessionId);
    if (session) {
      session.currentUrl = url;
      this.crawlSessions.set(sessionId, session);
    }
  }
}

export const storage = new MemStorage();
