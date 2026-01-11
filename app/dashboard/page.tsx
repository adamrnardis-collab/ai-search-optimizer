'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Download,
  Lock,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Crown,
  MessageSquareQuote,
  HelpCircle,
  Target,
  Lightbulb,
  Quote,
  Users,
  BookOpen,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

export default function DashboardPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'recommendations'>('overview');

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

  const handleDownloadPDF = async () => {
    setShowUpgradeModal(true);
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

  const getConfidenceColor = (confidence: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-green-100 text-green-700 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'low': 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return colors[confidence] || 'bg-gray-100 text-gray-600';
  };

  const getStrengthColor = (strength: string) => {
    const colors: Record<string, string> = {
      'strong': 'border-l-green-500 bg-green-50',
      'medium': 'border-l-yellow-500 bg-yellow-50',
      'weak': 'border-l-red-500 bg-red-50',
    };
    return colors[strength] || 'border-l-gray-500 bg-gray-50';
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
          
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Demo Mode
          </span>
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 min-w-[150px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
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
            {/* Score Overview Card */}
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
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span>{result.metadata.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{(result.metadata.loadTime / 1000).toFixed(1)}s load</span>
                      <span>•</span>
                      <span title={result.metadata.readabilityGrade}>
                        Readability: {result.metadata.readabilityScore}/100
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                  activeTab === 'overview' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors flex items-center gap-1 ${
                  activeTab === 'insights' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Insights
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                  activeTab === 'recommendations' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recommendations
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
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

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.insights.questionsAnswered.length}</div>
                    <div className="text-sm text-gray-500">Questions Answered</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{result.insights.quotableSnippets.filter(s => s.strength === 'strong').length}</div>
                    <div className="text-sm text-gray-500">Strong Quotes</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{result.insights.entities.length}</div>
                    <div className="text-sm text-gray-500">Key Entities</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{result.insights.contentGaps.length}</div>
                    <div className="text-sm text-gray-500">Content Gaps</div>
                  </div>
                </div>
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                {/* AI Citation Preview */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquareQuote className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">How AI Might Cite Your Content</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Preview of how AI assistants could reference your content when answering user queries.
                  </p>
                  
                  {result.insights.citationPreviews.length > 0 ? (
                    <div className="space-y-4">
                      {result.insights.citationPreviews.map((preview, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${getConfidenceColor(preview.confidence)}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="text-sm font-medium text-gray-700">
                              <span className="text-gray-400">User asks:</span> &quot;{preview.query}&quot;
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              preview.confidence === 'high' ? 'bg-green-200 text-green-800' :
                              preview.confidence === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {preview.confidence} confidence
                            </span>
                          </div>
                          <div className="text-sm italic text-gray-600">
                            &quot;{preview.citation}&quot;
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Quote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No strong citation opportunities found. Add more specific facts and statistics.</p>
                    </div>
                  )}
                </div>

                {/* Questions Answered */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Questions Your Content Answers</h3>
                  </div>
                  
                  {result.insights.questionsAnswered.length > 0 ? (
                    <div className="grid gap-2">
                      {result.insights.questionsAnswered.map((question, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-sm">{question}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No clear questions detected. Consider adding FAQ-style content.</p>
                  )}
                </div>

                {/* Quotable Snippets */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Quote className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Quotable Snippets Found</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Sentences AI is likely to extract and quote directly.
                  </p>
                  
                  {result.insights.quotableSnippets.length > 0 ? (
                    <div className="space-y-3">
                      {result.insights.quotableSnippets.map((snippet, i) => (
                        <div key={i} className={`p-3 border-l-4 rounded-r-lg ${getStrengthColor(snippet.strength)}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm">&quot;{snippet.text}&quot;</p>
                            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                              snippet.strength === 'strong' ? 'bg-green-200 text-green-800' :
                              snippet.strength === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {snippet.type}
                            </span>
                          </div>
                          {snippet.suggestion && (
                            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              {snippet.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No strong quotable snippets found. Add specific facts, statistics, or definitions.</p>
                  )}
                </div>

                {/* Key Entities */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold">Key Entities Detected</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    People, organizations, and concepts AI will identify in your content.
                  </p>
                  
                  {result.insights.entities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.insights.entities.map((entity, i) => (
                        <div 
                          key={i} 
                          className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm"
                          title={entity.context}
                        >
                          <span className="font-medium">{entity.name}</span>
                          <span className="text-gray-400 ml-1 text-xs">
                            ({entity.type} • {entity.mentions}x)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No significant entities detected.</p>
                  )}
                </div>

                {/* Content Gaps */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold">Content Gaps to Fill</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Missing content types that would improve AI discoverability.
                  </p>
                  
                  {result.insights.contentGaps.length > 0 ? (
                    <div className="space-y-3">
                      {result.insights.contentGaps.map((gap, i) => (
                        <div key={i} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-red-800 dark:text-red-200">{gap.topic}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              gap.priority === 'high' ? 'bg-red-200 text-red-800' :
                              gap.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{gap.reason}</p>
                          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {gap.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600">Great! No major content gaps detected.</p>
                    </div>
                  )}
                </div>

                {/* Platform Tips */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Platform-Specific Tips</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {result.insights.platformTips.map((tip, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                        tip.implemented ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-zinc-800/50'
                      }`}>
                        {tip.implemented ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            tip.platform === 'All' ? 'bg-purple-100 text-purple-700' :
                            tip.platform === 'ChatGPT' ? 'bg-green-100 text-green-700' :
                            tip.platform === 'Perplexity' ? 'bg-blue-100 text-blue-700' :
                            tip.platform === 'Claude' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tip.platform}
                          </span>
                          <p className="text-sm mt-1">{tip.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Priority Recommendations</h3>
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              <strong>Impact:</strong> {rec.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.allRecommendations.length > 3 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">Unlock {result.allRecommendations.length - 3} more recommendations</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Get code examples and detailed fix instructions</p>
                        </div>
                        <Link
                          href="/pricing"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1"
                        >
                          <Zap className="w-4 h-4" />
                          View Plans
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pro Feature</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  PDF export requires Pro. Set up Clerk + Stripe to enable payments.
                </p>
                
                <div className="space-y-3">
                  <Link
                    href="/pricing"
                    className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center"
                  >
                    View Pricing
                  </Link>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-3 border border-gray-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
