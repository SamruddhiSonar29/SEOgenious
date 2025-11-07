import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Activity, FileText, Target, BarChart3 } from "lucide-react";
import type { SeoScore } from "@shared/schema";
import { format } from "date-fns";

export default function SeoScoreDashboard() {
  const [domain, setDomain] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateMutation = useMutation({
    mutationFn: async (domainInput: string) => {
      const res = await apiRequest("POST", "/api/seo-score/calculate", { domain: domainInput });
      return await res.json();
    },
    onSuccess: (data: SeoScore) => {
      // Invalidate and refetch queries before updating state
      queryClient.invalidateQueries({ queryKey: [`/api/seo-score/${data.domain}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/seo-score/${data.domain}/history`] });
      queryClient.refetchQueries({ queryKey: [`/api/seo-score/${data.domain}`] });
      queryClient.refetchQueries({ queryKey: [`/api/seo-score/${data.domain}/history`] });
      setSelectedDomain(data.domain);
      toast({
        title: "Score Calculated",
        description: `SEO score for ${data.domain}: ${data.overallScore}/100`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Calculation Failed",
        description: "Failed to calculate SEO score. Please try again.",
      });
    },
  });

  const { data: currentScore } = useQuery<SeoScore>({
    queryKey: [`/api/seo-score/${selectedDomain}`],
    enabled: !!selectedDomain,
  });

  const { data: scoreHistory = [] } = useQuery<SeoScore[]>({
    queryKey: [`/api/seo-score/${selectedDomain}/history`],
    enabled: !!selectedDomain,
  });

  const handleCalculate = () => {
    if (!domain.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a domain name",
      });
      return;
    }
    calculateMutation.mutate(domain.trim());
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const chartData = scoreHistory.map((score) => ({
    date: format(new Date(score.createdAt), "MMM d"),
    overall: score.overallScore,
    technical: score.technicalScore,
    ranking: score.rankingScore,
    content: score.contentScore,
    activity: score.activityScore,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Score Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Unified scoring system aggregating all your SEO metrics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate SEO Score</CardTitle>
          <CardDescription>
            Enter your domain to calculate a comprehensive SEO score based on audits, rankings, content, and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              data-testid="input-domain"
              className="flex-1"
            />
            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              data-testid="button-calculate"
            >
              {calculateMutation.isPending ? "Calculating..." : "Calculate Score"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentScore && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overall SEO Score</CardTitle>
                <CardDescription data-testid="text-domain">{currentScore.domain}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="flex items-center justify-center h-48 w-48">
                      <div className={`text-6xl font-bold ${getScoreColor(currentScore.overallScore)}`} data-testid="text-overall-score">
                        {currentScore.overallScore}
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-48 w-48 -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(currentScore.overallScore / 100) * 553} 553`}
                          className={getScoreColor(currentScore.overallScore)}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4" data-testid="text-last-calculated">
                  Last calculated: {format(new Date(currentScore.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Score distribution across SEO categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Technical SEO</span>
                    </div>
                    <span className="font-medium">{currentScore.technicalScore}/100 (35%)</span>
                  </div>
                  <Progress value={currentScore.technicalScore} className="h-2" data-testid="progress-technical" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Ranking Performance</span>
                    </div>
                    <span className="font-medium">{currentScore.rankingScore}/100 (30%)</span>
                  </div>
                  <Progress value={currentScore.rankingScore} className="h-2" data-testid="progress-ranking" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Content Quality</span>
                    </div>
                    <span className="font-medium">{currentScore.contentScore}/100 (20%)</span>
                  </div>
                  <Progress value={currentScore.contentScore} className="h-2" data-testid="progress-content" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>Platform Activity</span>
                    </div>
                    <span className="font-medium">{currentScore.activityScore}/100 (15%)</span>
                  </div>
                  <Progress value={currentScore.activityScore} className="h-2" data-testid="progress-activity" />
                </div>
              </CardContent>
            </Card>
          </div>

          {scoreHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Score Trends
                </CardTitle>
                <CardDescription>
                  Historical SEO score performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300} data-testid="chart-score-trends">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="overall" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Overall Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="technical" 
                      stroke="#22c55e" 
                      strokeWidth={1.5}
                      name="Technical"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ranking" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5}
                      name="Ranking"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="content" 
                      stroke="#a855f7" 
                      strokeWidth={1.5}
                      name="Content"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activity" 
                      stroke="#f59e0b" 
                      strokeWidth={1.5}
                      name="Activity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>How to Improve Your Score</CardTitle>
              <CardDescription>Actionable recommendations based on your current performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentScore.technicalScore < 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted" data-testid="recommendation-technical">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Improve Technical SEO</p>
                    <p className="text-sm text-muted-foreground">
                      Run regular SEO audits and fix critical issues to boost your technical score.
                    </p>
                  </div>
                </div>
              )}

              {currentScore.rankingScore < 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted" data-testid="recommendation-ranking">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Boost Keyword Rankings</p>
                    <p className="text-sm text-muted-foreground">
                      Track more keywords and optimize your content to rank in top 10 positions.
                    </p>
                  </div>
                </div>
              )}

              {currentScore.contentScore < 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted" data-testid="recommendation-content">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Publish More Content</p>
                    <p className="text-sm text-muted-foreground">
                      Use the Content Planner to create and publish high-quality content regularly.
                    </p>
                  </div>
                </div>
              )}

              {currentScore.activityScore < 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted" data-testid="recommendation-activity">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Increase Platform Activity</p>
                    <p className="text-sm text-muted-foreground">
                      Engage more with SEO features to improve your activity score.
                    </p>
                  </div>
                </div>
              )}

              {currentScore.overallScore >= 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950" data-testid="recommendation-excellent">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-900 dark:text-green-100">Excellent Performance!</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your SEO score is excellent. Keep maintaining your current practices.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!currentScore && !calculateMutation.isPending && (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Score Data</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Enter a domain above to calculate your comprehensive SEO score based on your audits, rankings, content, and platform activity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
