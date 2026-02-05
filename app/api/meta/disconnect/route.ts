import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '@/lib/firebaseAdmin';

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();

        // Delete OAuth token
        const tokenRef = db.collection('clerk_users').doc(userId).collection('oauth_tokens').doc('facebook');
        await tokenRef.delete();

        // Delete pages under this user
        const pagesRef = db.collection('clerk_users').doc(userId).collection('platforms').doc('facebook').collection('pages');
        const pagesSnap = await pagesRef.get();
        const batch = db.batch();
        pagesSnap.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to disconnect';
        console.error('[Meta Disconnect] error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
