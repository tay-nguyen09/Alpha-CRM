import { auth } from '@clerk/nextjs/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { getPageAccessToken } from '@/lib/tokenCache'

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: conversationId } = await params
    const { userId } = await auth()

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const db = getFirestore()
        const [pageId, psid] = conversationId.split('_')

        const timings: Record<string, number> = {}
        const tTotalStart = Date.now()

        // Verify that this conversation belongs to a page owned by the user
        const tVerifyStart = Date.now()
        const userPageRef = db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .doc(pageId)

        const userPageDoc = await userPageRef.get()
        timings.verifyMs = Date.now() - tVerifyStart
        if (!userPageDoc.exists) {
            return Response.json({ error: 'Access denied' }, { status: 403 })
        }

        // Try to get conversation from Firestore first
        const tFsStart = Date.now()
        const conversationDoc = await db.collection('conversations').doc(conversationId).get()
        timings.firestoreMs = Date.now() - tFsStart

        if (conversationDoc.exists) {
            const conversation = conversationDoc.data() as Record<string, unknown>
            timings.totalMs = Date.now() - tTotalStart
            return Response.json({
                id: conversationId,
                conversationId,
                ...conversation,
                serverTimings: timings,
            })
        }

        // Fallback: fetch from Facebook Graph API by scanning conversations and matching PSID
        const tTokenStart = Date.now()
        const accessToken = await getPageAccessToken(userId!, pageId)
        timings.tokenMs = Date.now() - tTokenStart
        if (!accessToken) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const tGraphStart = Date.now()
        let after: string | null = null
        let foundConv: Record<string, unknown> | null = null
        let safetyCounter = 0

        while (!foundConv && safetyCounter < 10) {
            const params = new URLSearchParams({
                fields: 'id,participants,messages.limit(100){from,to,message,created_time}',
                limit: '25',
                access_token: accessToken,
            })
            if (after) params.set('after', after)

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/conversations?${params.toString()}`
            const res = await fetch(url)
            const json = await res.json() as Record<string, unknown>
            if (!res.ok) {
                break
            }

            const data = (json.data as Array<Record<string, unknown>> | undefined) || []
            foundConv = data.find((c) => {
                const participants = (c.participants as Record<string, unknown> | undefined)?.data as Array<Record<string, unknown>> | undefined || []
                return participants.some((p) => (p.id as string) === psid)
            }) || null

            const paging = json.paging as Record<string, unknown> | undefined
            after = (paging?.cursors as Record<string, unknown> | undefined)?.after as string | null || null
            safetyCounter++
            if (!after) break
        }
        timings.graphMs = Date.now() - tGraphStart

        if (!foundConv) {
            timings.totalMs = Date.now() - tTotalStart
            return Response.json({ error: 'Conversation not found', serverTimings: timings }, { status: 404 })
        }

        // Transform into our Conversation shape
        const participants = (foundConv.participants as Record<string, unknown> | undefined)?.data as Array<Record<string, unknown>> | undefined || []
        const customer = participants.find((p) => (p.id as string) !== pageId)

        const rawMsgs = (foundConv.messages as Record<string, unknown> | undefined)?.data as Array<Record<string, unknown>> | undefined || []
        const messages = rawMsgs.map((m) => {
            const fromId = (m.from as Record<string, unknown> | undefined)?.id as string | undefined
            return {
                from: fromId === pageId ? 'agent' : 'customer',
                text: (m.message as string) || '',
                at: (m.created_time as string) || new Date().toISOString(),
            }
        })

        const conversation = {
            conversationId,
            pageId,
            psid,
            customerName: (customer?.name as string) || 'Khách hàng',
            updatedAt: messages[messages.length - 1]?.at || new Date().toISOString(),
            messages,
        }

        timings.totalMs = Date.now() - tTotalStart
        return Response.json({ ...conversation, serverTimings: timings })
    } catch (err) {
        console.error('[GET /api/conversations/:id] Error:', err)
        return Response.json({ error: 'Failed to fetch conversation' }, { status: 500 })
    }
}
