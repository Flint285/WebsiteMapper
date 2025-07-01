import { useQuery } from "@tanstack/react-query";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ResultsSummaryProps {
  sessionId: number;
}

export default function ResultsSummary({ sessionId }: ResultsSummaryProps) {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crawl", sessionId],
    refetchInterval: (query) => {
      const session = (query?.state?.data as any)?.session;
      return session?.status === "running" ? 2000 : false;
    },
  });

  const session = (data as any)?.session;
  const stats = (data as any)?.stats;

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/crawl/${sessionId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crawl-results.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Complete",
          description: "Results have been downloaded as CSV.",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Report URL has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !session || !stats) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show summary until we have some results
  if (stats.totalFound === 0) {
    return null;
  }

  const pages = (data as any)?.pages || [];
  const avgLoadTime = pages.length > 0 
    ? (pages.reduce((sum: number, page: any) => sum + (page.loadTime || 0), 0) / pages.length / 1000).toFixed(1)
    : "0.0";

  return (
    <Card className="mb-8 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-gray-900">Crawl Results Summary</CardTitle>
          <div className="flex space-x-3">
            <Button onClick={handleExport} className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-md">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleShare} className="border-2 border-gray-300 hover:border-gray-400 shadow-md">
              <Share className="mr-2 h-4 w-4" />
              Share Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-gray-700 mb-2">{stats.totalFound.toLocaleString()}</div>
            <div className="text-sm font-medium text-gray-600">Total URLs Found</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-3xl font-bold text-blue-700 mb-2">{stats.uniquePages?.toLocaleString() || 0}</div>
            <div className="text-sm font-medium text-blue-600">Unique Pages</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-3xl font-bold text-green-700 mb-2">{stats.successful.toLocaleString()}</div>
            <div className="text-sm font-medium text-green-600">Successful Pages</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-3xl font-bold text-amber-700 mb-2">{stats.duplicateUrls?.toLocaleString() || 0}</div>
            <div className="text-sm font-medium text-amber-600">Duplicate URLs</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-3xl font-bold text-red-700 mb-2">{stats.errors.toLocaleString()}</div>
            <div className="text-sm font-medium text-red-600">Error Pages</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 shadow-sm">
            <div className="text-3xl font-bold text-purple-700 mb-2">{stats.pdfLinks?.toLocaleString() || 0}</div>
            <div className="text-sm font-medium text-purple-600">PDF Links Found</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200 shadow-sm">
            <div className="text-3xl font-bold text-orange-700 mb-2">{avgLoadTime}s</div>
            <div className="text-sm font-medium text-orange-600">Avg Load Time</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl border border-teal-200 shadow-sm">
            <div className="text-3xl font-bold text-teal-700 mb-2">
              {stats.uniquePages && stats.totalFound ? ((stats.uniquePages / stats.totalFound) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm font-medium text-teal-600">Content Uniqueness</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Status Code Distribution</h4>
            <div className="space-y-2">
              {Object.entries(stats.statusCodes).map(([code, count]) => (
                <div key={code} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        code.startsWith('2') ? 'bg-green-500' :
                        code.startsWith('3') ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                    />
                    <span className="text-sm">
                      {code} {
                        code === '200' ? 'OK' :
                        code === '301' ? 'Redirect' :
                        code === '404' ? 'Not Found' :
                        code === '500' ? 'Server Error' :
                        ''
                      }
                    </span>
                  </div>
                  <span className="text-sm font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-3">Page Types</h4>
            <div className="space-y-2">
              {Object.entries(stats.pageTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{type} Pages</span>
                  <span className="text-sm font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
