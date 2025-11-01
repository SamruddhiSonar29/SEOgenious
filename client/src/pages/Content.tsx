import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Content() {
  const [content, setContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<any>(null);

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

              <Button
                data-testid="button-analyze"
                onClick={analyzeContent}
                disabled={!content.trim() || !targetKeyword.trim()}
                className="gradient-primary animate-gradient"
              >
                Analyze Content
              </Button>
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
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Suggestions</h2>
                  <ul className="space-y-3">
                    {suggestions.suggestions.map((suggestion: any, index: number) => {
                      const Icon = suggestion.type === 'success' ? CheckCircle2 : 
                                  suggestion.type === 'warning' ? AlertCircle : Info;
                      const iconColor = suggestion.type === 'success' ? 'text-green-500' :
                                       suggestion.type === 'warning' ? 'text-amber-500' : 'text-blue-500';
                      
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
                          <span className="text-sm">{suggestion.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
