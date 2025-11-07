import type { BacklinkProfile, BacklinkSnapshot } from "@shared/schema";
import { storage } from "../storage";
import { backlinkRiskAssessment } from "./aiWrapper";

export interface BacklinkAnalysisResult {
  profileId: string;
  targetUrl: string;
  totalBacklinks: number;
  newBacklinks: number;
  lostBacklinks: number;
  domainAuthority: number;
  spamScore: number;
  anchorTextDistribution: Record<string, number>;
  toxicCount: number;
  doFollowCount: number;
  aiRiskAssessment?: string;
}

export interface BacklinkProfileWithData extends BacklinkProfile {
  backlinks: BacklinkSnapshot[];
  anchorTextDistribution: Record<string, number>;
  toxicCount: number;
  doFollowCount: number;
  newBacklinksCount: number;
  lostBacklinksCount: number;
}

export class BacklinkAnalyzerService {
  async analyzeBacklinks(targetUrl: string, userId: string): Promise<BacklinkAnalysisResult> {
    let profile = await this.getProfileByUrl(targetUrl, userId);
    
    if (profile) {
      return await this.refreshBacklinkAnalysis(profile.id, userId);
    }

    const newBacklinks = this.generateSimulatedBacklinks(targetUrl);
    
    const domainAuthority = this.calculateDomainAuthority(newBacklinks);
    const spamScore = this.calculateSpamScore(newBacklinks);
    const toxicCount = newBacklinks.filter(b => b.isToxic).length;
    const anchorTextDistribution = this.calculateAnchorDistribution(newBacklinks);

    profile = await storage.createBacklinkProfile({
      userId,
      targetUrl,
      totalBacklinks: newBacklinks.length,
      domainAuthority,
      spamScore,
      lastCheckedAt: new Date(),
    });

    for (const backlink of newBacklinks) {
      await storage.createBacklinkSnapshot({
        ...backlink,
        profileId: profile.id,
      });
    }

    let aiRiskAssessment: string | undefined;
    try {
      const assessmentResult = await backlinkRiskAssessment({
        totalBacklinks: newBacklinks.length,
        toxicCount,
        spamScore,
        domainAuthority,
      });
      aiRiskAssessment = assessmentResult.assessment;
    } catch (error) {
      console.log('AI risk assessment failed, continuing without it');
    }

    return {
      profileId: profile.id,
      targetUrl,
      totalBacklinks: newBacklinks.length,
      newBacklinks: newBacklinks.length,
      lostBacklinks: 0,
      domainAuthority,
      spamScore,
      anchorTextDistribution,
      toxicCount,
      doFollowCount: newBacklinks.filter(b => b.isDoFollow).length,
      aiRiskAssessment,
    };
  }

  async refreshBacklinkAnalysis(profileId: string, userId: string): Promise<BacklinkAnalysisResult> {
    const profile = await storage.getBacklinkProfile(profileId, userId);
    if (!profile) {
      throw new Error('Backlink profile not found');
    }

    const existingBacklinks = await storage.getBacklinkSnapshots(profileId);
    const newBacklinks = this.generateSimulatedBacklinks(profile.targetUrl);

    const existingUrls = new Set(existingBacklinks.map(b => b.sourceUrl));
    const newUrls = new Set(newBacklinks.map(b => b.sourceUrl));

    for (const backlink of existingBacklinks) {
      if (!newUrls.has(backlink.sourceUrl)) {
        await storage.updateBacklinkSnapshot(backlink.id, {
          status: 'lost',
          lastSeenAt: new Date(),
        });
      } else {
        await storage.updateBacklinkSnapshot(backlink.id, {
          lastSeenAt: new Date(),
        });
      }
    }

    const trulyNewBacklinks = newBacklinks.filter(b => !existingUrls.has(b.sourceUrl));
    for (const backlink of trulyNewBacklinks) {
      await storage.createBacklinkSnapshot({
        ...backlink,
        profileId: profile.id,
      });
    }

    const allCurrentBacklinks = await storage.getBacklinkSnapshots(profileId);
    const activeBacklinks = allCurrentBacklinks.filter(b => b.status === 'active');

    const domainAuthority = this.calculateDomainAuthority(activeBacklinks);
    const spamScore = this.calculateSpamScore(activeBacklinks);
    const toxicCount = activeBacklinks.filter(b => b.isToxic).length;
    const anchorTextDistribution = this.calculateAnchorDistribution(activeBacklinks);

    await storage.updateBacklinkProfile(profileId, {
      totalBacklinks: activeBacklinks.length,
      domainAuthority,
      spamScore,
      lastCheckedAt: new Date(),
    });

    let aiRiskAssessment: string | undefined;
    try {
      const assessmentResult = await backlinkRiskAssessment({
        totalBacklinks: activeBacklinks.length,
        toxicCount,
        spamScore,
        domainAuthority,
      });
      aiRiskAssessment = assessmentResult.assessment;
    } catch (error) {
      console.log('AI risk assessment failed, continuing without it');
    }

    return {
      profileId: profile.id,
      targetUrl: profile.targetUrl,
      totalBacklinks: activeBacklinks.length,
      newBacklinks: trulyNewBacklinks.length,
      lostBacklinks: allCurrentBacklinks.filter(b => b.status === 'lost').length,
      domainAuthority,
      spamScore,
      anchorTextDistribution,
      toxicCount,
      doFollowCount: activeBacklinks.filter(b => b.isDoFollow).length,
      aiRiskAssessment,
    };
  }

  async getProfileWithData(profileId: string, userId: string): Promise<BacklinkProfileWithData | null> {
    const profile = await storage.getBacklinkProfile(profileId, userId);
    if (!profile) return null;

    const backlinks = await storage.getBacklinkSnapshots(profileId);
    const activeBacklinks = backlinks.filter(b => b.status === 'active');
    
    const anchorTextDistribution = this.calculateAnchorDistribution(backlinks);
    const toxicCount = backlinks.filter(b => b.isToxic).length;
    const doFollowCount = backlinks.filter(b => b.isDoFollow).length;
    const lostBacklinksCount = backlinks.filter(b => b.status === 'lost').length;
    const newBacklinksCount = backlinks.filter(b => {
      const daysSinceFirstSeen = (new Date().getTime() - new Date(b.firstSeenAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceFirstSeen <= 7;
    }).length;

    return {
      ...profile,
      backlinks: activeBacklinks,
      anchorTextDistribution,
      toxicCount,
      doFollowCount,
      newBacklinksCount,
      lostBacklinksCount,
    };
  }

  private async getProfileByUrl(targetUrl: string, userId: string): Promise<BacklinkProfile | null> {
    const profiles = await storage.getBacklinkProfiles(userId);
    return profiles.find(p => p.targetUrl === targetUrl) || null;
  }

  private generateSimulatedBacklinks(targetUrl: string): Array<Omit<BacklinkSnapshot, 'id' | 'profileId' | 'firstSeenAt' | 'lastSeenAt'>> {
    const count = Math.floor(Math.random() * 50) + 20;
    const backlinks: Array<Omit<BacklinkSnapshot, 'id' | 'profileId' | 'firstSeenAt' | 'lastSeenAt'>> = [];

    const domains = [
      'techcrunch.com', 'medium.com', 'dev.to', 'hackernoon.com',
      'forbes.com', 'entrepreneur.com', 'inc.com', 'mashable.com',
      'wired.com', 'theverge.com', 'digitalocean.com', 'github.com',
      'stackoverflow.com', 'reddit.com', 'producthunt.com', 'indiehackers.com',
      'blog.example.com', 'news.example.org', 'forum.example.net',
      'spammy-site.xyz', 'low-quality-links.info', 'link-farm.biz'
    ];

    const anchorTexts = [
      targetUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      'click here', 'read more', 'check this out', 'learn more',
      'SEO tools', 'digital marketing', 'analytics platform', 'marketing software',
      'best SEO tool', 'SEO platform', 'website optimization'
    ];

    const linkTypes = ['blog', 'article', 'directory', 'forum', 'social', 'news'];

    for (let i = 0; i < count; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const isSpammy = domain.includes('spammy') || domain.includes('link-farm') || domain.includes('low-quality');
      
      const domainAuthority = isSpammy 
        ? Math.floor(Math.random() * 20) + 1
        : Math.floor(Math.random() * 70) + 30;
      
      const pageAuthority = Math.min(domainAuthority + Math.floor(Math.random() * 20) - 10, 100);
      const spamScore = isSpammy
        ? Math.floor(Math.random() * 60) + 40
        : Math.floor(Math.random() * 30);
      
      const isToxic = spamScore > 60 || domainAuthority < 15;
      const isDoFollow = Math.random() > 0.3;
      const anchorText = anchorTexts[Math.floor(Math.random() * anchorTexts.length)];
      const linkType = linkTypes[Math.floor(Math.random() * linkTypes.length)];
      
      backlinks.push({
        sourceUrl: `https://${domain}/page-${i}`,
        sourceDomain: domain,
        anchorText,
        linkType,
        domainAuthority,
        pageAuthority,
        spamScore,
        isDoFollow,
        isToxic,
        status: 'active',
      });
    }

    return backlinks;
  }

  private calculateDomainAuthority(backlinks: Array<{ domainAuthority: number }>): number {
    if (backlinks.length === 0) return 0;
    const avg = backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / backlinks.length;
    return Math.round(avg);
  }

  private calculateSpamScore(backlinks: Array<{ spamScore: number }>): number {
    if (backlinks.length === 0) return 0;
    const avg = backlinks.reduce((sum, b) => sum + b.spamScore, 0) / backlinks.length;
    return Math.round(avg);
  }

  private calculateAnchorDistribution(backlinks: Array<{ anchorText: string }>): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const backlink of backlinks) {
      distribution[backlink.anchorText] = (distribution[backlink.anchorText] || 0) + 1;
    }

    return distribution;
  }
}

export const backlinkAnalyzerService = new BacklinkAnalyzerService();
