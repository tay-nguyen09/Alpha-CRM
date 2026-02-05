import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { getPageAccessToken } from '@/lib/tokenCache';

// Helper to add delay between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();
        let pagesSnap;
        try {
            pagesSnap = await db
                .collection('clerk_users')
                .doc(userId)
                .collection('platforms')
                .doc('facebook')
                .collection('pages')
                .get();
        } catch (err: any) {
            // Firestore quota exceeded
            if (err?.code === 'resource_exhausted' || String(err).includes('quota')) {
                console.error('Firestore quota exceeded during bootstrap:', err);
                return NextResponse.json(
                    { error: 'Service quota exceeded - too many requests' },
                    { status: 503 }
                );
            }
            throw err;
        }

        const pages = pagesSnap.docs.map((doc) => ({ pageId: doc.id, name: doc.data().name || doc.id }));

        let warmed = 0;
        const failed: string[] = [];

        // Rate limit: 500ms between token fetches to avoid Firestore quota exceeded
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            try {
                await getPageAccessToken(userId, p.pageId);
                warmed++;
            } catch (e) {
                failed.push(p.pageId);
                console.error(`Failed to warm page ${p.pageId}:`, e);
            }

            // Add delay before next request (except for last one)
            if (i < pages.length - 1) {
                await sleep(500);
            }
        }

        return NextResponse.json({
            success: failed.length === 0,
            warmed,
            total: pages.length,
            pages: pages.map(p => p.pageId),
            failed: failed.length,
            failedPages: failed
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        const isQuotaError = String(error).includes('quota') || String(error).includes('resource_exhausted');
        return NextResponse.json(
            { error: error.message || 'Bootstrap failed' },
            { status: isQuotaError ? 503 : 500 }
        );
    }
}
