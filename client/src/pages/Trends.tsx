import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Trash2, Search, Lightbulb, BarChart3 } from "lucide-react";

const searchFormSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  industry: z.string().optional(),
  location: z.string().default("global"),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface TrendSearch {
  id: string;
  keyword: string;
  industry: string | null;
  location: string;
  currentVolume: number;
  trend: string;
  competitionLevel: string;
  createdAt: string;
  lastCheckedAt: string | null;
}

interface TrendData {
  id: string;
  keyword: string;
  industry: string | null;
  location: string;
  currentVolume: number;
  trend: string;
  competitionLevel: string;
  createdAt: string;
  lastCheckedAt: string | null;
  history: Array<{
    date: string;
    volume: number;
  }>;
}

interface TopicSuggestion {
  topic: string;
  relevance: number;
  searchVolume: number;
  difficulty: string;
}

export default function Trends() {
  const { toast } = useToast();
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [suggestionsKeyword, setSuggestionsKeyword] = useState("");

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      keyword: "",
      industry: "",
      location: "global",
    },
  });

  const { data: searches = [] } = useQuery<TrendSearch[]>({
    queryKey: ["/api/trends"],
  });

  const { data: trendData } = useQuery<TrendData>({
    queryKey: ["/api/trends", selectedTrendId],
    enabled: !!selectedTrendId,
  });

  const suggestionsMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const res = await apiRequest("POST", "/api/trends/suggestions", { keyword });
      return res.json();
    },
  });

  const suggestionsData = suggestionsMutation.data as { suggestions: TopicSuggestion[] } | undefined;
  const isLoadingSuggestions = suggestionsMutation.isPending;

  const searchMutation = useMutation({
    mutationFn: async (data: SearchFormValues) => {
      toast({ title: "Analyzing trend...", description: "Please wait while we gather trend data." });
      return apiRequest("POST", "/api/trends/search", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      form.reset();
      toast({
        title: "Trend Analysis Complete",
        description: "The trend data has been successfully analyzed.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to analyze trend. Please try again.",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (id: string) => {
      toast({ title: "Refreshing trend data..." });
      return apiRequest("POST", `/api/trends/refresh/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trends", selectedTrendId] });
      toast({
        title: "Trend Refreshed",
        description: "The trend data has been updated with the latest information.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh trend data. Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/trends/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      if (selectedTrendId) {
        setSelectedTrendId(null);
      }
      toast({
        title: "Trend Search Deleted",
        description: "The trend search has been removed.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete trend search. Please try again.",
      });
    },
  });

  const getTrendIcon = (trend: string) => {
    if (trend === "rising") return <TrendingUp className="h-4 w-4" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "rising") return "text-green-500";
    if (trend === "declining") return "text-red-500";
    return "text-muted-foreground";
  };

  const getCompetitionColor = (level: string) => {
    if (level === "low") return "bg-green-500/20 text-green-500 border-green-500/50";
    if (level === "medium") return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    return "bg-red-500/20 text-red-500 border-red-500/50";
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "easy") return "bg-green-500/20 text-green-500 border-green-500/50";
    if (difficulty === "medium") return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    return "bg-red-500/20 text-red-500 border-red-500/50";
  };

  const onSubmit = (data: SearchFormValues) => {
    searchMutation.mutate(data);
  };

  const chartData = trendData?.history.map(point => ({
    date: new Date(point.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    volume: point.volume,
  })) || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-2" data-testid="heading-trends">
              Trend & Topic Discovery
            </h1>
            <p className="text-muted-foreground">
              Discover trending keywords and topics with AI-powered suggestions
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Trends</CardTitle>
              <CardDescription>Enter a keyword to analyze search volume trends</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="keyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keyword</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., content marketing"
                              {...field}
                              data-testid="input-keyword"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., technology"
                              {...field}
                              data-testid="input-industry"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="global"
                              {...field}
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searchMutation.isPending}
                    data-testid="button-search"
                  >
                    {searchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Analyze Trend
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Trend Searches ({searches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {searches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No trend searches yet
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {searches.map((search) => (
                        <Card
                          key={search.id}
                          className={`cursor-pointer hover-elevate active-elevate-2 ${
                            selectedTrendId === search.id ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedTrendId(search.id)}
                          data-testid={`card-trend-${search.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" data-testid={`text-keyword-${search.id}`}>
                                  {search.keyword}
                                </p>
                                {search.industry && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {search.industry}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <div className={`flex items-center gap-1 ${getTrendColor(search.trend)}`}>
                                    {getTrendIcon(search.trend)}
                                    <span className="text-xs capitalize">{search.trend}</span>
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${getCompetitionColor(search.competitionLevel)}`}>
                                    {search.competitionLevel}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium">
                                  {search.currentVolume.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  vol/mo
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedTrendId && trendData ? (
                <Tabs defaultValue="overview" data-testid="tabs-trend-details">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                      <TabsTrigger value="suggestions" data-testid="tab-suggestions">Topic Suggestions</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshMutation.mutate(selectedTrendId)}
                        disabled={refreshMutation.isPending}
                        data-testid="button-refresh"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(selectedTrendId)}
                        disabled={deleteMutation.isPending}
                        data-testid="button-delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Current Volume</p>
                          <p className="text-2xl font-bold mt-1" data-testid="text-current-volume">
                            {trendData.currentVolume.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">searches/month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Trend</p>
                          <div className={`flex items-center gap-2 mt-1 ${getTrendColor(trendData.trend)}`}>
                            {getTrendIcon(trendData.trend)}
                            <p className="text-2xl font-bold capitalize" data-testid="text-trend">
                              {trendData.trend}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Competition</p>
                          <p className="text-2xl font-bold mt-1 capitalize" data-testid="text-competition">
                            {trendData.competitionLevel}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-2xl font-bold mt-1 capitalize" data-testid="text-location">
                            {trendData.location}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Search Volume Trend (12 Months)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              className="text-xs"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                              className="text-xs"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "hsl(var(--foreground))" }}
                              formatter={(value: number) => [value.toLocaleString(), "Volume"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="volume"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="suggestions" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          AI-Powered Topic Suggestions
                        </CardTitle>
                        <CardDescription>
                          Related topics and content ideas for "{trendData.keyword}"
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          if (!suggestionsKeyword || suggestionsKeyword !== trendData.keyword) {
                            return (
                              <div className="text-center py-8">
                                <Button
                                  onClick={() => {
                                    setSuggestionsKeyword(trendData.keyword);
                                    suggestionsMutation.mutate(trendData.keyword);
                                  }}
                                  data-testid="button-generate-suggestions"
                                >
                                  <Lightbulb className="mr-2 h-4 w-4" />
                                  Generate Suggestions
                                </Button>
                              </div>
                            );
                          }
                          
                          if (isLoadingSuggestions) {
                            return (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            );
                          }
                          
                          if (suggestionsData?.suggestions && suggestionsData.suggestions.length > 0) {
                            return (
                              <div className="space-y-2">
                                {suggestionsData.suggestions.map((suggestion, idx) => (
                                  <Card key={idx} data-testid={`suggestion-${idx}`}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm" data-testid={`suggestion-topic-${idx}`}>
                                            {suggestion.topic}
                                          </p>
                                          <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                              Relevance: {suggestion.relevance}%
                                            </Badge>
                                            <Badge variant="outline" className={`text-xs ${getDifficultyColor(suggestion.difficulty)}`}>
                                              {suggestion.difficulty}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {suggestion.searchVolume.toLocaleString()} vol/mo
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            );
                          }
                          
                          return (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">No suggestions available</p>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Select a Trend</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a trend search from the list to view detailed analytics
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
