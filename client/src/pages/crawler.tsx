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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 sm:py-0 sm:h-20">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl mr-4">
                <Bug className="text-white h-8 w-8" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  WebsiteMapper
                </h1>
                <span className="ml-0 sm:ml-3 mt-1 sm:mt-0 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full w-fit border border-orange-200">
                  BETA
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <div className="text-sm font-medium text-gray-700">Professional SEO Analysis</div>
              <div className="text-xs text-gray-500">Advanced web crawling & content insights</div>
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
