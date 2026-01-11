/**
 * Stripe Payment Utilities
 */

import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Price ID for Pro subscription
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;

// Pro features
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
 * Create a Stripe checkout session for Pro subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Create a billing portal session for managing subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  return customers.data[0] || null;
}

/**
 * Check if customer has active subscription
 */
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data.length > 0;
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(customerId: string): Promise<{
  isActive: boolean;
  subscription: Stripe.Subscription | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });

  const subscription = subscriptions.data[0];

  if (!subscription) {
    return {
      isActive: false,
      subscription: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    };
  }

  return {
    isActive: subscription.status === 'active',
    subscription,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };
}
