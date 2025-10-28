import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "./LoadingSpinner";

interface OutlineData {
  h1: string;
  h2_headings: string[];
  h3_subheadings: { [key: string]: string[] };
}

export default function ContentOutline() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<OutlineData | null>(null);

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/content_outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await response.json();
      setOutline(data);
    } catch (error) {
      console.error('Error generating outline:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="keyword" className="text-sm font-medium">
            Target Keyword
          </Label>
          <Input
            id="keyword"
            data-testid="input-keyword"
            type="text"
            placeholder="e.g., best CRM software for small business"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="max-w-2xl"
          />
        </div>
        <Button
          data-testid="button-create-outline"
          onClick={handleGenerate}
          disabled={loading || !keyword.trim()}
        >
          Create Outline
        </Button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && outline && (
        <div className="space-y-6 rounded-md border bg-card p-6" data-testid="outline-result">
          <div>
            <h2 className="text-xl font-semibold text-primary">{outline.h1}</h2>
          </div>

          {outline.h2_headings.map((h2, index) => (
            <div key={index} className="space-y-3 pl-4 border-l-2 border-border">
              <h3 className="text-lg font-medium">{h2}</h3>
              {outline.h3_subheadings[h2] && (
                <div className="space-y-2 pl-4">
                  {outline.h3_subheadings[h2].map((h3, h3Index) => (
                    <p key={h3Index} className="text-sm text-muted-foreground">
                      {h3}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
