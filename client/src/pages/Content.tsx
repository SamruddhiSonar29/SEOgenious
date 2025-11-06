import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Info, Bookmark, FileText, Wand2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportContentAnalysisToPDF } from "@/lib/exports";

export default function Content() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const analyzeContent = async () => {
    if (!content.trim() || !targetKeyword.trim()) return;

    try {
      const response = await fetch('/api/content_optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keyword: targetKeyword }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }
      
      const data = await response.json();
      setSuggestions(data);
      
      // Invalidate activities cache to refresh activity feed
      queryClient.invalidateQueries({ queryKey: ['/api/user/activities'] });
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  };

  const handleSaveAnalysis = async () => {
    try {
      await apiRequest('POST', '/api/saved', {
        type: 'content_analysis',
        title: `Content Analysis: ${targetKeyword}`,
        data: {
          keyword: targetKeyword,
          contentPreview: content.substring(0, 200),
          wordCount: suggestions.word_count,
          keywordDensity: suggestions.keyword_density,
          readabilityScore: suggestions.readability_score,
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/saved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      
      toast({
        title: "Saved!",
        description: "Content analysis has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content analysis.",
        variant: "destructive",
      });
    }
  };

  const handleAIRewrite = async () => {
    if (!content.trim()) return;
    
    setIsRewriting(true);
    try {
      const data = await apiRequest('POST', '/api/ai/rewrite', {
        content,
        targetKeyword: targetKeyword || undefined,
        tone: 'professional',
      }) as any;
      
      setContent(data.rewrittenContent);
      
      toast({
        title: "Content Rewritten!",
        description: data.mode === 'mock' 
          ? "Content improved (using mock AI)"
          : "Content enhanced with AI",
      });
      
      if (data.suggestions?.length > 0) {
        console.log("AI Suggestions:", data.suggestions);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rewrite content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Interactive Content Optimizer</h1>
            <p className="text-muted-foreground">
              Real-time content analysis with actionable suggestions
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Editor Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-keyword">Target Keyword</Label>
                <Input
                  id="target-keyword"
                  data-testid="input-target-keyword"
                  placeholder="e.g., best SEO tools"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-editor">Content</Label>
                <Textarea
                  id="content-editor"
                  data-testid="textarea-content"
                  placeholder="Paste or type your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="font-sans"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  data-testid="button-analyze"
                  onClick={analyzeContent}
                  disabled={!content.trim() || !targetKeyword.trim()}
                  className="gradient-primary animate-gradient"
                >
                  Analyze Content
                </Button>
                <Button
                  data-testid="button-ai-rewrite"
                  onClick={handleAIRewrite}
                  disabled={!content.trim() || isRewriting}
                  variant="outline"
                >
                  {isRewriting ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI Rewrite
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Suggestions Sidebar */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Content Metrics</h2>
                {suggestions ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Word Count</p>
                      <p className="text-2xl font-bold">{suggestions.word_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Keyword Density</p>
                      <p className="text-2xl font-bold text-primary">{suggestions.keyword_density}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Readability</p>
                      <p className="text-2xl font-bold">{suggestions.readability_score}/100</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter content and click "Analyze Content" to see metrics
                  </p>
                )}
              </div>

              {suggestions && (
                <>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Suggestions</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportContentAnalysisToPDF({
                            keyword: targetKeyword,
                            word_count: suggestions.word_count,
                            keyword_density: suggestions.keyword_density,
                            readability_score: suggestions.readability_score,
                            suggestions: suggestions.suggestions
                          })}
                          data-testid="button-export-pdf"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveAnalysis}
                          data-testid="button-save-analysis"
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                    <ul className="space-y-3">
                    {suggestions.suggestions.map((suggestion: any, index: number) => {
                      const Icon = suggestion.type === 'success' ? CheckCircle2 : 
                                  suggestion.type === 'warning' ? AlertCircle : Info;
                      const iconColor = suggestion.type === 'success' ? 'text-green-500' :
                                       suggestion.type === 'warning' ? 'text-amber-500' : 'text-blue-500';
                      
                      return (
                        <li key={index} className="flex items-start gap-3" data-testid={`suggestion-${index}`}>
                          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
                          <span className="text-sm" data-testid={`suggestion-text-${index}`}>{suggestion.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
