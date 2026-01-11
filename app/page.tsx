import Link from 'next/link';
import { 
  Search, 
  BarChart3, 
  FileText, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Star,
  Shield,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AI Search Optimizer</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Try It Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI Search is the future of discovery
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Get Your Website Cited by{' '}
            <span className="text-blue-600">AI Assistants</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Analyze your pages for AI search readiness. Get actionable recommendations 
            to improve visibility in ChatGPT, Perplexity, Claude, and other LLM-powered search.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
              Analyze Your Site Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-8 py-4 border border-gray-300 dark:border-zinc-700 hover:border-gray-400 font-semibold rounded-xl">
              See How It Works
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Free to use • No sign-up required
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Three simple steps to optimize your content for AI search engines
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Enter Your URL</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Paste any webpage URL and we&apos;ll analyze it for AI search readiness
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Get Your Score</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                See your AI readiness score across 5 key categories with 50+ checks
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Fix & Improve</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Follow prioritized recommendations with code examples to boost visibility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">What We Analyze</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            We check 50+ factors that influence how AI systems discover and cite your content
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Content Structure', items: ['Heading hierarchy', 'FAQ sections', 'Clear definitions', 'Proper formatting'] },
              { title: 'Citation Readiness', items: ['Quotable statements', 'Statistics & data', 'Specific claims', 'Clear sentences'] },
              { title: 'Technical SEO', items: ['Schema.org markup', 'Meta tags', 'Page speed', 'Mobile friendly'] },
              { title: 'Credibility Signals', items: ['Author information', 'Publish dates', 'Source citations', 'About page'] },
              { title: 'AI-Specific Factors', items: ['Upfront answers', 'Key takeaways', 'Table of contents', 'Accessibility'] },
              { title: 'Competitive Edge', items: ['vs. competitor analysis', 'Gap identification', 'Industry benchmarks', 'Priority ranking'] },
            ].map((category, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-semibold mb-3">{category.title}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Cited by AI?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Analyze your website and get actionable recommendations to improve AI visibility.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50">
            Start Free Analysis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">AI Search Optimizer</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</Link>
          </div>
          <p className="text-sm text-gray-500">© 2025 AI Search Optimizer</p>
        </div>
      </footer>
    </div>
  );
}
