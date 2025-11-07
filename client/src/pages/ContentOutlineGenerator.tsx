import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportContentOutlineToPDF } from "@/lib/exports";
import { FileText, Download, Loader2, Lightbulb, CheckCircle2 } from "lucide-react";

interface OutlineSection {
  heading: string;
  level: 'h2' | 'h3';
  keyPoints: string[];
  wordCount: number;
}

interface ContentOutline {
  title: string;
  metaDescription: string;
  targetWordCount: number;
  sections: OutlineSection[];
  seoTips: string[];
  relatedQuestions: string[];
}

export default function ContentOutlineGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [outline, setOutline] = useState<ContentOutline | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest<ContentOutline>('/api/content_outline', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      });
      return response;
    },
    onSuccess: (data) => {
      setOutline(data);
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Outline Generated",
        description: `Successfully created outline for "${topic}"`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content outline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your content outline",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(topic);
  };

  const handleExportPDF = () => {
    if (!outline) return;
    exportContentOutlineToPDF(topic, outline);
    toast({
      title: "PDF Exported",
      description: "Content outline has been exported to PDF",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Outline Generator</h1>
          <p className="text-muted-foreground">
            Generate comprehensive, SEO-optimized content outlines with AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Outline</CardTitle>
            <CardDescription>
              Enter a topic to generate a detailed content outline with headings, key points, and SEO tips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="flex gap-2">
              <Input
                placeholder="e.g., How to improve website SEO"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1"
                data-testid="input-topic"
              />
              <Button 
                type="submit" 
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Generate Outline
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {outline && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Generated Outline</h2>
              <Button 
                onClick={handleExportPDF} 
                variant="outline"
                data-testid="button-export-pdf"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>

            <Card data-testid="card-outline">
              <CardHeader>
                <CardTitle className="text-xl">{outline.title}</CardTitle>
                {outline.metaDescription && (
                  <CardDescription className="text-sm">
                    <strong>Meta Description:</strong> {outline.metaDescription}
                  </CardDescription>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" data-testid="badge-word-count">
                    Target: {outline.targetWordCount.toLocaleString()} words
                  </Badge>
                  <Badge variant="secondary" data-testid="badge-section-count">
                    {outline.sections.length} sections
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Outline Sections */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content Structure
                  </h3>
                  <div className="space-y-4">
                    {outline.sections.map((section, idx) => (
                      <div 
                        key={idx}
                        className={`${section.level === 'h3' ? 'ml-6' : ''}`}
                        data-testid={`section-${idx}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={section.level === 'h2' ? 'default' : 'outline'}
                                data-testid={`badge-level-${idx}`}
                              >
                                {section.level.toUpperCase()}
                              </Badge>
                              <h4 className={`font-semibold ${section.level === 'h2' ? 'text-base' : 'text-sm'}`}>
                                {section.heading}
                              </h4>
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                              {section.keyPoints.map((point, pidx) => (
                                <li key={pidx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            ~{section.wordCount} words
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SEO Tips */}
                {outline.seoTips.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-lg">SEO Tips</h3>
                    <ul className="space-y-2">
                      {outline.seoTips.map((tip, idx) => (
                        <li 
                          key={idx} 
                          className="flex items-start gap-2 text-sm"
                          data-testid={`seo-tip-${idx}`}
                        >
                          <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Questions */}
                {outline.relatedQuestions.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-lg">Related Questions to Answer</h3>
                    <ul className="space-y-2">
                      {outline.relatedQuestions.map((question, idx) => (
                        <li 
                          key={idx} 
                          className="text-sm text-muted-foreground"
                          data-testid={`question-${idx}`}
                        >
                          <strong className="text-foreground">Q{idx + 1}:</strong> {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
