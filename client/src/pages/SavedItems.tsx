import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Trash2, FileText, Search } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SavedItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  data: any;
  createdAt: string;
}

export default function SavedItems() {
  const { toast } = useToast();

  const { data: savedItems = [], isLoading } = useQuery<SavedItem[]>({
    queryKey: ['/api/saved'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      toast({
        title: "Deleted",
        description: "Saved item has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'keyword_cluster':
        return <Search className="h-5 w-5" />;
      case 'content_analysis':
        return <FileText className="h-5 w-5" />;
      default:
        return <Bookmark className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword_cluster':
        return 'Keyword Cluster';
      case 'content_analysis':
        return 'Content Analysis';
      default:
        return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Saved Items</h1>
            <p className="text-muted-foreground">
              View and manage your saved analyses and keyword clusters
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12" data-testid="loading-state">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading saved items...</p>
              </div>
            </div>
          ) : savedItems.length === 0 ? (
            <Card data-testid="empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bookmark className="h-16 w-16 text-muted-foreground mb-4" data-testid="icon-empty" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">No saved items yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md" data-testid="text-empty-description">
                  Start saving your favorite keyword clusters and content analyses from the Keywords and Content pages.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="saved-items-grid">
              {savedItems.map((item) => (
                <Card key={item.id} className="hover-elevate" data-testid={`card-saved-${item.id}`}>
                  <CardHeader className="gap-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary" data-testid={`icon-${item.type}`}>
                          {getIcon(item.type)}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1" data-testid={`text-type-${item.id}`}>
                            {getTypeLabel(item.type)}
                          </div>
                          <CardTitle className="text-base line-clamp-2" data-testid={`text-title-${item.id}`}>
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.type === 'keyword_cluster' && item.data?.keywords && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {item.data.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              data-testid={`keyword-chip-${item.id}-${idx}`}
                            >
                              {keyword}
                            </span>
                          ))}
                          {item.data.keywords.length > 5 && (
                            <span 
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              data-testid={`keyword-more-${item.id}`}
                            >
                              +{item.data.keywords.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {item.type === 'content_analysis' && (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Word Count</p>
                            <p className="font-semibold" data-testid={`metric-wordcount-${item.id}`}>
                              {item.data?.wordCount || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Keyword Density</p>
                            <p className="font-semibold" data-testid={`metric-density-${item.id}`}>
                              {item.data?.keywordDensity || 'N/A'}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3" data-testid={`text-saved-time-${item.id}`}>
                      Saved {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
