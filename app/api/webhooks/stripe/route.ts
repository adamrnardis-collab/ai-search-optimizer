import { NextRequest, NextResponse } from 'next/server';

// Placeholder webhook - Stripe integration disabled for demo mode
export async function POST(request: NextRequest) {
  console.log('[Webhook] Stripe webhooks disabled in demo mode');
  
  return NextResponse.json({ 
    message: 'Stripe webhooks disabled. Enable Clerk + Stripe for payment functionality.',
    received: true 
  });
}
