import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Play, Loader2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const crawlFormSchema = z.object({
  url: z.string().min(1, "URL is required").url("Please enter a valid URL (e.g., https://example.com)"),
  maxPages: z.number().min(1, "Must be at least 1 page").max(10000, "Maximum 10,000 pages allowed"),
  maxDepth: z.number().min(1, "Must be at least 1 level deep").max(20, "Maximum 20 levels allowed"),
});

type CrawlFormData = z.infer<typeof crawlFormSchema>;

interface CrawlerFormProps {
  onSessionStart: (sessionId: number) => void;
}

export default function CrawlerForm({ onSessionStart }: CrawlerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CrawlFormData>({
    resolver: zodResolver(crawlFormSchema),
    defaultValues: {
      url: "",
      maxPages: 1000,
      maxDepth: 5,
    },
  });

  const onSubmit = async (data: CrawlFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/crawl/start", data);
      const result = await response.json();
      
      onSessionStart(result.sessionId);
      toast({
        title: "Crawl Started",
        description: `Crawling ${data.url} with max depth ${data.maxDepth}. Progress will appear below.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start crawling. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Analyze Website Pages
            </h2>
            <p className="text-gray-600 text-lg">
              Discover and analyze all pages on a website, including duplicate content detection and SEO insights
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-base font-semibold text-gray-700">Website URL</Label>
              <p className="text-sm text-gray-500">Enter the homepage URL of the website you want to analyze</p>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  {...form.register("url")}
                />
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {form.formState.errors.url && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {form.formState.errors.url.message}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="maxPages" className="text-base font-semibold text-gray-700">Max Pages</Label>
                <p className="text-sm text-gray-500">Limit the number of pages to crawl (1-10,000)</p>
                <Input
                  id="maxPages"
                  type="number"
                  placeholder="1000"
                  min="1"
                  max="10000"
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  {...form.register("maxPages", { valueAsNumber: true })}
                />
                {form.formState.errors.maxPages && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {form.formState.errors.maxPages.message}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="maxDepth" className="text-base font-semibold text-gray-700">Crawl Depth</Label>
                <p className="text-sm text-gray-500">How deep to follow links from the homepage</p>
                <Select
                  value={form.watch("maxDepth")?.toString()}
                  onValueChange={(value) => form.setValue("maxDepth", parseInt(value))}
                >
                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 levels (recommended)</SelectItem>
                    <SelectItem value="5">5 levels (thorough)</SelectItem>
                    <SelectItem value="10">10 levels (deep scan)</SelectItem>
                    <SelectItem value="20">20 levels (comprehensive)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.maxDepth && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {form.formState.errors.maxDepth.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-3 h-5 w-5" />
              )}
              {isSubmitting ? "Starting Crawl..." : "Start Crawling"}
            </Button>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-1 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">How it works:</p>
                  <p>The crawler discovers pages by following links, detects duplicate content using advanced analysis, and provides comprehensive SEO insights including page statistics, status codes, load times, and PDF document discovery.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
