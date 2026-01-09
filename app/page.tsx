'use client';

import { useState } from 'react';
import { 
  Search, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  FileText,
  Zap,
  TrendingUp,
  Clock,
  Database,
  Code,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { AnswerResponse } from '@/lib/types';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [depth, setDepth] = useState<3 | 5 | 10>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [showBestPractices, setShowBestPractices] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), depth }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Search Optimizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover how websites rank in AI-powered search. Enter a question, get a cited answer, 
            and learn how to optimize your content for LLM visibility.
          </p>
        </header>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="question" className="sr-only">Your question</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask any question (e.g., 'What are the benefits of meditation?')"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 
                           bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div>
                <label htmlFor="depth" className="sr-only">Search depth</label>
                <select
                  id="depth"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value) as 3 | 5 | 10)}
                  className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 
                           bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value={3}>3 sources</option>
                  <option value={5}>5 sources</option>
                  <option value={10}>10 sources</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white font-medium rounded-lg transition-colors
                         flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search & Answer
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="card p-4 mb-8 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Searching the web, analyzing content, and generating insights...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              This may take 10-30 seconds depending on source availability
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Meta Info Bar */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                {result.meta.searchBackend.charAt(0).toUpperCase() + result.meta.searchBackend.slice(1)}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {result.meta.sourcesFetched}/{result.meta.sourcesSearched} sources analyzed
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {(result.meta.processingTime / 1000).toFixed(1)}s
              </span>
              {result.meta.cached && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Zap className="w-4 h-4" />
                  Cached
                </span>
              )}
            </div>

            {/* Answer Panel */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Answer
                </h2>
                <span className={`text-sm font-medium confidence-${result.answer.confidence}`}>
                  {result.answer.confidence.charAt(0).toUpperCase() + result.answer.confidence.slice(1)} confidence
                </span>
              </div>
              
              <div className="prose dark:prose-invert max-w-none answer-text">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {result.answer.text}
                </p>
              </div>

              {result.answer.citations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Citations
                  </h3>
                  <div className="space-y-2">
                    {result.answer.citations.map((citation) => (
                      <a
                        key={citation.index}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span className="font-medium">[{citation.index}]</span>
                        <span className="line-clamp-1">{citation.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Sources Panel */}
            <section className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Sources Analyzed
              </h2>
              
              <div className="space-y-4">
                {result.sources.map((source) => (
                  <div 
                    key={source.index}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0 flex-1">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                        >
                          [{source.index}] {source.title || 'Untitled'}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {source.url}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Score: {source.relevanceScore.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {source.topSnippet && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                        &ldquo;{source.topSnippet}&rdquo;
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {source.qualitySignals.hasStructuredData && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Schema.org
                        </span>
                      )}
                      {source.qualitySignals.hasGoodMetadata && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Good Meta
                        </span>
                      )}
                      {source.qualitySignals.hasHeadings && (
                        <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Structured
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300">
                        {source.qualitySignals.wordCount} words
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300">
                        {source.qualitySignals.loadTime}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Optimization Tips Panel */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  AI Search Optimization Tips
                </h2>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Overall Score: <span className="font-semibold">{result.optimization.overallScore}/100</span>
                  </span>
                </div>
              </div>

              {result.optimization.tips.length > 0 ? (
                <div className="space-y-4">
                  {result.optimization.tips.map((tip, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 badge-${tip.priority}`}>
                          {tip.priority.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {tip.category}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {tip.issue}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tip.recommendation}
                          </p>
                          {tip.example && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <Code className="w-3 h-3" />
                                Example
                              </div>
                              <pre className="text-xs bg-gray-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto">
                                {tip.example}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No specific issues found. The analyzed sources follow good practices.
                </p>
              )}

              {/* Best Practices Accordion */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <button
                  onClick={() => setShowBestPractices(!showBestPractices)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    General Best Practices for AI Search Optimization
                  </h3>
                  {showBestPractices ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {showBestPractices && (
                  <ul className="mt-4 space-y-2">
                    {result.optimization.bestPractices.map((practice, index) => (
                      <li 
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {practice}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            AI Search Optimizer MVP • Built to demonstrate LLM search optimization concepts
          </p>
          <p className="mt-1">
            Uses DuckDuckGo for search • No paid APIs required for core functionality
          </p>
        </footer>
      </div>
    </main>
  );
}
