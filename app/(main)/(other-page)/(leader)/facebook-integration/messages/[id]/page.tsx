'use client';
import { useParams } from 'next/navigation';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { MessageThread } from '@/components/messages/MessageThread';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
    markConversationReadLocal,
    selectConversationById,
    selectPages,
    fetchConversationByIdAsync,
} from '@/lib/redux/features/messages/messagesSlice';

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.id as string;
    const dispatch = useAppDispatch();

    const conversation = useAppSelector((state) => selectConversationById(state, conversationId));
    const pages = useAppSelector(selectPages);

    const activeConversation = useMemo(() => conversation, [conversation]);

    // Client-side timing instrumentation
    const tMount = useRef<number | null>(null);
    const [clientTimings, setClientTimings] = useState<{ fetchMs?: number; totalMs?: number }>({});
    const tFetchStart = useRef<number | null>(null);

    useEffect(() => {
        if (tMount.current === null) {
            tMount.current = performance.now();
        }
        if (conversationId) {
            // If conversation not found in Redux, fetch it from API
            if (!conversation) {
                tFetchStart.current = performance.now();
                dispatch(fetchConversationByIdAsync({ conversationId }));
            }

            dispatch(markConversationReadLocal(conversationId));
        }
    }, [conversationId, dispatch, conversation]);

    // When conversation arrives, compute client timings
    useEffect(() => {
        if (conversation && tFetchStart.current) {
            const now = performance.now();
            setClientTimings({
                fetchMs: now - tFetchStart.current,
                totalMs: tMount.current ? now - tMount.current : undefined,
            });
            tFetchStart.current = null;
        }
    }, [conversation]);

    const handleCopyPSID = useCallback((psid: string) => {
        navigator.clipboard.writeText(psid);
        alert('PSID copied: ' + psid);
    }, []);

    const serverTimings: Record<string, number> | undefined = (activeConversation as unknown as { serverTimings?: Record<string, number> })?.serverTimings;

    return (
        <div className="space-y-2">
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="rounded-md border border-gray-200 bg-white p-3 text-xs dark:border-gray-800 dark:bg-white/5">
                    <div className="font-medium mb-1">Timings (client/server)</div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div>Client fetch: {clientTimings.fetchMs ? clientTimings.fetchMs.toFixed(0) : '-'} ms</div>
                            <div>Total to ready: {clientTimings.totalMs ? clientTimings.totalMs.toFixed(0) : '-'} ms</div>
                        </div>
                        <div>
                            <div>Verify: {serverTimings?.verifyMs?.toFixed?.(0) ?? '-'} ms</div>
                            <div>Firestore: {serverTimings?.firestoreMs?.toFixed?.(0) ?? '-'} ms</div>
                            <div>Token: {serverTimings?.tokenMs?.toFixed?.(0) ?? '-'} ms</div>
                            <div>Graph: {serverTimings?.graphMs?.toFixed?.(0) ?? '-'} ms</div>
                            <div>Total: {serverTimings?.totalMs?.toFixed?.(0) ?? '-'} ms</div>
                        </div>
                    </div>
                </div>
            )} */}
            <MessageThread
                conversation={activeConversation}
                pages={pages}
                onCopyPSID={handleCopyPSID}
                apiBaseUrl=""
            />
        </div>
    );
}
