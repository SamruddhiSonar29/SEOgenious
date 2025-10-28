import { Button } from "@/components/ui/button";
import SEOHealthScore from "@/components/dashboard/SEOHealthScore";
import StatCard from "@/components/dashboard/StatCard";
import { FileText, TrendingUp, Search as SearchIcon, Play } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your SEO performance and get actionable insights
          </p>
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

        {/* Stats grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Reports"
            value="24"
            icon={FileText}
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Avg. SEO Score"
            value="82"
            icon={TrendingUp}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Keywords Tracked"
            value="156"
            icon={SearchIcon}
            gradient="from-cyan-500 to-blue-500"
          />
        </div>

        {/* Recent activity */}
        <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Completed keyword analysis', time: '2 hours ago', status: 'success' },
              { action: 'Generated content outline', time: '5 hours ago', status: 'success' },
              { action: 'Analyzed competitor page', time: '1 day ago', status: 'info' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg border bg-background p-4 hover-elevate"
              >
                <div className={`h-2 w-2 rounded-full ${item.status === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
