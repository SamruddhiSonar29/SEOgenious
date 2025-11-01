import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Sparkles } from "lucide-react";

export default function Hero() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  return (
    <>
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-blue-50/30 px-8 py-24 lg:py-32">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-4 top-1/3 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI-Powered SEO Analysis</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-7xl">
            Boost Your Website{" "}
            <span className="gradient-text">
              Visibility
            </span>
            <br />
            with AI-Powered SEO
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground lg:text-xl">
            Your personal SEO partner to analyze, optimize, and dominate search rankings.
            Get data-driven insights in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                data-testid="button-start-free"
                className="gradient-primary animate-gradient text-base font-semibold shadow-lg shadow-primary/25"
              >
                Start for Free
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              data-testid="button-watch-demo"
              className="group gap-2 text-base"
              onClick={() => setShowDemoModal(true)}
            >
              <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>10,000+ Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>1M+ Keywords Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Demo Video Modal */}
    <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">SEOgenious Demo</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
          {/* Replace this div with your actual demo video */}
          {/* Example YouTube embed: */}
          {/* <iframe 
            className="w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
            title="SEOgenious Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          /> */}
          
          {/* Placeholder - Replace with your video */}
          <div className="text-center p-8">
            <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">Demo Video Coming Soon</p>
            <p className="text-muted-foreground mb-6">
              See SEOgenious in action with our comprehensive walkthrough
            </p>
            <Link href="/register">
              <Button 
                className="gradient-primary animate-gradient"
                onClick={() => setShowDemoModal(false)}
              >
                Try it Now - It's Free
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
