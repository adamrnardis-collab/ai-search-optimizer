import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Search Optimizer - Get Cited by AI Assistants',
  description: 'Analyze your website for AI search readiness. Get actionable recommendations to improve visibility in ChatGPT, Perplexity, Claude, and Google AI.',
  keywords: ['AI SEO', 'LLM optimization', 'AI search', 'ChatGPT SEO', 'Perplexity optimization'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
