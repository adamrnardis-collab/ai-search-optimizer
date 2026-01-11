import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/analyzer';
import { isValidUrl } from '@/lib/utils';

// Simple rate limiting for demo
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const DEMO_LIMIT = 5; // 5 requests per hour per IP
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demo rate limit reached. Please try again later or sign up for full access.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
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
    const result = await analyzeUrl(url);
    console.log(`[Demo Analyze] Completed with score: ${result.score}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Demo Analyze] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Analysis failed';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
