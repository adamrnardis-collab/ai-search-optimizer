/**
 * Claude AI-Powered Analysis
 * 
 * Uses Claude API to provide intelligent content analysis
 * for AI search optimization.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysis {
  // Overall assessment
  summary: string;
  aiReadinessScore: number;
  
  // What AI assistants will understand about this page
  contentUnderstanding: {
    mainTopic: string;
    targetAudience: string;
    contentType: string;
    keyMessages: string[];
  };
  
  // How AI might cite this content
  citationSimulation: {
    likelyQueries: string[];
    sampleCitations: Array<{
      userQuery: string;
      aiResponse: string;
      citedText: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  
  // Specific improvements
  improvements: Array<{
    category: 'content' | 'structure' | 'credibility' | 'technical';
    issue: string;
    recommendation: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    exampleFix?: string;
  }>;
  
  // Content that should be added
  missingContent: Array<{
    topic: string;
    reason: string;
    suggestedContent: string;
  }>;
  
  // Rewritten snippets for better AI citation
  rewriteSuggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  
  // Competitive insights
  competitiveAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}

export async function analyzeWithClaude(
  content: string,
  title: string,
  url: string,
  metadata: {
    wordCount: number;
    hasSchema: boolean;
    hasFAQ: boolean;
    hasAuthor: boolean;
    headings: string[];
  }
): Promise<AIAnalysis> {
  // Truncate content if too long (keep first 8000 chars for cost efficiency)
  const truncatedContent = content.length > 8000 
    ? content.slice(0, 8000) + '\n\n[Content truncated for analysis...]'
    : content;

  const prompt = `You are an expert in AI search optimization - helping websites get cited by AI assistants like ChatGPT, Perplexity, Claude, and Google AI Overview.

Analyze this webpage content and provide detailed recommendations for improving its visibility in AI-powered search.

**Page Information:**
- URL: ${url}
- Title: ${title}
- Word Count: ${metadata.wordCount}
- Has Schema Markup: ${metadata.hasSchema}
- Has FAQ Section: ${metadata.hasFAQ}
- Has Author Info: ${metadata.hasAuthor}
- Headings: ${metadata.headings.slice(0, 10).join(', ')}

**Page Content:**
${truncatedContent}

**Your Task:**
Analyze this content as if you were an AI assistant deciding whether to cite it. Provide your analysis in the following JSON format:

{
  "summary": "A 2-3 sentence overall assessment of how AI-ready this content is",
  "aiReadinessScore": <number 0-100>,
  
  "contentUnderstanding": {
    "mainTopic": "What this page is primarily about",
    "targetAudience": "Who this content is written for",
    "contentType": "article/guide/product page/FAQ/etc",
    "keyMessages": ["The 3-5 main points this content conveys"]
  },
  
  "citationSimulation": {
    "likelyQueries": ["5-7 search queries where this page COULD be cited if optimized well"],
    "sampleCitations": [
      {
        "userQuery": "A realistic question a user might ask",
        "aiResponse": "How an AI assistant would respond, citing this page",
        "citedText": "The specific text from this page that would be quoted",
        "confidence": "high/medium/low - how likely this citation would happen"
      }
    ]
  },
  
  "improvements": [
    {
      "category": "content/structure/credibility/technical",
      "issue": "Specific problem identified",
      "recommendation": "What to do about it",
      "priority": "critical/high/medium/low",
      "exampleFix": "Concrete example of the fix (if applicable)"
    }
  ],
  
  "missingContent": [
    {
      "topic": "What's missing",
      "reason": "Why this matters for AI citation",
      "suggestedContent": "Draft of what to add (2-3 sentences)"
    }
  ],
  
  "rewriteSuggestions": [
    {
      "original": "A weak sentence from the content",
      "improved": "A rewritten version optimized for AI citation",
      "reason": "Why this is better"
    }
  ],
  
  "competitiveAnalysis": {
    "strengths": ["What this content does well for AI citation"],
    "weaknesses": ["What holds it back"],
    "opportunities": ["Quick wins that could significantly improve citations"]
  }
}

**Important Guidelines:**
1. Be specific and actionable - don't give generic advice
2. Quote actual text from the content when suggesting rewrites
3. Focus on what makes content citable by AI (clear facts, statistics, definitions, direct answers)
4. Consider all major AI platforms (ChatGPT, Perplexity, Claude, Google AI Overview)
5. Prioritize improvements by impact
6. Provide at least 3 sample citations showing how the content could be cited
7. Include at least 5 specific improvements
8. Suggest at least 2 content rewrites

Return ONLY valid JSON, no markdown or other formatting.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    const analysis = JSON.parse(textContent.text) as AIAnalysis;
    return analysis;

  } catch (error) {
    console.error('[Claude Analysis] Error:', error);
    
    // Return a fallback analysis if Claude fails
    return {
      summary: 'AI analysis temporarily unavailable. Using rule-based analysis.',
      aiReadinessScore: 50,
      contentUnderstanding: {
        mainTopic: title || 'Unknown',
        targetAudience: 'General audience',
        contentType: 'webpage',
        keyMessages: ['Content analysis pending'],
      },
      citationSimulation: {
        likelyQueries: [],
        sampleCitations: [],
      },
      improvements: [
        {
          category: 'technical',
          issue: 'AI analysis could not be completed',
          recommendation: 'Try again or check API configuration',
          priority: 'high',
        },
      ],
      missingContent: [],
      rewriteSuggestions: [],
      competitiveAnalysis: {
        strengths: [],
        weaknesses: ['Unable to analyze'],
        opportunities: [],
      },
    };
  }
}

/**
 * Generate a focused rewrite suggestion for a specific piece of content
 */
export async function generateRewrite(
  originalText: string,
  context: string,
  targetQuery: string
): Promise<{ improved: string; explanation: string }> {
  const prompt = `Rewrite this text to be more likely to be cited by AI assistants when users search for "${targetQuery}".

**Context:** ${context}

**Original Text:**
${originalText}

**Requirements:**
1. Make it more factual and specific
2. Add numbers/statistics if possible (or placeholders like [X%])
3. Make sentences quotable (15-25 words ideal)
4. Start with the most important information
5. Use clear, declarative statements

Return JSON:
{
  "improved": "The rewritten text",
  "explanation": "Why this version is more citable"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response');
    }

    return JSON.parse(textContent.text);
  } catch {
    return {
      improved: originalText,
      explanation: 'Could not generate rewrite',
    };
  }
}

/**
 * Generate FAQ suggestions based on content
 */
export async function generateFAQSuggestions(
  content: string,
  topic: string
): Promise<Array<{ question: string; answer: string }>> {
  const prompt = `Based on this content about "${topic}", generate 5 FAQ questions and answers that would help this page get cited by AI assistants.

**Content:**
${content.slice(0, 4000)}

**Requirements:**
1. Questions should be what real users would ask AI assistants
2. Answers should be concise (2-3 sentences) and highly quotable
3. Include specific facts/numbers where the content supports them
4. Make answers stand alone (don't require reading the full article)

Return JSON array:
[
  {
    "question": "What is X?",
    "answer": "A clear, citable answer..."
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response');
    }

    return JSON.parse(textContent.text);
  } catch {
    return [];
  }
}

/**
 * Analyze how well content answers a specific query
 */
export async function analyzeQueryMatch(
  content: string,
  query: string
): Promise<{
  matchScore: number;
  wouldCite: boolean;
  reason: string;
  improvementSuggestion: string;
}> {
  const prompt = `You are an AI assistant deciding whether to cite this content when a user asks: "${query}"

**Content:**
${content.slice(0, 3000)}

Evaluate and return JSON:
{
  "matchScore": <0-100 how well this answers the query>,
  "wouldCite": <true/false would you cite this>,
  "reason": "Why you would or wouldn't cite this",
  "improvementSuggestion": "What would make you more likely to cite it"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response');
    }

    return JSON.parse(textContent.text);
  } catch {
    return {
      matchScore: 0,
      wouldCite: false,
      reason: 'Analysis unavailable',
      improvementSuggestion: '',
    };
  }
}
