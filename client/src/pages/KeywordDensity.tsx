import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Search, TrendingUp, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface DensityResult {
  keyword: string;
  count: number;
  density: number;
  wordCount: number;
  charCount: number;
  recommended: {
    min: number;
    max: number;
    status: 'low' | 'optimal' | 'high';
  };
}

export default function KeywordDensity() {
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<DensityResult | null>(null);

  const analyzeKeywordDensity = () => {
    if (!text.trim() || !keyword.trim()) return;

    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase().trim();
    
    // Count keyword occurrences
    const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    
    // Calculate metrics
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
    
    // Determine recommendation (ideal: 1-3% for primary keyword)
    let status: 'low' | 'optimal' | 'high' = 'optimal';
    if (density < 1) status = 'low';
    if (density > 3) status = 'high';

    setResult({
      keyword: lowerKeyword,
      count,
      density: parseFloat(density.toFixed(2)),
      wordCount,
      charCount,
      recommended: {
        min: 1,
        max: 3,
        status,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-amber-500';
      case 'optimal': return 'text-green-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'low':
        return 'Your keyword density is below the recommended range. Consider using the keyword more naturally throughout your content.';
      case 'optimal':
        return 'Perfect! Your keyword density is in the optimal range for SEO.';
      case 'high':
        return 'Your keyword density is too high. This may be considered keyword stuffing. Try to reduce usage.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2" data-testid="link-home">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  SEOgenious
                </span>
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <a data-testid="link-login">
                  <Button variant="ghost">Log In</Button>
                </a>
              </Link>
              <Link href="/register">
                <a data-testid="link-register">
                  <Button className="gradient-primary animate-gradient">
                    Get Started Free
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
              <TrendingUp className="h-4 w-4" />
              100% Free Tool - No Sign Up Required
            </div>
            <h1 className="text-4xl font-bold mb-4 md:text-5xl">
              Free Keyword Density Checker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Optimize your content for SEO by analyzing keyword frequency and density. Get instant insights to improve your rankings.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Your Content</CardTitle>
                  <CardDescription>
                    Paste your content and enter your target keyword
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyword-input">Target Keyword</Label>
                    <Input
                      id="keyword-input"
                      data-testid="input-keyword"
                      placeholder="e.g., keyword density checker"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content-input">Your Content</Label>
                    <Textarea
                      id="content-input"
                      data-testid="textarea-content"
                      placeholder="Paste your content here to analyze keyword density..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={16}
                      className="font-sans resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {text.length} characters • {text.trim().split(/\s+/).filter(w => w.length > 0).length} words
                    </p>
                  </div>
                  <Button
                    data-testid="button-analyze"
                    onClick={analyzeKeywordDensity}
                    disabled={!text.trim() || !keyword.trim()}
                    className="w-full gradient-primary animate-gradient"
                    size="lg"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Analyze Keyword Density
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {result ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Results</CardTitle>
                      <CardDescription>
                        Keyword: <span className="font-semibold text-foreground">"{result.keyword}"</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Keyword Density */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Keyword Density</span>
                          <span className={`text-2xl font-bold ${getStatusColor(result.recommended.status)}`} data-testid="text-density">
                            {result.density}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(result.density * 20, 100)} 
                          className="h-2"
                          data-testid="progress-density"
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: {result.recommended.min}% - {result.recommended.max}%
                        </p>
                      </div>

                      {/* Status Message */}
                      <div className={`rounded-lg border p-4 ${
                        result.recommended.status === 'low' ? 'border-amber-500/50 bg-amber-500/10' :
                        result.recommended.status === 'optimal' ? 'border-green-500/50 bg-green-500/10' :
                        'border-red-500/50 bg-red-500/10'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {result.recommended.status === 'low' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : result.recommended.status === 'optimal' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <p className={`text-sm font-medium ${getStatusColor(result.recommended.status)}`} data-testid="text-status">
                            {result.recommended.status === 'low' ? 'Below Optimal' :
                             result.recommended.status === 'optimal' ? 'Optimal' :
                             'Above Optimal'}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid="text-recommendation">
                          {getStatusMessage(result.recommended.status)}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Keyword Count</p>
                              <p className="text-3xl font-bold text-primary" data-testid="text-count">
                                {result.count}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Total Words</p>
                              <p className="text-3xl font-bold" data-testid="text-word-count">
                                {result.wordCount}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* CTA */}
                      <Card className="border-primary/50 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-3">
                            <FileText className="h-8 w-8 text-primary mx-auto" />
                            <h3 className="font-semibold">Want More Advanced SEO Tools?</h3>
                            <p className="text-sm text-muted-foreground">
                              Get AI-powered keyword research, content optimization, and competitor analysis
                            </p>
                            <Link href="/register">
                              <a data-testid="link-cta-register">
                                <Button className="w-full gradient-primary animate-gradient">
                                  Start Free Trial
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </a>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Enter your target keyword and content, then click "Analyze Keyword Density" to see detailed insights
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">What is Keyword Density?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Keyword density is the percentage of times a keyword appears in your content compared to the total word count.
                  </p>
                  <p>
                    For optimal SEO, aim for <strong className="text-foreground">1-3% keyword density</strong>. Too low and search engines might not understand your topic. Too high and it may be considered keyword stuffing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="border-t bg-muted/30 py-16 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready for Professional SEO Tools?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of marketers using SEOgenious for AI-powered keyword research, content optimization, and competitor analysis.
          </p>
          <Link href="/register">
            <a data-testid="link-footer-cta">
              <Button size="lg" className="gradient-primary animate-gradient">
                Get Started Free - No Credit Card Required
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </Link>
        </div>
      </section>
    </div>
  );
}
