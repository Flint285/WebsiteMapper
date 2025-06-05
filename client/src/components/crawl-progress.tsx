import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CrawlProgressProps {
  sessionId: number;
}

export default function CrawlProgress({ sessionId }: CrawlProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crawl", sessionId],
    refetchInterval: (data) => {
      // Stop refetching if crawl is completed or stopped
      const session = data?.session;
      return session?.status === "running" ? 2000 : false;
    },
  });

  const session = data?.session;
  const stats = data?.stats;

  // Update elapsed time
  useEffect(() => {
    if (session?.status === "running" && session.startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
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
    return null;
  }

  // Don't show progress for completed/stopped sessions
  if (session.status !== "running") {
    return null;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = session.maxPages 
    ? Math.min((session.totalPages / session.maxPages) * 100, 100)
    : 0;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Crawling Progress</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
            >
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
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
          <div className="text-sm text-muted-foreground mb-1">Currently Crawling:</div>
          <div className="text-sm font-mono text-foreground truncate">
            {session.url}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
