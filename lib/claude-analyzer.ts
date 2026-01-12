/**
 * Claude AI-Powered Analysis
 * 
 * Uses direct HTTP calls to Anthropic API (avoiding SDK issues in serverless)
 */

export interface AIAnalysis {
  summary: string;
  aiReadinessScore: number;
  
  contentUnderstanding: {
    mainTopic: string;
    targetAudience: string;
    contentType: string;
    keyMessages: string[];
  };
  
  citationSimulation: {
    likelyQueries: string[];
    sampleCitations: Array<{
      userQuery: string;
      aiResponse: string;
      citedText: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  
  improvements: Array<{
    category: 'content' | 'structure' | 'credibility' | 'technical';
    issue: string;
    recommendation: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    exampleFix?: string;
  }>;
  
  missingContent: Array<{
    topic: string;
    reason: string;
    suggestedContent: string;
  }>;
  
  rewriteSuggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  
  competitiveAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}

function createFallbackAnalysis(title: string, errorMessage?: string): AIAnalysis {
  return {
    summary: errorMessage || 'AI analysis not available.',
    aiReadinessScore: 50,
    contentUnderstanding: {
      mainTopic: title || 'Unknown',
      targetAudience: 'General audience',
      contentType: 'webpage',
      keyMessages: ['Enable AI analysis for detailed insights'],
    },
    citationSimulation: {
      likelyQueries: [],
      sampleCitations: [],
    },
    improvements: [],
    missingContent: [],
    rewriteSuggestions: [],
    competitiveAnalysis: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
    },
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('[Claude Analysis] No API key configured');
    return createFallbackAnalysis(title, 'Configure ANTHROPIC_API_KEY for AI-powered analysis.');
  }

  // Truncate content for cost efficiency
  const truncatedContent = content.length > 6000 
    ? content.slice(0, 6000) + '\n\n[Content truncated...]'
    : content;

  const prompt = `You are an expert in AI search optimization - helping websites get cited by AI assistants like ChatGPT, Perplexity, Claude, and Google AI Overview.

Analyze this webpage and provide recommendations for improving its visibility in AI-powered search.

**Page Info:**
- URL: ${url}
- Title: ${title}
- Words: ${metadata.wordCount}
- Has Schema: ${metadata.hasSchema}
- Has FAQ: ${metadata.hasFAQ}
- Has Author: ${metadata.hasAuthor}
- Headings: ${metadata.headings.slice(0, 8).join(', ')}

**Content:**
${truncatedContent}

Respond with this exact JSON structure (no markdown, just JSON):

{
  "summary": "2-3 sentence assessment of AI-readiness",
  "aiReadinessScore": 65,
  "contentUnderstanding": {
    "mainTopic": "What the page is about",
    "targetAudience": "Who it's for",
    "contentType": "article/guide/product/etc",
    "keyMessages": ["Main point 1", "Main point 2", "Main point 3"]
  },
  "citationSimulation": {
    "likelyQueries": ["query 1", "query 2", "query 3", "query 4", "query 5"],
    "sampleCitations": [
      {
        "userQuery": "A question someone might ask",
        "aiResponse": "How AI would answer using this page",
        "citedText": "Text that would be quoted",
        "confidence": "high"
      },
      {
        "userQuery": "Another question",
        "aiResponse": "Another AI response",
        "citedText": "Another quote",
        "confidence": "medium"
      }
    ]
  },
  "improvements": [
    {
      "category": "content",
      "issue": "Specific problem",
      "recommendation": "How to fix it",
      "priority": "high",
      "exampleFix": "Example of the fix"
    }
  ],
  "missingContent": [
    {
      "topic": "What to add",
      "reason": "Why it matters",
      "suggestedContent": "Draft of what to write"
    }
  ],
  "rewriteSuggestions": [
    {
      "original": "A weak sentence from the content",
      "improved": "A better version optimized for AI citation",
      "reason": "Why it's better"
    }
  ],
  "competitiveAnalysis": {
    "strengths": ["Good thing 1", "Good thing 2"],
    "weaknesses": ["Problem 1", "Problem 2"],
    "opportunities": ["Quick win 1", "Quick win 2"]
  }
}`;

  try {
    console.log('[Claude Analysis] Calling Anthropic API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Claude Analysis] API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from response
    const textContent = data.content?.find((block: { type: string }) => block.type === 'text');
    if (!textContent || !textContent.text) {
      throw new Error('No text response from Claude');
    }

    // Clean the response - remove any markdown formatting
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const analysis = JSON.parse(jsonText) as AIAnalysis;
    console.log('[Claude Analysis] Success, score:', analysis.aiReadinessScore);
    return analysis;

  } catch (error) {
    console.error('[Claude Analysis] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createFallbackAnalysis(title, `AI analysis failed: ${message}`);
  }
}
