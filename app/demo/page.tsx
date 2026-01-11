'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

export default function DemoPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/demo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-500',
      'B': 'bg-lime-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'F': 'bg-red-500',
    };
    return colors[grade] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'good': 'text-green-600',
      'warning': 'text-yellow-600',
      'poor': 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AI Search Optimizer</span>
          </Link>
          
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Demo Mode
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Demo Banner */}
        <div className="card p-4 mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            <strong>Demo Mode:</strong> Try the analyzer without signing up. Limited to basic results.
          </p>
        </div>

        {/* URL Input */}
        <div className="card p-6 mb-8">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="url" className="sr-only">URL to analyze</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to analyze (e.g., https://example.com/blog/article)"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 min-w-[150px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-4 mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing your page for AI search readiness...
            </p>
            <p className="text-sm text-gray-500 mt-2">This usually takes 5-15 seconds</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 ${getGradeColor(result.grade)} rounded-2xl flex flex-col items-center justify-center text-white`}>
                    <span className="text-4xl font-bold">{result.score}</span>
                    <span className="text-sm opacity-90">Grade {result.grade}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">{result.metadata.title || 'Untitled Page'}</h2>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      {result.metadata.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-sm text-gray-500 mt-1">
                      {result.metadata.wordCount} words • {(result.metadata.loadTime / 1000).toFixed(1)}s load time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(result.categories).map(([key, cat]) => {
                  const names: Record<string, string> = {
                    contentStructure: 'Content Structure',
                    citationReadiness: 'Citation Readiness',
                    technicalSeo: 'Technical SEO',
                    credibilitySignals: 'Credibility Signals',
                    aiSpecificFactors: 'AI-Specific Factors',
                  };
                  
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{names[key]}</span>
                        <span className={`text-sm font-medium ${getStatusColor(cat.status)}`}>
                          {cat.percentage}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${
                            cat.status === 'good' ? 'bg-green-500' : 
                            cat.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Recommendations (Limited in Demo) */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Recommendations</h3>
                <span className="text-sm text-gray-500">Showing 3 of {result.allRecommendations.length}</span>
              </div>
              
              <div className="space-y-4">
                {result.topRecommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded priority-${rec.priority}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upgrade CTA */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Want the full report?</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sign up free for detailed recommendations with code examples
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
