/**
 * Page Fetching Module
 * 
 * Fetches web pages with proper timeouts, user agent, and rate limiting.
 * Extracts main content using Readability algorithm.
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { pageCache, cacheKey } from './cache';

export interface PageContent {
  url: string;
  title: string;
  description: string;
  content: string;
  textContent: string;
  wordCount: number;
  headings: string[];
  hasStructuredData: boolean;
  loadTime: number;
  error?: string;
}

const USER_AGENT = 'Mozilla/5.0 (compatible; AISearchOptimizer/1.0; +https://example.com/bot)';
const FETCH_TIMEOUT = parseInt(process.env.FETCH_TIMEOUT || '10000', 10);
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_FETCHES || '3', 10);

// Simple semaphore for rate limiting
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  
  return new Promise(resolve => {
    requestQueue.push(resolve);
  });
}

function releaseSlot(): void {
  activeRequests--;
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    activeRequests++;
    next?.();
  }
}

/**
 * Fetch and parse a single page
 */
export async function fetchPage(url: string): Promise<PageContent> {
  const key = cacheKey('page', url);
  const cached = pageCache.get<PageContent>(key);
  
  if (cached) {
    console.log('[Fetch] Cache hit for:', url);
    return cached;
  }

  await acquireSlot();
  const startTime = Date.now();
  
  try {
    console.log('[Fetch] Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Not HTML: ${contentType}`);
    }

    const html = await response.text();
    const loadTime = Date.now() - startTime;

    // Parse with JSDOM
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract metadata
    const title = extractTitle(document);
    const description = extractDescription(document);
    const headings = extractHeadings(document);
    const hasStructuredData = checkStructuredData(document);

    // Extract main content with Readability
    const reader = new Readability(document.cloneNode(true) as Document);
    const article = reader.parse();

    const content = article?.content || '';
    const textContent = article?.textContent || extractFallbackText(document);
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

    const result: PageContent = {
      url,
      title,
      description,
      content,
      textContent,
      wordCount,
      headings,
      hasStructuredData,
      loadTime,
    };

    pageCache.set(key, result);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Fetch] Error fetching ${url}:`, errorMessage);
    
    return {
      url,
      title: '',
      description: '',
      content: '',
      textContent: '',
      wordCount: 0,
      headings: [],
      hasStructuredData: false,
      loadTime: Date.now() - startTime,
      error: errorMessage,
    };
  } finally {
    releaseSlot();
  }
}

/**
 * Fetch multiple pages concurrently
 */
export async function fetchPages(urls: string[]): Promise<PageContent[]> {
  return Promise.all(urls.map(url => fetchPage(url)));
}

/**
 * Extract page title
 */
function extractTitle(document: Document): string {
  // Try og:title first
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return ogTitle.trim();
  
  // Then twitter:title
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
  if (twitterTitle) return twitterTitle.trim();
  
  // Then <title> tag
  const titleTag = document.querySelector('title')?.textContent;
  if (titleTag) return titleTag.trim();
  
  // Finally, first h1
  const h1 = document.querySelector('h1')?.textContent;
  if (h1) return h1.trim();
  
  return '';
}

/**
 * Extract page description
 */
function extractDescription(document: Document): string {
  // Try og:description first
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (ogDesc) return ogDesc.trim();
  
  // Then meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (metaDesc) return metaDesc.trim();
  
  // Then twitter:description
  const twitterDesc = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
  if (twitterDesc) return twitterDesc.trim();
  
  return '';
}

/**
 * Extract all headings from the page
 */
function extractHeadings(document: Document): string[] {
  const headings: string[] = [];
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  elements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 0 && text.length < 200) {
      headings.push(text);
    }
  });
  
  return headings.slice(0, 20); // Limit to 20 headings
}

/**
 * Check if page has structured data
 */
function checkStructuredData(document: Document): boolean {
  // Check for JSON-LD
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) return true;
  
  // Check for microdata
  const microdata = document.querySelector('[itemscope]');
  if (microdata) return true;
  
  // Check for RDFa
  const rdfa = document.querySelector('[vocab], [typeof]');
  if (rdfa) return true;
  
  return false;
}

/**
 * Fallback text extraction when Readability fails
 */
function extractFallbackText(document: Document): string {
  // Remove script, style, nav, footer, header elements
  const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, aside, .sidebar, .navigation, .menu');
  elementsToRemove.forEach(el => el.remove());
  
  // Get text from main or article or body
  const main = document.querySelector('main, article, [role="main"]');
  const body = main || document.body;
  
  return (body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000); // Limit to ~50k chars
}

export { extractTitle, extractDescription, extractHeadings };
