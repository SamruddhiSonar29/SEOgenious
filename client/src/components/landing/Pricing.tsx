import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for getting started",
    features: [
      "5 keyword analyses per month",
      "Basic content optimization",
      "Limited competitor insights",
      "Email support",
    ],
    cta: "Get Started",
    href: "/register",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹149",
    description: "For serious content creators",
    features: [
      "Unlimited keyword analyses",
      "Advanced content optimization",
      "Full competitor insights",
      "AI keyword clustering",
      "Priority support",
      "Custom reports",
    ],
    cta: "Start Free Trial",
    href: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "₹500",
    description: "For agencies and teams",
    features: [
      "Everything in Pro",
      "Team collaboration (up to 10 users)",
      "White-label reports",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/register",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section className="px-8 py-24 bg-gradient-to-b from-background to-muted/30" id="pricing">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold lg:text-5xl">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose the perfect plan for your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              className={`relative overflow-hidden rounded-xl border bg-card p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.featured ? "gradient-border scale-105" : ""
              }`}
            >
              {plan.featured && (
                <div className="absolute right-4 top-4 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
              
              {/* Description */}
              <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              {/* CTA Button */}
              <Link href={plan.href}>
                <Button
                  data-testid={`button-${plan.name.toLowerCase()}-cta`}
                  className={`mb-6 w-full ${
                    plan.featured
                      ? "gradient-primary animate-gradient text-white shadow-lg shadow-primary/25"
                      : ""
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>

              {/* Features List */}
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
