import { Search, FileText, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Keyword Analysis",
    description: "Discover high-value keywords with AI-powered research and clustering. Uncover opportunities your competitors are missing.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    title: "Content Optimization",
    description: "Real-time content analysis with actionable suggestions. Improve readability, keyword density, and meta tags instantly.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Competitor Insights",
    description: "Analyze top-ranking competitors and identify content gaps. Get strategic recommendations to outrank the competition.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

export default function Features() {
  return (
    <section className="px-8 py-24" id="features">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold lg:text-5xl">
            Powerful Features for{" "}
            <span className="gradient-text">SEO Success</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to optimize your content and dominate search rankings
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                data-testid={`card-feature-${index}`}
                className="group relative overflow-hidden rounded-xl border bg-card p-8 shadow-md transition-all hover:shadow-xl hover-elevate"
              >
                {/* Gradient glow effect on hover */}
                <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r ${feature.gradient} opacity-0 blur transition-opacity group-hover:opacity-20`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-xl font-semibold">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
