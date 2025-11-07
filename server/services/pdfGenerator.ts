import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { executiveSummary } from './aiWrapper';
import type { Audit } from '@shared/schema';

interface RankHistoryData {
  keyword: string;
  targetUrl: string;
  currentRank: number | null;
  history: Array<{
    rank: number | null;
    checkedAt: Date;
  }>;
}

export class PDFGeneratorService {
  private addHeader(doc: jsPDF, title: string) {
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('SEOgenious', 20, 20);
    
    doc.setFontSize(16);
    doc.text(title, 20, 32);
    
    doc.setTextColor(0, 0, 0);
  }

  private addFooter(doc: jsPDF, pageNumber: number) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${format(new Date(), 'PPP')} | Page ${pageNumber}`,
      20,
      pageHeight - 10
    );
  }

  async generateSEOAuditReport(audit: Audit): Promise<Buffer> {
    const doc = new jsPDF();
    let currentY = 50;
    
    this.addHeader(doc, 'SEO Audit Report');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Website:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(audit.url, 60, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Audit Date:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(audit.createdAt), 'PPP'), 60, currentY);
    currentY += 20;
    
    const scoreColor = audit.score >= 80 ? [34, 197, 94] : audit.score >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(20, currentY, 60, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text(audit.score.toString(), 50, currentY + 22, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SEO Score', 50, currentY + 28, { align: 'center' });
    
    currentY += 45;
    
    if (audit.status === 'completed') {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 20, currentY);
      currentY += 10;
      
      const findings = (audit.findings as any[]) || [];
      const recommendations = (audit.recommendations as any[]) || [];
      
      const executiveSummary = await this.generateExecutiveSummary(audit.url, audit.score, findings, recommendations);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(executiveSummary, 170);
      doc.text(summaryLines, 20, currentY);
      currentY += summaryLines.length * 6 + 15;
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Findings', 20, currentY);
      currentY += 10;
      
      if (findings.length > 0) {
        const findingsTableData = findings.map(f => [
          f.severity === 'critical' ? '🔴 Critical' : f.severity === 'warning' ? '🟡 Warning' : '🟢 Info',
          f.category,
          f.message
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['Severity', 'Category', 'Issue']],
          body: findingsTableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 20, right: 20 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('No issues found.', 20, currentY);
        currentY += 15;
      }
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 20, currentY);
      currentY += 10;
      
      if (recommendations.length > 0) {
        const recommendationsTableData = recommendations.map((r, idx) => [
          (idx + 1).toString(),
          r.title,
          r.description
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['#', 'Action', 'Details']],
          body: recommendationsTableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 20, right: 20 },
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('No recommendations available.', 20, currentY);
      }
    }
    
    this.addFooter(doc, 1);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateRankTrackingReport(data: RankHistoryData): Promise<Buffer> {
    const doc = new jsPDF();
    let currentY = 50;
    
    this.addHeader(doc, 'Rank Tracking Report');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Keyword:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.keyword, 60, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Target URL:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.targetUrl, 60, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Current Rank:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.currentRank ? `#${data.currentRank}` : 'Not Ranked', 60, currentY);
    currentY += 20;
    
    if (data.history.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Rank History', 20, currentY);
      currentY += 10;
      
      const historyTableData = data.history.map(h => [
        format(new Date(h.checkedAt), 'PPP p'),
        h.rank ? `#${h.rank}` : 'Not Ranked'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Rank Position']],
        body: historyTableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 20, right: 20 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Analysis', 20, currentY);
      currentY += 10;
      
      const analysis = await this.generateRankingAnalysis(data.keyword, data.history);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const analysisLines = doc.splitTextToSize(analysis, 170);
      doc.text(analysisLines, 20, currentY);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.text('No rank history available yet.', 20, currentY);
    }
    
    this.addFooter(doc, 1);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  private async generateExecutiveSummary(
    url: string,
    score: number,
    findings: any[],
    recommendations: any[]
  ): Promise<string> {
    const criticalIssues = findings.filter(f => f.severity === 'critical').length;
    const warningIssues = findings.filter(f => f.severity === 'warning').length;
    
    const reportText = `SEO Audit Report for ${url}

Overall Score: ${score}/100

Key Findings:
- ${criticalIssues} critical issues identified
- ${warningIssues} warnings found
- ${recommendations.length} actionable recommendations provided

Issues by Category:
${findings.slice(0, 5).map(f => `- ${f.category}: ${f.message}`).join('\n')}

Top Recommendations:
${recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}: ${r.description}`).join('\n')}`;

    try {
      const result = await executiveSummary({ reportText, maxLength: 150 });
      return result.summary;
    } catch (error) {
      return `This SEO audit analyzed ${url} and assigned a score of ${score}/100. The audit identified ${criticalIssues} critical issues and ${warningIssues} warnings that require attention. ${recommendations.length} actionable recommendations have been provided to improve the site's search engine optimization. Review the detailed findings below to understand specific areas for improvement.`;
    }
  }

  private async generateRankingAnalysis(
    keyword: string,
    history: Array<{ rank: number | null; checkedAt: Date }>
  ): Promise<string> {
    const rankedHistory = history.filter(h => h.rank !== null);
    
    if (rankedHistory.length === 0) {
      return `The keyword "${keyword}" has not achieved ranking in the top 100 positions during the tracked period.`;
    }
    
    const latestRank = rankedHistory[rankedHistory.length - 1]?.rank || 0;
    const earliestRank = rankedHistory[0]?.rank || 0;
    const improvement = earliestRank - latestRank;
    
    const reportText = `Keyword Ranking Analysis for "${keyword}"

Initial Rank: #${earliestRank}
Current Rank: #${latestRank}
Position Change: ${improvement > 0 ? `Improved by ${improvement} positions` : improvement < 0 ? `Declined by ${Math.abs(improvement)} positions` : 'No change'}
Total Checks: ${history.length}

Historical Data:
${rankedHistory.slice(0, 5).map(h => `- ${format(new Date(h.checkedAt), 'MMM d, yyyy')}: #${h.rank}`).join('\n')}`;

    try {
      const result = await executiveSummary({ reportText, maxLength: 100 });
      return result.summary;
    } catch (error) {
      if (improvement > 0) {
        return `The keyword "${keyword}" has improved by ${improvement} positions, moving from #${earliestRank} to #${latestRank}. This positive trend indicates your SEO efforts are working. Continue monitoring and optimizing to maintain this upward momentum.`;
      } else if (improvement < 0) {
        return `The keyword "${keyword}" has decreased by ${Math.abs(improvement)} positions, moving from #${earliestRank} to #${latestRank}. This decline warrants attention. Review recent changes and competitor activity to identify opportunities for improvement.`;
      } else {
        return `The keyword "${keyword}" has maintained a stable position at #${latestRank}. Consistent ranking is good, but there may be opportunities to push higher with targeted optimization efforts.`;
      }
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
