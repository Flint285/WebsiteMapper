import { useState } from "react";
import { Bug } from "lucide-react";
import CrawlerForm from "@/components/crawler-form";
import CrawlStatus from "@/components/crawl-status";
import ResultsSummary from "@/components/results-summary";
import ResultsTable from "@/components/results-table";

export default function CrawlerPage() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const handleSessionStart = (sessionId: number) => {
    console.log(`Setting current session to: ${sessionId}`);
    setCurrentSessionId(sessionId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-16">
            <div className="flex items-center mb-2 sm:mb-0">
              <Bug className="text-primary text-2xl mr-3 h-8 w-8" />
              <div className="flex flex-col sm:flex-row sm:items-center">
                <h1 className="text-xl font-medium text-foreground">Website Page Crawler</h1>
                <span className="ml-0 sm:ml-3 mt-1 sm:mt-0 px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full w-fit">BETA</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Professional SEO Analysis Tool
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CrawlerForm onSessionStart={handleSessionStart} />
        
        {currentSessionId && (
          <>
            <CrawlStatus sessionId={currentSessionId} />
            <ResultsSummary sessionId={currentSessionId} />
            <ResultsTable sessionId={currentSessionId} />
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-muted-foreground">
            Website Page Crawler - Professional SEO Analysis Tool |{" "}
            <span className="text-primary">Powered by Advanced Web Crawling Technology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
