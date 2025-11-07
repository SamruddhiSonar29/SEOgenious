import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpDown,
  FileDown,
  FileText,
  Bookmark,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportKeywordResearchToCSV, exportKeywordResearchToPDF } from "@/lib/exports";

interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  competition: number;
  difficulty: number;
  cpc: number;
  intent: string;
  trend: string;
}

interface KeywordResearchResult {
  seedKeyword: string;
  keywords: KeywordIdea[];
  totalResults: number;
}

type SortField = 'keyword' | 'searchVolume' | 'competition' | 'difficulty' | 'cpc';
type SortDirection = 'asc' | 'desc';

export default function KeywordResearch() {
  const { toast } = useToast();
  const [seedKeyword, setSeedKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResearchResult | null>(null);
  const [sortField, setSortField] = useState<SortField>('searchVolume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState({
    intent: 'all',
    minSearchVolume: 0,
    maxDifficulty: 100,
  });

  const handleResearch = async () => {
    if (!seedKeyword.trim()) return;

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/keyword-research', {
        seedKeyword,
        count: 50,
      });
      
      const data = await response as KeywordResearchResult;
      setResult(data);
      
      // Invalidate activities cache to refresh activity feed
      queryClient.invalidateQueries({ queryKey: ['/api/user/activities'] });
      
      toast({
        title: "Keywords Generated",
        description: `Found ${data.keywords.length} keyword ideas for "${seedKeyword}"`,
      });
    } catch (error) {
      console.error('Keyword research error:', error);
      toast({
        title: "Error",
        description: "Failed to generate keyword ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSaveKeyword = async (keyword: KeywordIdea) => {
    try {
      await apiRequest('POST', '/api/saved', {
        type: 'keyword_idea',
        title: keyword.keyword,
        data: keyword,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/saved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      
      toast({
        title: "Saved!",
        description: `Keyword "${keyword.keyword}" has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save keyword.",
        variant: "destructive",
      });
    }
  };

  const getFilteredAndSortedKeywords = () => {
    if (!result) return [];
    
    let filtered = result.keywords.filter(kw => {
      if (filter.intent !== 'all' && kw.intent !== filter.intent) return false;
      if (kw.searchVolume < filter.minSearchVolume) return false;
      if (kw.difficulty > filter.maxDifficulty) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'commercial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'transactional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'informational': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'navigational': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-500';
    if (difficulty < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredKeywords = getFilteredAndSortedKeywords();

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent" data-testid="heading-keyword-research">
              AI Keyword Research
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate keyword ideas with search volume, competition, and CPC data
            </p>
          </div>

          <Card data-testid="card-search">
            <CardHeader>
              <CardTitle>Generate Keyword Ideas</CardTitle>
              <CardDescription>Enter a seed keyword to discover related opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="seedKeyword">Seed Keyword</Label>
                  <Input
                    id="seedKeyword"
                    data-testid="input-seed-keyword"
                    placeholder="e.g., SEO tools"
                    value={seedKeyword}
                    onChange={(e) => setSeedKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    data-testid="button-research"
                    onClick={handleResearch}
                    disabled={loading || !seedKeyword.trim()}
                    className="gradient-primary animate-gradient"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Generate Ideas
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && <LoadingSpinner />}

          {!loading && result && (
            <div className="space-y-6" data-testid="results-section">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {filteredKeywords.length} Keywords Found
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportKeywordResearchToCSV(filteredKeywords)}
                    data-testid="button-export-csv"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportKeywordResearchToPDF(seedKeyword, filteredKeywords)}
                    data-testid="button-export-pdf"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="intent-filter" className="text-sm">Intent</Label>
                    <select
                      id="intent-filter"
                      data-testid="select-intent"
                      value={filter.intent}
                      onChange={(e) => setFilter({ ...filter, intent: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="informational">Informational</option>
                      <option value="commercial">Commercial</option>
                      <option value="transactional">Transactional</option>
                      <option value="navigational">Navigational</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-volume" className="text-sm">Min Search Volume</Label>
                    <Input
                      id="min-volume"
                      data-testid="input-min-volume"
                      type="number"
                      value={filter.minSearchVolume}
                      onChange={(e) => setFilter({ ...filter, minSearchVolume: parseInt(e.target.value) || 0 })}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-difficulty" className="text-sm">Max Difficulty</Label>
                    <Input
                      id="max-difficulty"
                      data-testid="input-max-difficulty"
                      type="number"
                      value={filter.maxDifficulty}
                      onChange={(e) => setFilter({ ...filter, maxDifficulty: parseInt(e.target.value) || 100 })}
                      className="w-32"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Results Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('keyword')}
                            className="flex items-center gap-2 font-semibold text-sm hover-elevate"
                            data-testid="sort-keyword"
                          >
                            Keyword
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('searchVolume')}
                            className="flex items-center gap-2 font-semibold text-sm hover-elevate"
                            data-testid="sort-volume"
                          >
                            Volume
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('competition')}
                            className="flex items-center gap-2 font-semibold text-sm hover-elevate"
                            data-testid="sort-competition"
                          >
                            Competition
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('difficulty')}
                            className="flex items-center gap-2 font-semibold text-sm hover-elevate"
                            data-testid="sort-difficulty"
                          >
                            Difficulty
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('cpc')}
                            className="flex items-center gap-2 font-semibold text-sm hover-elevate"
                            data-testid="sort-cpc"
                          >
                            CPC
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Intent</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trend</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-card">
                      {filteredKeywords.map((keyword, index) => (
                        <tr key={index} className="hover-elevate" data-testid={`row-keyword-${index}`}>
                          <td className="px-4 py-3 text-sm font-medium" data-testid={`text-keyword-${index}`}>
                            {keyword.keyword}
                          </td>
                          <td className="px-4 py-3 text-sm" data-testid={`text-volume-${index}`}>
                            {keyword.searchVolume.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${keyword.competition}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {keyword.competition}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                              {keyword.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ${keyword.cpc.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${getIntentColor(keyword.intent)}`}>
                              {keyword.intent}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {getTrendIcon(keyword.trend)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveKeyword(keyword)}
                              data-testid={`button-save-${index}`}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
