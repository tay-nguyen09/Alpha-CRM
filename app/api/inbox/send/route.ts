import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '../../../../lib/firebaseAdmin';
import { getPageAccessToken } from '../../../../lib/tokenCache';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getFirestore();
        const body = await req.json();
        const { pageId, psid, message, attachmentUrl, adminName } = body;

        if (!pageId || !psid) {
            return NextResponse.json({ error: 'pageId and psid required' }, { status: 400 });
        }

        if (!message && !attachmentUrl) {
            return NextResponse.json({ error: 'message or attachmentUrl required' }, { status: 400 });
        }

        const accessToken = await getPageAccessToken(userId, pageId);
        if (!accessToken) {
            return NextResponse.json({ error: 'No access token for this page' }, { status: 401 });
        }

        const conversationId = `${pageId}_${psid}`;

        // Determine 24-hour window based on last customer message in Firestore
        let within24h = true;
        try {
            const lastCustomerSnap = await db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .where('from', '==', 'customer')
                .orderBy('at', 'desc')
                .limit(1)
                .get();
            const lastAtIso = lastCustomerSnap.docs[0]?.data()?.at as string | undefined;
            if (lastAtIso) {
                const lastAt = new Date(lastAtIso).getTime();
                within24h = Date.now() - lastAt <= 24 * 60 * 60 * 1000;
            }
        } catch (err) {
            // If query fails, default to within24h=true to avoid unnecessary blocks
            console.warn('[Send Message] Failed to check 24h window:', err);
        }

        // Messaging type logic: RESPONSE within 24h, else require valid MESSAGE_TAG
        const allowedTags = ['CONFIRMED_EVENT_UPDATE', 'POST_PURCHASE_UPDATE', 'ACCOUNT_UPDATE'] as const;
        type AllowedTag = typeof allowedTags[number];
        const requestedTag = (body?.tag as string | undefined)?.toUpperCase() as AllowedTag | undefined;

        if (!within24h && !requestedTag) {
            return NextResponse.json({
                error: '#10 Outside 24-hour window. Provide a valid message tag (CONFIRMED_EVENT_UPDATE, POST_PURCHASE_UPDATE, ACCOUNT_UPDATE) or wait for the user to reply.',
                code: 10,
            }, { status: 403 });
        }

        if (!within24h && requestedTag && !allowedTags.includes(requestedTag)) {
            return NextResponse.json({
                error: `Invalid tag '${requestedTag}'. Allowed tags: ${allowedTags.join(', ')}`,
                code: 10,
            }, { status: 400 });
        }

        // Build message payload
        const messageData: any = {
            recipient: { id: psid },
            messaging_type: within24h ? 'RESPONSE' : 'MESSAGE_TAG',
            ...(within24h ? {} : { tag: requestedTag })
        };

        if (attachmentUrl) {
            // Send attachment
            messageData.message = {
                attachment: {
                    type: 'file', // Can be 'image', 'video', 'audio', 'file'
                    payload: {
                        url: attachmentUrl,
                        is_reusable: false
                    }
                }
            };
        } else if (message) {
            // Send text
            messageData.message = {
                text: message
            };
        }

        // Call Facebook Graph API
        const graphUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`;
        const graphRes = await fetch(graphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...messageData,
                access_token: accessToken
            })
        });

        const graphJson = await graphRes.json();

        if (!graphRes.ok) {
            console.error('[Send Message] Graph API error:', graphJson);
            return NextResponse.json({
                error: graphJson?.error?.message || 'Failed to send message',
                details: graphJson?.error
            }, { status: graphRes.status });
        }

        const messageId = graphJson.message_id;

        // Save message to Firestore for realtime updates and history
        await db.collection('conversations').doc(conversationId).collection('messages').doc(messageId).set({
            id: messageId,
            from: 'agent',
            text: message || '',
            at: new Date().toISOString(),
            senderName: adminName || 'Unknown Admin',
            attachments: attachmentUrl ? [{
                type: 'file',
                url: attachmentUrl
            }] : [],
            pageId,
            conversationId
        }).catch(err => console.warn('[Send Message] Failed to save to Firestore:', err));

        // Log to audit with admin name
        await db.collection('auditLogs').add({
            type: 'message.sent',
            pageId,
            psid,
            adminName: adminName || 'Unknown',
            message: message?.substring(0, 100) || 'attachment',
            messageId,
            at: new Date().toISOString()
        }).catch(err => console.warn('Failed to log message:', err));

        return NextResponse.json({
            success: true,
            messageId,
            recipientId: graphJson.recipient_id
        });
    } catch (err: any) {
        console.error('[Send Message] Fatal error:', err);
        return NextResponse.json({
            error: err?.message || 'Failed to send message'
        }, { status: 500 });
    }
}
