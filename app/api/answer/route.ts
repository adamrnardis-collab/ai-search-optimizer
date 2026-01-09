/**
 * POST /api/answer
 * 
 * Main endpoint that orchestrates the AI Search Optimization pipeline:
 * 1. Search the web for relevant sources
 * 2. Fetch and parse page content
 * 3. Extract relevant evidence
 * 4. Synthesize an answer with citations
 * 5. Generate optimization tips
 */

import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/lib/search';
import { fetchPages } from '@/lib/fetch';
import { extractEvidence, getBestEvidence } from '@/lib/extract';
import { synthesizeAnswer } from '@/lib/synthesize';
import { generateOptimizationTips } from '@/lib/optimize';
import { answerCache, cacheKey } from '@/lib/cache';
import type { AnswerRequest, AnswerResponse, ErrorResponse } from '@/lib/types';

// Rate limiting (simple in-memory)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    let body: AnswerRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input
    const { question, depth = 5 } = body;
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Question must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 500) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Question must be under 500 characters' },
        { status: 400 }
      );
    }

    const validDepths = [3, 5, 10];
    const searchDepth = validDepths.includes(depth) ? depth : 5;

    // Check cache for full response
    const fullCacheKey = cacheKey('answer', trimmedQuestion, searchDepth);
    const cachedResponse = answerCache.get<AnswerResponse>(fullCacheKey);
    
    if (cachedResponse) {
      console.log('[API] Cache hit for full response');
      return NextResponse.json({
        ...cachedResponse,
        meta: { ...cachedResponse.meta, cached: true },
      });
    }

    console.log(`[API] Processing question: "${trimmedQuestion}" (depth: ${searchDepth})`);

    // Step 1: Web search
    console.log('[API] Step 1: Web search');
    const searchResults = await webSearch(trimmedQuestion, { depth: searchDepth });
    
    if (searchResults.length === 0) {
      return NextResponse.json<AnswerResponse>({
        success: true,
        question: trimmedQuestion,
        answer: {
          text: 'No search results found. Please try a different query.',
          citations: [],
          confidence: 'low',
          method: 'template',
        },
        sources: [],
        optimization: {
          overallScore: 0,
          tips: [],
          bestPractices: [],
        },
        meta: {
          searchBackend: getSearchBackend(),
          sourcesSearched: 0,
          sourcesFetched: 0,
          processingTime: Date.now() - startTime,
          cached: false,
        },
      });
    }

    // Step 2: Fetch pages
    console.log(`[API] Step 2: Fetching ${searchResults.length} pages`);
    const urls = searchResults.map(r => r.url);
    const pages = await fetchPages(urls);
    
    const successfulPages = pages.filter(p => !p.error);
    console.log(`[API] Successfully fetched ${successfulPages.length}/${pages.length} pages`);

    // Step 3: Extract evidence
    console.log('[API] Step 3: Extracting evidence');
    const sources = extractEvidence(trimmedQuestion, pages);
    const evidence = getBestEvidence(sources, 5);

    // Step 4: Synthesize answer
    console.log('[API] Step 4: Synthesizing answer');
    const answer = await synthesizeAnswer(trimmedQuestion, sources, evidence);

    // Step 5: Generate optimization tips
    console.log('[API] Step 5: Generating optimization tips');
    const optimization = generateOptimizationTips(trimmedQuestion, sources, pages);

    // Build response
    const response: AnswerResponse = {
      success: true,
      question: trimmedQuestion,
      answer: {
        text: answer.answer,
        citations: answer.citations,
        confidence: answer.confidence,
        method: answer.method,
      },
      sources: sources.slice(0, searchDepth).map(s => ({
        index: s.index,
        url: s.url,
        title: s.title,
        description: s.description,
        relevanceScore: Math.round(s.relevanceScore * 100) / 100,
        topSnippet: s.topSnippets[0]?.snippet || '',
        qualitySignals: s.qualitySignals,
      })),
      optimization: {
        overallScore: optimization.overallScore,
        tips: optimization.tips,
        bestPractices: optimization.bestPractices,
      },
      meta: {
        searchBackend: getSearchBackend(),
        sourcesSearched: searchResults.length,
        sourcesFetched: successfulPages.length,
        processingTime: Date.now() - startTime,
        cached: false,
      },
    };

    // Cache the response
    answerCache.set(fullCacheKey, response);

    console.log(`[API] Completed in ${response.meta.processingTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json<ErrorResponse>(
      { 
        success: false, 
        error: 'Failed to process request',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Get the search backend being used
 */
function getSearchBackend(): string {
  if (process.env.TAVILY_API_KEY) return 'tavily';
  if (process.env.SERPAPI_KEY) return 'serpapi';
  return 'duckduckgo';
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
