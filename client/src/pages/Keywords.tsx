import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface KeywordCluster {
  cluster: string;
  keywords: string[];
}

export default function Keywords() {
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());

  const handleClusterKeywords = async () => {
    if (!keywords.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/keyword_clustering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.split('\n').filter(k => k.trim()) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cluster keywords');
      }
      
      const data = await response.json();
      setClusters(data);
      setExpandedClusters(new Set([0]));
      
      // Invalidate activities cache to refresh activity feed
      queryClient.invalidateQueries({ queryKey: ['/api/user/activities'] });
    } catch (error) {
      console.error('Error clustering keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCluster = (index: number) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClusters(newExpanded);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">AI Keyword Clustering</h1>
            <p className="text-muted-foreground">
              Group keywords into thematic clusters automatically
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (one per line)</Label>
                    <Textarea
                      id="keywords"
                      data-testid="textarea-keywords"
                      placeholder="seo tools&#10;best seo software&#10;keyword research tool&#10;content optimization&#10;seo analysis&#10;..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    data-testid="button-cluster"
                    onClick={handleClusterKeywords}
                    disabled={loading || !keywords.trim()}
                    className="w-full gradient-primary animate-gradient"
                  >
                    Cluster Keywords
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              {loading && <LoadingSpinner />}

              {!loading && clusters.length > 0 && (
                <div className="space-y-4" data-testid="clusters-result">
                  <h2 className="text-xl font-semibold">
                    {clusters.length} Clusters Found
                  </h2>
                  {clusters.map((cluster, index) => (
                    <div
                      key={index}
                      className="rounded-xl border bg-card shadow-sm"
                    >
                      <button
                        onClick={() => toggleCluster(index)}
                        className="flex w-full items-center justify-between p-4 text-left hover-elevate"
                        data-testid={`cluster-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          {expandedClusters.has(index) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <h3 className="font-semibold">{cluster.cluster}</h3>
                            <p className="text-sm text-muted-foreground">
                              {cluster.keywords.length} keywords
                            </p>
                          </div>
                        </div>
                      </button>
                      {expandedClusters.has(index) && (
                        <div className="border-t p-4">
                          <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map((keyword, keywordIndex) => (
                              <span
                                key={keywordIndex}
                                className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
