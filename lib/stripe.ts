/**
 * Stripe Payment Utilities - PLACEHOLDER
 * 
 * Stripe integration is disabled in demo mode.
 * Enable Clerk + Stripe for full payment functionality.
 */

// Pro features (for display purposes)
export const PRO_FEATURES = [
  'Unlimited URL scans',
  'Full detailed reports',
  'PDF export',
  'Competitor comparison',
  'Priority support',
  'API access (coming soon)',
];

export const FREE_FEATURES = [
  '3 scans per month',
  'Basic report preview',
  'Top 3 recommendations',
];

/**
 * Placeholder - Stripe not configured
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  returnUrl: string
): Promise<string> {
  console.log('[Stripe] Payments disabled in demo mode');
  throw new Error('Stripe payments not configured. Set up Clerk + Stripe to enable.');
}

/**
 * Placeholder - Stripe not configured
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  throw new Error('Stripe payments not configured.');
}
