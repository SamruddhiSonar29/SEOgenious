import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Digital Marketing Manager",
    company: "TechStart India",
    content: "SEOgenious transformed our content strategy. We saw a 150% increase in organic traffic within 3 months!",
    rating: 5,
    initials: "RK",
  },
  {
    name: "Priya Sharma",
    role: "Content Creator",
    company: "BlogMasters",
    content: "The AI-powered keyword research is incredible. It saves me hours every week and finds opportunities I would have missed.",
    rating: 5,
    initials: "PS",
  },
  {
    name: "Amit Patel",
    role: "SEO Specialist",
    company: "Growth Agency",
    content: "Best SEO tool I've used. The competitor analysis feature alone is worth the price. Highly recommended!",
    rating: 5,
    initials: "AP",
  },
];

export default function Testimonials() {
  return (
    <section className="px-8 py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold lg:text-5xl">
            Loved by <span className="gradient-text">SEO Professionals</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join thousands of marketers and content creators who trust SEOgenious
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`}>
              <CardContent className="p-6">
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
