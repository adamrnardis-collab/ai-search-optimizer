import { NextResponse } from 'next/server';

// Placeholder - use /api/demo-analyze instead
export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/demo-analyze endpoint' },
    { status: 400 }
  );
}
