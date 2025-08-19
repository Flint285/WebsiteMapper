import { crawlSessions, crawledPages, discoveredLinks, type CrawlSession, type InsertCrawlSession, type CrawledPage, type InsertCrawledPage, type DiscoveredLink, type InsertDiscoveredLink } from "@shared/schema";

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
  
  // PDF link tracking
  addPdfLink(sessionId: number, url: string): Promise<void>;
  getPdfLinkCount(sessionId: number): Promise<number>;
  getPdfLinks(sessionId: number): Promise<string[]>;
  
  // Text search functionality
  getPagesBySearchMatch(sessionId: number, hasSearchText?: boolean): Promise<CrawledPage[]>;
  getSearchMatchCount(sessionId: number): Promise<number>;
  
  // URL search functionality
  getPagesByUrlMatch(sessionId: number, hasSearchUrl?: boolean): Promise<CrawledPage[]>;
  getUrlMatchCount(sessionId: number): Promise<number>;
  
  // Link discovery functionality
  addDiscoveredLink(link: InsertDiscoveredLink): Promise<DiscoveredLink>;
  getDiscoveredLinks(sessionId: number): Promise<DiscoveredLink[]>;
  getLinkCount(sessionId: number): Promise<number>;
  getInternalLinkCount(sessionId: number): Promise<number>;
  getExternalLinkCount(sessionId: number): Promise<number>;
  
  // Session management
  getLatestSession(): Promise<CrawlSession | undefined>;
}

export class MemStorage implements IStorage {
  private crawlSessions: Map<number, CrawlSession>;
  private crawledPages: Map<number, CrawledPage>;
  private discoveredLinks: Map<number, DiscoveredLink>;
  private pdfLinks: Map<number, Set<string>>; // sessionId -> set of PDF URLs
  private currentSessionId: number;
  private currentPageId: number;
  private currentLinkId: number;

  constructor() {
    this.crawlSessions = new Map();
    this.crawledPages = new Map();
    this.discoveredLinks = new Map();
    this.pdfLinks = new Map();
    this.currentSessionId = 1;
    this.currentPageId = 1;
    this.currentLinkId = 1;
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
      matchingPages: 0,
      urlMatchingPages: 0,
      startedAt: new Date(),
      completedAt: null,
      error: null,
      maxPages: insertSession.maxPages || null,
      searchText: insertSession.searchText || null,
      searchUrl: insertSession.searchUrl || null,
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
      id,
      url: insertPage.url,
      sessionId: insertPage.sessionId,
      statusCode: insertPage.statusCode || null,
      contentType: insertPage.contentType || null,
      size: insertPage.size || null,
      loadTime: insertPage.loadTime || null,
      depth: insertPage.depth,
      contentHash: insertPage.contentHash ?? null,
      containsSearchText: insertPage.containsSearchText ?? false,
      textMatches: insertPage.textMatches ?? 0,
      containsSearchUrl: insertPage.containsSearchUrl ?? false,
      urlMatches: insertPage.urlMatches ?? 0,
      discoveredAt: new Date(),
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

  async addPdfLink(sessionId: number, url: string): Promise<void> {
    if (!this.pdfLinks.has(sessionId)) {
      this.pdfLinks.set(sessionId, new Set());
    }
    this.pdfLinks.get(sessionId)!.add(url);
  }

  async getPdfLinkCount(sessionId: number): Promise<number> {
    const pdfSet = this.pdfLinks.get(sessionId);
    return pdfSet ? pdfSet.size : 0;
  }

  async getPdfLinks(sessionId: number): Promise<string[]> {
    const pdfSet = this.pdfLinks.get(sessionId);
    return pdfSet ? Array.from(pdfSet) : [];
  }

  async getPagesBySearchMatch(sessionId: number, hasSearchText?: boolean): Promise<CrawledPage[]> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && 
      (hasSearchText === undefined || page.containsSearchText === hasSearchText)
    );
  }

  async getSearchMatchCount(sessionId: number): Promise<number> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && page.containsSearchText
    ).length;
  }

  async getPagesByUrlMatch(sessionId: number, hasSearchUrl?: boolean): Promise<CrawledPage[]> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && 
                (hasSearchUrl === undefined || page.containsSearchUrl === hasSearchUrl)
    );
  }

  async getUrlMatchCount(sessionId: number): Promise<number> {
    return Array.from(this.crawledPages.values()).filter(
      (page) => page.sessionId === sessionId && page.containsSearchUrl
    ).length;
  }

  async addDiscoveredLink(insertLink: InsertDiscoveredLink): Promise<DiscoveredLink> {
    const id = this.currentLinkId++;
    const link: DiscoveredLink = {
      ...insertLink,
      id,
      linkText: insertLink.linkText || null,
      discoveredAt: new Date(),
    };
    this.discoveredLinks.set(id, link);
    return link;
  }

  async getDiscoveredLinks(sessionId: number): Promise<DiscoveredLink[]> {
    return Array.from(this.discoveredLinks.values()).filter(link => 
      link.sessionId === sessionId
    );
  }

  async getLinkCount(sessionId: number): Promise<number> {
    const links = Array.from(this.discoveredLinks.values()).filter(link => 
      link.sessionId === sessionId
    );
    return links.length;
  }

  async getInternalLinkCount(sessionId: number): Promise<number> {
    const links = Array.from(this.discoveredLinks.values()).filter(link => 
      link.sessionId === sessionId && link.isInternal === true
    );
    return links.length;
  }

  async getExternalLinkCount(sessionId: number): Promise<number> {
    const links = Array.from(this.discoveredLinks.values()).filter(link => 
      link.sessionId === sessionId && link.isInternal === false
    );
    return links.length;
  }

  async getLatestSession(): Promise<CrawlSession | undefined> {
    const sessions = Array.from(this.crawlSessions.values());
    if (sessions.length === 0) return undefined;
    
    // Return the session with the highest ID (most recent)
    return sessions.reduce((latest, current) => 
      current.id > latest.id ? current : latest
    );
  }
}

export const storage = new MemStorage();
