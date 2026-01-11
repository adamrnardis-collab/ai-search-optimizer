/**
 * PDF Report Generator
 * 
 * Generates a downloadable PDF report from analysis results.
 * Uses jsPDF for client-side PDF generation.
 */

import { jsPDF } from 'jspdf';
import type { AnalysisResult } from './analyzer';

export function generatePDFReport(result: AnalysisResult): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper functions
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    // Check if we need a new page
    if (y + (lines.length * fontSize * 0.4) > 280) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.4 + 3;
  };

  const addHeading = (text: string, level: 1 | 2 | 3 = 1) => {
    const sizes = { 1: 18, 2: 14, 3: 12 };
    y += level === 1 ? 5 : 3;
    addText(text, sizes[level], true);
    y += 2;
  };

  const addDivider = () => {
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const getGradeColor = (grade: string): [number, number, number] => {
    const colors: Record<string, [number, number, number]> = {
      'A': [34, 197, 94],
      'B': [132, 204, 22],
      'C': [250, 204, 21],
      'D': [249, 115, 22],
      'F': [239, 68, 68],
    };
    return colors[grade] || [100, 100, 100];
  };

  // === Header ===
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Search Optimization Report', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(result.timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }), margin, 35);

  y = 55;
  doc.setTextColor(0, 0, 0);

  // === URL & Score Summary ===
  addText(`URL: ${result.url}`, 10);
  y += 5;

  // Score box
  const gradeColor = getGradeColor(result.grade);
  doc.setFillColor(...gradeColor);
  doc.roundedRect(margin, y, 60, 30, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.score}`, margin + 15, y + 15);
  doc.setFontSize(12);
  doc.text(`Grade: ${result.grade}`, margin + 15, y + 25);
  
  doc.setTextColor(0, 0, 0);
  
  // Metadata next to score
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Domain: ${result.metadata.domain}`, margin + 70, y + 8);
  doc.text(`Word Count: ${result.metadata.wordCount}`, margin + 70, y + 16);
  doc.text(`Load Time: ${(result.metadata.loadTime / 1000).toFixed(1)}s`, margin + 70, y + 24);
  
  y += 40;
  addDivider();

  // === Category Scores ===
  addHeading('Category Breakdown', 2);
  
  const categoryNames: Record<string, string> = {
    contentStructure: 'Content Structure',
    citationReadiness: 'Citation Readiness',
    technicalSeo: 'Technical SEO',
    credibilitySignals: 'Credibility Signals',
    aiSpecificFactors: 'AI-Specific Factors',
  };

  Object.entries(result.categories).forEach(([key, cat]) => {
    const name = categoryNames[key] || key;
    const statusColor: [number, number, number] = 
      cat.status === 'good' ? [34, 197, 94] :
      cat.status === 'warning' ? [250, 204, 21] : [239, 68, 68];
    
    // Category row
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(name, margin, y);
    
    // Progress bar background
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin + 70, y - 4, 80, 6, 2, 2, 'F');
    
    // Progress bar fill
    doc.setFillColor(...statusColor);
    doc.roundedRect(margin + 70, y - 4, (cat.percentage / 100) * 80, 6, 2, 2, 'F');
    
    // Percentage
    doc.text(`${cat.percentage}%`, margin + 155, y);
    
    y += 10;
  });

  addDivider();

  // === Top Recommendations ===
  addHeading('Priority Recommendations', 2);
  
  result.topRecommendations.forEach((rec, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Priority badge
    const priorityColors: Record<string, [number, number, number]> = {
      critical: [239, 68, 68],
      high: [249, 115, 22],
      medium: [250, 204, 21],
      low: [34, 197, 94],
    };
    
    doc.setFillColor(...(priorityColors[rec.priority] || [100, 100, 100]));
    doc.roundedRect(margin, y - 3, 20, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(rec.priority.toUpperCase(), margin + 2, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${rec.title}`, margin + 25, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(rec.description, contentWidth - 25);
    doc.text(descLines, margin + 25, y);
    y += descLines.length * 4 + 2;
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    const howToLines = doc.splitTextToSize(`How to fix: ${rec.howToFix}`, contentWidth - 25);
    doc.text(howToLines, margin + 25, y);
    y += howToLines.length * 3.5 + 8;
    
    doc.setTextColor(0, 0, 0);
  });

  // === All Checks Summary ===
  doc.addPage();
  y = 20;
  
  addHeading('All Checks', 2);
  
  const checksByCategory: Record<string, typeof result.checks> = {};
  result.checks.forEach(check => {
    if (!checksByCategory[check.category]) {
      checksByCategory[check.category] = [];
    }
    checksByCategory[check.category].push(check);
  });

  Object.entries(checksByCategory).forEach(([category, checks]) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    addHeading(categoryNames[category] || category, 3);
    
    checks.forEach(check => {
      const icon = check.passed ? '✓' : '✗';
      const color: [number, number, number] = check.passed ? [34, 197, 94] : [239, 68, 68];
      
      doc.setTextColor(...color);
      doc.setFontSize(10);
      doc.text(icon, margin, y);
      
      doc.setTextColor(0, 0, 0);
      doc.text(check.name, margin + 8, y);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(`(${check.score}/${check.maxScore})`, margin + 100, y);
      
      y += 6;
    });
    
    y += 4;
  });

  // === Footer on last page ===
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by AI Search Optimizer Pro`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Generate and download PDF (client-side)
 */
export function downloadPDFReport(result: AnalysisResult): void {
  const doc = generatePDFReport(result);
  const filename = `ai-search-report-${result.metadata.domain}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
