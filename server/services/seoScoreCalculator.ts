import { storage } from "../storage";
import type { SeoScore } from "@shared/schema";

export class SeoScoreCalculator {
  /**
   * Calculate Technical SEO Score (35% weight)
   * Based on recent SEO Health Audits for the domain
   */
  private async calculateTechnicalScore(userId: string, domain: string): Promise<number> {
    try {
      const audits = await storage.getAuditsByUserId(userId);
      
      // Filter audits for this domain (match domain in URL)
      const domainAudits = audits.filter(audit => {
        try {
          const url = new URL(audit.url);
          return url.hostname === domain || url.hostname === `www.${domain}` || audit.url.includes(domain);
        } catch {
          return audit.url.includes(domain);
        }
      });

      if (domainAudits.length === 0) {
        return 0; // No audits = 0 score
      }

      // Get the most recent audit score
      const latestAudit = domainAudits.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return latestAudit.score;
    } catch (error) {
      console.error('Error calculating technical score:', error);
      return 0;
    }
  }

  /**
   * Calculate Ranking Performance Score (30% weight)
   * Based on keyword rankings - lower ranks = higher score
   */
  private async calculateRankingScore(userId: string, domain: string): Promise<number> {
    try {
      const keywords = await storage.getKeywordsByUserId(userId);
      
      // Filter keywords for this domain
      const domainKeywords = keywords.filter(kw => 
        kw.targetUrl.includes(domain)
      );

      if (domainKeywords.length === 0) {
        return 0; // No keywords tracked = 0 score
      }

      let totalScore = 0;
      let keywordsWithRank = 0;

      for (const keyword of domainKeywords) {
        const snapshots = await storage.getRankSnapshotsByKeywordId(keyword.id);
        
        if (snapshots.length > 0) {
          // Get latest snapshot
          const latest = snapshots.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          if (latest.rank) {
            // Score: rank 1-10 = 100, rank 11-30 = 70, rank 31-50 = 40, rank 51-100 = 20, >100 = 5
            let rankScore = 0;
            if (latest.rank <= 10) rankScore = 100;
            else if (latest.rank <= 30) rankScore = 70;
            else if (latest.rank <= 50) rankScore = 40;
            else if (latest.rank <= 100) rankScore = 20;
            else rankScore = 5;

            totalScore += rankScore;
            keywordsWithRank++;
          }
        }
      }

      return keywordsWithRank > 0 ? Math.round(totalScore / keywordsWithRank) : 0;
    } catch (error) {
      console.error('Error calculating ranking score:', error);
      return 0;
    }
  }

  /**
   * Calculate Content Quality Score (20% weight)
   * Based on Content Planner activity - more published content = higher score
   */
  private async calculateContentScore(userId: string, domain: string): Promise<number> {
    try {
      const contentItems = await storage.getContentItemsByUserId(userId);
      
      if (contentItems.length === 0) {
        return 0; // No content = 0 score
      }

      // Count by status
      const published = contentItems.filter(c => c.status === 'published').length;
      const inReview = contentItems.filter(c => c.status === 'in_review').length;
      const draft = contentItems.filter(c => c.status === 'draft').length;
      const scheduled = contentItems.filter(c => c.status === 'scheduled').length;

      // Weighted scoring: published = 10 pts, scheduled = 7 pts, in_review = 5 pts, draft = 2 pts
      const score = (published * 10) + (scheduled * 7) + (inReview * 5) + (draft * 2);
      
      // Cap at 100, normalize based on content volume
      return Math.min(100, Math.round(score));
    } catch (error) {
      console.error('Error calculating content score:', error);
      return 0;
    }
  }

  /**
   * Calculate Activity Score (15% weight)
   * Based on overall platform engagement
   */
  private async calculateActivityScore(userId: string): Promise<number> {
    try {
      const activities = await storage.getActivitiesByUserId(userId);
      
      if (activities.length === 0) {
        return 0; // No activity = 0 score
      }

      // Get activities from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivities = activities.filter(a => 
        new Date(a.createdAt) >= thirtyDaysAgo
      );

      // Score based on activity frequency: 1-10 = 20, 11-25 = 40, 26-50 = 60, 51-100 = 80, >100 = 100
      const count = recentActivities.length;
      let score = 0;
      if (count <= 10) score = 20;
      else if (count <= 25) score = 40;
      else if (count <= 50) score = 60;
      else if (count <= 100) score = 80;
      else score = 100;

      return score;
    } catch (error) {
      console.error('Error calculating activity score:', error);
      return 0;
    }
  }

  /**
   * Calculate overall SEO score by aggregating all category scores
   */
  async calculateScore(userId: string, domain: string): Promise<SeoScore> {
    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Calculate individual category scores
    const technicalScore = await this.calculateTechnicalScore(userId, normalizedDomain);
    const rankingScore = await this.calculateRankingScore(userId, normalizedDomain);
    const contentScore = await this.calculateContentScore(userId, normalizedDomain);
    const activityScore = await this.calculateActivityScore(userId);

    // Weighted overall score: Technical (35%), Ranking (30%), Content (20%), Activity (15%)
    const overallScore = Math.round(
      (technicalScore * 0.35) +
      (rankingScore * 0.30) +
      (contentScore * 0.20) +
      (activityScore * 0.15)
    );

    // Create metadata JSON
    const metadata = JSON.stringify({
      weights: {
        technical: '35%',
        ranking: '30%',
        content: '20%',
        activity: '15%',
      },
      calculatedAt: new Date().toISOString(),
    });

    // Save score to database
    const score = await storage.createSeoScore({
      userId,
      domain: normalizedDomain,
      overallScore,
      technicalScore,
      rankingScore,
      contentScore,
      activityScore,
      metadata,
    });

    // Record activity
    await storage.createActivity({
      userId,
      type: 'seo_score_calculated',
      description: `Calculated SEO score for ${normalizedDomain}: ${overallScore}/100`,
      metadata: { domain: normalizedDomain, score: overallScore },
    });

    return score;
  }

  /**
   * Get the latest score for a domain
   */
  async getLatestScore(userId: string, domain: string): Promise<SeoScore | null> {
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    return storage.getLatestSeoScore(userId, normalizedDomain);
  }

  /**
   * Get score history for a domain
   */
  async getScoreHistory(userId: string, domain: string): Promise<SeoScore[]> {
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    return storage.getSeoScoreHistory(userId, normalizedDomain);
  }
}

export const seoScoreCalculator = new SeoScoreCalculator();
