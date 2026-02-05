import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: pageId } = await params;
        if (!pageId) {
            return NextResponse.json({ error: 'pageId required' }, { status: 400 });
        }

        const db = getFirestore();
        const pageRef = db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .doc(pageId);

        // Delete page doc (removes stored token for that page)
        await pageRef.delete();

        return NextResponse.json({ success: true, pageId });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to disconnect page';
        console.error('[Meta Disconnect Page] error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
