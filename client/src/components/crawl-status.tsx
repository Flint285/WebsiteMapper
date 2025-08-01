import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Square, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CrawlStatusProps {
  sessionId: number;
}

export default function CrawlStatus({ sessionId }: CrawlStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/crawl", sessionId],
    refetchInterval: (query) => {
      const session = (query?.state?.data as any)?.session;
      return session?.status === "running" ? 1000 : false;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const session = (data as any)?.session;
  const stats = (data as any)?.stats;

  // Update elapsed time
  useEffect(() => {
    if (session?.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const updateTime = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      };
      
      updateTime();
      
      if (session.status === "running") {
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [session?.status, session?.startedAt]);

  const handleStop = async () => {
    try {
      await apiRequest("POST", `/api/crawl/${sessionId}/stop`);
      toast({
        title: "Crawl Stopped",
        description: "The crawling process has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop the crawl.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading crawl status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Session {sessionId} not found or still loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "stopped":
        return <Badge className="bg-orange-100 text-orange-800">Stopped</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "stopped":
        return <Square className="h-5 w-5 text-orange-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const progress = session.maxPages 
    ? Math.min((session.totalPages / session.maxPages) * 100, 100)
    : Math.min((session.totalPages / 1000) * 100, 100);

  return (
    <Card className="mb-8 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {getStatusIcon(session.status)}
            <CardTitle className="text-2xl font-bold text-gray-900">Crawl Status</CardTitle>
            {getStatusBadge(session.status)}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <Clock className="mr-2 h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-700">{formatTime(elapsedTime)}</span>
            </div>
            {session.status === "running" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                className="shadow-md"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Crawl
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
            <span>Discovery Progress</span>
            <span>
              {session.totalPages}{session.maxPages ? ` / ${session.maxPages.toLocaleString()}` : ""} pages
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-600 mb-1">Pages Found</div>
            <div className="text-2xl font-bold text-gray-700">{session.totalPages.toLocaleString()}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-sm font-medium text-green-600 mb-1">Successful (2xx)</div>
            <div className="text-2xl font-bold text-green-700">{session.successfulPages.toLocaleString()}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-sm font-medium text-red-600 mb-1">Errors (4xx/5xx)</div>
            <div className="text-2xl font-bold text-red-700">{session.errorPages.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <div className="text-sm text-muted-foreground mb-1">Target URL:</div>
          <div className="text-sm font-mono text-foreground truncate">
            {session.url}
          </div>
        </div>

        {session.status === "running" && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <div className="text-sm text-blue-800 font-medium mb-1">Currently Crawling:</div>
            <div className="text-xs font-mono text-blue-700 truncate">
              {session.currentUrl || "Initializing..."}
            </div>
          </div>
        )}

        {session.status === "completed" && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-md">
            <div className="text-sm text-green-800 font-medium">
              ✅ Crawling completed successfully! Found {session.totalPages} pages total.
            </div>
            <div className="text-xs text-green-700 mt-1">
              Completed at {session.completedAt ? new Date(session.completedAt).toLocaleTimeString() : 'Unknown time'}
            </div>
          </div>
        )}

        {session.status === "stopped" && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
            <div className="text-sm text-orange-800 font-medium">
              ⏸️ Crawling stopped by user. Found {session.totalPages} pages before stopping.
            </div>
          </div>
        )}

        {session.status === "error" && session.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <div className="text-sm text-red-800">
              Error: {session.error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}