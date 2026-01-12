import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Search Optimizer Pro',
  description: 'Optimize your website for AI-powered search engines. Get actionable recommendations to improve your visibility in ChatGPT, Perplexity, Claude, and more.',
  keywords: ['AI SEO', 'LLM optimization', 'AI search', 'ChatGPT SEO', 'Perplexity optimization'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Clerk is configured
  const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                       !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

  if (clerkEnabled) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
            {children}
          </body>
        </html>
      </ClerkProvider>
    );
  }

  // No Clerk - render without auth
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
