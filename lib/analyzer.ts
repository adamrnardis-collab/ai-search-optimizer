/**
 * AI Search Optimizer - Lightweight Page Analyzer
 * 
 * Uses cheerio (fast, serverless-friendly) for HTML parsing
 * and Claude AI for intelligent analysis.
 */

import * as cheerio from 'cheerio';
import { analyzeWithClaude, type AIAnalysis } from './claude-analyzer';

// ============================================
// Types
// ============================================

export interface AnalysisResult {
  url: string;
  timestamp: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  categories: {
    contentStructure: CategoryScore;
    citationReadiness: CategoryScore;
    technicalSeo: CategoryScore;
    credibilitySignals: CategoryScore;
    aiSpecificFactors: CategoryScore;
  };
  
  checks: Check[];
  
  metadata: {
    title: string;
    description: string;
    wordCount: number;
    loadTime: number;
    domain: string;
    readabilityScore: number;
    readabilityGrade: string;
  };
  
  topRecommendations: Recommendation[];
  allRecommendations: Recommendation[];
  
  insights: {
    citationPreviews: CitationPreview[];
    questionsAnswered: string[];
    entities: ExtractedEntity[];
    quotableSnippets: QuotableSnippet[];
    contentGaps: ContentGap[];
    platformTips: PlatformTip[];
  };
  
  aiAnalysis?: AIAnalysis;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  percentage: number;
  status: 'good' | 'warning' | 'poor';
}

export interface Check {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
}

export interface Recommendation {
  id: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  howToFix: string;
  codeExample?: string;
}

export interface CitationPreview {
  query: string;
  citation: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'organization' | 'product' | 'concept' | 'location' | 'date';
  mentions: number;
  context: string;
}

export interface QuotableSnippet {
  text: string;
  type: 'statistic' | 'definition' | 'fact' | 'claim' | 'answer';
  strength: 'strong' | 'medium' | 'weak';
  suggestion?: string;
}

export interface ContentGap {
  topic: string;
  reason: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PlatformTip {
  platform: 'ChatGPT' | 'Perplexity' | 'Claude' | 'Google AI' | 'All';
  tip: string;
  implemented: boolean;
}

// ============================================
// Main Analysis Function
// ============================================

export async function analyzeUrl(url: string, includeAI: boolean = true): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  console.log(`[Analyzer] Fetching: ${url}`);
  
  // Fetch the page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const loadTime = Date.now() - startTime;
  
  console.log(`[Analyzer] Fetched in ${loadTime}ms, parsing...`);

  // Parse with cheerio (fast!)
  const $ = cheerio.load(html);
  
  // Remove script/style content
  $('script, style, noscript, iframe').remove();
  
  // Extract text content
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  // Extract metadata
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';
  const description = $('meta[name="description"]').attr('content') || '';
  const domain = new URL(url).hostname.replace(/^www\./, '');
  
  // Calculate readability
  const { score: readabilityScore, grade: readabilityGrade } = calculateReadability(textContent);

  // Run checks
  const checks = runAllChecks($, html, textContent, loadTime);
  
  // Calculate scores
  const categories = calculateCategoryScores(checks);
  
  const totalScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);
  const maxScore = Object.values(categories).reduce((sum, cat) => sum + cat.maxScore, 0);
  let score = Math.round((totalScore / maxScore) * 100);
  
  // Generate recommendations
  const allRecommendations = generateRecommendations(checks);
  const topRecommendations = allRecommendations.slice(0, 5);

  // Generate insights
  const insights = generateInsights($, textContent, title, domain, checks);

  // Extract headings for Claude
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  // Run Claude AI analysis
  let aiAnalysis: AIAnalysis | undefined;
  
  if (includeAI && process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('[Analyzer] Running Claude analysis...');
      aiAnalysis = await analyzeWithClaude(
        textContent.slice(0, 8000),
        title,
        url,
        {
          wordCount,
          hasSchema: checks.find(c => c.id === 'schema-markup')?.passed || false,
          hasFAQ: checks.find(c => c.id === 'faq-section')?.passed || false,
          hasAuthor: checks.find(c => c.id === 'author-info')?.passed || false,
          headings: headings.slice(0, 10),
        }
      );
      
      // Blend scores if AI analysis succeeded
      if (aiAnalysis.aiReadinessScore && aiAnalysis.aiReadinessScore > 0) {
        score = Math.round(aiAnalysis.aiReadinessScore * 0.6 + score * 0.4);
      }
      console.log('[Analyzer] Claude analysis complete');
    } catch (error) {
      console.error('[Analyzer] Claude analysis failed:', error);
    }
  }
  
  const grade = scoreToGrade(score);

  return {
    url,
    timestamp: new Date().toISOString(),
    score,
    grade,
    categories,
    checks,
    metadata: {
      title,
      description,
      wordCount,
      loadTime,
      domain,
      readabilityScore,
      readabilityGrade,
    },
    topRecommendations,
    allRecommendations,
    insights,
    aiAnalysis,
  };
}

// ============================================
// Readability Calculator
// ============================================

function calculateReadability(text: string): { score: number; grade: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) {
    return { score: 50, grade: 'N/A' };
  }
  
  const avgWordsPerSentence = words.length / sentences.length;
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  const score = Math.max(0, Math.min(100, Math.round(fleschScore)));
  
  let grade: string;
  if (score >= 80) grade = 'Easy';
  else if (score >= 60) grade = 'Standard';
  else if (score >= 40) grade = 'Hard';
  else grade = 'Very Hard';
  
  return { score, grade };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// ============================================
// Checks
// ============================================

function runAllChecks(
  $: cheerio.CheerioAPI,
  html: string,
  textContent: string,
  loadTime: number
): Check[] {
  const checks: Check[] = [];
  const textLower = textContent.toLowerCase();

  // Content Structure
  const h1Count = $('h1').length;
  checks.push({
    id: 'single-h1',
    category: 'contentStructure',
    name: 'Single H1 Tag',
    passed: h1Count === 1,
    score: h1Count === 1 ? 10 : 0,
    maxScore: 10,
    details: h1Count === 1 ? 'Good: Page has one H1' : `Found ${h1Count} H1 tags`,
  });

  const h2Count = $('h2').length;
  checks.push({
    id: 'subheadings',
    category: 'contentStructure',
    name: 'Uses Subheadings',
    passed: h2Count >= 2,
    score: h2Count >= 2 ? 10 : h2Count >= 1 ? 5 : 0,
    maxScore: 10,
    details: `Found ${h2Count} H2 subheadings`,
  });

  const wordCount = textContent.split(/\s+/).length;
  checks.push({
    id: 'content-length',
    category: 'contentStructure',
    name: 'Sufficient Content',
    passed: wordCount >= 500,
    score: wordCount >= 500 ? 10 : wordCount >= 300 ? 5 : 0,
    maxScore: 10,
    details: `${wordCount} words`,
  });

  const hasFAQ = textLower.includes('faq') || textLower.includes('frequently asked') || $('*[itemtype*="FAQPage"]').length > 0;
  checks.push({
    id: 'faq-section',
    category: 'contentStructure',
    name: 'FAQ Section',
    passed: hasFAQ,
    score: hasFAQ ? 15 : 0,
    maxScore: 15,
    details: hasFAQ ? 'FAQ section detected' : 'No FAQ section found',
  });

  // Citation Readiness
  const hasStats = /\d+%|\$[\d,]+|\d+\s*(million|billion|percent)/i.test(textContent);
  checks.push({
    id: 'statistics',
    category: 'citationReadiness',
    name: 'Contains Statistics',
    passed: hasStats,
    score: hasStats ? 15 : 0,
    maxScore: 15,
    details: hasStats ? 'Statistics/numbers found' : 'No statistics found',
  });

  const hasDefinitions = /\b(is defined as|refers to|is a type of|means)\b/i.test(textContent);
  checks.push({
    id: 'definitions',
    category: 'citationReadiness',
    name: 'Clear Definitions',
    passed: hasDefinitions,
    score: hasDefinitions ? 10 : 0,
    maxScore: 10,
    details: hasDefinitions ? 'Definition patterns found' : 'No clear definitions',
  });

  // Technical SEO
  const hasSchema = html.includes('application/ld+json') || html.includes('itemtype=');
  checks.push({
    id: 'schema-markup',
    category: 'technicalSeo',
    name: 'Schema Markup',
    passed: hasSchema,
    score: hasSchema ? 15 : 0,
    maxScore: 15,
    details: hasSchema ? 'Structured data found' : 'No schema markup',
  });

  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const hasMetaDesc = metaDesc.length >= 50 && metaDesc.length <= 160;
  checks.push({
    id: 'meta-description',
    category: 'technicalSeo',
    name: 'Meta Description',
    passed: hasMetaDesc,
    score: hasMetaDesc ? 10 : metaDesc.length > 0 ? 5 : 0,
    maxScore: 10,
    details: metaDesc.length > 0 ? `${metaDesc.length} chars` : 'Missing',
  });

  const hasCanonical = $('link[rel="canonical"]').length > 0;
  checks.push({
    id: 'canonical-url',
    category: 'technicalSeo',
    name: 'Canonical URL',
    passed: hasCanonical,
    score: hasCanonical ? 5 : 0,
    maxScore: 5,
    details: hasCanonical ? 'Canonical set' : 'No canonical URL',
  });

  checks.push({
    id: 'page-speed',
    category: 'technicalSeo',
    name: 'Page Speed',
    passed: loadTime < 3000,
    score: loadTime < 2000 ? 10 : loadTime < 3000 ? 5 : 0,
    maxScore: 10,
    details: `Loaded in ${(loadTime / 1000).toFixed(1)}s`,
  });

  // Credibility
  const hasAuthor = /\b(author|written by|by\s+[A-Z])/i.test(html) || $('[rel="author"], .author, #author').length > 0;
  checks.push({
    id: 'author-info',
    category: 'credibilitySignals',
    name: 'Author Information',
    passed: hasAuthor,
    score: hasAuthor ? 10 : 0,
    maxScore: 10,
    details: hasAuthor ? 'Author info found' : 'No author information',
  });

  const hasDate = /\b(published|updated|posted)\s*(on|:)?\s*\w+\s+\d/i.test(html) || $('time, [datetime]').length > 0;
  checks.push({
    id: 'publish-date',
    category: 'credibilitySignals',
    name: 'Publish Date',
    passed: hasDate,
    score: hasDate ? 10 : 0,
    maxScore: 10,
    details: hasDate ? 'Date found' : 'No publish date',
  });

  const externalLinks = $('a[href^="http"]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return !href.includes(new URL(url).hostname);
  }).length;
  checks.push({
    id: 'external-links',
    category: 'credibilitySignals',
    name: 'Source Citations',
    passed: externalLinks >= 2,
    score: externalLinks >= 2 ? 10 : externalLinks >= 1 ? 5 : 0,
    maxScore: 10,
    details: `${externalLinks} external links`,
  });

  // AI-Specific
  const firstPara = $('p').first().text();
  const answersUpfront = firstPara.length > 50 && /\b(is|are|was|means|refers)\b/i.test(firstPara);
  checks.push({
    id: 'upfront-answer',
    category: 'aiSpecificFactors',
    name: 'Answers Upfront',
    passed: answersUpfront,
    score: answersUpfront ? 15 : 0,
    maxScore: 15,
    details: answersUpfront ? 'Direct answer in first paragraph' : 'No upfront answer',
  });

  const hasTOC = textLower.includes('table of contents') || $('nav a[href^="#"], .toc, #toc').length > 3;
  checks.push({
    id: 'table-of-contents',
    category: 'aiSpecificFactors',
    name: 'Table of Contents',
    passed: hasTOC,
    score: hasTOC ? 5 : 0,
    maxScore: 5,
    details: hasTOC ? 'TOC found' : 'No table of contents',
  });

  return checks;
}

// ============================================
// Score Calculation
// ============================================

function calculateCategoryScores(checks: Check[]): AnalysisResult['categories'] {
  const categoryMap: Record<string, { score: number; maxScore: number }> = {
    contentStructure: { score: 0, maxScore: 0 },
    citationReadiness: { score: 0, maxScore: 0 },
    technicalSeo: { score: 0, maxScore: 0 },
    credibilitySignals: { score: 0, maxScore: 0 },
    aiSpecificFactors: { score: 0, maxScore: 0 },
  };

  for (const check of checks) {
    if (categoryMap[check.category]) {
      categoryMap[check.category].score += check.score;
      categoryMap[check.category].maxScore += check.maxScore;
    }
  }

  const result: AnalysisResult['categories'] = {} as AnalysisResult['categories'];
  
  for (const [key, value] of Object.entries(categoryMap)) {
    const percentage = value.maxScore > 0 ? Math.round((value.score / value.maxScore) * 100) : 0;
    result[key as keyof AnalysisResult['categories']] = {
      score: value.score,
      maxScore: value.maxScore,
      percentage,
      status: percentage >= 70 ? 'good' : percentage >= 40 ? 'warning' : 'poor',
    };
  }

  return result;
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ============================================
// Recommendations
// ============================================

function generateRecommendations(checks: Check[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const failedChecks = checks.filter(c => !c.passed);
  
  for (const check of failedChecks) {
    const rec = getRecommendation(check);
    if (rec) recommendations.push(rec);
  }

  // Sort by priority
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return recommendations;
}

function getRecommendation(check: Check): Recommendation | null {
  const recs: Record<string, Omit<Recommendation, 'id'>> = {
    'schema-markup': {
      category: 'Technical',
      priority: 'critical',
      title: 'Add Schema.org Markup',
      description: 'Structured data helps AI understand your content.',
      impact: 'High - significantly improves AI discoverability',
      howToFix: 'Add JSON-LD structured data to your page.',
      codeExample: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article",...}</script>',
    },
    'faq-section': {
      category: 'Content',
      priority: 'high',
      title: 'Add FAQ Section',
      description: 'FAQs are highly cited by AI assistants.',
      impact: 'High - FAQs provide perfect citation material',
      howToFix: 'Add 5-10 frequently asked questions with concise answers.',
    },
    'statistics': {
      category: 'Content',
      priority: 'high',
      title: 'Add Statistics',
      description: 'AI prefers citing specific numbers and data.',
      impact: 'High - statistics make content more authoritative',
      howToFix: 'Include specific percentages, dollar amounts, or measurable outcomes.',
    },
    'author-info': {
      category: 'Credibility',
      priority: 'high',
      title: 'Add Author Information',
      description: 'Author attribution increases credibility.',
      impact: 'Medium - helps AI trust your content',
      howToFix: 'Add author name, bio, and credentials.',
    },
    'upfront-answer': {
      category: 'AI Optimization',
      priority: 'high',
      title: 'Answer Questions Upfront',
      description: 'AI prefers content that answers directly.',
      impact: 'High - first paragraph is often quoted',
      howToFix: 'Start with a clear answer or definition in your first paragraph.',
    },
    'meta-description': {
      category: 'Technical',
      priority: 'medium',
      title: 'Improve Meta Description',
      description: 'Meta description helps AI understand page content.',
      impact: 'Medium - improves content discovery',
      howToFix: 'Write a 120-160 character description summarizing your content.',
    },
  };

  const rec = recs[check.id];
  if (!rec) return null;

  return { id: check.id, ...rec };
}

// ============================================
// Insights (simplified)
// ============================================

function generateInsights(
  $: cheerio.CheerioAPI,
  textContent: string,
  title: string,
  domain: string,
  checks: Check[]
): AnalysisResult['insights'] {
  return {
    citationPreviews: [],
    questionsAnswered: extractQuestions(textContent, title),
    entities: [],
    quotableSnippets: findQuotableSnippets(textContent),
    contentGaps: identifyContentGaps(checks),
    platformTips: generatePlatformTips(checks),
  };
}

function extractQuestions(text: string, title: string): string[] {
  const questions: string[] = [];
  
  if (title.toLowerCase().includes('how to')) {
    questions.push(title + '?');
  }
  if (title.toLowerCase().includes('what is')) {
    questions.push(title + '?');
  }
  
  // Look for question patterns in content
  const matches = text.match(/\b(what|how|why|when|where|who|which)\s+[^.?]+\?/gi);
  if (matches) {
    questions.push(...matches.slice(0, 5));
  }
  
  return [...new Set(questions)].slice(0, 6);
}

function findQuotableSnippets(text: string): QuotableSnippet[] {
  const snippets: QuotableSnippet[] = [];
  const sentences = text.split(/[.!]/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 200);
  
  for (const sentence of sentences.slice(0, 20)) {
    if (/\d+%|\$[\d,]+/.test(sentence)) {
      snippets.push({ text: sentence, type: 'statistic', strength: 'strong' });
    } else if (/\b(is defined as|refers to|means)\b/i.test(sentence)) {
      snippets.push({ text: sentence, type: 'definition', strength: 'strong' });
    }
  }
  
  return snippets.slice(0, 5);
}

function identifyContentGaps(checks: Check[]): ContentGap[] {
  const gaps: ContentGap[] = [];
  
  if (!checks.find(c => c.id === 'faq-section')?.passed) {
    gaps.push({
      topic: 'FAQ Section',
      reason: 'FAQs are highly cited by AI',
      suggestion: 'Add 5-10 common questions with concise answers',
      priority: 'high',
    });
  }
  
  if (!checks.find(c => c.id === 'statistics')?.passed) {
    gaps.push({
      topic: 'Statistics & Data',
      reason: 'AI prefers specific numbers',
      suggestion: 'Add percentages, metrics, or data points',
      priority: 'high',
    });
  }
  
  if (!checks.find(c => c.id === 'schema-markup')?.passed) {
    gaps.push({
      topic: 'Structured Data',
      reason: 'Schema helps AI understand content type',
      suggestion: 'Add JSON-LD schema markup',
      priority: 'high',
    });
  }
  
  return gaps;
}

function generatePlatformTips(checks: Check[]): PlatformTip[] {
  const hasSchema = checks.find(c => c.id === 'schema-markup')?.passed;
  const hasFAQ = checks.find(c => c.id === 'faq-section')?.passed;
  const hasStats = checks.find(c => c.id === 'statistics')?.passed;
  
  return [
    {
      platform: 'Perplexity',
      tip: 'Include statistics and source citations',
      implemented: !!hasStats,
    },
    {
      platform: 'ChatGPT',
      tip: 'Add FAQ sections with clear Q&A format',
      implemented: !!hasFAQ,
    },
    {
      platform: 'Google AI',
      tip: 'Use Schema.org structured data',
      implemented: !!hasSchema,
    },
    {
      platform: 'All',
      tip: 'Answer questions in the first paragraph',
      implemented: checks.find(c => c.id === 'upfront-answer')?.passed || false,
    },
  ];
}
