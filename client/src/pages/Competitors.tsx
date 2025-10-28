import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ExternalLink } from "lucide-react";

interface CompetitorData {
  rank: number;
  url: string;
  word_count: number;
  content_angle: string;
  domain_authority: number;
}

export default function Competitors() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/serp_analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await response.json();
      setCompetitors(data);
    } catch (error) {
      console.error('Error analyzing competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">SERP Competitor Analysis</h1>
            <p className="text-muted-foreground">
              Analyze top-ranking competitors and identify content gaps
            </p>
          </div>

          <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="keyword">Target Keyword</Label>
                <Input
                  id="keyword"
                  data-testid="input-keyword"
                  placeholder="e.g., best project management software"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  data-testid="button-analyze"
                  onClick={handleAnalyze}
                  disabled={loading || !keyword.trim()}
                  className="gradient-primary animate-gradient"
                >
                  Analyze Top 10
                </Button>
              </div>
            </div>
          </div>

          {loading && <LoadingSpinner />}

          {!loading && competitors.length > 0 && (
            <div className="space-y-6" data-testid="competitors-result">
              {/* Summary Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Word Count</p>
                  <p className="mt-2 text-3xl font-bold">
                    {Math.round(competitors.reduce((acc, c) => acc + c.word_count, 0) / competitors.length)}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Domain Authority</p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {Math.round(competitors.reduce((acc, c) => acc + c.domain_authority, 0) / competitors.length)}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">Most Common Angle</p>
                  <p className="mt-2 text-lg font-bold">Guide/Tutorial</p>
                </div>
              </div>

              {/* Competitor Table */}
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">URL</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Words</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Content Angle</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">DA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-card">
                    {competitors.map((comp) => (
                      <tr key={comp.rank} className="hover-elevate">
                        <td className="px-6 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {comp.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            {new URL(comp.url).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm">{comp.word_count}</td>
                        <td className="px-6 py-4 text-sm">{comp.content_angle}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium">{comp.domain_authority}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
