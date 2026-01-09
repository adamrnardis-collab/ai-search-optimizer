/**
 * AI Search Optimization Tips Generator
 * 
 * Analyzes pages and generates actionable recommendations
 * for improving visibility in LLM-powered search.
 */

import { ExtractedSource } from './extract';
import { PageContent } from './fetch';

export interface OptimizationTip {
  category: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  example?: string;
}

export interface OptimizationReport {
  overallScore: number;
  tips: OptimizationTip[];
  bestPractices: string[];
  sourceAnalysis: SourceAnalysis[];
}

export interface SourceAnalysis {
  url: string;
  title: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Generate optimization tips based on analyzed sources
 */
export function generateOptimizationTips(
  question: string,
  sources: ExtractedSource[],
  pages: PageContent[]
): OptimizationReport {
  const tips: OptimizationTip[] = [];
  const sourceAnalysis: SourceAnalysis[] = [];

  // Analyze each source
  for (let i = 0; i < sources.length && i < pages.length; i++) {
    const source = sources[i];
    const page = pages[i];
    
    if (page.error) continue;

    const analysis = analyzeSource(source, page);
    sourceAnalysis.push(analysis);
    
    // Generate tips from weaknesses
    for (const weakness of analysis.weaknesses) {
      const tip = weaknessToTip(weakness, page.url);
      if (tip && !tips.some(t => t.issue === tip.issue)) {
        tips.push(tip);
      }
    }
  }

  // Add general best practices tips
  const generalTips = generateGeneralTips(sources, pages);
  tips.push(...generalTips);

  // Sort by priority
  tips.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Calculate overall score
  const overallScore = calculateOverallScore(sourceAnalysis);

  return {
    overallScore,
    tips: tips.slice(0, 10), // Limit to top 10 tips
    bestPractices: BEST_PRACTICES,
    sourceAnalysis,
  };
}

/**
 * Analyze a single source for strengths and weaknesses
 */
function analyzeSource(source: ExtractedSource, page: PageContent): SourceAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 50; // Base score

  // Check structured data
  if (source.qualitySignals.hasStructuredData) {
    strengths.push('Has structured data (Schema.org/JSON-LD)');
    score += 10;
  } else {
    weaknesses.push('missing_structured_data');
  }

  // Check metadata quality
  if (source.qualitySignals.hasGoodMetadata) {
    strengths.push('Good title and meta description');
    score += 10;
  } else {
    if (!page.title) weaknesses.push('missing_title');
    if (!page.description) weaknesses.push('missing_description');
  }

  // Check headings
  if (source.qualitySignals.hasHeadings) {
    strengths.push('Well-structured with headings');
    score += 5;
  } else {
    weaknesses.push('missing_headings');
  }

  // Check content length
  if (source.qualitySignals.wordCount > 500) {
    strengths.push('Comprehensive content');
    score += 10;
  } else if (source.qualitySignals.wordCount < 200) {
    weaknesses.push('thin_content');
  }

  // Check load time
  if (source.qualitySignals.loadTime < 2000) {
    strengths.push('Fast page load');
    score += 5;
  } else if (source.qualitySignals.loadTime > 5000) {
    weaknesses.push('slow_loading');
  }

  // Check relevance score
  if (source.relevanceScore > 5) {
    strengths.push('High relevance to query');
    score += 10;
  } else if (source.relevanceScore < 2) {
    weaknesses.push('low_relevance');
  }

  // Check for citation-worthy snippets
  if (source.topSnippets.length >= 2 && source.topSnippets[0].score > 3) {
    strengths.push('Contains citation-worthy factual statements');
    score += 10;
  } else {
    weaknesses.push('weak_citation_nuggets');
  }

  return {
    url: source.url,
    title: source.title,
    score: Math.min(100, Math.max(0, score)),
    strengths,
    weaknesses,
  };
}

/**
 * Convert weakness identifier to actionable tip
 */
function weaknessToTip(weakness: string, url: string): OptimizationTip | null {
  const tips: Record<string, Omit<OptimizationTip, 'example'> & { example?: string }> = {
    missing_structured_data: {
      category: 'Technical SEO',
      priority: 'high',
      issue: 'Missing structured data markup',
      recommendation: 'Add Schema.org JSON-LD markup to help AI systems understand your content structure. Include Article, FAQPage, HowTo, or Product schemas as appropriate.',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {"@type": "Person", "name": "Author Name"},
  "datePublished": "2024-01-15"
}
</script>`,
    },
    missing_title: {
      category: 'Metadata',
      priority: 'high',
      issue: 'Missing or poor page title',
      recommendation: 'Add a descriptive, unique title tag that clearly states what the page is about. Keep it under 60 characters.',
      example: '<title>Complete Guide to [Topic] | Your Brand</title>',
    },
    missing_description: {
      category: 'Metadata',
      priority: 'high',
      issue: 'Missing meta description',
      recommendation: 'Add a compelling meta description (150-160 chars) that summarizes the page content and includes key terms naturally.',
      example: '<meta name="description" content="Learn everything about [topic] with our comprehensive guide. Includes [key features], expert tips, and real examples.">',
    },
    missing_headings: {
      category: 'Content Structure',
      priority: 'medium',
      issue: 'Poor content structure - missing headings',
      recommendation: 'Use a clear heading hierarchy (H1, H2, H3) to organize content. Each section should address a specific subtopic.',
    },
    thin_content: {
      category: 'Content Quality',
      priority: 'medium',
      issue: 'Thin content - insufficient depth',
      recommendation: 'Expand content with more comprehensive coverage. Include definitions, examples, data points, and expert insights. Aim for at least 500+ words for informational content.',
    },
    slow_loading: {
      category: 'Technical SEO',
      priority: 'low',
      issue: 'Slow page load time',
      recommendation: 'Optimize page speed by compressing images, minifying CSS/JS, and using a CDN. Faster pages get crawled more frequently.',
    },
    low_relevance: {
      category: 'Content Relevance',
      priority: 'medium',
      issue: 'Content may not directly address search intent',
      recommendation: 'Ensure content directly answers common questions about the topic. Include an FAQ section and clear definitions upfront.',
    },
    weak_citation_nuggets: {
      category: 'Citation Optimization',
      priority: 'high',
      issue: 'Lacks easily citable factual statements',
      recommendation: 'Include clear, standalone factual sentences that AI can easily cite. Use specific numbers, dates, and definitive statements.',
      example: 'Instead of: "This product is really fast"\nWrite: "The X500 processes 10,000 requests per second, making it 3x faster than the industry average."',
    },
  };

  return tips[weakness] || null;
}

/**
 * Generate general tips applicable across all sources
 */
function generateGeneralTips(sources: ExtractedSource[], pages: PageContent[]): OptimizationTip[] {
  const tips: OptimizationTip[] = [];

  // Check if any source has structured data
  const anyHasStructuredData = sources.some(s => s.qualitySignals.hasStructuredData);
  if (!anyHasStructuredData) {
    tips.push({
      category: 'Competitive Gap',
      priority: 'high',
      issue: 'None of the top sources use structured data',
      recommendation: 'Adding Schema.org markup would give you a significant advantage over competitors in AI search visibility.',
    });
  }

  // Check average content quality
  const avgWordCount = sources.reduce((sum, s) => sum + s.qualitySignals.wordCount, 0) / sources.length;
  if (avgWordCount < 500) {
    tips.push({
      category: 'Content Strategy',
      priority: 'medium',
      issue: 'Most sources have relatively thin content',
      recommendation: 'There\'s an opportunity to create more comprehensive content than competitors. Aim for 1500+ words with detailed coverage.',
    });
  }

  // Add evergreen tips
  tips.push({
    category: 'AI Optimization',
    priority: 'medium',
    issue: 'Optimize for AI understanding',
    recommendation: 'Write content that answers questions directly. Start sections with clear definitions and key facts before diving into details.',
  });

  return tips;
}

/**
 * Calculate overall optimization score
 */
function calculateOverallScore(analyses: SourceAnalysis[]): number {
  if (analyses.length === 0) return 0;
  return Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length);
}

/**
 * Best practices for AI Search Optimization
 */
const BEST_PRACTICES = [
  'Start articles with a clear, concise answer to the main question',
  'Use FAQ sections with explicit questions and direct answers',
  'Include specific numbers, statistics, and dates that can be cited',
  'Add Schema.org structured data (Article, FAQPage, HowTo)',
  'Write authoritative content with clear author credentials',
  'Keep sentences factual and citation-worthy',
  'Use descriptive headings that preview section content',
  'Ensure fast page load times (<3 seconds)',
  'Include a table of contents for long-form content',
  'Update content regularly with current information',
];

export { BEST_PRACTICES };
