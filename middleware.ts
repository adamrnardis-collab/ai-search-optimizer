import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Check if Clerk is properly configured
const clerkEnabled = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                     process.env.CLERK_SECRET_KEY &&
                     !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
                     !process.env.CLERK_SECRET_KEY.includes('placeholder');

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/demo',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/demo-analyze',
]);

export default clerkEnabled ? clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const session = await auth();
    session.protect();
  }
}) : clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
