import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bug, Search } from "lucide-react";
import CrawlerForm from "@/components/crawler-form";
import CrawlStatus from "@/components/crawl-status";
import ResultsSummary from "@/components/results-summary";
import ResultsTable from "@/components/results-table";
import { LinksTable } from "@/components/links-table";

export default function CrawlerPage() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  // Auto-detect the most recent session
  const { data: latestSession } = useQuery({
    queryKey: ['/api/crawl/latest'],
    retry: false,
  });
  
  useEffect(() => {
    if (latestSession && (latestSession as any)?.sessionId && !currentSessionId) {
      const sessionId = (latestSession as any).sessionId;
      console.log(`Auto-detecting latest session: ${sessionId}`);
      setCurrentSessionId(sessionId);
    }
  }, [latestSession, currentSessionId]);

  // Add manual session switcher button for session 2
  const handleSwitchToSession2 = () => {
    console.log('Manually switching to session 2');
    setCurrentSessionId(2);
  };
  
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
        
        {/* Hidden debug panel - only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-4 text-center">
            <button 
              onClick={handleSwitchToSession2}
              className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
            >
              Dev: View Session 2
            </button>
            {currentSessionId && (
              <span className="ml-3 text-xs text-gray-500">
                Session: {currentSessionId}
              </span>
            )}
          </div>
        )}
        
        {currentSessionId ? (
          <>
            <CrawlStatus sessionId={currentSessionId} />
            <ResultsSummary sessionId={currentSessionId} />
            <ResultsTable sessionId={currentSessionId} />
            <LinksTable sessionId={currentSessionId} />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start Crawling</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a website URL above to begin discovering pages, analyzing content, and generating comprehensive SEO insights.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Duplicate Detection
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Link Discovery
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                SEO Analysis
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Real-time Progress
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 rounded-lg">
                <Bug className="text-white h-5 w-5" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                WebsiteMapper
              </span>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Professional SEO Analysis & Web Crawling Platform
              </div>
              <div className="text-xs text-gray-500">
                Advanced duplicate content detection • PDF discovery • Real-time insights
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
