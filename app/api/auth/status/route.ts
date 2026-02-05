import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '../../../../lib/firebaseAdmin';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ user: null, pages: [], isConnected: false });
        }

        const db = getFirestore();

        // Get user's Facebook OAuth token
        let user = null;
        try {
            const tokenDoc = await db
                .collection('clerk_users')
                .doc(userId)
                .collection('oauth_tokens')
                .doc('facebook')
                .get();

            if (tokenDoc.exists) {
                const data = tokenDoc.data();
                user = {
                    name: (data as any)?.userName || 'User',
                    picture: (data as any)?.userPicture || '',
                    connectedAt: (data as any)?.createdAt || ''
                };
            }
        } catch (err) {
            // Silent fail; user remains null
        }

        // Get user's Facebook pages (stored under clerk_users/{userId}/platforms/facebook/pages)
        const pages: Array<{ pageId: string; name: string; category: string; fetchedAt: string }> = [];
        try {
            const pagesSnap = await db
                .collection('clerk_users')
                .doc(userId)
                .collection('platforms')
                .doc('facebook')
                .collection('pages')
                .get();

            pagesSnap.forEach((pageDoc) => {
                const data = pageDoc.data();
                pages.push({
                    pageId: pageDoc.id,
                    name: (data as any).name || pageDoc.id,
                    category: (data as any).category || '',
                    fetchedAt: (data as any).fetchedAt || ''
                });
            });
        } catch (err) {
            // Silent fail; pages remains empty
        }

        return NextResponse.json({ user, pages, isConnected: !!user });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch status';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
