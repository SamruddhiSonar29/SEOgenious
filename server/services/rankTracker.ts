import type { Keyword, RankSnapshot } from "@shared/schema";
import { storage } from "../storage";

export interface RankCheckResult {
  keywordId: string;
  keyword: string;
  targetUrl: string;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number | null;
  url: string | null;
}

export interface KeywordWithTrend extends Keyword {
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number | null;
  snapshots: Array<{ rank: number | null; createdAt: Date }>;
}

export class RankTrackerService {
  async checkRank(keywordId: string, userId: string): Promise<RankCheckResult | null> {
    const keyword = await storage.getKeyword(keywordId, userId);
    if (!keyword) return null;

    const snapshots = await storage.getRankSnapshots(keywordId, 2);

    const currentRank = this.simulateRankCheck(keyword);

    await storage.createRankSnapshot({
      keywordId,
      rank: currentRank,
      page: currentRank ? Math.ceil(currentRank / 10) : null,
      url: currentRank ? keyword.targetUrl : null,
    });

    const previousRank = snapshots.length > 0 ? snapshots[0].rank : null;
    const rankChange = currentRank !== null && previousRank !== null 
      ? previousRank - currentRank
      : null;

    return {
      keywordId,
      keyword: keyword.keyword,
      targetUrl: keyword.targetUrl,
      currentRank,
      previousRank,
      rankChange,
      url: currentRank ? keyword.targetUrl : null,
    };
  }

  async getKeywordWithTrend(keywordId: string, userId: string): Promise<KeywordWithTrend | null> {
    const keyword = await storage.getKeyword(keywordId, userId);
    if (!keyword) return null;

    const snapshots = await storage.getRankSnapshots(keywordId, 30);

    const currentRank = snapshots.length > 0 ? snapshots[0].rank : null;
    const previousRank = snapshots.length > 1 ? snapshots[1].rank : null;
    const rankChange = currentRank !== null && previousRank !== null 
      ? previousRank - currentRank
      : null;

    return {
      ...keyword,
      currentRank,
      previousRank,
      rankChange,
      snapshots: snapshots.map(s => ({
        rank: s.rank,
        createdAt: s.createdAt,
      })),
    };
  }

  async getAllKeywordsWithTrends(userId: string): Promise<KeywordWithTrend[]> {
    const keywords = await storage.getKeywords(userId);
    
    const keywordsWithTrends = await Promise.all(
      keywords.map(async (keyword) => {
        const snapshots = await storage.getRankSnapshots(keyword.id, 30);
        
        const currentRank = snapshots.length > 0 ? snapshots[0].rank : null;
        const previousRank = snapshots.length > 1 ? snapshots[1].rank : null;
        const rankChange = currentRank !== null && previousRank !== null 
          ? previousRank - currentRank
          : null;

        return {
          ...keyword,
          currentRank,
          previousRank,
          rankChange,
          snapshots: snapshots.map(s => ({
            rank: s.rank,
            createdAt: s.createdAt,
          })),
        };
      })
    );

    return keywordsWithTrends;
  }

  private simulateRankCheck(keyword: Keyword): number | null {
    const randomFactor = Math.random();
    
    if (randomFactor < 0.7) {
      const baseRank = Math.floor(Math.random() * 50) + 1;
      const variation = Math.floor((Math.random() - 0.5) * 10);
      return Math.max(1, Math.min(100, baseRank + variation));
    } else if (randomFactor < 0.9) {
      const lowerRank = Math.floor(Math.random() * 50) + 51;
      return lowerRank;
    } else {
      return null;
    }
  }

  async createInitialSnapshot(keywordId: string, userId: string): Promise<void> {
    const keyword = await storage.getKeyword(keywordId, userId);
    if (!keyword) return;

    const initialRank = this.simulateRankCheck(keyword);
    
    await storage.createRankSnapshot({
      keywordId,
      rank: initialRank,
      page: initialRank ? Math.ceil(initialRank / 10) : null,
      url: initialRank ? keyword.targetUrl : null,
    });
  }
}

export const rankTrackerService = new RankTrackerService();
