import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "./LoadingSpinner";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface SEOSuggestions {
  suggested_title: string;
  meta_description: string;
  keyword_density: number;
  readability_score: number;
  recommendations: string[];
}

export default function OnPageSEO() {
  const [keyword, setKeyword] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SEOSuggestions | null>(null);

  const handleAnalyze = async () => {
    if (!keyword.trim() || !text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/onpage_seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, text }),
      });
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error analyzing text:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo-keyword" className="text-sm font-medium">
            Target Keyword
          </Label>
          <Input
            id="seo-keyword"
            data-testid="input-seo-keyword"
            type="text"
            placeholder="e.g., content marketing strategy"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="max-w-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-text" className="text-sm font-medium">
            Article Text
          </Label>
          <Textarea
            id="article-text"
            data-testid="textarea-article"
            placeholder="Paste your article content here for SEO analysis..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>

        <Button
          data-testid="button-analyze-text"
          onClick={handleAnalyze}
          disabled={loading || !keyword.trim() || !text.trim()}
        >
          Analyze Text
        </Button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && suggestions && (
        <div className="space-y-6" data-testid="seo-suggestions">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-md border bg-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Suggested Title
              </h3>
              <p className="text-sm font-medium">{suggestions.suggested_title}</p>
            </div>

            <div className="space-y-2 rounded-md border bg-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Meta Description
              </h3>
              <p className="text-sm">{suggestions.meta_description}</p>
            </div>

            <div className="space-y-2 rounded-md border bg-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Keyword Density
              </h3>
              <p className="text-2xl font-semibold text-primary">
                {suggestions.keyword_density}%
              </p>
            </div>

            <div className="space-y-2 rounded-md border bg-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Readability Score
              </h3>
              <p className="text-2xl font-semibold text-primary">
                {suggestions.readability_score}/100
              </p>
            </div>
          </div>

          <div className="rounded-md border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Recommendations</h3>
            <ul className="space-y-3">
              {suggestions.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  {index < 2 ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
