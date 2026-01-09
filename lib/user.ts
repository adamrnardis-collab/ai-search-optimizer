/**
 * User Management & Usage Tracking
 * 
 * In production, replace this with a real database (e.g., Prisma + PostgreSQL).
 * This implementation uses Clerk's user metadata for simplicity.
 */

import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export interface UserData {
  id: string;
  email: string;
  isPro: boolean;
  stripeCustomerId?: string;
  scansThisMonth: number;
  scansResetDate: string;
  totalScans: number;
  savedReports: string[];
}

const FREE_SCANS_PER_MONTH = parseInt(process.env.FREE_SCANS_PER_MONTH || '3', 10);

/**
 * Get current user data
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as Record<string, unknown>;

  // Check if scans need to be reset (monthly)
  const now = new Date();
  const resetDate = metadata.scansResetDate ? new Date(metadata.scansResetDate as string) : null;
  const needsReset = !resetDate || resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear();

  const scansThisMonth = needsReset ? 0 : (metadata.scansThisMonth as number) || 0;
  const scansResetDate = needsReset ? now.toISOString() : (metadata.scansResetDate as string) || now.toISOString();

  // Update if reset was needed
  if (needsReset) {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...metadata,
        scansThisMonth: 0,
        scansResetDate: scansResetDate,
      },
    });
  }

  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress || '',
    isPro: (metadata.isPro as boolean) || false,
    stripeCustomerId: metadata.stripeCustomerId as string | undefined,
    scansThisMonth,
    scansResetDate,
    totalScans: (metadata.totalScans as number) || 0,
    savedReports: (metadata.savedReports as string[]) || [],
  };
}

/**
 * Check if user can perform a scan
 */
export async function canScan(userData: UserData): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  if (userData.isPro) {
    return { allowed: true };
  }

  const remaining = FREE_SCANS_PER_MONTH - userData.scansThisMonth;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Monthly scan limit reached. Upgrade to Pro for unlimited scans.',
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining,
  };
}

/**
 * Increment scan count for user
 */
export async function incrementScanCount(userId: string): Promise<void> {
  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as Record<string, unknown>;

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...metadata,
      scansThisMonth: ((metadata.scansThisMonth as number) || 0) + 1,
      totalScans: ((metadata.totalScans as number) || 0) + 1,
    },
  });
}

/**
 * Upgrade user to Pro
 */
export async function upgradeUserToPro(userId: string, stripeCustomerId: string): Promise<void> {
  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as Record<string, unknown>;

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...metadata,
      isPro: true,
      stripeCustomerId,
    },
  });
}

/**
 * Downgrade user from Pro
 */
export async function downgradeUserFromPro(userId: string): Promise<void> {
  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as Record<string, unknown>;

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...metadata,
      isPro: false,
    },
  });
}

/**
 * Save a report ID for user
 */
export async function saveReport(userId: string, reportId: string): Promise<void> {
  const user = await clerkClient.users.getUser(userId);
  const metadata = (user.publicMetadata || {}) as Record<string, unknown>;
  const savedReports = (metadata.savedReports as string[]) || [];

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...metadata,
      savedReports: [...savedReports, reportId].slice(-50), // Keep last 50
    },
  });
}

/**
 * Get user's scan usage stats
 */
export function getUsageStats(userData: UserData): {
  used: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentage: number;
  resetDate: string;
} {
  if (userData.isPro) {
    return {
      used: userData.scansThisMonth,
      limit: 'unlimited',
      remaining: 'unlimited',
      percentage: 0,
      resetDate: userData.scansResetDate,
    };
  }

  const remaining = Math.max(0, FREE_SCANS_PER_MONTH - userData.scansThisMonth);
  
  return {
    used: userData.scansThisMonth,
    limit: FREE_SCANS_PER_MONTH,
    remaining,
    percentage: (userData.scansThisMonth / FREE_SCANS_PER_MONTH) * 100,
    resetDate: userData.scansResetDate,
  };
}
