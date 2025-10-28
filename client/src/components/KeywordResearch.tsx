import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "./LoadingSpinner";

interface KeywordData {
  keyword: string;
  intent: string;
  difficulty: number;
}

export default function KeywordResearch() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordData[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/keyword_research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error generating keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600';
    if (difficulty <= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium">
            Topic or Niche
          </Label>
          <Input
            id="topic"
            data-testid="input-topic"
            type="text"
            placeholder="e.g., AI in marketing, sustainable fashion, remote work tools"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="max-w-2xl"
          />
        </div>
        <Button
          data-testid="button-generate-keywords"
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
        >
          Generate Keywords
        </Button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && results.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Keyword
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Search Intent
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Difficulty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((item, index) => (
                <tr
                  key={index}
                  data-testid={`row-keyword-${index}`}
                  className="hover-elevate"
                >
                  <td className="px-4 py-3 text-sm">{item.keyword}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {item.intent}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
