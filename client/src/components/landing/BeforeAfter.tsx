import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Users, Target } from "lucide-react";

const examples = [
  {
    company: "E-commerce Store",
    before: {
      traffic: "2.5K",
      keywords: "45",
      conversion: "1.2%",
    },
    after: {
      traffic: "12.8K",
      keywords: "230",
      conversion: "3.8%",
    },
    timeframe: "6 months",
    icon: Target,
  },
  {
    company: "SaaS Startup",
    before: {
      traffic: "800",
      keywords: "12",
      conversion: "0.8%",
    },
    after: {
      traffic: "6.2K",
      keywords: "156",
      conversion: "2.9%",
    },
    timeframe: "4 months",
    icon: TrendingUp,
  },
  {
    company: "Content Blog",
    before: {
      traffic: "1.2K",
      keywords: "28",
      conversion: "0.5%",
    },
    after: {
      traffic: "8.9K",
      keywords: "198",
      conversion: "2.1%",
    },
    timeframe: "5 months",
    icon: Users,
  },
];

export default function BeforeAfter() {
  return (
    <section className="px-8 py-24" id="results">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold lg:text-5xl">
            Real <span className="gradient-text">Results</span> from Real Businesses
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            See how businesses like yours achieved remarkable SEO growth
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {examples.map((example, index) => {
            const Icon = example.icon;
            return (
              <Card key={index} className="overflow-hidden" data-testid={`example-${index}`}>
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-6 text-white">
                  <Icon className="mb-3 h-8 w-8" />
                  <h3 className="mb-1 text-xl font-bold">{example.company}</h3>
                  <p className="text-sm text-blue-100">After {example.timeframe}</p>
                </div>
                <CardContent className="p-6">
                  {/* Before */}
                  <div className="mb-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Before
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Traffic</span>
                        <span className="font-semibold">{example.before.traffic}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Keywords Ranking</span>
                        <span className="font-semibold">{example.before.keywords}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-semibold">{example.before.conversion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="my-4 flex justify-center">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>

                  {/* After */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                      After
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Traffic</span>
                        <span className="font-bold text-green-600">{example.after.traffic}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Keywords Ranking</span>
                        <span className="font-bold text-green-600">{example.after.keywords}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-bold text-green-600">{example.after.conversion}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
