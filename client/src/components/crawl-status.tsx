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

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crawl", sessionId],
    refetchInterval: (data) => {
      const session = (data as any)?.session;
      return session?.status === "running" ? 2000 : false;
    },
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

  if (isLoading || !session) {
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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(session.status)}
            <CardTitle>Crawl Status</CardTitle>
            {getStatusBadge(session.status)}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            {session.status === "running" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
              >
                <Square className="mr-1 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pages Discovered</span>
            <span>
              {session.totalPages}{session.maxPages ? ` / ${session.maxPages}` : ""}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-muted p-3 rounded-md">
            <div className="text-muted-foreground">Pages Found</div>
            <div className="text-lg font-semibold text-foreground">{session.totalPages}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <div className="text-muted-foreground">Successful (2xx)</div>
            <div className="text-lg font-semibold text-green-600">{session.successfulPages}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-md">
            <div className="text-muted-foreground">Errors (4xx/5xx)</div>
            <div className="text-lg font-semibold text-red-600">{session.errorPages}</div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <div className="text-sm text-muted-foreground mb-1">Target URL:</div>
          <div className="text-sm font-mono text-foreground truncate">
            {session.url}
          </div>
        </div>

        {session.status === "completed" && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-md">
            <div className="text-sm text-green-800">
              Crawling completed successfully! Found {session.totalPages} pages total.
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