/**
 * Content Extraction & Evidence Selection Module
 * 
 * Extracts relevant snippets from page content using BM25 ranking.
 * Selects the most relevant evidence for answering the question.
 */

import { PageContent } from './fetch';

export interface Evidence {
  sourceIndex: number;
  url: string;
  title: string;
  snippet: string;
  score: number;
  context: string; // Surrounding text for context
}

export interface ExtractedSource {
  index: number;
  url: string;
  title: string;
  description: string;
  topSnippets: Evidence[];
  relevanceScore: number;
  qualitySignals: {
    hasStructuredData: boolean;
    hasGoodMetadata: boolean;
    hasHeadings: boolean;
    wordCount: number;
    loadTime: number;
  };
}

/**
 * BM25 parameters (tuned for web content)
 */
const BM25_K1 = 1.5; // Term frequency saturation
const BM25_B = 0.75; // Length normalization

/**
 * Extract evidence from multiple pages for a given question
 */
export function extractEvidence(
  question: string,
  pages: PageContent[]
): ExtractedSource[] {
  // Tokenize the question
  const queryTerms = tokenize(question);
  
  if (queryTerms.length === 0) {
    return [];
  }

  // Calculate IDF for query terms across all documents
  const idfScores = calculateIDF(queryTerms, pages);
  
  // Calculate average document length
  const avgDocLength = pages.reduce((sum, p) => sum + p.wordCount, 0) / Math.max(pages.length, 1);

  // Process each page
  const results: ExtractedSource[] = pages
    .filter(page => !page.error && page.textContent.length > 50)
    .map((page, index) => {
      // Split content into paragraphs/sentences for snippet extraction
      const paragraphs = splitIntoParagraphs(page.textContent);
      
      // Score each paragraph using BM25
      const scoredParagraphs = paragraphs.map(para => ({
        text: para,
        score: calculateBM25Score(para, queryTerms, idfScores, avgDocLength),
      }));
      
      // Sort by score and take top 3
      scoredParagraphs.sort((a, b) => b.score - a.score);
      const topParagraphs = scoredParagraphs.slice(0, 3);
      
      // Calculate overall relevance score
      const relevanceScore = topParagraphs.reduce((sum, p) => sum + p.score, 0) / 3;
      
      // Convert to Evidence objects
      const topSnippets: Evidence[] = topParagraphs
        .filter(p => p.score > 0)
        .map(p => ({
          sourceIndex: index + 1,
          url: page.url,
          title: page.title,
          snippet: truncateSnippet(p.text, 300),
          score: p.score,
          context: p.text,
        }));

      return {
        index: index + 1,
        url: page.url,
        title: page.title || 'Untitled',
        description: page.description,
        topSnippets,
        relevanceScore,
        qualitySignals: {
          hasStructuredData: page.hasStructuredData,
          hasGoodMetadata: Boolean(page.title && page.description),
          hasHeadings: page.headings.length > 0,
          wordCount: page.wordCount,
          loadTime: page.loadTime,
        },
      };
    });

  // Sort by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return results;
}

/**
 * Tokenize text into lowercase terms, removing stopwords
 */
export function tokenize(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
    'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'can', 'just', 'should', 'now', 'i', 'you', 'your', 'we', 'our',
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopwords.has(term));
}

/**
 * Calculate IDF scores for query terms
 */
function calculateIDF(queryTerms: string[], documents: PageContent[]): Map<string, number> {
  const idfScores = new Map<string, number>();
  const N = documents.length;
  
  for (const term of queryTerms) {
    // Count documents containing this term
    let df = 0;
    for (const doc of documents) {
      if (doc.textContent.toLowerCase().includes(term)) {
        df++;
      }
    }
    
    // IDF formula: log((N - df + 0.5) / (df + 0.5) + 1)
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    idfScores.set(term, Math.max(idf, 0));
  }
  
  return idfScores;
}

/**
 * Calculate BM25 score for a document/paragraph
 */
export function calculateBM25Score(
  text: string,
  queryTerms: string[],
  idfScores: Map<string, number>,
  avgDocLength: number
): number {
  const tokens = tokenize(text);
  const docLength = tokens.length;
  
  if (docLength === 0) return 0;
  
  // Count term frequencies
  const termFreqs = new Map<string, number>();
  for (const token of tokens) {
    termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
  }
  
  let score = 0;
  
  for (const term of queryTerms) {
    const tf = termFreqs.get(term) || 0;
    const idf = idfScores.get(term) || 0;
    
    // BM25 formula
    const numerator = tf * (BM25_K1 + 1);
    const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength));
    
    score += idf * (numerator / denominator);
  }
  
  return score;
}

/**
 * Split text into paragraphs for snippet extraction
 */
function splitIntoParagraphs(text: string): string[] {
  // Split on double newlines or sentence boundaries for longer text
  const paragraphs = text
    .split(/\n\n+|\r\n\r\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 50); // Minimum paragraph length
  
  // If we don't have enough paragraphs, split on single newlines
  if (paragraphs.length < 3) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
    
    // Group sentences into chunks of ~3
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      chunks.push(sentences.slice(i, i + 3).join(' '));
    }
    
    return chunks.length > 0 ? chunks : paragraphs;
  }
  
  return paragraphs;
}

/**
 * Truncate snippet to max length while keeping complete sentences
 */
function truncateSnippet(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Find the last sentence boundary before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSentence = truncated.lastIndexOf('. ');
  
  if (lastSentence > maxLength / 2) {
    return truncated.slice(0, lastSentence + 1);
  }
  
  // Otherwise, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

/**
 * Get the best evidence for citation (top snippet from each unique source)
 */
export function getBestEvidence(sources: ExtractedSource[], maxSources: number = 5): Evidence[] {
  const bestEvidence: Evidence[] = [];
  
  for (const source of sources.slice(0, maxSources)) {
    if (source.topSnippets.length > 0) {
      bestEvidence.push(source.topSnippets[0]);
    }
  }
  
  return bestEvidence;
}
