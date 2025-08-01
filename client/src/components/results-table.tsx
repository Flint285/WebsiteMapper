import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, Copy, FileText, File, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ResultsTableProps {
  sessionId: number;
}

export default function ResultsTable({ sessionId }: ResultsTableProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crawl", sessionId],
    refetchInterval: (query) => {
      const session = (query?.state?.data as any)?.session;
      return session?.status === "running" ? 2000 : false;
    },
  });

  const pages = (data as any)?.pages || [];

  // Filter and paginate pages
  let filteredPages = pages.filter((page: any) => {
    const matchesSearch = !searchFilter || page.url.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || page.statusCode?.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Create a map of content hashes to count duplicates
  const hashCounts = new Map();
  pages.forEach((page: any) => {
    if (page.contentHash) {
      hashCounts.set(page.contentHash, (hashCounts.get(page.contentHash) || 0) + 1);
    }
  });

  // Apply unique content filter if enabled
  if (showUniqueOnly) {
    const seenHashes = new Set();
    filteredPages = filteredPages.filter((page: any) => {
      if (!page.contentHash) return true; // Keep pages without hash (errors, etc.)
      if (seenHashes.has(page.contentHash)) return false;
      seenHashes.add(page.contentHash);
      return true;
    });
  }

  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  
  // Reset to first page if current page is beyond available pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when changing page size
  const handlePageSizeChange = (newSize: string) => {
    setItemsPerPage(parseInt(newSize));
    setCurrentPage(1);
  };

  // Reset to first page when toggling unique content filter
  const handleUniqueToggle = (checked: boolean) => {
    setShowUniqueOnly(checked);
    setCurrentPage(1);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied",
        description: "URL has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    if (contentType.includes('html')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (contentType.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
    if (contentType.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (statusCode: number | null) => {
    if (!statusCode) return <Badge variant="secondary">Unknown</Badge>;
    
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{statusCode}</Badge>;
    }
    if (statusCode >= 300 && statusCode < 400) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{statusCode}</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{statusCode}</Badge>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLoadTime = (ms: number | null) => {
    if (!ms) return "-";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
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

  // Don't show table until we have some results
  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pages discovered yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Start a crawl to discover and analyze pages on your website. Results will appear here as they're found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-2 sm:mb-0 text-2xl font-bold text-gray-900">
              Discovered Pages ({filteredPages.length})
            </CardTitle>
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <Switch
                id="unique-only"
                checked={showUniqueOnly}
                onCheckedChange={handleUniqueToggle}
              />
              <Label htmlFor="unique-only" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Unique content only
              </Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Filter URLs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                <SelectValue placeholder="All Status Codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Codes</SelectItem>
                <SelectItem value="200">200 OK</SelectItem>
                <SelectItem value="301">301 Redirect</SelectItem>
                <SelectItem value="404">404 Not Found</SelectItem>
                <SelectItem value="500">500 Server Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
                <SelectItem value="250">250 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPages.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching results</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">
              No pages match your current filters. Try adjusting your search terms or filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchFilter("");
                setStatusFilter("");
                setShowUniqueOnly(false);
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5 min-w-96">URL</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-20">Size</TableHead>
                  <TableHead className="w-24">Load Time</TableHead>
                  <TableHead className="w-20">Content</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPages.map((page: any) => (
                <TableRow key={page.id}>
                  <TableCell className="w-2/5 min-w-96">
                    <div className="flex items-center">
                      {getContentTypeIcon(page.contentType || "")}
                      <span className="font-mono text-sm break-all ml-2">
                        {page.url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(page.statusCode)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.contentType?.includes('html') ? 'HTML' :
                     page.contentType?.includes('pdf') ? 'PDF' :
                     page.contentType?.includes('image') ? 'Image' : 'Other'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(page.size)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLoadTime(page.loadTime)}
                  </TableCell>
                  <TableCell>
                    {page.contentHash && hashCounts.get(page.contentHash) > 1 ? (
                      <Badge variant="secondary" className="text-xs">
                        Duplicate ({hashCounts.get(page.contentHash)})
                      </Badge>
                    ) : (
                      page.contentHash ? (
                        <Badge variant="outline" className="text-xs">
                          Unique
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(page.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyUrl(page.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredPages.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPages.length)} of{" "}
              {filteredPages.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
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
