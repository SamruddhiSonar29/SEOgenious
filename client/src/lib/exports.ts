import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download a string as a file
 */
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export keyword clusters to CSV
 */
export function exportKeywordClustersToCSV(clusters: Array<{ cluster: string; keywords: string[] }>) {
  // Create CSV header
  let csv = 'Cluster,Keywords,Keyword Count\n';
  
  // Add each cluster
  clusters.forEach((cluster) => {
    const keywords = cluster.keywords.join('; ');
    csv += `"${cluster.cluster}","${keywords}",${cluster.keywords.length}\n`;
  });
  
  // Download
  const filename = `keyword-clusters-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export keyword clusters to PDF
 */
export function exportKeywordClustersToPDF(clusters: Array<{ cluster: string; keywords: string[] }>) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Keyword Clusters Report', 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Table data
  const tableData = clusters.map((cluster) => [
    cluster.cluster,
    cluster.keywords.length.toString(),
    cluster.keywords.join(', ')
  ]);
  
  // Create table
  autoTable(doc, {
    startY: 35,
    head: [['Cluster', 'Count', 'Keywords']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Primary color
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 'auto' }
    }
  });
  
  // Download
  const filename = `keyword-clusters-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export content analysis to PDF
 */
export function exportContentAnalysisToPDF(analysis: {
  keyword: string;
  word_count: number;
  keyword_density: number;
  readability_score: number;
  suggestions: Array<{ type: string; text: string }>;
}) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Content Analysis Report', 14, 20);
  
  // Date and keyword
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Target Keyword: ${analysis.keyword}`, 14, 34);
  
  // Metrics section
  doc.setFontSize(14);
  doc.text('Content Metrics', 14, 45);
  
  doc.setFontSize(10);
  doc.text(`Word Count: ${analysis.word_count}`, 14, 53);
  doc.text(`Keyword Density: ${analysis.keyword_density}%`, 14, 59);
  doc.text(`Readability Score: ${analysis.readability_score}/100`, 14, 65);
  
  // Suggestions section
  doc.setFontSize(14);
  doc.text('Optimization Suggestions', 14, 78);
  
  // Create suggestions table
  const suggestionsData = analysis.suggestions.map((s, i) => [
    (i + 1).toString(),
    s.type.charAt(0).toUpperCase() + s.type.slice(1),
    s.text
  ]);
  
  autoTable(doc, {
    startY: 85,
    head: [['#', 'Type', 'Suggestion']],
    body: suggestionsData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' }
    }
  });
  
  // Download
  const filename = `content-analysis-${analysis.keyword.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export SERP competitor analysis to CSV
 */
export function exportSERPAnalysisToCSV(results: Array<{
  rank: number;
  url: string;
  word_count: number;
  content_angle: string;
  domain_authority: number;
}>) {
  // Create CSV header
  let csv = 'Rank,URL,Word Count,Content Angle,Domain Authority\n';
  
  // Add each result
  results.forEach((result) => {
    csv += `${result.rank},"${result.url}",${result.word_count},"${result.content_angle}",${result.domain_authority}\n`;
  });
  
  // Download
  const filename = `serp-analysis-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export SERP competitor analysis to PDF
 */
export function exportSERPAnalysisToPDF(
  keyword: string,
  results: Array<{
    rank: number;
    url: string;
    word_count: number;
    content_angle: string;
    domain_authority: number;
  }>
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('SERP Competitor Analysis', 14, 20);
  
  // Date and keyword
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Keyword: ${keyword}`, 14, 34);
  
  // Summary metrics
  const avgWords = Math.round(results.reduce((acc, r) => acc + r.word_count, 0) / results.length);
  const avgDA = Math.round(results.reduce((acc, r) => acc + r.domain_authority, 0) / results.length);
  
  doc.setFontSize(9);
  doc.text(`Average Word Count: ${avgWords} | Average Domain Authority: ${avgDA}`, 14, 42);
  
  // Table data
  const tableData = results.map((result) => [
    result.rank.toString(),
    new URL(result.url).hostname,
    result.word_count.toLocaleString(),
    result.content_angle,
    result.domain_authority.toString()
  ]);
  
  // Create table
  autoTable(doc, {
    startY: 48,
    head: [['Rank', 'Domain', 'Words', 'Content Angle', 'DA']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 35 },
      4: { cellWidth: 15, halign: 'center' }
    }
  });
  
  // Add note
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('DA = Domain Authority', 14, finalY + 10);
  
  // Download
  const filename = `serp-analysis-${keyword.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
