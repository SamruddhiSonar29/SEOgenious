import type { AuditFinding, AuditMetadata } from "@shared/schema";
import { executiveSummary } from "./aiWrapper";

interface PageAnalysis {
  html: string;
  title?: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  images: Array<{ src: string; alt: string | null }>;
  links: Array<{ href: string; isInternal: boolean; text: string }>;
  loadTime: number;
  pageSize: number;
}

interface AuditResult {
  score: number;
  findings: AuditFinding[];
  recommendations: string[];
  metadata: AuditMetadata;
}

class SEOAuditorService {
  private async fetchPage(url: string): Promise<PageAnalysis> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEOgenious-Auditor/1.0',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const loadTime = Date.now() - startTime;
      const pageSize = Buffer.byteLength(html, 'utf8');

      return this.parseHTML(html, url, loadTime, pageSize);
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseHTML(html: string, baseUrl: string, loadTime: number, pageSize: number): PageAnalysis {
    const urlObj = new URL(baseUrl);
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract meta description
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : undefined;

    // Extract H1 tags
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h1Tags = Array.from(h1Matches).map(m => m[1].trim());

    // Extract H2 tags
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    const h2Tags = Array.from(h2Matches).map(m => m[1].trim());

    // Extract images
    const imgMatches = html.matchAll(/<img[^>]+>/gi);
    const images = Array.from(imgMatches).map(match => {
      const img = match[0];
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      const altMatch = img.match(/alt=["']([^"']*)["']/i);
      return {
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : null,
      };
    });

    // Extract links
    const linkMatches = html.matchAll(/<a[^>]+>([^<]*)<\/a>/gi);
    const links = Array.from(linkMatches).map(match => {
      const anchor = match[0];
      const hrefMatch = anchor.match(/href=["']([^"']+)["']/i);
      const href = hrefMatch ? hrefMatch[1] : '';
      const text = match[1].trim();
      
      let isInternal = false;
      try {
        if (href.startsWith('/') || href.startsWith('#')) {
          isInternal = true;
        } else if (href.startsWith('http')) {
          const linkUrl = new URL(href);
          isInternal = linkUrl.hostname === urlObj.hostname;
        }
      } catch {
        isInternal = false;
      }

      return { href, isInternal, text };
    });

    return {
      html,
      title,
      metaDescription,
      h1Tags,
      h2Tags,
      images,
      links,
      loadTime,
      pageSize,
    };
  }

  private analyzeFindings(analysis: PageAnalysis, url: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Title analysis
    if (!analysis.title) {
      findings.push({
        category: 'Meta Tags',
        severity: 'critical',
        message: 'Missing page title',
        element: '<title>',
        suggestion: 'Add a unique, descriptive title tag (50-60 characters)',
      });
    } else if (analysis.title.length < 30) {
      findings.push({
        category: 'Meta Tags',
        severity: 'warning',
        message: `Title is too short (${analysis.title.length} characters)`,
        element: `<title>${analysis.title}</title>`,
        suggestion: 'Expand title to 50-60 characters for better SEO',
      });
    } else if (analysis.title.length > 60) {
      findings.push({
        category: 'Meta Tags',
        severity: 'warning',
        message: `Title is too long (${analysis.title.length} characters)`,
        element: `<title>${analysis.title}</title>`,
        suggestion: 'Shorten title to 50-60 characters to avoid truncation in search results',
      });
    }

    // Meta description analysis
    if (!analysis.metaDescription) {
      findings.push({
        category: 'Meta Tags',
        severity: 'critical',
        message: 'Missing meta description',
        element: '<meta name="description">',
        suggestion: 'Add a compelling meta description (150-160 characters)',
      });
    } else if (analysis.metaDescription.length < 120) {
      findings.push({
        category: 'Meta Tags',
        severity: 'warning',
        message: `Meta description is too short (${analysis.metaDescription.length} characters)`,
        element: `<meta name="description" content="...">`,
        suggestion: 'Expand meta description to 150-160 characters',
      });
    } else if (analysis.metaDescription.length > 160) {
      findings.push({
        category: 'Meta Tags',
        severity: 'warning',
        message: `Meta description is too long (${analysis.metaDescription.length} characters)`,
        element: `<meta name="description" content="...">`,
        suggestion: 'Shorten meta description to 150-160 characters',
      });
    }

    // H1 analysis
    if (analysis.h1Tags.length === 0) {
      findings.push({
        category: 'Content Structure',
        severity: 'critical',
        message: 'Missing H1 heading',
        element: '<h1>',
        suggestion: 'Add a single, descriptive H1 heading that includes your primary keyword',
      });
    } else if (analysis.h1Tags.length > 1) {
      findings.push({
        category: 'Content Structure',
        severity: 'warning',
        message: `Multiple H1 tags found (${analysis.h1Tags.length})`,
        element: '<h1>',
        suggestion: 'Use only one H1 tag per page for better SEO',
      });
    }

    // H2 analysis
    if (analysis.h2Tags.length === 0) {
      findings.push({
        category: 'Content Structure',
        severity: 'info',
        message: 'No H2 headings found',
        element: '<h2>',
        suggestion: 'Add H2 subheadings to improve content structure and readability',
      });
    }

    // Image alt text analysis
    const imagesWithoutAlt = analysis.images.filter(img => !img.alt || img.alt.trim() === '');
    if (imagesWithoutAlt.length > 0) {
      findings.push({
        category: 'Accessibility',
        severity: 'warning',
        message: `${imagesWithoutAlt.length} image(s) missing alt text`,
        element: '<img>',
        suggestion: 'Add descriptive alt text to all images for accessibility and SEO',
      });
    }

    // Links analysis
    const totalLinks = analysis.links.length;
    const internalLinks = analysis.links.filter(l => l.isInternal).length;
    const externalLinks = totalLinks - internalLinks;

    if (totalLinks === 0) {
      findings.push({
        category: 'Links',
        severity: 'warning',
        message: 'No links found on page',
        element: '<a>',
        suggestion: 'Add relevant internal and external links to improve navigation and SEO',
      });
    }

    // Empty link text
    const emptyLinks = analysis.links.filter(l => !l.text || l.text.trim() === '');
    if (emptyLinks.length > 0) {
      findings.push({
        category: 'Links',
        severity: 'warning',
        message: `${emptyLinks.length} link(s) with empty anchor text`,
        element: '<a>',
        suggestion: 'Use descriptive anchor text for all links',
      });
    }

    // Performance
    if (analysis.loadTime > 3000) {
      findings.push({
        category: 'Performance',
        severity: 'warning',
        message: `Slow page load time (${(analysis.loadTime / 1000).toFixed(2)}s)`,
        suggestion: 'Optimize page load time to under 3 seconds',
      });
    }

    if (analysis.pageSize > 1024 * 1024) {
      findings.push({
        category: 'Performance',
        severity: 'warning',
        message: `Large page size (${(analysis.pageSize / 1024 / 1024).toFixed(2)}MB)`,
        suggestion: 'Reduce page size by optimizing images and minifying resources',
      });
    }

    // HTTPS check
    if (!url.startsWith('https://')) {
      findings.push({
        category: 'Security',
        severity: 'critical',
        message: 'Page not served over HTTPS',
        suggestion: 'Enable HTTPS for better security and SEO ranking',
      });
    }

    // Mobile viewport check
    const hasViewport = analysis.html.match(/<meta\s+name=["']viewport["']/i);
    if (!hasViewport) {
      findings.push({
        category: 'Mobile',
        severity: 'critical',
        message: 'Missing viewport meta tag',
        element: '<meta name="viewport">',
        suggestion: 'Add viewport meta tag for mobile responsiveness',
      });
    }

    return findings;
  }

  private calculateScore(findings: AuditFinding[]): number {
    let score = 100;

    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private async generateRecommendations(
    findings: AuditFinding[],
    url: string
  ): Promise<string[]> {
    // Build a summary of findings for AI
    const findingsSummary = findings.map(f => 
      `${f.severity.toUpperCase()}: ${f.category} - ${f.message}`
    ).join('\n');

    try {
      // Use AI to generate intelligent recommendations
      const aiResponse = await executiveSummary({
        reportText: `SEO Audit Findings for ${url}:\n\n${findingsSummary}\n\nProvide 3-5 prioritized action items to improve SEO.`,
        maxLength: 500
      });

      return aiResponse.actionItems.length > 0 
        ? aiResponse.actionItems 
        : this.getFallbackRecommendations(findings);
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      return this.getFallbackRecommendations(findings);
    }
  }

  private getFallbackRecommendations(findings: AuditFinding[]): string[] {
    const recommendations: string[] = [];
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const warningFindings = findings.filter(f => f.severity === 'warning');

    if (criticalFindings.length > 0) {
      recommendations.push(
        `Fix ${criticalFindings.length} critical issue(s) immediately: ${criticalFindings.map(f => f.message).join(', ')}`
      );
    }

    if (warningFindings.length > 0) {
      recommendations.push(
        `Address ${warningFindings.length} warning(s) to improve SEO performance`
      );
    }

    const metaIssues = findings.filter(f => f.category === 'Meta Tags');
    if (metaIssues.length > 0) {
      recommendations.push(
        'Optimize meta tags (title and description) for better search visibility'
      );
    }

    const contentIssues = findings.filter(f => f.category === 'Content Structure');
    if (contentIssues.length > 0) {
      recommendations.push(
        'Improve content structure with proper heading hierarchy (H1, H2, H3)'
      );
    }

    const accessibilityIssues = findings.filter(f => f.category === 'Accessibility');
    if (accessibilityIssues.length > 0) {
      recommendations.push(
        'Add alt text to images for better accessibility and SEO'
      );
    }

    return recommendations.slice(0, 5);
  }

  async runAudit(url: string): Promise<AuditResult> {
    const startTime = Date.now();

    // Fetch and parse the page
    const analysis = await this.fetchPage(url);

    // Analyze for issues
    const findings = this.analyzeFindings(analysis, url);

    // Calculate score
    const score = this.calculateScore(findings);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(findings, url);

    // Build metadata
    const metadata: AuditMetadata = {
      crawlTimeMs: Date.now() - startTime,
      pageSize: analysis.pageSize,
      loadTime: analysis.loadTime,
      resourceCount: analysis.images.length,
      totalLinks: analysis.links.length,
      internalLinks: analysis.links.filter(l => l.isInternal).length,
      externalLinks: analysis.links.filter(l => !l.isInternal).length,
    };

    return {
      score,
      findings,
      recommendations,
      metadata,
    };
  }
}

export const seoAuditor = new SEOAuditorService();
