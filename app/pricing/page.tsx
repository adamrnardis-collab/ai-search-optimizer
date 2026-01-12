import Link from 'next/link';
import { Check, X, Search, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AI Search Optimizer</span>
          </Link>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
            Try It Free
          </Link>
        </div>
      </nav>

      <main className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Currently free during beta. Premium features coming soon.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card p-8 border-2 border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                Current
              </div>
              <h2 className="text-2xl font-bold mb-2">Free Beta</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Full access during beta</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">£0</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Unlimited scans</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Claude AI-powered analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Citation simulator</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>All recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Content rewrite suggestions</span>
                </li>
              </ul>

              <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Start Analyzing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro Plan - Coming Soon */}
            <div className="card p-8 opacity-75">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Coming soon</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">£19</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Check className="w-5 h-5" />
                  <span>Priority analysis</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Check className="w-5 h-5" />
                  <span>Bulk URL analysis</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Check className="w-5 h-5" />
                  <span>PDF export</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Check className="w-5 h-5" />
                  <span>API access</span>
                </li>
              </ul>

              <button disabled className="w-full py-3 text-center border border-gray-300 dark:border-zinc-700 rounded-lg font-medium bg-gray-100 dark:bg-zinc-800 text-gray-500 cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
