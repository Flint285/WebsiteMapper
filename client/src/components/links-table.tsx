import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Search, Download, Filter } from "lucide-react";
import { DiscoveredLink } from "@shared/schema";

interface LinksTableProps {
  sessionId: number;
}

export function LinksTable({ sessionId }: LinksTableProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { data: links, isLoading, error } = useQuery<DiscoveredLink[]>({
    queryKey: ['/api/crawl', sessionId, 'links'],
    enabled: !!sessionId,
    retry: (failureCount, error: any) => {
      // Don't retry if session is not found
      if (error?.message?.includes('404') || error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });





  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, typeFilter]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !links) {
    return (
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">
            Error loading links: {error?.toString() || 'Unknown error'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This may happen if the crawl session expired or the server restarted.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Links Found</h3>
          <p className="text-gray-500">
            No links were discovered during the crawl. This might happen if the pages contain no links or only non-HTML content was crawled.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter links based on search and type filters
  const filteredLinks = links.filter(link => {
    const matchesSearch = searchFilter === "" || 
      link.targetUrl.toLowerCase().includes(searchFilter.toLowerCase()) ||
      link.sourceUrl.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (link.linkText && link.linkText.toLowerCase().includes(searchFilter.toLowerCase()));
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "internal" && link.isInternal) ||
      (typeFilter === "external" && !link.isInternal);
    
    return matchesSearch && matchesType;
  });



  // Pagination
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

  const handlePageSizeChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const exportLinks = () => {
    const csvContent = [
      "Source URL,Target URL,Link Text,Type",
      ...filteredLinks.map(link => 
        `"${link.sourceUrl}","${link.targetUrl}","${link.linkText || ''}","${link.isInternal ? 'Internal' : 'External'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'discovered-links.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const internalCount = links.filter(l => l.isInternal).length;
  const externalCount = links.filter(l => !l.isInternal).length;

  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Discovered Links ({links.length})
            </CardTitle>
            <p className="text-gray-600 mt-1">
              {internalCount} internal • {externalCount} external
              {filteredLinks.length !== links.length && (
                <span className="text-blue-600"> • {filteredLinks.length} filtered</span>
              )}
            </p>
          </div>
          <Button onClick={exportLinks} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="relative md:col-span-2">
            <Input
              placeholder="Search links, text, or source..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Links</SelectItem>
              <SelectItem value="internal">Internal Links</SelectItem>
              <SelectItem value="external">External Links</SelectItem>
            </SelectContent>
          </Select>
          <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="250">250 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Target URL</TableHead>
                <TableHead className="font-semibold">Link Text</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLinks.map((link) => (
                <TableRow key={link.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-sm max-w-xs">
                    <div className="truncate" title={link.sourceUrl}>
                      {link.sourceUrl}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-mono text-sm" title={link.targetUrl}>
                        {link.targetUrl}
                      </div>
                      {!link.isInternal && (
                        <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={link.linkText || ''}>
                      {link.linkText || <span className="text-gray-400 italic">No text</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={link.isInternal ? "default" : "secondary"}
                      className={link.isInternal ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                    >
                      {link.isInternal ? "Internal" : "External"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLinks.length)} of {filteredLinks.length} links
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}