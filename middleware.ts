import { authMiddleware } from '@clerk/nextjs/server';

// Check if Clerk is properly configured
const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.CLERK_SECRET_KEY &&
                     !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
                     !process.env.CLERK_SECRET_KEY.includes('placeholder');

export default authMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/demo',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/(.*)',
    '/api/demo-analyze',
  ],
  ignoredRoutes: clerkEnabled ? [] : ['/(.*)', '/api/(.*)'],
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
