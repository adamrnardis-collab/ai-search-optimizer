import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { analyzeUrl } from '@/lib/analyzer';
import { isValidUrl } from '@/lib/utils';

const FREE_SCANS_PER_MONTH = 3;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await clerkClient.users.getUser(userId);
    const metadata = (user.publicMetadata || {}) as Record<string, unknown>;
    const isPro = metadata.isPro === true;

    // Check scan limits for free users
    if (!isPro) {
      const now = new Date();
      const resetDate = metadata.scansResetDate ? new Date(metadata.scansResetDate as string) : null;
      const needsReset = !resetDate || resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear();
      
      let scansThisMonth = needsReset ? 0 : (metadata.scansThisMonth as number) || 0;
      
      if (needsReset) {
        // Reset monthly counter
        await clerkClient.users.updateUser(userId, {
          publicMetadata: {
            ...metadata,
            scansThisMonth: 0,
            scansResetDate: now.toISOString(),
          },
        });
        scansThisMonth = 0;
      }

      if (scansThisMonth >= FREE_SCANS_PER_MONTH) {
        return NextResponse.json(
          { error: 'Monthly scan limit reached. Upgrade to Pro for unlimited scans.' },
          { status: 403 }
        );
      }
    }

    // Parse request
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL. Please enter a valid http or https URL.' },
        { status: 400 }
      );
    }

    // Analyze the URL
    console.log(`[Analyze] Starting analysis for: ${url}`);
    const result = await analyzeUrl(url);
    console.log(`[Analyze] Completed with score: ${result.score}`);

    // Increment scan count for free users
    if (!isPro) {
      const currentUser = await clerkClient.users.getUser(userId);
      const currentMetadata = currentUser.publicMetadata as Record<string, unknown>;
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...currentMetadata,
          scansThisMonth: ((currentMetadata.scansThisMonth as number) || 0) + 1,
          totalScans: ((currentMetadata.totalScans as number) || 0) + 1,
        },
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Analyze] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Analysis failed';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
