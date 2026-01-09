import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Search Optimizer',
  description: 'Analyze how websites can rank better in LLM-powered search',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
