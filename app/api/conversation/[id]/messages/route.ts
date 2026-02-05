import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '../../../../../lib/firebaseAdmin';
import { getPageAccessToken } from '../../../../../lib/tokenCache';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const db = getFirestore();
        const conversationId = id; // Format: pageId_psid
        const url = new URL(req.url);
        const after = url.searchParams.get('after') || undefined;
        const limit = url.searchParams.get('limit') || '20';
        const pageId = url.searchParams.get('pageId') || '';

        if (!pageId) {
            return NextResponse.json({ error: 'pageId required' }, { status: 400 });
        }

        const accessToken = await getPageAccessToken(userId, pageId);
        if (!accessToken) {
            return NextResponse.json({ error: 'No access token' }, { status: 401 });
        }

        // Extract PSID from conversationId (format: pageId_psid)
        const psid = conversationId.split('_')[1];
        if (!psid) {
            return NextResponse.json({ error: 'Invalid conversationId format' }, { status: 400 });
        }

        // Fetch conversations to find the actual thread ID for this PSID
        let threadId = conversationId; // Fallback to original

        try {
            const convUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/conversations?fields=id,participants&limit=100&access_token=${encodeURIComponent(accessToken)}`;
            const convRes = await fetch(convUrl);
            const convJson = await convRes.json();

            if (convRes.ok && convJson.data) {
                // Find conversation with this PSID
                const conversation = convJson.data.find((conv: any) =>
                    conv.participants?.data?.some((p: any) => p.id === psid)
                );

                if (conversation) {
                    threadId = conversation.id;
                } else {
                    // Return empty if no thread found
                    return NextResponse.json({ messages: [], nextCursor: null });
                }
            }
        } catch (err) {
            // Silent fail on thread lookup
        }

        const urlParams = new URLSearchParams({
            fields: 'from,to,message,created_time,attachments',
            limit: limit,
            access_token: accessToken
        });
        if (after) urlParams.set('after', after);

        const graphUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${threadId}/messages?${urlParams.toString()}`;
        const graphRes = await fetch(graphUrl);
        const graphJson = await graphRes.json();

        if (!graphRes.ok) {
            const msg = graphJson?.error?.message || 'Graph API failed';
            return NextResponse.json({ error: msg }, { status: graphRes.status });
        }

        const messages = (graphJson.data || []).map((m: any) => {
            const msg: any = {
                id: m.id,
                from: m.from?.id === pageId ? 'agent' : 'customer',
                text: m.message || '',
                at: m.created_time
            };
            // Parse attachments if any
            if (m.attachments?.data) {
                msg.attachments = m.attachments.data.map((att: any) => ({
                    type: att.image_data ? 'image' : att.video_data ? 'video' : 'file',
                    url: att.image_data?.url || att.video_data?.url || att.file_url || '',
                    name: att.name
                })).filter((a: any) => a.url);
            }
            return msg;
        }).sort((a: any, b: any) => a.at.localeCompare(b.at));

        // Also fetch messages from Firestore (user-sent messages with admin names)
        try {
            const messagesRef = db.collection('conversations').doc(conversationId).collection('messages');
            const firestoreSnapshot = await messagesRef.orderBy('at', 'desc').limit(100).get();
            const firestoreMessages = firestoreSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Merge and deduplicate by ID
            const merged = new Map<string, any>();
            messages.forEach((m: any) => merged.set(m.id, m));
            firestoreMessages.forEach((m: any) => merged.set(m.id, m)); // Firestore messages override (have senderName)

            const combined = Array.from(merged.values())
                .sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());

            return NextResponse.json({
                messages: combined,
                nextCursor: graphJson.paging?.cursors?.after || null
            });
        } catch (err) {
            // Fallback to just Graph API messages if Firestore fails
            return NextResponse.json({
                messages,
                nextCursor: graphJson.paging?.cursors?.after || null
            });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
    }
}
