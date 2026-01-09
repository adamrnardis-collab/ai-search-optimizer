/**
 * Web Search Module
 * 
 * Provides web search functionality with multiple backends:
 * - DuckDuckGo HTML scraping (free, no API key required)
 * - SerpAPI (optional, requires SERPAPI_KEY)
 * - Tavily (optional, requires TAVILY_API_KEY)
 */

import { searchCache, cacheKey } from './cache';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface SearchOptions {
  depth: number; // Number of results to return
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Main search function - automatically picks the best available backend
 */
export async function webSearch(query: string, options: SearchOptions = { depth: 5 }): Promise<SearchResult[]> {
  const key = cacheKey('search', query, options.depth);
  const cached = searchCache.get<SearchResult[]>(key);
  
  if (cached) {
    console.log('[Search] Cache hit for:', query);
    return cached;
  }

  let results: SearchResult[];

  // Try backends in order of preference
  if (process.env.TAVILY_API_KEY) {
    console.log('[Search] Using Tavily API');
    results = await searchWithTavily(query, options.depth);
  } else if (process.env.SERPAPI_KEY) {
    console.log('[Search] Using SerpAPI');
    results = await searchWithSerpAPI(query, options.depth);
  } else {
    console.log('[Search] Using DuckDuckGo (free)');
    results = await searchWithDuckDuckGo(query, options.depth);
  }

  // Dedupe and filter results
  results = dedupeResults(results);
  results = filterSpam(results);
  
  searchCache.set(key, results);
  return results;
}

/**
 * DuckDuckGo HTML scraping (no API key required)
 */
async function searchWithDuckDuckGo(query: string, depth: number): Promise<SearchResult[]> {
  try {
    // Use DuckDuckGo HTML search
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Parse results using regex (simpler than full DOM parsing)
    // DuckDuckGo HTML results are in <a class="result__a" href="...">
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
    
    // Extract URLs and titles
    const urlMatches = [...html.matchAll(resultRegex)];
    const snippetMatches = [...html.matchAll(snippetRegex)];

    for (let i = 0; i < Math.min(urlMatches.length, depth); i++) {
      const match = urlMatches[i];
      let url = match[1];
      const title = decodeHTMLEntities(match[2].trim());
      
      // DuckDuckGo wraps URLs - extract the actual URL
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]*)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
      }
      
      // Skip non-http URLs
      if (!url.startsWith('http')) continue;
      
      const snippet = snippetMatches[i] 
        ? decodeHTMLEntities(snippetMatches[i][1].replace(/<[^>]*>/g, '').trim())
        : '';

      results.push({
        title: title || url,
        url,
        snippet,
        position: i + 1,
      });
    }

    return results;
  } catch (error) {
    console.error('[DuckDuckGo] Search error:', error);
    // Return empty results on error rather than throwing
    return [];
  }
}

/**
 * SerpAPI search (requires SERPAPI_KEY)
 */
async function searchWithSerpAPI(query: string, depth: number): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: 'google',
      num: String(Math.min(depth, 10)),
    });

    const response = await fetch(`https://serpapi.com/search?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`SerpAPI returned ${response.status}`);
    }

    const data = await response.json();
    const organic = data.organic_results || [];

    return organic.map((result: { title?: string; link?: string; snippet?: string }, index: number) => ({
      title: result.title || '',
      url: result.link || '',
      snippet: result.snippet || '',
      position: index + 1,
    }));
  } catch (error) {
    console.error('[SerpAPI] Search error:', error);
    return [];
  }
}

/**
 * Tavily search (requires TAVILY_API_KEY)
 */
async function searchWithTavily(query: string, depth: number): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: Math.min(depth, 10),
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Tavily returned ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((result: { title?: string; url?: string; content?: string }, index: number) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
      position: index + 1,
    }));
  } catch (error) {
    console.error('[Tavily] Search error:', error);
    return [];
  }
}

/**
 * Remove duplicate URLs from results
 */
function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    // Normalize URL for comparison
    const normalized = normalizeUrl(result.url);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Filter out spammy/low-quality results
 */
function filterSpam(results: SearchResult[]): SearchResult[] {
  const spamPatterns = [
    /pinterest\.com/i,
    /facebook\.com/i,
    /twitter\.com/i,
    /instagram\.com/i,
    /tiktok\.com/i,
    /linkedin\.com/i,
    /youtube\.com\/shorts/i,
  ];

  return results.filter(result => {
    // Check for spam patterns
    for (const pattern of spamPatterns) {
      if (pattern.test(result.url)) return false;
    }
    
    // Filter very short snippets
    if (result.snippet.length < 10) return false;
    
    return true;
  });
}

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove www, trailing slash, common tracking params
    let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  return text.replace(/&[^;]+;/g, match => entities[match] || match);
}

export { searchWithDuckDuckGo, searchWithSerpAPI, searchWithTavily };
