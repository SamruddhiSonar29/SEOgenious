import { Button } from "@/components/ui/button";
import SEOHealthScore from "@/components/dashboard/SEOHealthScore";
import StatsWidget from "@/components/dashboard/StatsWidget";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { Search as SearchIcon, Play } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor your SEO performance and get actionable insights
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsWidget />
        </div>

        {/* Main content grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* SEO Health Score - takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold">SEO Health Score</h2>
              <div className="flex flex-col items-center justify-center md:flex-row md:justify-around">
                <SEOHealthScore score={85} />
                <div className="mt-6 space-y-4 md:mt-0">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Overall Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Your website is performing well! Focus on improving meta descriptions and internal linking for even better results.
                    </p>
                  </div>
                  <Button
                    data-testid="button-run-analysis"
                    className="gradient-primary animate-gradient gap-2 shadow-lg shadow-primary/25"
                  >
                    <Play className="h-4 w-4" />
                    Run New Analysis
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-lg">
              <SearchIcon className="mb-4 h-8 w-8" />
              <h3 className="mb-2 text-lg font-semibold">Keyword Research</h3>
              <p className="mb-4 text-sm text-blue-50">
                Discover high-value keywords for your content strategy
              </p>
              <Button
                variant="outline"
                className="w-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                data-testid="button-keyword-research"
                onClick={() => window.location.href = '/dashboard/keywords'}
              >
                Start Research
              </Button>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-8">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
