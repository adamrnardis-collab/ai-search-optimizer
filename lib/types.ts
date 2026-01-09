/**
 * Shared Type Definitions
 */

// Re-export types from modules
export type { SearchResult, SearchOptions } from './search';
export type { PageContent } from './fetch';
export type { Evidence, ExtractedSource } from './extract';
export type { SynthesizedAnswer, Citation } from './synthesize';
export type { OptimizationTip, OptimizationReport, SourceAnalysis } from './optimize';

/**
 * API Request/Response Types
 */

export interface AnswerRequest {
  question: string;
  depth?: number; // 3, 5, or 10
}

export interface AnswerResponse {
  success: boolean;
  question: string;
  answer: {
    text: string;
    citations: {
      index: number;
      url: string;
      title: string;
      snippet: string;
    }[];
    confidence: 'high' | 'medium' | 'low';
    method: 'template' | 'ai';
  };
  sources: {
    index: number;
    url: string;
    title: string;
    description: string;
    relevanceScore: number;
    topSnippet: string;
    qualitySignals: {
      hasStructuredData: boolean;
      hasGoodMetadata: boolean;
      hasHeadings: boolean;
      wordCount: number;
      loadTime: number;
    };
  }[];
  optimization: {
    overallScore: number;
    tips: {
      category: string;
      priority: 'high' | 'medium' | 'low';
      issue: string;
      recommendation: string;
      example?: string;
    }[];
    bestPractices: string[];
  };
  meta: {
    searchBackend: string;
    sourcesSearched: number;
    sourcesFetched: number;
    processingTime: number;
    cached: boolean;
  };
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}
