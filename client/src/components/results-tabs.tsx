import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon } from "lucide-react";
import ResultsTable from "./results-table";
import { LinksTable } from "./links-table";
import { useQuery } from "@tanstack/react-query";

interface ResultsTabsProps {
  sessionId: number;
}

export function ResultsTabs({ sessionId }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState("pages");

  // Get basic stats for tab badges
  const { data: session } = useQuery({
    queryKey: [`/api/crawl/${sessionId}`],
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.session?.status === 'running' ? 2000 : false;
    },
  });

  const { data: linksResponse } = useQuery({
    queryKey: [`/api/crawl/${sessionId}/links`],
    enabled: !!sessionId,
  });

  const links = Array.isArray(linksResponse) ? linksResponse : [];
  const pages = (session as any)?.session?.totalPages || 0;

  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-6 pb-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 rounded-xl p-1">
            <TabsTrigger 
              value="pages" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              <span className="font-semibold">Discovered Pages</span>
              {pages > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                  {pages.toLocaleString()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="links" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="font-semibold">Discovered Links</span>
              {links.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-cyan-100 text-cyan-700">
                  {links.length.toLocaleString()}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pages" className="p-0 m-0">
          <div className="p-6 pt-0">
            <ResultsTable sessionId={sessionId} />
          </div>
        </TabsContent>

        <TabsContent value="links" className="p-0 m-0">
          <div className="p-6 pt-0">
            <LinksTable sessionId={sessionId} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}