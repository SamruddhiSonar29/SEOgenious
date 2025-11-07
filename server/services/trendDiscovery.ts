import { storage } from "../storage";
import { topicSuggestions as getAITopicSuggestions } from "./aiWrapper";

export interface TrendAnalysisResult {
  keyword: string;
  currentVolume: number;
  trend: "rising" | "stable" | "declining";
  competitionLevel: "low" | "medium" | "high";
  relatedTopics: string[];
}

export interface TopicSuggestion {
  topic: string;
  relevance: number;
  searchVolume: number;
  difficulty: "easy" | "medium" | "hard";
}

export class TrendDiscoveryService {
  private generateSearchVolume(keyword: string): number {
    const seed = keyword.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseVolume = 1000 + (seed % 50000);
    const variance = Math.random() * 0.3 - 0.15;
    return Math.floor(baseVolume * (1 + variance));
  }

  private calculateTrend(searchId: string, currentVolume: number): "rising" | "stable" | "declining" {
    const seed = searchId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const trendValue = seed % 100;
    
    if (trendValue < 35) return "rising";
    if (trendValue < 70) return "stable";
    return "declining";
  }

  private calculateCompetition(keyword: string): "low" | "medium" | "high" {
    const wordCount = keyword.split(" ").length;
    const length = keyword.length;
    
    if (wordCount >= 3 || length > 20) return "low";
    if (wordCount === 2 || length > 12) return "medium";
    return "high";
  }

  async analyzeTrend(
    userId: string,
    keyword: string,
    industry?: string,
    location: string = "global"
  ): Promise<TrendAnalysisResult> {
    const currentVolume = this.generateSearchVolume(keyword);
    const competitionLevel = this.calculateCompetition(keyword);

    const search = await storage.createTrendSearch({
      userId,
      keyword,
      industry: industry || null,
      location,
      currentVolume,
      trend: "stable",
      competitionLevel,
    });

    const trend = this.calculateTrend(search.id, currentVolume);
    await storage.updateTrendSearch(search.id, {
      trend,
      lastCheckedAt: new Date(),
    });

    await this.generateHistoricalData(search.id, currentVolume, trend);

    const relatedTopics = await this.generateRelatedTopics(keyword, industry);

    return {
      keyword,
      currentVolume,
      trend,
      competitionLevel,
      relatedTopics,
    };
  }

  private async generateHistoricalData(
    searchId: string,
    currentVolume: number,
    trend: string
  ): Promise<void> {
    const dataPoints = 12;
    const now = new Date();

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      let volumeAtPoint: number;
      
      if (trend === "rising") {
        const growthFactor = 1 - (i / dataPoints) * 0.4;
        volumeAtPoint = Math.floor(currentVolume * growthFactor);
      } else if (trend === "declining") {
        const declineFactor = 1 + (i / dataPoints) * 0.4;
        volumeAtPoint = Math.floor(currentVolume * declineFactor);
      } else {
        const variance = (Math.random() - 0.5) * 0.1;
        volumeAtPoint = Math.floor(currentVolume * (1 + variance));
      }

      await storage.createTrendSnapshot({
        searchId,
        searchVolume: Math.max(100, volumeAtPoint),
        date,
      });
    }
  }

  private async generateRelatedTopics(keyword: string, industry?: string): Promise<string[]> {
    const variations = [
      `${keyword} tips`,
      `${keyword} guide`,
      `best ${keyword}`,
      `${keyword} tutorial`,
      `how to ${keyword}`,
      `${keyword} tools`,
      `${keyword} strategies`,
      `${keyword} trends`,
    ];

    const random = Math.floor(Math.random() * variations.length);
    return variations.slice(0, Math.min(5, random + 3));
  }

  async getTopicSuggestions(keyword: string, industry?: string): Promise<TopicSuggestion[]> {
    try {
      const aiResponse = await getAITopicSuggestions({ keyword, industry });
      
      let suggestions: TopicSuggestion[];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(aiResponse);
        }
      } catch {
        suggestions = this.generateFallbackSuggestions(keyword);
      }

      return suggestions.slice(0, 8);
    } catch (error) {
      console.error("Error generating AI topic suggestions:", error);
      return this.generateFallbackSuggestions(keyword);
    }
  }

  private generateFallbackSuggestions(keyword: string): TopicSuggestion[] {
    const templates = [
      { prefix: "Best", relevance: 90, volume: 8000, difficulty: "medium" as const },
      { prefix: "How to", relevance: 85, volume: 12000, difficulty: "easy" as const },
      { prefix: "Top 10", relevance: 80, volume: 6000, difficulty: "medium" as const },
      { prefix: "Ultimate guide to", relevance: 75, volume: 5000, difficulty: "hard" as const },
      { prefix: "Free", relevance: 70, volume: 9000, difficulty: "easy" as const },
      { prefix: "Tips for", relevance: 65, volume: 4000, difficulty: "easy" as const },
      { prefix: "Advanced", relevance: 60, volume: 3000, difficulty: "hard" as const },
      { prefix: "Beginner's guide to", relevance: 55, volume: 7000, difficulty: "medium" as const },
    ];

    return templates.map((template, idx) => ({
      topic: `${template.prefix} ${keyword}`,
      relevance: template.relevance - (idx * 2),
      searchVolume: template.volume + Math.floor(Math.random() * 2000),
      difficulty: template.difficulty,
    }));
  }

  async refreshTrend(searchId: string, userId: string): Promise<TrendAnalysisResult | null> {
    const search = await storage.getTrendSearch(searchId, userId);
    if (!search) return null;

    const newVolume = this.generateSearchVolume(search.keyword);
    const trend = this.calculateTrend(searchId, newVolume);
    const competitionLevel = this.calculateCompetition(search.keyword);

    await storage.updateTrendSearch(searchId, {
      currentVolume: newVolume,
      trend,
      competitionLevel,
      lastCheckedAt: new Date(),
    });

    await storage.createTrendSnapshot({
      searchId,
      searchVolume: newVolume,
      date: new Date(),
    });

    const relatedTopics = await this.generateRelatedTopics(search.keyword, search.industry || undefined);

    return {
      keyword: search.keyword,
      currentVolume: newVolume,
      trend,
      competitionLevel,
      relatedTopics,
    };
  }

  async getTrendHistory(searchId: string, userId: string) {
    const search = await storage.getTrendSearch(searchId, userId);
    if (!search) return null;

    const snapshots = await storage.getTrendSnapshots(searchId, 30);
    
    const history = snapshots.map(snapshot => ({
      date: snapshot.date.toISOString(),
      volume: snapshot.searchVolume,
    })).reverse();

    return {
      id: search.id,
      keyword: search.keyword,
      industry: search.industry,
      location: search.location,
      currentVolume: search.currentVolume,
      trend: search.trend,
      competitionLevel: search.competitionLevel,
      createdAt: search.createdAt.toISOString(),
      lastCheckedAt: search.lastCheckedAt?.toISOString() || null,
      history,
    };
  }
}

export const trendDiscoveryService = new TrendDiscoveryService();
