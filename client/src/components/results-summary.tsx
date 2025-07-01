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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Crawl Results Summary</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="mr-2 h-4 w-4" />
              Share Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalFound.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total URLs Found</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.uniquePages?.toLocaleString() || 0}</div>
            <div className="text-sm text-muted-foreground">Unique Pages</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.successful.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Successful Pages</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600 mb-2">{stats.duplicateUrls?.toLocaleString() || 0}</div>
            <div className="text-sm text-muted-foreground">Duplicate URLs</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.errors.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Error Pages</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.pdfLinks?.toLocaleString() || 0}</div>
            <div className="text-sm text-muted-foreground">PDF Links Found</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{avgLoadTime}s</div>
            <div className="text-sm text-muted-foreground">Avg Load Time</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {stats.uniquePages && stats.totalFound ? ((stats.uniquePages / stats.totalFound) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Content Uniqueness</div>
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
