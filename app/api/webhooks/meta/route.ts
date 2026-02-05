import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getFirestore } from '../../../../lib/firebaseAdmin';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token';
const APP_SECRET = process.env.META_APP_SECRET || '';

// GET: Webhook verification from Facebook
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] Verification successful');
        return new NextResponse(challenge, { status: 200 });
    }

    console.warn('[Webhook] Verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Receive webhook events from Facebook
export async function POST(req: NextRequest) {
    console.log('[Webhook] ===== RECEIVED POST REQUEST =====');
    console.log('[Webhook] Headers:', Object.fromEntries(req.headers.entries()));

    try {
        const body = await req.text();
        console.log('[Webhook] Body:', body);

        // Verify signature
        const signature = req.headers.get('x-hub-signature-256');
        if (signature && APP_SECRET) {
            const expectedSignature = 'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex');

            if (signature !== expectedSignature) {
                console.warn('[Webhook] Signature mismatch. Expected:', expectedSignature, 'Got:', signature);
                console.warn('[Webhook] APP_SECRET:', APP_SECRET.substring(0, 10) + '...');
                // Continue processing anyway for debugging
            } else {
                console.log('[Webhook] Signature verified successfully');
            }
        }

        // Parse event
        const event = JSON.parse(body);
        console.log('[Webhook] Event object:', event.object);
        console.log('[Webhook] Entry count:', event.entry?.length || 0);

        // Respond immediately (Facebook requires fast response)
        const response = new NextResponse('EVENT_RECEIVED', { status: 200 });

        // Process events asynchronously
        processWebhookEvent(event).catch(err => {
            console.error('[Webhook] Processing error:', err);
        });

        return response;
    } catch (err) {
        console.error('[Webhook] Fatal error:', err);
        return new NextResponse('OK', { status: 200 }); // Always return 200
    }
}

async function processWebhookEvent(event: any) {
    console.log('[Webhook] Processing event...', JSON.stringify(event).substring(0, 200));

    try {
        const db = getFirestore();

        if (event.object !== 'page') {
            console.log('[Webhook] Not a page event, skipping');
            return;
        }

        for (const entry of event.entry || []) {
            const pageId = entry.id;
            const time = entry.time;

            console.log('[Webhook] Processing entry for page:', pageId);

            // Process messaging events
            for (const messaging of entry.messaging || []) {
                const senderId = messaging.sender?.id;
                const recipientId = messaging.recipient?.id;
                const timestamp = messaging.timestamp;
                const messageData = messaging.message;

                // Create unique event ID for idempotency
                const eventId = `${entry.id}_${time}_${messageData?.mid || Date.now()}`;

                // Check if already processed (prevents duplicates from Meta retries)
                try {
                    const existingEvent = await db.collection('webhook_events').doc(eventId).get();
                    if (existingEvent.exists) {
                        console.log('[Webhook] Event already processed, skipping:', eventId);
                        continue;
                    }
                } catch (err) {
                    console.warn('[Webhook] Failed to check existing event:', err);
                    // Continue anyway, duplicate is better than missing message
                }

                if (!messageData) {
                    console.log('[Webhook] No message data, skipping');
                    continue;
                }

                console.log('[Webhook] Processing message:', messageData.mid, 'from:', senderId);
                console.log('[Webhook] senderId:', senderId, 'recipientId:', recipientId, 'pageId:', pageId);

                try {
                    // Store message event
                    await db.collection('webhook_events').doc(eventId).set({
                        type: 'message',
                        pageId,
                        senderId,
                        recipientId,
                        messageId: messageData.mid,
                        text: messageData.text || '',
                        timestamp,
                        attachments: messageData.attachments?.map((att: any) => ({
                            type: att.type,
                            url: att.payload?.url || ''
                        })) || [],
                        receivedAt: new Date().toISOString(),
                        processed: false
                    });
                    console.log('[Webhook] Saved to webhook_events:', eventId);

                    // Normalize to messages collection for realtime updates
                    // Customer PSID is the one that's not the page
                    const customerPSID = senderId === pageId ? recipientId : senderId;
                    const conversationId = `${pageId}_${customerPSID}`;
                    console.log('[Webhook] *** CONVERSATION ID:', conversationId, '(pageId:', pageId, 'customerPSID:', customerPSID, ')');
                    const messagesRef = db.collection('conversations').doc(conversationId).collection('messages');

                    await messagesRef.doc(messageData.mid).set({
                        id: messageData.mid,
                        from: senderId === pageId ? 'agent' : 'customer',
                        text: messageData.text || '',
                        at: new Date(timestamp).toISOString(),
                        attachments: messageData.attachments?.map((att: any) => ({
                            type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'file',
                            url: att.payload?.url || ''
                        })) || [],
                        pageId,
                        conversationId
                    });
                    console.log('[Webhook] Saved message to Firestore:', messageData.mid);

                    // Update conversation with customer info
                    const customerPSIDForConv = senderId === pageId ? recipientId : senderId;

                    // Fetch customer info from Graph API if we don't have it
                    let customerName = customerPSIDForConv;
                    let customerPicture = '';

                    try {
                        // Get page access token from Firestore
                        const pageDoc = await db.collection('pages').doc(pageId).get();
                        if (pageDoc.exists) {
                            const pageData = pageDoc.data();
                            const accessToken = pageData?.accessTokenEncrypted; // Encrypted token

                            if (accessToken) {
                                // Decrypt token (simplified - you should use proper decrypt function)
                                const { decrypt } = await import('../../../../lib/encrypt');
                                const decryptedToken = decrypt(pageData.accessTokenIv || 'none', accessToken);

                                // Fetch customer info from Graph API
                                const graphUrl = `https://graph.facebook.com/v19.0/${customerPSIDForConv}?fields=name,profile_pic&access_token=${encodeURIComponent(decryptedToken)}`;
                                const graphRes = await fetch(graphUrl);

                                if (graphRes.ok) {
                                    const userData = await graphRes.json();
                                    customerName = userData.name || customerPSIDForConv;
                                    customerPicture = userData.profile_pic || '';
                                    console.log('[Webhook] Fetched customer info:', customerName);
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('[Webhook] Failed to fetch customer info:', err);
                    }

                    await db.collection('conversations').doc(conversationId).set({
                        conversationId,
                        pageId,
                        psid: customerPSIDForConv,
                        customerName,
                        customerPicture,
                        lastMessageAt: new Date(timestamp).toISOString(),
                        lastMessageText: messageData.text || '',
                        unread: senderId !== pageId // Mark as unread if from customer
                    }, { merge: true });

                    console.log(`[Webhook] ✅ SUCCESSFULLY SAVED - Message ${messageData.mid} for conversation ${conversationId}`);
                } catch (err) {
                    console.error('[Webhook] Error processing message:', err);
                }
            }

            // Process feed events (comments, posts)
            for (const change of entry.changes || []) {
                if (change.field === 'feed') {
                    const value = change.value;
                    const eventId = `feed_${entry.id}_${time}_${value.post_id || value.comment_id}`;

                    await db.collection('webhook_events').doc(eventId).set({
                        type: 'feed',
                        field: change.field,
                        pageId,
                        postId: value.post_id,
                        commentId: value.comment_id,
                        parentId: value.parent_id,
                        message: value.message,
                        from: value.from,
                        verb: value.verb, // add, edit, remove
                        receivedAt: new Date().toISOString(),
                        processed: false
                    });

                    console.log(`[Webhook] Received feed event: ${value.verb} on ${value.post_id || value.comment_id}`);
                }
            }
        }

        // Log to audit
        await db.collection('auditLogs').add({
            type: 'webhook.received',
            event: event.object,
            entries: event.entry?.length || 0,
            at: new Date().toISOString()
        });

        console.log('[Webhook] Processing completed successfully');
    } catch (err) {
        console.error('[Webhook] Fatal error in processWebhookEvent:', err);
    }
}
