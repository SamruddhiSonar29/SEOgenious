import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { 
  Link as LinkIcon, 
  AlertTriangle, 
  Shield, 
  RefreshCw, 
  Trash2, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { BacklinkProfileWithData } from "@shared/schema";

const analyzeUrlSchema = z.object({
  targetUrl: z.string().url("Must be a valid URL"),
});

type AnalyzeUrlForm = z.infer<typeof analyzeUrlSchema>;

const COLORS = {
  dofollow: "hsl(var(--chart-1))",
  nofollow: "hsl(var(--chart-2))",
  toxic: "hsl(var(--destructive))",
  clean: "hsl(var(--chart-3))",
};

export default function Backlinks() {
  const { toast } = useToast();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const form = useForm<AnalyzeUrlForm>({
    resolver: zodResolver(analyzeUrlSchema),
    defaultValues: {
      targetUrl: "",
    },
  });

  const { data: profilesData, isLoading } = useQuery<{ profiles: BacklinkProfileWithData[] }>({
    queryKey: ["/api/backlinks"],
  });

  const { data: selectedProfile } = useQuery<BacklinkProfileWithData>({
    queryKey: selectedProfileId ? [`/api/backlinks/${selectedProfileId}`] : [],
    enabled: !!selectedProfileId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: AnalyzeUrlForm) => {
      return await apiRequest("POST", "/api/backlinks/analyze", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backlinks"] });
      setSelectedProfileId(data.profileId);
      form.reset();
      toast({
        title: "Analysis Complete",
        description: `Found ${data.totalBacklinks} backlinks for your domain`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze backlinks",
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return await apiRequest("POST", `/api/backlinks/refresh/${profileId}`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backlinks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/backlinks/${selectedProfileId}`] });
      toast({
        title: "Refresh Complete",
        description: `Found ${data.newBacklinks} new and ${data.lostBacklinks} lost backlinks`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh backlink data",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return await apiRequest("DELETE", `/api/backlinks/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backlinks"] });
      setSelectedProfileId(null);
      toast({
        title: "Profile Deleted",
        description: "Backlink profile has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnalyzeUrlForm) => {
    analyzeMutation.mutate(data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 70) return "default";
    if (score >= 40) return "secondary";
    return "destructive";
  };

  // Calculate chart data
  const linkTypeData = selectedProfile?.backlinks
    ? [
        { 
          name: "DoFollow", 
          value: selectedProfile.backlinks.filter(s => s.isDoFollow && s.status === 'active').length,
          color: COLORS.dofollow,
        },
        { 
          name: "NoFollow", 
          value: selectedProfile.backlinks.filter(s => !s.isDoFollow && s.status === 'active').length,
          color: COLORS.nofollow,
        },
      ]
    : [];

  const toxicData = selectedProfile?.backlinks
    ? [
        { 
          name: "Clean", 
          value: selectedProfile.backlinks.filter(s => !s.isToxic && s.status === 'active').length,
          color: COLORS.clean,
        },
        { 
          name: "Toxic", 
          value: selectedProfile.backlinks.filter(s => s.isToxic && s.status === 'active').length,
          color: COLORS.toxic,
        },
      ]
    : [];

  // Anchor text distribution (top 10)
  const anchorTextCounts = selectedProfile?.backlinks
    .filter(s => s.status === 'active')
    .reduce((acc: Record<string, number>, s) => {
      acc[s.anchorText] = (acc[s.anchorText] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topAnchors = anchorTextCounts
    ? Object.entries(anchorTextCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([text, count]) => ({ text, count }))
    : [];

  const activeBacklinks = selectedProfile?.backlinks.filter(s => s.status === 'active') || [];
  const toxicBacklinks = activeBacklinks.filter(s => s.isToxic);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent" data-testid="heading-backlinks">
              Backlink Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze your backlink profile, track link quality, and identify toxic links
            </p>
          </div>

      <Card data-testid="card-analyze-url">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Analyze Domain
          </CardTitle>
          <CardDescription>
            Enter your website URL to analyze its backlink profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="targetUrl">Target URL</Label>
                <Input
                  id="targetUrl"
                  data-testid="input-target-url"
                  placeholder="https://example.com"
                  {...form.register("targetUrl")}
                />
                {form.formState.errors.targetUrl && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.targetUrl.message}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  data-testid="button-analyze"
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : profilesData?.profiles && profilesData.profiles.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold">Your Domains</h2>
            <div className="space-y-2">
              {profilesData.profiles.map((profile) => (
                <Card
                  key={profile.id}
                  data-testid={`card-profile-${profile.id}`}
                  className={`cursor-pointer transition-all hover-elevate ${
                    selectedProfileId === profile.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={profile.targetUrl}>
                          {profile.targetUrl}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span data-testid={`text-backlinks-${profile.id}`}>
                            {profile.totalBacklinks} links
                          </span>
                          <span className={getScoreColor(profile.domainAuthority)}>
                            DA: {profile.domainAuthority}
                          </span>
                        </div>
                      </div>
                      {profile.spamScore > 30 && (
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedProfile ? (
              <div className="space-y-6">
                <Card data-testid="card-profile-overview">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate" title={selectedProfile.targetUrl}>
                          {selectedProfile.targetUrl}
                        </CardTitle>
                        <CardDescription>
                          Last checked: {selectedProfile.lastCheckedAt ? format(new Date(selectedProfile.lastCheckedAt), "MMM d, yyyy 'at' h:mm a") : 'Never'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="button-refresh"
                          onClick={() => refreshMutation.mutate(selectedProfile.id)}
                          disabled={refreshMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="button-delete"
                          onClick={() => deleteMutation.mutate(selectedProfile.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Links</p>
                        <p className="text-2xl font-bold" data-testid="text-total-links">
                          {selectedProfile.totalBacklinks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Domain Authority</p>
                        <p className={`text-2xl font-bold ${getScoreColor(selectedProfile.domainAuthority)}`} data-testid="text-domain-authority">
                          {selectedProfile.domainAuthority}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spam Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(100 - selectedProfile.spamScore)}`} data-testid="text-spam-score">
                          {selectedProfile.spamScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Toxic Links</p>
                        <p className="text-2xl font-bold text-destructive" data-testid="text-toxic-count">
                          {toxicBacklinks.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="overview" data-testid="tabs-backlinks">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                    <TabsTrigger value="links" data-testid="tab-links">All Links</TabsTrigger>
                    <TabsTrigger value="toxic" data-testid="tab-toxic">
                      Toxic Links
                      {toxicBacklinks.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {toxicBacklinks.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Link Type Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={linkTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {linkTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Link Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={toxicData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {toxicData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Anchor Texts</CardTitle>
                        <CardDescription>Most common anchor text used in your backlinks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topAnchors.map((anchor, idx) => (
                            <div key={idx} data-testid={`anchor-item-${idx}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate flex-1" title={anchor.text}>
                                  {anchor.text}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {anchor.count as number} links
                                </span>
                              </div>
                              <Progress 
                                value={((anchor.count as number) / activeBacklinks.length) * 100} 
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="links" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">All Backlinks ({activeBacklinks.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                          {activeBacklinks.map((link, idx) => (
                            <Card key={idx} data-testid={`link-item-${idx}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <a
                                      href={link.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                                      title={link.sourceUrl}
                                      data-testid={`link-url-${idx}`}
                                    >
                                      {link.sourceDomain}
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                    <p className="text-sm text-muted-foreground mt-1 truncate" title={link.anchorText}>
                                      Anchor: "{link.anchorText}"
                                    </p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      <Badge variant={link.isDoFollow ? "default" : "secondary"} className="text-xs">
                                        {link.isDoFollow ? "DoFollow" : "NoFollow"}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        DA: {link.domainAuthority}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        PA: {link.pageAuthority}
                                      </Badge>
                                      {link.isToxic && (
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Toxic
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="toxic" className="space-y-4">
                    {toxicBacklinks.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Toxic Backlinks ({toxicBacklinks.length})
                          </CardTitle>
                          <CardDescription>
                            These backlinks may harm your SEO. Consider disavowing them.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {toxicBacklinks.map((link, idx) => (
                              <Card key={idx} className="border-destructive/50" data-testid={`toxic-link-${idx}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <a
                                        href={link.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                                        title={link.sourceUrl}
                                        data-testid={`toxic-link-url-${idx}`}
                                      >
                                        {link.sourceDomain}
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                      </a>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Spam Score: {link.spamScore}% | DA: {link.domainAuthority}
                                      </p>
                                      <div className="flex gap-2 mt-2 flex-wrap">
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          High Risk
                                        </Badge>
                                        {link.spamScore >= 80 && (
                                          <Badge variant="destructive" className="text-xs">
                                            Critical
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
                          <p className="text-lg font-medium">No Toxic Links Found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your backlink profile looks clean!
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Select a Domain</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a domain from the list to view its backlink profile
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Backlink Profiles Yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start by analyzing your first domain above
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </DashboardLayout>
  );
}
