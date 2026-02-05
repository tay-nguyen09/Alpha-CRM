import { NextResponse } from 'next/server';

// This endpoint has been removed. Returning 410 Gone to indicate deprecation.
export async function POST() {
    return NextResponse.json({ error: 'mark-read feature removed' }, { status: 410 });
}
