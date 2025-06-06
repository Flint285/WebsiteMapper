import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const crawlFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  maxPages: z.number().min(1).max(10000),
  maxDepth: z.number().min(1).max(20),
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
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-medium text-foreground mb-2 text-center">
            Analyze Website Pages
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Enter a website URL to crawl and count all publicly accessible pages
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL</Label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  className="pl-12"
                  {...form.register("url")}
                />
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
              {form.formState.errors.url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="maxPages">Max Pages (Optional)</Label>
                <Input
                  id="maxPages"
                  type="number"
                  placeholder="1000"
                  min="1"
                  max="10000"
                  {...form.register("maxPages", { valueAsNumber: true })}
                />
                {form.formState.errors.maxPages && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.maxPages.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="maxDepth">Max Depth</Label>
                <Select
                  value={form.watch("maxDepth")?.toString()}
                  onValueChange={(value) => form.setValue("maxDepth", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 levels</SelectItem>
                    <SelectItem value="5">5 levels</SelectItem>
                    <SelectItem value="10">10 levels</SelectItem>
                    <SelectItem value="20">20 levels</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.maxDepth && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.maxDepth.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              <Play className="mr-2 h-4 w-4" />
              {isSubmitting ? "Starting Crawl..." : "Start Crawling"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
