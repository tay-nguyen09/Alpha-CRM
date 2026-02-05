import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getFirestore } from '@/lib/firebaseAdmin';
import { decrypt } from '@/lib/encrypt';

type GraphMessage = {
    id: string;
    message?: string;
    created_time: string;
    from?: { id: string; name?: string };
};

type GraphConversation = {
    id: string;
    participants?: { data?: { id: string; name?: string }[] };
    messages?: { data?: GraphMessage[] };
};

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';

function detectPhones(text: string | undefined): string[] {
    if (!text) return [];
    const matches = text.match(/\+?\d[\d\s\-().]{7,}/g) || [];
    return matches
        .map((m) => m.replace(/[^\d+]/g, ''))
        .filter((m, idx, arr) => m.length >= 8 && arr.indexOf(m) === idx);
}

async function getPageAccessToken(db: FirebaseFirestore.Firestore, userId: string, pageId?: string): Promise<string> {
    // Try Firestore first (from OAuth callback, user-scoped)
    if (pageId && userId) {
        try {
            const pageDoc = await db
                .collection('clerk_users')
                .doc(userId)
                .collection('platforms')
                .doc('facebook')
                .collection('pages')
                .doc(String(pageId))
                .get();

            if (pageDoc.exists) {
                const data = pageDoc.data();
                if (data?.accessTokenEncrypted && data?.accessTokenIv && data?.accessTokenAuthTag) {
                    const token = decrypt(data.accessTokenIv, data.accessTokenEncrypted, data.accessTokenAuthTag);
                    return token;
                }
            }
        } catch (err: unknown) {
            console.error(`[getPageAccessToken] Failed to get token for page ${pageId}:`, err);
        }
    }
    // Fallback to env
    if (!pageId) {
        return process.env.META_PAGE_ACCESS_TOKEN || '';
    }
    const envKey = `META_PAGE_ACCESS_TOKEN_${pageId}`;
    const specific = process.env[envKey];
    if (specific) {
        return specific;
    }
    const fallback = process.env.META_PAGE_ACCESS_TOKEN || '';
    return fallback;
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();
        const url = new URL(req.url);
        const pageIdParam = url.searchParams.get('pageId');
        const cursor = url.searchParams.get('cursor') || undefined; // Graph after-cursor
        const limitParam = Number(url.searchParams.get('limit') || '5');
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 25) : 5;

        // Fetch user's pages from clerk_users/{userId}/platforms/facebook/pages
        let pageIds: string[] = [];
        const pageNameById: Record<string, string> = {};
        if (pageIdParam) {
            pageIds = [pageIdParam];
            try {
                const pageDoc = await db
                    .collection('clerk_users')
                    .doc(userId)
                    .collection('platforms')
                    .doc('facebook')
                    .collection('pages')
                    .doc(String(pageIdParam))
                    .get();
                if (pageDoc.exists) {
                    const data = pageDoc.data();
                    pageNameById[pageIdParam] = (data?.name as string) || pageIdParam;
                }
            } catch {
                // Ignore; fallback to pageId only
            }
        } else {
            try {
                const pagesSnap = await db
                    .collection('clerk_users')
                    .doc(userId)
                    .collection('platforms')
                    .doc('facebook')
                    .collection('pages')
                    .get();
                pageIds = pagesSnap.docs.map((pageDoc) => {
                    const data = pageDoc.data();
                    pageNameById[pageDoc.id] = (data?.name as string) || pageDoc.id;
                    return pageDoc.id;
                });
            } catch {
                // Silent fail; check env fallback
            }

            if (pageIds.length === 0) {
                const fallback = process.env.META_PAGE_ID;
                if (fallback) {
                    pageIds = [fallback];
                    pageNameById[fallback] = fallback;
                }
                else {
                    // Gracefully return empty dataset when no pages are configured
                    return NextResponse.json({ conversations: [], nextCursor: null, message: 'No pages found. Connect a page to see conversations.' });
                }
            }
        }
        // Fetch conversations from each page
        const allConversations: Array<{
            conversationId: string
            pageId: string
            psid: string
            customerName: string
            updatedAt: string
            messages: Array<{
                id: string
                from: string
                text: string
                at: string
                attachments?: Array<{ type: string; url: string; name?: string }>
            }>
        }> = [];
        let nextCursor: string | null = null;

        for (const pageId of pageIds) {
            const accessToken = await getPageAccessToken(db, userId, pageId);
            if (!accessToken) {
                continue;
            }

            const params = new URLSearchParams({
                fields: 'messages.limit(25){from,to,message,created_time,attachments},participants',
                limit: String(limit),
                access_token: accessToken
            });
            if (cursor) params.set('after', cursor);

            const graphUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/conversations?${params.toString()}`;
            const graphRes = await fetch(graphUrl);
            const graphJson = await graphRes.json() as Record<string, unknown>;
            if (!graphRes.ok) {
                const errorData = graphJson as Record<string, unknown>;
                const msg = (errorData?.error as Record<string, unknown>)?.message || 'Graph API failed';
                console.error(`[API messages] Graph API error for page ${pageId} (${graphRes.status}):`, msg);
                continue; // Skip this page
            }

            if (!nextCursor && (graphJson as Record<string, unknown>)?.paging) {
                const pagingData = (graphJson as Record<string, unknown>)?.paging as Record<string, unknown>;
                const cursorsData = pagingData?.cursors as Record<string, unknown>;
                nextCursor = (cursorsData?.after as string) || null;
            }

            const conversations = (graphJson.data as GraphConversation[] | undefined)?.map((conv) => {
                const participants = conv.participants?.data || [];
                const customer = participants.find((p) => p.id !== pageId) || participants[0];
                const psid = customer?.id || conv.id;
                const customerName = customer?.name || 'Customer';

                const msgs = (conv.messages?.data || []).map((m) => {
                    const msg: { id: string; from: string; text: string; at: string; attachments?: Array<{ type: string; url: string; name?: string }> } = {
                        id: m.id,
                        from: m.from?.id === pageId ? 'agent' : 'customer',
                        text: m.message || '',
                        at: m.created_time
                    };
                    // Parse attachments if any
                    const messageData = m as GraphMessage & { attachments?: { data?: Array<Record<string, unknown>> } };
                    if (messageData.attachments?.data) {
                        msg.attachments = messageData.attachments.data
                            .map((att: Record<string, unknown>): { type: string; url: string; name?: string } | null => {
                                const imageData = att.image_data as Record<string, unknown> | undefined;
                                const videoData = att.video_data as Record<string, unknown> | undefined;
                                const url = (imageData?.url as string) || (videoData?.url as string) || (att.file_url as string);
                                if (!url) return null;
                                return {
                                    type: imageData ? 'image' : videoData ? 'video' : 'file',
                                    url,
                                    name: att.name as string | undefined
                                };
                            })
                            .filter((a): a is { type: string; url: string; name?: string } => a !== null);
                    }
                    return msg;
                });

                const sortedMsgs = msgs.sort((a, b) => a.at.localeCompare(b.at));
                const updatedAt = sortedMsgs[sortedMsgs.length - 1]?.at || new Date().toISOString();

                // Use consistent conversationId format: pageId_psid
                const consistentConvId = `${pageId}_${psid}`;

                return {
                    conversationId: consistentConvId, // Changed from conv.id to consistent format
                    pageId,
                    psid,
                    customerName,
                    updatedAt,
                    messages: sortedMsgs
                };
            }) || [];

            allConversations.push(...conversations);
            const pagingData = graphJson as Record<string, unknown>;
            if (!nextCursor && (pagingData?.paging as Record<string, unknown>)?.cursors) {
                const cursorsData = ((pagingData?.paging as Record<string, unknown>)?.cursors as Record<string, unknown>);
                nextCursor = (cursorsData?.after as string) || null;
            }
        }

        // Sort all conversations by updatedAt
        allConversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        // console.log(`[API messages] Total conversations collected: ${allConversations.length}`);

        // Store contacts in Firestore when phone numbers appear in customer messages only
        const contactWrites: Promise<unknown>[] = [];
        allConversations.forEach((conv) => {
            const pageName = pageNameById[conv.pageId] || conv.pageId;
            conv.messages.forEach((m) => {
                // Only save phone numbers from customer messages, not from page/agent
                if (m.from === 'customer') {
                    detectPhones(m.text).forEach((phone) => {
                        const docId = `contact-${conv.pageId}-${conv.psid}-${phone}`;
                        contactWrites.push(
                            db.collection('contact_candidates').doc(docId).set({
                                phone,
                                pageId: conv.pageId,
                                pageName,
                                psid: conv.psid,
                                conversationId: conv.conversationId,
                                customerName: conv.customerName,
                                lastSeenAt: m.at,
                                messageSnippet: (m.text || '').slice(0, 200)
                            }, { merge: true })
                        );
                    });
                }
            });
        });
        // Do not block response on failures; log silently
        if (contactWrites.length) {
            Promise.allSettled(contactWrites).catch(() => undefined);
        }

        if (!allConversations.length) {
            // No conversations found; return empty dataset
        }

        return NextResponse.json({ conversations: allConversations, nextCursor });
    } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error('Unknown error');
        console.error('[API messages] Fatal error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to load messages',
            details: error.stack?.split('\n').slice(0, 5).join('\n') || 'No stack trace'
        }, { status: 500 });
    }
}
