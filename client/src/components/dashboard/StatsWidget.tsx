import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, TrendingUp, Bookmark } from "lucide-react";

interface UserStats {
  totalKeywords: number;
  totalContent: number;
  totalCompetitors: number;
  savedItems: number;
}

export default function StatsWidget() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
  });

  const statCards = [
    {
      title: "Keywords Analyzed",
      value: stats?.totalKeywords || 0,
      icon: Search,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Content Created",
      value: stats?.totalContent || 0,
      icon: FileText,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Competitors Tracked",
      value: stats?.totalCompetitors || 0,
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Saved Items",
      value: stats?.savedItems || 0,
      icon: Bookmark,
      color: "from-green-500 to-emerald-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total lifetime
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
