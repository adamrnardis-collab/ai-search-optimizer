/**
 * AI Search Optimizer - Page Analyzer
 * 
 * Analyzes a webpage for AI search readiness and generates
 * actionable optimization recommendations.
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// ============================================
// Types
// ============================================

export interface AnalysisResult {
  url: string;
  timestamp: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // Category scores (0-100)
  categories: {
    contentStructure: CategoryScore;
    citationReadiness: CategoryScore;
    technicalSeo: CategoryScore;
    credibilitySignals: CategoryScore;
    aiSpecificFactors: CategoryScore;
  };
  
  // Individual checks
  checks: Check[];
  
  // Page metadata
  metadata: {
    title: string;
    description: string;
    wordCount: number;
    loadTime: number;
    domain: string;
  };
  
  // Top recommendations (prioritized)
  topRecommendations: Recommendation[];
  
  // All recommendations by category
  allRecommendations: Recommendation[];
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

// ============================================
// Main Analysis Function
// ============================================

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  // Fetch the page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AISearchOptimizer/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const loadTime = Date.now() - startTime;

  // Parse with JSDOM
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Extract content with Readability
  const reader = new Readability(document.cloneNode(true) as Document);
  const article = reader.parse();
  const textContent = article?.textContent || '';
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  // Extract metadata
  const title = extractTitle(document);
  const description = extractDescription(document);
  const domain = new URL(url).hostname.replace(/^www\./, '');

  // Run all checks
  const checks = runAllChecks(document, html, textContent, loadTime);
  
  // Calculate category scores
  const categories = calculateCategoryScores(checks);
  
  // Calculate overall score
  const totalScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);
  const maxScore = Object.values(categories).reduce((sum, cat) => sum + cat.maxScore, 0);
  const score = Math.round((totalScore / maxScore) * 100);
  
  // Determine grade
  const grade = scoreToGrade(score);
  
  // Generate recommendations
  const allRecommendations = generateRecommendations(checks);
  const topRecommendations = allRecommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 5);

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
    },
    topRecommendations,
    allRecommendations,
  };
}

// ============================================
// Check Functions
// ============================================

function runAllChecks(
  document: Document,
  html: string,
  textContent: string,
  loadTime: number
): Check[] {
  const checks: Check[] = [];

  // === Content Structure Checks ===
  
  checks.push(checkHeadingHierarchy(document));
  checks.push(checkHasH1(document));
  checks.push(checkSubheadings(document));
  checks.push(checkParagraphStructure(document));
  checks.push(checkHasFAQSection(document, textContent));
  checks.push(checkHasDefinitions(textContent));
  checks.push(checkContentLength(textContent));
  checks.push(checkHasLists(document));

  // === Citation Readiness Checks ===
  
  checks.push(checkHasStatistics(textContent));
  checks.push(checkHasQuotableStatements(textContent));
  checks.push(checkHasSpecificClaims(textContent));
  checks.push(checkSentenceClarity(textContent));
  checks.push(checkHasDatesAndTimelines(textContent));

  // === Technical SEO Checks ===
  
  checks.push(checkHasSchemaMarkup(document, html));
  checks.push(checkMetaTitle(document));
  checks.push(checkMetaDescription(document));
  checks.push(checkOpenGraphTags(document));
  checks.push(checkCanonicalUrl(document));
  checks.push(checkPageSpeed(loadTime));
  checks.push(checkMobileViewport(document));
  checks.push(checkHasAltText(document));

  // === Credibility Signals Checks ===
  
  checks.push(checkHasAuthorInfo(document, html));
  checks.push(checkHasPublishDate(document, html));
  checks.push(checkHasAboutSection(document));
  checks.push(checkHasSourceCitations(document, textContent));
  checks.push(checkHasExternalLinks(document));

  // === AI-Specific Factors Checks ===
  
  checks.push(checkAnswersQuestionUpfront(textContent));
  checks.push(checkHasTableOfContents(document));
  checks.push(checkHasSummarySection(document, textContent));
  checks.push(checkNoPaywallDetected(document, html));
  checks.push(checkContentAccessibility(document));

  return checks;
}

// --- Content Structure Checks ---

function checkHeadingHierarchy(document: Document): Check {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const levels: number[] = [];
  
  headings.forEach(h => {
    levels.push(parseInt(h.tagName[1]));
  });

  // Check for proper hierarchy (no skipping levels)
  let properHierarchy = true;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      properHierarchy = false;
      break;
    }
  }

  return {
    id: 'heading-hierarchy',
    category: 'contentStructure',
    name: 'Heading Hierarchy',
    passed: properHierarchy && levels.length >= 3,
    score: properHierarchy && levels.length >= 3 ? 10 : levels.length >= 2 ? 5 : 0,
    maxScore: 10,
    details: properHierarchy 
      ? `Good heading structure with ${levels.length} headings`
      : 'Heading levels are skipped or missing',
  };
}

function checkHasH1(document: Document): Check {
  const h1s = document.querySelectorAll('h1');
  const hasOne = h1s.length === 1;
  
  return {
    id: 'single-h1',
    category: 'contentStructure',
    name: 'Single H1 Tag',
    passed: hasOne,
    score: hasOne ? 10 : 0,
    maxScore: 10,
    details: hasOne 
      ? 'Page has exactly one H1 tag'
      : h1s.length === 0 ? 'Missing H1 tag' : `Multiple H1 tags found (${h1s.length})`,
  };
}

function checkSubheadings(document: Document): Check {
  const h2s = document.querySelectorAll('h2');
  const h3s = document.querySelectorAll('h3');
  const hasGoodStructure = h2s.length >= 2 && h3s.length >= 1;

  return {
    id: 'subheadings',
    category: 'contentStructure',
    name: 'Descriptive Subheadings',
    passed: hasGoodStructure,
    score: hasGoodStructure ? 10 : h2s.length >= 1 ? 5 : 0,
    maxScore: 10,
    details: `Found ${h2s.length} H2 tags and ${h3s.length} H3 tags`,
  };
}

function checkParagraphStructure(document: Document): Check {
  const paragraphs = document.querySelectorAll('p');
  const goodParagraphs = Array.from(paragraphs).filter(p => {
    const text = p.textContent || '';
    const wordCount = text.split(/\s+/).length;
    return wordCount >= 20 && wordCount <= 150;
  });

  const ratio = paragraphs.length > 0 ? goodParagraphs.length / paragraphs.length : 0;
  const passed = ratio >= 0.5;

  return {
    id: 'paragraph-structure',
    category: 'contentStructure',
    name: 'Well-Structured Paragraphs',
    passed,
    score: passed ? 8 : ratio >= 0.3 ? 4 : 0,
    maxScore: 8,
    details: `${goodParagraphs.length}/${paragraphs.length} paragraphs are well-sized (20-150 words)`,
  };
}

function checkHasFAQSection(document: Document, textContent: string): Check {
  const hasFAQHeading = /faq|frequently asked|common questions/i.test(textContent);
  const hasQuestionAnswerPattern = (textContent.match(/\?[\s\S]{10,200}[.!]/g) || []).length >= 3;
  const hasSchemaFAQ = document.querySelector('script[type="application/ld+json"]')?.textContent?.includes('FAQPage');

  const passed = hasFAQHeading || hasSchemaFAQ || hasQuestionAnswerPattern;

  return {
    id: 'faq-section',
    category: 'contentStructure',
    name: 'FAQ Section',
    passed,
    score: hasSchemaFAQ ? 15 : passed ? 10 : 0,
    maxScore: 15,
    details: passed 
      ? hasSchemaFAQ ? 'Has FAQ with Schema markup' : 'FAQ section detected'
      : 'No FAQ section found',
  };
}

function checkHasDefinitions(textContent: string): Check {
  const definitionPatterns = [
    /is defined as/gi,
    /refers to/gi,
    /means that/gi,
    /is a type of/gi,
    /\bis\b[^.]{5,50}that/gi,
  ];

  let count = 0;
  definitionPatterns.forEach(pattern => {
    count += (textContent.match(pattern) || []).length;
  });

  const passed = count >= 2;

  return {
    id: 'definitions',
    category: 'contentStructure',
    name: 'Clear Definitions',
    passed,
    score: passed ? 8 : count >= 1 ? 4 : 0,
    maxScore: 8,
    details: `Found ${count} definition-style statements`,
  };
}

function checkContentLength(textContent: string): Check {
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  const passed = wordCount >= 800;
  const good = wordCount >= 1500;

  return {
    id: 'content-length',
    category: 'contentStructure',
    name: 'Content Depth',
    passed: passed,
    score: good ? 10 : passed ? 7 : wordCount >= 400 ? 3 : 0,
    maxScore: 10,
    details: `${wordCount} words (recommended: 800+)`,
  };
}

function checkHasLists(document: Document): Check {
  const uls = document.querySelectorAll('ul');
  const ols = document.querySelectorAll('ol');
  const totalLists = uls.length + ols.length;
  const passed = totalLists >= 2;

  return {
    id: 'has-lists',
    category: 'contentStructure',
    name: 'Structured Lists',
    passed,
    score: passed ? 6 : totalLists >= 1 ? 3 : 0,
    maxScore: 6,
    details: `Found ${totalLists} lists (${uls.length} bulleted, ${ols.length} numbered)`,
  };
}

// --- Citation Readiness Checks ---

function checkHasStatistics(textContent: string): Check {
  const statPatterns = [
    /\d+(\.\d+)?%/g,
    /\d+(\.\d+)?\s*(million|billion|thousand)/gi,
    /\$\d+/g,
    /£\d+/g,
    /€\d+/g,
    /increased by \d+/gi,
    /decreased by \d+/gi,
    /\d+x (faster|more|better|higher|lower)/gi,
  ];

  let count = 0;
  statPatterns.forEach(pattern => {
    count += (textContent.match(pattern) || []).length;
  });

  const passed = count >= 3;

  return {
    id: 'statistics',
    category: 'citationReadiness',
    name: 'Specific Statistics',
    passed,
    score: passed ? 15 : count >= 1 ? 7 : 0,
    maxScore: 15,
    details: `Found ${count} statistics/numbers`,
  };
}

function checkHasQuotableStatements(textContent: string): Check {
  // Look for short, declarative sentences that could be quoted
  const sentences = textContent.split(/[.!?]+/).filter(s => {
    const trimmed = s.trim();
    const wordCount = trimmed.split(/\s+/).length;
    return wordCount >= 8 && wordCount <= 25;
  });

  const quotable = sentences.filter(s => {
    // Check for factual patterns
    return /\b(is|are|was|were|has|have|can|will|should|must)\b/i.test(s) &&
           !/\b(I think|maybe|perhaps|probably|might)\b/i.test(s);
  });

  const passed = quotable.length >= 5;

  return {
    id: 'quotable-statements',
    category: 'citationReadiness',
    name: 'Quotable Statements',
    passed,
    score: passed ? 15 : quotable.length >= 2 ? 7 : 0,
    maxScore: 15,
    details: `Found ${quotable.length} clear, quotable sentences`,
  };
}

function checkHasSpecificClaims(textContent: string): Check {
  const claimPatterns = [
    /research shows/gi,
    /studies (show|indicate|suggest|found)/gi,
    /according to/gi,
    /evidence suggests/gi,
    /data (shows|indicates)/gi,
    /proven to/gi,
    /has been shown to/gi,
  ];

  let count = 0;
  claimPatterns.forEach(pattern => {
    count += (textContent.match(pattern) || []).length;
  });

  const passed = count >= 2;

  return {
    id: 'specific-claims',
    category: 'citationReadiness',
    name: 'Evidence-Backed Claims',
    passed,
    score: passed ? 12 : count >= 1 ? 6 : 0,
    maxScore: 12,
    details: `Found ${count} evidence-backed claim phrases`,
  };
}

function checkSentenceClarity(textContent: string): Check {
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Check for overly complex sentences (too many commas, very long)
  const clearSentences = sentences.filter(s => {
    const commas = (s.match(/,/g) || []).length;
    const words = s.split(/\s+/).length;
    return commas <= 3 && words <= 35;
  });

  const ratio = sentences.length > 0 ? clearSentences.length / sentences.length : 0;
  const passed = ratio >= 0.7;

  return {
    id: 'sentence-clarity',
    category: 'citationReadiness',
    name: 'Sentence Clarity',
    passed,
    score: passed ? 8 : ratio >= 0.5 ? 4 : 0,
    maxScore: 8,
    details: `${Math.round(ratio * 100)}% of sentences are clear and concise`,
  };
}

function checkHasDatesAndTimelines(textContent: string): Check {
  const datePatterns = [
    /\b(19|20)\d{2}\b/g,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
    /as of \d/gi,
    /since \d/gi,
    /by \d{4}/gi,
  ];

  let count = 0;
  datePatterns.forEach(pattern => {
    count += (textContent.match(pattern) || []).length;
  });

  const passed = count >= 2;

  return {
    id: 'dates-timelines',
    category: 'citationReadiness',
    name: 'Dates & Timelines',
    passed,
    score: passed ? 8 : count >= 1 ? 4 : 0,
    maxScore: 8,
    details: `Found ${count} date references`,
  };
}

// --- Technical SEO Checks ---

function checkHasSchemaMarkup(document: Document, html: string): Check {
  const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
  const hasMicrodata = document.querySelector('[itemscope]') !== null;
  
  let schemaTypes: string[] = [];
  jsonLd.forEach(script => {
    const content = script.textContent || '';
    const typeMatch = content.match(/"@type"\s*:\s*"([^"]+)"/g);
    if (typeMatch) {
      schemaTypes.push(...typeMatch.map(t => t.replace(/"@type"\s*:\s*"([^"]+)"/, '$1')));
    }
  });

  const hasSchema = jsonLd.length > 0 || hasMicrodata;
  const hasRichSchema = schemaTypes.some(t => 
    ['Article', 'FAQPage', 'HowTo', 'Product', 'Review', 'Organization'].includes(t)
  );

  return {
    id: 'schema-markup',
    category: 'technicalSeo',
    name: 'Schema.org Markup',
    passed: hasSchema,
    score: hasRichSchema ? 20 : hasSchema ? 12 : 0,
    maxScore: 20,
    details: hasSchema 
      ? `Found schema types: ${schemaTypes.join(', ') || 'microdata'}`
      : 'No structured data found',
  };
}

function checkMetaTitle(document: Document): Check {
  const title = document.querySelector('title')?.textContent?.trim() || '';
  const length = title.length;
  const passed = length >= 30 && length <= 60;

  return {
    id: 'meta-title',
    category: 'technicalSeo',
    name: 'Meta Title',
    passed,
    score: passed ? 10 : length > 0 ? 5 : 0,
    maxScore: 10,
    details: length > 0 
      ? `${length} characters (optimal: 30-60)`
      : 'Missing title tag',
  };
}

function checkMetaDescription(document: Document): Check {
  const desc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  const length = desc.length;
  const passed = length >= 120 && length <= 160;

  return {
    id: 'meta-description',
    category: 'technicalSeo',
    name: 'Meta Description',
    passed,
    score: passed ? 10 : length > 0 ? 5 : 0,
    maxScore: 10,
    details: length > 0 
      ? `${length} characters (optimal: 120-160)`
      : 'Missing meta description',
  };
}

function checkOpenGraphTags(document: Document): Check {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  
  const count = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  const passed = count === 3;

  return {
    id: 'open-graph',
    category: 'technicalSeo',
    name: 'Open Graph Tags',
    passed,
    score: passed ? 8 : count >= 1 ? 4 : 0,
    maxScore: 8,
    details: `${count}/3 Open Graph tags present`,
  };
}

function checkCanonicalUrl(document: Document): Check {
  const canonical = document.querySelector('link[rel="canonical"]');
  const passed = canonical !== null;

  return {
    id: 'canonical-url',
    category: 'technicalSeo',
    name: 'Canonical URL',
    passed,
    score: passed ? 6 : 0,
    maxScore: 6,
    details: passed ? 'Canonical URL is set' : 'Missing canonical URL',
  };
}

function checkPageSpeed(loadTime: number): Check {
  const passed = loadTime < 3000;
  const fast = loadTime < 1500;

  return {
    id: 'page-speed',
    category: 'technicalSeo',
    name: 'Page Load Speed',
    passed,
    score: fast ? 10 : passed ? 7 : loadTime < 5000 ? 3 : 0,
    maxScore: 10,
    details: `${(loadTime / 1000).toFixed(1)}s load time (target: <3s)`,
  };
}

function checkMobileViewport(document: Document): Check {
  const viewport = document.querySelector('meta[name="viewport"]');
  const passed = viewport !== null;

  return {
    id: 'mobile-viewport',
    category: 'technicalSeo',
    name: 'Mobile Viewport',
    passed,
    score: passed ? 6 : 0,
    maxScore: 6,
    details: passed ? 'Viewport meta tag present' : 'Missing viewport meta tag',
  };
}

function checkHasAltText(document: Document): Check {
  const images = document.querySelectorAll('img');
  const imagesWithAlt = Array.from(images).filter(img => {
    const alt = img.getAttribute('alt');
    return alt && alt.trim().length > 0;
  });

  const ratio = images.length > 0 ? imagesWithAlt.length / images.length : 1;
  const passed = ratio >= 0.8;

  return {
    id: 'image-alt-text',
    category: 'technicalSeo',
    name: 'Image Alt Text',
    passed,
    score: passed ? 6 : ratio >= 0.5 ? 3 : 0,
    maxScore: 6,
    details: images.length > 0 
      ? `${imagesWithAlt.length}/${images.length} images have alt text`
      : 'No images found',
  };
}

// --- Credibility Signals Checks ---

function checkHasAuthorInfo(document: Document, html: string): Check {
  const authorPatterns = [
    /by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/,
    /author/i,
    /written by/i,
    /"author"/i,
    /rel="author"/i,
  ];

  const hasAuthor = authorPatterns.some(p => p.test(html));
  const hasAuthorSchema = html.includes('"author"') && html.includes('@type');

  return {
    id: 'author-info',
    category: 'credibilitySignals',
    name: 'Author Information',
    passed: hasAuthor,
    score: hasAuthorSchema ? 15 : hasAuthor ? 10 : 0,
    maxScore: 15,
    details: hasAuthor 
      ? hasAuthorSchema ? 'Author info with schema markup' : 'Author information found'
      : 'No author information detected',
  };
}

function checkHasPublishDate(document: Document, html: string): Check {
  const datePatterns = [
    /published/i,
    /datePublished/i,
    /article:published_time/i,
    /<time/i,
    /datetime=/i,
  ];

  const hasDate = datePatterns.some(p => p.test(html));
  const hasDateSchema = html.includes('datePublished') || html.includes('dateModified');

  return {
    id: 'publish-date',
    category: 'credibilitySignals',
    name: 'Publish/Update Date',
    passed: hasDate,
    score: hasDateSchema ? 12 : hasDate ? 8 : 0,
    maxScore: 12,
    details: hasDate 
      ? hasDateSchema ? 'Date with schema markup' : 'Publish date found'
      : 'No publish date detected',
  };
}

function checkHasAboutSection(document: Document): Check {
  const links = document.querySelectorAll('a');
  const hasAboutLink = Array.from(links).some(a => {
    const href = a.getAttribute('href') || '';
    const text = a.textContent || '';
    return /about|who-we-are|our-team|company/i.test(href + text);
  });

  return {
    id: 'about-section',
    category: 'credibilitySignals',
    name: 'About/Company Info',
    passed: hasAboutLink,
    score: hasAboutLink ? 8 : 0,
    maxScore: 8,
    details: hasAboutLink 
      ? 'Links to about/company page found'
      : 'No about page link found',
  };
}

function checkHasSourceCitations(document: Document, textContent: string): Check {
  const citationPatterns = [
    /\[\d+\]/g,
    /\(source:/gi,
    /according to [A-Z]/g,
    /<cite/gi,
    /\breference/gi,
  ];

  let count = 0;
  citationPatterns.forEach(pattern => {
    count += (textContent.match(pattern) || []).length;
  });

  const passed = count >= 2;

  return {
    id: 'source-citations',
    category: 'credibilitySignals',
    name: 'Source Citations',
    passed,
    score: passed ? 12 : count >= 1 ? 6 : 0,
    maxScore: 12,
    details: `Found ${count} source citation patterns`,
  };
}

function checkHasExternalLinks(document: Document): Check {
  const links = document.querySelectorAll('a[href^="http"]');
  const currentDomain = document.location?.hostname || '';
  
  const externalLinks = Array.from(links).filter(a => {
    const href = a.getAttribute('href') || '';
    try {
      const linkDomain = new URL(href).hostname;
      return linkDomain !== currentDomain && !linkDomain.includes(currentDomain);
    } catch {
      return false;
    }
  });

  const passed = externalLinks.length >= 2;

  return {
    id: 'external-links',
    category: 'credibilitySignals',
    name: 'External References',
    passed,
    score: passed ? 8 : externalLinks.length >= 1 ? 4 : 0,
    maxScore: 8,
    details: `Found ${externalLinks.length} external links`,
  };
}

// --- AI-Specific Factors Checks ---

function checkAnswersQuestionUpfront(textContent: string): Check {
  // Check if the first 200 words contain direct answer patterns
  const first200Words = textContent.split(/\s+/).slice(0, 200).join(' ');
  
  const answerPatterns = [
    /\bis\b/i,
    /\bare\b/i,
    /\bmeans\b/i,
    /\brefers to\b/i,
    /\bdefined as\b/i,
  ];

  const hasDirectAnswer = answerPatterns.some(p => p.test(first200Words));
  const startsWithDefinition = /^[A-Z][^.]+\s(is|are|refers|means)\s/.test(textContent.trim());

  return {
    id: 'upfront-answer',
    category: 'aiSpecificFactors',
    name: 'Answers Question Upfront',
    passed: hasDirectAnswer,
    score: startsWithDefinition ? 15 : hasDirectAnswer ? 10 : 0,
    maxScore: 15,
    details: hasDirectAnswer 
      ? 'Content provides direct answers early'
      : 'Content may bury the main answer',
  };
}

function checkHasTableOfContents(document: Document): Check {
  const tocPatterns = [
    /table of contents/i,
    /in this article/i,
    /jump to section/i,
  ];

  const hasToc = Array.from(document.querySelectorAll('nav, ul, ol, div')).some(el => {
    const text = el.textContent || '';
    const links = el.querySelectorAll('a[href^="#"]');
    return tocPatterns.some(p => p.test(text)) || links.length >= 4;
  });

  return {
    id: 'table-of-contents',
    category: 'aiSpecificFactors',
    name: 'Table of Contents',
    passed: hasToc,
    score: hasToc ? 10 : 0,
    maxScore: 10,
    details: hasToc 
      ? 'Table of contents detected'
      : 'No table of contents found',
  };
}

function checkHasSummarySection(document: Document, textContent: string): Check {
  const summaryPatterns = [
    /key takeaways/i,
    /summary/i,
    /in brief/i,
    /tl;?dr/i,
    /quick summary/i,
    /bottom line/i,
  ];

  const hasSummary = summaryPatterns.some(p => p.test(textContent));

  return {
    id: 'summary-section',
    category: 'aiSpecificFactors',
    name: 'Summary/Key Takeaways',
    passed: hasSummary,
    score: hasSummary ? 12 : 0,
    maxScore: 12,
    details: hasSummary 
      ? 'Summary section detected'
      : 'No summary or key takeaways section',
  };
}

function checkNoPaywallDetected(document: Document, html: string): Check {
  const paywallPatterns = [
    /paywall/i,
    /subscribe to (read|continue)/i,
    /premium content/i,
    /member(s)? only/i,
    /sign up to read/i,
  ];

  const hasPaywall = paywallPatterns.some(p => p.test(html));

  return {
    id: 'no-paywall',
    category: 'aiSpecificFactors',
    name: 'Content Accessibility',
    passed: !hasPaywall,
    score: hasPaywall ? 0 : 10,
    maxScore: 10,
    details: hasPaywall 
      ? 'Paywall or gated content detected'
      : 'Content appears freely accessible',
  };
}

function checkContentAccessibility(document: Document): Check {
  const hasAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]').length > 0;
  const hasRoles = document.querySelectorAll('[role]').length > 0;
  const hasLangAttr = document.documentElement.hasAttribute('lang');

  const score = (hasAriaLabels ? 3 : 0) + (hasRoles ? 3 : 0) + (hasLangAttr ? 4 : 0);
  const passed = score >= 7;

  return {
    id: 'accessibility',
    category: 'aiSpecificFactors',
    name: 'Accessibility Features',
    passed,
    score,
    maxScore: 10,
    details: `Lang attr: ${hasLangAttr ? '✓' : '✗'}, ARIA: ${hasAriaLabels ? '✓' : '✗'}, Roles: ${hasRoles ? '✓' : '✗'}`,
  };
}

// ============================================
// Helper Functions
// ============================================

function extractTitle(document: Document): string {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const titleTag = document.querySelector('title')?.textContent;
  return (ogTitle || titleTag || '').trim();
}

function extractDescription(document: Document): string {
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
  return (ogDesc || metaDesc || '').trim();
}

function calculateCategoryScores(checks: Check[]): AnalysisResult['categories'] {
  const categories: AnalysisResult['categories'] = {
    contentStructure: { score: 0, maxScore: 0, percentage: 0, status: 'good' },
    citationReadiness: { score: 0, maxScore: 0, percentage: 0, status: 'good' },
    technicalSeo: { score: 0, maxScore: 0, percentage: 0, status: 'good' },
    credibilitySignals: { score: 0, maxScore: 0, percentage: 0, status: 'good' },
    aiSpecificFactors: { score: 0, maxScore: 0, percentage: 0, status: 'good' },
  };

  for (const check of checks) {
    const cat = check.category as keyof typeof categories;
    if (categories[cat]) {
      categories[cat].score += check.score;
      categories[cat].maxScore += check.maxScore;
    }
  }

  for (const key of Object.keys(categories) as (keyof typeof categories)[]) {
    const cat = categories[key];
    cat.percentage = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    cat.status = cat.percentage >= 70 ? 'good' : cat.percentage >= 40 ? 'warning' : 'poor';
  }

  return categories;
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateRecommendations(checks: Check[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const check of checks) {
    if (check.passed) continue;

    const rec = checkToRecommendation(check);
    if (rec) {
      recommendations.push(rec);
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

function checkToRecommendation(check: Check): Recommendation | null {
  const recs: Record<string, Omit<Recommendation, 'id'>> = {
    'schema-markup': {
      category: 'Technical SEO',
      priority: 'critical',
      title: 'Add Schema.org Structured Data',
      description: 'Structured data helps AI systems understand your content type, author, dates, and key information.',
      impact: 'High impact on AI discoverability. Pages with schema markup are significantly more likely to be cited by AI.',
      howToFix: 'Add JSON-LD structured data to your page. Choose the appropriate schema type (Article, FAQPage, HowTo, etc.).',
      codeExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20"
}
</script>`,
    },
    'faq-section': {
      category: 'Content Structure',
      priority: 'high',
      title: 'Add an FAQ Section',
      description: 'FAQ sections with clear questions and answers are highly cited by AI assistants.',
      impact: 'FAQs provide perfect "citation nuggets" that AI can directly quote.',
      howToFix: 'Add a Frequently Asked Questions section with 5-10 common questions and concise answers. Include FAQPage schema.',
      codeExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [topic]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "A clear, concise answer..."
    }
  }]
}
</script>`,
    },
    'statistics': {
      category: 'Citation Readiness',
      priority: 'high',
      title: 'Add Specific Statistics and Numbers',
      description: 'AI systems prefer to cite specific, verifiable numbers over vague claims.',
      impact: 'Statistics make your content more authoritative and quotable.',
      howToFix: 'Include specific percentages, dollar amounts, dates, and measurable outcomes. Cite your data sources.',
      codeExample: `<!-- Instead of: -->
"Our product is very fast"

<!-- Write: -->
"Our product processes 10,000 requests per second, 
3x faster than the industry average (Source: 2024 Benchmark Report)"`,
    },
    'quotable-statements': {
      category: 'Citation Readiness',
      priority: 'high',
      title: 'Create More Quotable Statements',
      description: 'Write clear, factual sentences that can stand alone as citations.',
      impact: 'AI systems extract and quote concise factual statements.',
      howToFix: 'Write declarative sentences with specific facts. Avoid hedging language like "might", "could", "perhaps".',
      codeExample: `<!-- Weak (hard to quote): -->
"Some experts think the market could potentially grow somewhat over time"

<!-- Strong (easy to quote): -->
"The global AI market will reach $407 billion by 2027, growing at 36.2% CAGR"`,
    },
    'author-info': {
      category: 'Credibility',
      priority: 'high',
      title: 'Add Author Information',
      description: 'Author attribution increases content credibility for AI systems.',
      impact: 'Content with clear authorship is more trusted and more likely to be cited.',
      howToFix: 'Add author name, bio, and credentials. Link to author page. Include author schema markup.',
      codeExample: `<div class="author-bio">
  <img src="author.jpg" alt="Jane Smith">
  <div>
    <strong>Jane Smith</strong>
    <p>Senior Research Analyst with 10 years experience in...</p>
  </div>
</div>`,
    },
    'meta-description': {
      category: 'Technical SEO',
      priority: 'medium',
      title: 'Improve Meta Description',
      description: 'Meta descriptions help AI systems understand page content at a glance.',
      impact: 'A good meta description (120-160 chars) improves content discovery.',
      howToFix: 'Write a compelling description that summarizes your main points and includes key terms.',
      codeExample: `<meta name="description" content="Learn the top 10 proven benefits of meditation backed by scientific research. Includes techniques for beginners and expert tips for daily practice.">`,
    },
    'upfront-answer': {
      category: 'AI Optimization',
      priority: 'high',
      title: 'Answer the Main Question Upfront',
      description: 'AI systems prefer content that provides direct answers early, not buried in text.',
      impact: 'Content with answers in the first paragraph is more likely to be selected.',
      howToFix: 'Start with a clear definition or direct answer. Use the "inverted pyramid" style - most important info first.',
      codeExample: `<!-- Start your article with the answer: -->
<p><strong>Meditation is a practice of focused attention that reduces 
stress and improves mental clarity.</strong> Research shows that just 
10 minutes daily can lower cortisol levels by 23%...</p>`,
    },
    'summary-section': {
      category: 'AI Optimization',
      priority: 'medium',
      title: 'Add a Key Takeaways Section',
      description: 'Summary sections provide perfect extraction points for AI systems.',
      impact: 'Key takeaways are frequently cited verbatim by AI assistants.',
      howToFix: 'Add a "Key Takeaways", "Summary", or "TL;DR" section with 3-5 bullet points.',
      codeExample: `<div class="key-takeaways">
  <h2>Key Takeaways</h2>
  <ul>
    <li>Meditation reduces stress hormones by up to 23%</li>
    <li>10 minutes daily practice shows measurable benefits</li>
    <li>Beginners should start with guided meditation apps</li>
  </ul>
</div>`,
    },
    'publish-date': {
      category: 'Credibility',
      priority: 'medium',
      title: 'Add Publication Date',
      description: 'AI systems prefer recent, dated content over undated pages.',
      impact: 'Dated content signals freshness and relevance.',
      howToFix: 'Add visible publish date and last updated date. Include datePublished in schema.',
      codeExample: `<time datetime="2024-01-15">Published: January 15, 2024</time>
<time datetime="2024-03-01">Last updated: March 1, 2024</time>`,
    },
    'heading-hierarchy': {
      category: 'Content Structure',
      priority: 'medium',
      title: 'Fix Heading Hierarchy',
      description: 'Proper heading structure helps AI understand content organization.',
      impact: 'Clear hierarchy improves content parsing and section extraction.',
      howToFix: 'Use headings in order (H1 → H2 → H3). Don\'t skip levels. Use one H1 per page.',
    },
    'single-h1': {
      category: 'Content Structure',
      priority: 'medium',
      title: 'Use a Single H1 Tag',
      description: 'Pages should have exactly one H1 that describes the main topic.',
      impact: 'Multiple H1s confuse content hierarchy signals.',
      howToFix: 'Keep one H1 for the main title. Use H2 for major sections.',
    },
    'content-length': {
      category: 'Content Structure',
      priority: 'medium',
      title: 'Expand Content Depth',
      description: 'Longer, comprehensive content tends to rank better in AI search.',
      impact: 'In-depth content (800+ words) covers more quotable points.',
      howToFix: 'Expand thin content with more details, examples, and explanations. Target 1,000-2,000 words for informational content.',
    },
    'page-speed': {
      category: 'Technical SEO',
      priority: 'low',
      title: 'Improve Page Speed',
      description: 'Faster pages are crawled more frequently and reliably.',
      impact: 'Speed affects crawl efficiency but not directly AI citation.',
      howToFix: 'Optimize images, minify CSS/JS, use caching, consider a CDN.',
    },
  };

  const rec = recs[check.id];
  if (!rec) return null;

  return {
    id: check.id,
    ...rec,
  };
}

export { extractTitle, extractDescription };
