import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '../../../lib/firebaseAdmin';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();
        const snap = await db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .get();

        const pages = snap.docs.map(doc => ({
            pageId: doc.id,
            name: doc.data().name || doc.id,
            category: doc.data().category || '',
            fetchedAt: doc.data().fetchedAt || ''
        }));
        return NextResponse.json({ pages });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to fetch pages' }, { status: 500 });
    }
}
