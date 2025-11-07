import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Trash2, Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { KeywordWithRankData } from "@shared/schema";

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  targetUrl: z.string().url("Must be a valid URL"),
  searchEngine: z.enum(["google", "bing", "yahoo"]).default("google"),
  location: z.string().optional(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
});

type AddKeywordForm = z.infer<typeof addKeywordSchema>;

export default function RankTracking() {
  const { toast } = useToast();
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  const form = useForm<AddKeywordForm>({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: {
      keyword: "",
      targetUrl: "",
      searchEngine: "google",
      location: "",
      device: "desktop",
    },
  });

  const { data: keywordsData, isLoading } = useQuery<{ keywords: KeywordWithRankData[] }>({
    queryKey: ["/api/rank-tracking/keywords"],
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data: AddKeywordForm) => {
      return await apiRequest("POST", "/api/rank-tracking/keywords", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-tracking/keywords"] });
      form.reset();
      toast({
        title: "Keyword added",
        description: "Rank tracking started for your keyword",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add keyword",
        variant: "destructive",
      });
    },
  });

  const checkRankMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      return await apiRequest("POST", `/api/rank-tracking/check/${keywordId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-tracking/keywords"] });
      toast({
        title: "Rank updated",
        description: "Latest ranking data fetched successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check rank",
        variant: "destructive",
      });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      return await apiRequest("DELETE", `/api/rank-tracking/keywords/${keywordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rank-tracking/keywords"] });
      setSelectedKeywordId(null);
      toast({
        title: "Keyword deleted",
        description: "Rank tracking stopped for this keyword",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete keyword",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddKeywordForm) => {
    addKeywordMutation.mutate(data);
  };

  const getRankChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getRankChangeText = (change: number | null) => {
    if (change === null) return "No change";
    if (change > 0) return `↑ ${change}`;
    if (change < 0) return `↓ ${Math.abs(change)}`;
    return "—";
  };

  const selectedKeyword = keywordsData?.keywords.find(k => k.id === selectedKeywordId);

  const chartData = selectedKeyword?.snapshots
    .slice()
    .reverse()
    .map((s, idx) => ({
      index: idx + 1,
      date: new Date(s.createdAt).toLocaleDateString(),
      rank: s.rank ?? 101,
    })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-rank-tracking">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rank Tracking Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your keyword rankings over time across search engines
        </p>
      </div>

      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords" data-testid="tab-keywords">Keywords</TabsTrigger>
          <TabsTrigger value="add" data-testid="tab-add">Add Keyword</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading keywords...</p>
              </CardContent>
            </Card>
          ) : keywordsData?.keywords.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No keywords tracked yet. Add your first keyword to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {keywordsData?.keywords.map((keyword) => (
                <Card 
                  key={keyword.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedKeywordId(keyword.id)}
                  data-testid={`card-keyword-${keyword.id}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{keyword.keyword}</CardTitle>
                    <CardDescription className="line-clamp-1">{keyword.targetUrl}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Rank</p>
                        <p className="text-2xl font-bold" data-testid={`rank-${keyword.id}`}>
                          {keyword.currentRank ?? "Not Ranking"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRankChangeIcon(keyword.rankChange)}
                        <span className="text-sm font-medium" data-testid={`change-${keyword.id}`}>
                          {getRankChangeText(keyword.rankChange)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          checkRankMutation.mutate(keyword.id);
                        }}
                        disabled={checkRankMutation.isPending}
                        data-testid={`button-check-${keyword.id}`}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteKeywordMutation.mutate(keyword.id);
                        }}
                        disabled={deleteKeywordMutation.isPending}
                        data-testid={`button-delete-${keyword.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedKeyword && (
            <Card>
              <CardHeader>
                <CardTitle>Rank History: {selectedKeyword.keyword}</CardTitle>
                <CardDescription>{selectedKeyword.targetUrl}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        reversed 
                        domain={[1, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Rank Position', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rank" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Rank Position"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No ranking data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Keyword</CardTitle>
              <CardDescription>
                Start tracking a new keyword's ranking position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g., best SEO tools"
                    {...form.register("keyword")}
                    data-testid="input-keyword"
                  />
                  {form.formState.errors.keyword && (
                    <p className="text-sm text-destructive">{form.formState.errors.keyword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    placeholder="https://example.com/page"
                    {...form.register("targetUrl")}
                    data-testid="input-targetUrl"
                  />
                  {form.formState.errors.targetUrl && (
                    <p className="text-sm text-destructive">{form.formState.errors.targetUrl.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchEngine">Search Engine</Label>
                    <Select
                      value={form.watch("searchEngine")}
                      onValueChange={(value) => form.setValue("searchEngine", value as "google" | "bing" | "yahoo")}
                    >
                      <SelectTrigger data-testid="select-searchEngine">
                        <SelectValue placeholder="Select engine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="bing">Bing</SelectItem>
                        <SelectItem value="yahoo">Yahoo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device">Device</Label>
                    <Select
                      value={form.watch("device")}
                      onValueChange={(value) => form.setValue("device", value as "desktop" | "mobile")}
                    >
                      <SelectTrigger data-testid="select-device">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, USA"
                    {...form.register("location")}
                    data-testid="input-location"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addKeywordMutation.isPending}
                  data-testid="button-add-keyword"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
