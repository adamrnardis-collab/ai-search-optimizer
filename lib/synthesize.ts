/**
 * Answer Synthesis Module
 * 
 * Generates answers grounded in extracted evidence with citations.
 * Supports two modes:
 * - Template-based (no API key required)
 * - AI-powered (requires OPENAI_API_KEY)
 */

import { Evidence, ExtractedSource } from './extract';

export interface SynthesizedAnswer {
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
  method: 'template' | 'ai';
}

export interface Citation {
  index: number;
  url: string;
  title: string;
  snippet: string;
}

/**
 * Generate an answer from evidence
 */
export async function synthesizeAnswer(
  question: string,
  sources: ExtractedSource[],
  evidence: Evidence[]
): Promise<SynthesizedAnswer> {
  // Filter to only sources with evidence
  const relevantSources = sources.filter(s => s.topSnippets.length > 0);
  
  if (relevantSources.length === 0 || evidence.length === 0) {
    return {
      answer: generateNoResultsResponse(question),
      citations: [],
      confidence: 'low',
      method: 'template',
    };
  }

  // Try AI synthesis if API key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      return await synthesizeWithAI(question, relevantSources, evidence);
    } catch (error) {
      console.error('[Synthesis] AI synthesis failed, falling back to template:', error);
    }
  }

  // Fall back to template-based synthesis
  return synthesizeWithTemplate(question, relevantSources, evidence);
}

/**
 * Template-based answer synthesis (no API required)
 */
function synthesizeWithTemplate(
  question: string,
  sources: ExtractedSource[],
  evidence: Evidence[]
): SynthesizedAnswer {
  const citations: Citation[] = evidence.map((e, idx) => ({
    index: idx + 1,
    url: e.url,
    title: e.title,
    snippet: e.snippet,
  }));

  // Build answer from top evidence snippets
  const topEvidence = evidence.slice(0, 3);
  
  // Determine confidence based on evidence quality
  const avgScore = evidence.reduce((sum, e) => sum + e.score, 0) / evidence.length;
  const confidence: 'high' | 'medium' | 'low' = 
    avgScore > 5 ? 'high' : avgScore > 2 ? 'medium' : 'low';

  // Generate answer based on evidence
  let answer = '';
  
  if (topEvidence.length === 1) {
    answer = `Based on the available sources, ${topEvidence[0].snippet} [1]`;
  } else {
    // Combine multiple sources
    answer = `Based on multiple sources:\n\n`;
    
    topEvidence.forEach((e, idx) => {
      const citationNum = idx + 1;
      answer += `• ${e.snippet} [${citationNum}]\n\n`;
    });
    
    answer += `These findings come from ${sources.length} source(s) analyzed.`;
  }

  // Add caveat for low confidence
  if (confidence === 'low') {
    answer += '\n\n*Note: The available sources provide limited information on this topic. Consider refining your search query for better results.*';
  }

  return {
    answer,
    citations,
    confidence,
    method: 'template',
  };
}

/**
 * AI-powered answer synthesis (requires OPENAI_API_KEY)
 */
async function synthesizeWithAI(
  question: string,
  sources: ExtractedSource[],
  evidence: Evidence[]
): Promise<SynthesizedAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build context from evidence
  const evidenceContext = evidence.map((e, idx) => 
    `[Source ${idx + 1}] ${e.title}\nURL: ${e.url}\nContent: ${e.snippet}`
  ).join('\n\n');

  const systemPrompt = `You are a helpful research assistant. Answer questions based ONLY on the provided sources. 
Always cite your sources using [1], [2], etc. notation.
If the sources don't contain enough information to answer the question, say so.
Be concise but thorough. Synthesize information from multiple sources when relevant.`;

  const userPrompt = `Question: ${question}

Sources:
${evidenceContext}

Provide a clear, well-cited answer based on these sources.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const aiAnswer = data.choices?.[0]?.message?.content || '';

  const citations: Citation[] = evidence.map((e, idx) => ({
    index: idx + 1,
    url: e.url,
    title: e.title,
    snippet: e.snippet,
  }));

  // Determine confidence based on evidence quality and AI response
  const avgScore = evidence.reduce((sum, e) => sum + e.score, 0) / evidence.length;
  const hasGoodCoverage = aiAnswer.includes('[1]') && aiAnswer.includes('[2]');
  const confidence: 'high' | 'medium' | 'low' = 
    avgScore > 5 && hasGoodCoverage ? 'high' : avgScore > 2 ? 'medium' : 'low';

  return {
    answer: aiAnswer,
    citations,
    confidence,
    method: 'ai',
  };
}

/**
 * Generate response when no results are found
 */
function generateNoResultsResponse(question: string): string {
  return `I couldn't find sufficient information to answer "${question}" from the available sources.

**Suggestions to improve your search:**
• Try more specific keywords related to your topic
• Use different phrasing or synonyms
• Break down complex questions into simpler parts
• Check for spelling errors in key terms

If this is a very recent topic, the information may not yet be widely available online.`;
}

/**
 * Format answer with proper citation rendering
 */
export function formatAnswerWithCitations(answer: SynthesizedAnswer): string {
  let formatted = answer.answer;
  
  // Add source list at the end
  if (answer.citations.length > 0) {
    formatted += '\n\n---\n**Sources:**\n';
    answer.citations.forEach(c => {
      formatted += `[${c.index}] [${c.title}](${c.url})\n`;
    });
  }
  
  return formatted;
}
