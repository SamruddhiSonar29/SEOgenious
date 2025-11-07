import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Info, 
  TrendingUp, 
  Search, 
  Download, 
  Bookmark,
  Loader2,
  Clock,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type AuditStatus = 'running' | 'completed' | 'failed';
type SeverityLevel = 'critical' | 'warning' | 'info';

interface AuditFinding {
  category: string;
  severity: SeverityLevel;
  message: string;
  element?: string;
}

interface AuditRecommendation {
  priority: string;
  action: string;
  impact: string;
}

interface Audit {
  id: string;
  url: string;
  score: number;
  status: AuditStatus;
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  metadata: Record<string, any>;
  createdAt: string;
}

export default function SeoAudit() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Poll for audit results when running
  const { data: currentAudit } = useQuery<Audit>({
    queryKey: currentAuditId ? [`/api/seo-audit/${currentAuditId}`] : [],
    enabled: !!currentAuditId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if still running
      return query.state.data?.status === 'running' ? 2000 : false;
    },
  });

  // Fetch audit history
  const { data: auditHistory } = useQuery<{ audits: Audit[]; total: number }>({
    queryKey: ['/api/seo-audit/history'],
  });

  const handleRunAudit = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      const response = await apiRequest('POST', '/api/seo-audit', { url });
      const data = response as unknown as { id: string; status: string };
      
      setCurrentAuditId(data.id);
      
      toast({
        title: "Audit Started",
        description: "Your SEO audit is running. Results will appear shortly.",
      });

      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seo-audit/history'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAudit = async () => {
    if (!currentAudit) return;

    try {
      await apiRequest('POST', '/api/saved', {
        type: 'seo_audit',
        title: `SEO Audit: ${currentAudit.url}`,
        data: {
          url: currentAudit.url,
          score: currentAudit.score,
          criticalIssues: currentAudit.findings.filter(f => f.severity === 'critical').length,
          warnings: currentAudit.findings.filter(f => f.severity === 'warning').length,
          auditDate: currentAudit.createdAt,
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/saved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      
      toast({
        title: "Saved!",
        description: "SEO audit has been saved to your collection.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save audit.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!currentAudit) return;
    
    toast({
      title: "Export Started",
      description: "Generating PDF report...",
    });
    
    try {
      const response = await fetch(`/api/reports/seo-audit/${currentAudit.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-audit-${currentAudit.url.replace(/[^a-z0-9]/gi, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your PDF report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getSeverityBadgeVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return "destructive";
      case 'warning':
        return "default";
      case 'info':
        return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">SEO Health Audit</h1>
            <p className="text-muted-foreground">
              Comprehensive technical SEO analysis with actionable recommendations
            </p>
          </div>

          {/* Audit Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Run New Audit</CardTitle>
              <CardDescription>
                Enter a URL to analyze its SEO health and get detailed recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="url" className="sr-only">Website URL</Label>
                  <Input
                    id="url"
                    data-testid="input-audit-url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
                  />
                </div>
                <Button 
                  onClick={handleRunAudit} 
                  disabled={isRunning || !url.trim()}
                  data-testid="button-run-audit"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Run Audit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Audit Results */}
          {currentAudit && (
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="findings" data-testid="tab-findings">Findings</TabsTrigger>
                <TabsTrigger value="recommendations" data-testid="tab-recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>SEO Score</CardTitle>
                      <CardDescription>{currentAudit.url}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSaveAudit}
                        data-testid="button-save-audit"
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleExportPDF}
                        data-testid="button-export-audit"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentAudit.status === 'running' ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                          <p className="mt-4 text-muted-foreground">Running SEO audit...</p>
                        </div>
                      </div>
                    ) : currentAudit.status === 'completed' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-center">
                          <div className={`rounded-full p-8 ${getScoreBgColor(currentAudit.score)}`}>
                            <div className={`text-6xl font-bold ${getScoreColor(currentAudit.score)}`}>
                              {currentAudit.score}
                            </div>
                            <div className="text-center text-sm text-muted-foreground mt-2">
                              / 100
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {currentAudit.findings.filter(f => f.severity === 'critical').length}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {currentAudit.findings.filter(f => f.severity === 'warning').length}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {currentAudit.recommendations.length}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <XCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
                          <p className="mt-4 text-muted-foreground">Audit failed. Please try again.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="findings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Issues Found</CardTitle>
                    <CardDescription>
                      {currentAudit.findings.length} issues detected across your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentAudit.findings.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
                          <p className="mt-4 text-muted-foreground">No issues found!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentAudit.findings.map((finding, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-3 rounded-lg border p-4"
                            data-testid={`finding-${index}`}
                          >
                            {getSeverityIcon(finding.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getSeverityBadgeVariant(finding.severity)} className="text-xs">
                                  {finding.severity}
                                </Badge>
                                <span className="text-sm font-medium">{finding.category}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{finding.message}</p>
                              {finding.element && (
                                <code className="mt-2 block rounded bg-muted px-2 py-1 text-xs">
                                  {finding.element}
                                </code>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Actions</CardTitle>
                    <CardDescription>
                      Prioritized improvements to boost your SEO score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentAudit.recommendations.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <TrendingUp className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
                          <p className="mt-4 text-muted-foreground">No recommendations at this time</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentAudit.recommendations.map((rec, index) => (
                          <div 
                            key={index}
                            className="rounded-lg border p-4"
                            data-testid={`recommendation-${index}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{rec.priority}</Badge>
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h4 className="font-medium mb-1">{rec.action}</h4>
                            <p className="text-sm text-muted-foreground">{rec.impact}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Audit History */}
          {auditHistory && auditHistory.audits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>
                  Your SEO audit history ({auditHistory.total} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditHistory.audits.slice(0, 5).map((audit) => (
                    <div 
                      key={audit.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover-elevate cursor-pointer"
                      onClick={() => setCurrentAuditId(audit.id)}
                      data-testid={`history-audit-${audit.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full px-3 py-1 ${getScoreBgColor(audit.score)}`}>
                          <span className={`text-lg font-bold ${getScoreColor(audit.score)}`}>
                            {audit.score}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{audit.url}</p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {format(new Date(audit.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      {audit.status === 'running' && (
                        <Badge variant="outline">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Running
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
