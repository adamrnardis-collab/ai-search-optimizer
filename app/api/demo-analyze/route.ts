import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/analyzer';
import { isValidUrl } from '@/lib/utils';

// Simple rate limiting for demo
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const DEMO_LIMIT = 10; // 10 requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= DEMO_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for analysis

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // Parse request
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL. Please enter a valid http or https URL.' },
        { status: 400 }
      );
    }

    // Analyze the URL
    console.log(`[Demo Analyze] Starting analysis for: ${url}`);
    
    try {
      const result = await analyzeUrl(url);
      console.log(`[Demo Analyze] Completed with score: ${result.score}`);
      return NextResponse.json(result);
    } catch (fetchError) {
      console.error('[Demo Analyze] Fetch/Analysis error:', fetchError);
      
      // Provide more helpful error messages
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
        return NextResponse.json(
          { error: 'The page took too long to load. Please try again or try a different URL.' },
          { status: 504 }
        );
      }
      
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        return NextResponse.json(
          { error: 'Could not find that website. Please check the URL and try again.' },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Could not connect to the website. It may be down or blocking our requests.' },
          { status: 502 }
        );
      }

      if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
        return NextResponse.json(
          { error: 'SSL certificate error. The website may have security issues.' },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to analyze: ${errorMessage}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Demo Analyze] Unexpected error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
