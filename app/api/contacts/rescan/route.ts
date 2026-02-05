import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { getPageAccessToken } from '@/lib/tokenCache';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';

function detectPhones(text: string | undefined): string[] {
    if (!text) return [];
    const matches = text.match(/\+?\d[\d\s\-().]{7,}/g) || [];
    return matches
        .map((m) => m.replace(/[^\d+]/g, ''))
        .filter((m, idx, arr) => m.length >= 8 && arr.indexOf(m) === idx);
}

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();
        let contactCount = 0;
        let conversationCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Get all existing user phones to exclude from candidates
        const usersSnap = await db.collection('users').get();
        const existingPhones = new Set<string>();
        usersSnap.docs.forEach(doc => {
            const phone = doc.data().phone;
            if (phone) existingPhones.add(phone);
        });

        // Get user's pages
        const pagesSnap = await db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .get();

        const pageNameById: Record<string, string> = {};
        pagesSnap.docs.forEach((doc) => {
            const data = doc.data();
            pageNameById[doc.id] = (data?.name as string) || doc.id;
        });

        const pageIds = pagesSnap.docs.map((doc) => doc.id);

        if (pageIds.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pages found to scan',
                contactCount: 0,
                conversationCount: 0
            });
        }

        // Scan all conversations for all pages
        for (const pageId of pageIds) {
            try {
                const accessToken = await getPageAccessToken(userId, pageId);
                if (!accessToken) continue;

                // Fetch all conversations for this page
                const allConversations: Array<Record<string, unknown>> = [];
                let after: string | null = null;
                let hasMore = true;

                while (hasMore) {
                    const params = new URLSearchParams({
                        fields: 'id,participants,messages.limit(100){from,to,message,created_time}',
                        limit: '25',
                        access_token: accessToken
                    });
                    if (after) params.set('after', after);

                    const graphUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/conversations?${params.toString()}`;
                    const graphRes = await fetch(graphUrl);
                    const graphJson = await graphRes.json() as Record<string, unknown>;

                    if (!graphRes.ok) {
                        errorCount++;
                        break;
                    }

                    const conversations = (graphJson.data as Array<Record<string, unknown>> | undefined) || [];
                    allConversations.push(...conversations);
                    conversationCount += conversations.length;

                    // Check for pagination
                    const paging = graphJson.paging as Record<string, unknown> | undefined;
                    after = (paging?.cursors as Record<string, unknown> | undefined)?.after as string | null || null;
                    hasMore = !!after;
                }

                // Extract phone numbers and save to contact_candidates
                const contactWrites: Promise<unknown>[] = [];
                allConversations.forEach((conv: Record<string, unknown>) => {
                    const participants = (conv.participants as Record<string, unknown> | undefined)?.data as Array<Record<string, unknown>> | undefined || [];
                    const customer = participants.find((p: Record<string, unknown>) => p.id !== pageId) || participants[0];
                    const psid = (customer?.id as string) || (conv.id as string);
                    const customerName = (customer?.name as string | undefined) || (conv.name as string | undefined) || psid;
                    const conversationId = `${pageId}_${psid}`;

                    // Process all messages in this conversation - only extract phones from customer messages
                    const messages = (conv.messages as Record<string, unknown> | undefined)?.data as Array<Record<string, unknown>> | undefined || [];
                    messages.forEach((m: Record<string, unknown>) => {
                        // Only extract phone numbers from customer messages (from !== pageId)
                        const fromId = (m.from as Record<string, unknown> | undefined)?.id as string | undefined;
                        const isCustomerMessage = fromId && fromId !== pageId;

                        if (isCustomerMessage && m.message) {
                            detectPhones(m.message as string).forEach((phone: string) => {
                                // Skip if phone already exists in users collection
                                if (existingPhones.has(phone)) {
                                    skippedCount++;
                                    return;
                                }

                                const docId = `contact-${pageId}-${psid}-${phone}`;
                                const pageName = pageNameById[pageId] || pageId;
                                contactWrites.push(
                                    db.collection('contact_candidates').doc(docId).set({
                                        phone,
                                        pageId,
                                        psid,
                                        conversationId,
                                        pageName,
                                        customerName,
                                        lastSeenAt: m.created_time,
                                        messageSnippet: ((m.message as string) || '').slice(0, 200)
                                    }, { merge: true })
                                );
                                contactCount++;
                            });
                        }
                    });
                });

                // Write all contacts in parallel
                if (contactWrites.length > 0) {
                    await Promise.allSettled(contactWrites);
                }
            } catch (err) {
                console.error(`[Rescan] Error scanning page ${pageId}:`, err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Hoàn Tất Tìm Kiếm. Tìm Thấy ${contactCount} contact(s) từ ${conversationCount} cuộc trò chuyện. (${skippedCount} số đã tồn tại)`,
            contactCount,
            conversationCount,
            skippedCount,
            errorCount: errorCount > 0 ? errorCount : undefined
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[Contacts Rescan] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Rescan failed'
        }, { status: 500 });
    }
}
