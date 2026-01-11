'use client';

import { useState, useEffect } from 'react';
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
  MessageSquareQuote,
  HelpCircle,
  Target,
  Lightbulb,
  Quote,
  Users,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Brain,
  FileEdit,
  TrendingUp,
  MessageCircle,
  Wand2
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analysis' | 'improvements' | 'citations'>('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-700 border-red-200',
      'high': 'bg-orange-100 text-orange-700 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'low': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const getConfidenceColor = (confidence: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-green-100 text-green-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'low': 'bg-gray-100 text-gray-600',
    };
    return colors[confidence] || 'bg-gray-100 text-gray-600';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
          
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">Powered by Claude AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 min-w-[180px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Analyze with Claude
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Claude AI analyzes your content and simulates how AI assistants will cite it
          </p>
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
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
              <Brain className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Claude is analyzing your page...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Simulating AI citations, identifying improvements, and generating recommendations
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Fetching content</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">AI analysis</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Generating insights</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Score Overview Card */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-28 h-28 ${getGradeColor(result.grade)} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg`}>
                    <span className="text-5xl font-bold">{result.score}</span>
                    <span className="text-sm opacity-90">Grade {result.grade}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">{result.metadata.title || 'Untitled Page'}</h2>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      {result.metadata.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span>{result.metadata.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{(result.metadata.loadTime / 1000).toFixed(1)}s load</span>
                      <span>•</span>
                      <span>Readability: {result.metadata.readabilityScore}/100</span>
                    </div>
                    {result.aiAnalysis && (
                      <div className="mt-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">AI-Powered Analysis</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* AI Summary */}
              {result.aiAnalysis?.summary && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Claude&apos;s Assessment</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.aiAnalysis.summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'overview' 
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('citations')}
                className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'citations' 
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquareQuote className="w-4 h-4" />
                Citation Simulator
              </button>
              <button
                onClick={() => setActiveTab('improvements')}
                className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'improvements' 
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Improvements
              </button>
              <button
                onClick={() => setActiveTab('ai-analysis')}
                className={`flex-1 px-4 py-2 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'ai-analysis' 
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Brain className="w-4 h-4" />
                AI Deep Dive
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
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

                {/* Content Understanding */}
                {result.aiAnalysis?.contentUnderstanding && (
                  <div className="card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      What AI Understands
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Main Topic</span>
                        <p className="font-medium">{result.aiAnalysis.contentUnderstanding.mainTopic}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Target Audience</span>
                        <p className="font-medium">{result.aiAnalysis.contentUnderstanding.targetAudience}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Content Type</span>
                        <p className="font-medium">{result.aiAnalysis.contentUnderstanding.contentType}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Key Messages</span>
                        <ul className="mt-1 space-y-1">
                          {result.aiAnalysis.contentUnderstanding.keyMessages.map((msg, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Competitive Analysis */}
                {result.aiAnalysis?.competitiveAnalysis && (
                  <div className="card p-6 md:col-span-2">
                    <h3 className="font-semibold mb-4">Strengths & Opportunities</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {result.aiAnalysis.competitiveAnalysis.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-green-700 dark:text-green-300">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {result.aiAnalysis.competitiveAnalysis.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-red-700 dark:text-red-300">• {w}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Quick Wins
                        </h4>
                        <ul className="space-y-1">
                          {result.aiAnalysis.competitiveAnalysis.opportunities.map((o, i) => (
                            <li key={i} className="text-sm text-blue-700 dark:text-blue-300">• {o}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Citations Tab */}
            {activeTab === 'citations' && (
              <div className="space-y-6">
                {/* Citation Simulations */}
                {result.aiAnalysis?.citationSimulation?.sampleCitations && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquareQuote className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">How AI Will Cite Your Content</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                      Claude simulated how AI assistants would respond to user queries using your content.
                    </p>
                    
                    <div className="space-y-6">
                      {result.aiAnalysis.citationSimulation.sampleCitations.map((citation, i) => (
                        <div key={i} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 dark:bg-zinc-800 p-3 border-b border-gray-200 dark:border-zinc-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">User asks:</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(citation.confidence)}`}>
                                {citation.confidence} confidence
                              </span>
                            </div>
                            <p className="mt-1 text-gray-700 dark:text-gray-300">&quot;{citation.userQuery}&quot;</p>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase">AI Response</span>
                                <p className="text-sm mt-1">{citation.aiResponse}</p>
                                {citation.citedText && (
                                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                                    <span className="text-xs text-yellow-700 dark:text-yellow-300 uppercase">Quoted from your page:</span>
                                    <p className="text-sm mt-1 italic">&quot;{citation.citedText}&quot;</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Likely Queries */}
                {result.aiAnalysis?.citationSimulation?.likelyQueries && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">Queries Your Page Could Answer</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      If optimized well, your page could be cited for these searches:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.citationSimulation.likelyQueries.map((query, i) => (
                        <div key={i} className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-700 dark:text-purple-300">
                          &quot;{query}&quot;
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Improvements Tab */}
            {activeTab === 'improvements' && (
              <div className="space-y-6">
                {/* AI Improvements */}
                {result.aiAnalysis?.improvements && result.aiAnalysis.improvements.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold">AI-Identified Improvements</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {result.aiAnalysis.improvements.map((imp, i) => (
                        <div key={i} className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-medium">{imp.issue}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(imp.priority)}`}>
                              {imp.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{imp.recommendation}</p>
                          {imp.exampleFix && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                              <span className="text-xs text-green-700 dark:text-green-300 uppercase font-medium">Example fix:</span>
                              <p className="mt-1 text-green-800 dark:text-green-200">{imp.exampleFix}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Content */}
                {result.aiAnalysis?.missingContent && result.aiAnalysis.missingContent.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold">Content You Should Add</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {result.aiAnalysis.missingContent.map((content, i) => (
                        <div key={i} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                          <h4 className="font-medium text-red-800 dark:text-red-200">{content.topic}</h4>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{content.reason}</p>
                          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded">
                            <span className="text-xs text-gray-500 uppercase">Suggested content:</span>
                            <p className="text-sm mt-1">{content.suggestedContent}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Deep Dive Tab */}
            {activeTab === 'ai-analysis' && (
              <div className="space-y-6">
                {/* Rewrite Suggestions */}
                {result.aiAnalysis?.rewriteSuggestions && result.aiAnalysis.rewriteSuggestions.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileEdit className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">AI Rewrite Suggestions</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Claude rewrote these sentences to be more likely to get cited by AI assistants.
                    </p>
                    
                    <div className="space-y-6">
                      {result.aiAnalysis.rewriteSuggestions.map((rewrite, i) => (
                        <div key={i} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-zinc-700">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400 uppercase font-medium">Original (weak)</span>
                            </div>
                            <p className="text-sm text-red-800 dark:text-red-200">&quot;{rewrite.original}&quot;</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400 uppercase font-medium">Improved (citable)</span>
                            </div>
                            <p className="text-sm text-green-800 dark:text-green-200">&quot;{rewrite.improved}&quot;</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">{rewrite.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No AI Analysis Fallback */}
                {!result.aiAnalysis && (
                  <div className="card p-12 text-center">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-600 mb-2">AI Analysis Not Available</h3>
                    <p className="text-sm text-gray-500">
                      Configure your ANTHROPIC_API_KEY to enable Claude-powered analysis.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
