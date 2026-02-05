import { useEffect, useState, useRef } from 'react';
import { ChatMessage } from '../components/messages/types';

// Lazy import Firebase only on client side
import type { Firestore } from 'firebase/firestore';

let db: Firestore | null = null;
let initPromise: Promise<Firestore | null> | null = null;
let isInitializing = false;

async function getFirestoreClient(): Promise<Firestore | null> {
    if (typeof window === 'undefined') {
        console.log('[getFirestoreClient] Server-side, skipping');
        return null;
    }

    if (db) {
        console.log('[getFirestoreClient] Returning cached client');
        return db;
    }

    if (initPromise) {
        console.log('[getFirestoreClient] Waiting for existing init...');
        return initPromise;
    }

    if (isInitializing) {
        console.log('[getFirestoreClient] Already initializing, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return db;
    }

    isInitializing = true;
    console.log('[getFirestoreClient] Starting Firebase init...');

    initPromise = (async (): Promise<Firestore | null> => {
        try {
            const { initializeApp, getApps } = await import('firebase/app');
            const { getFirestore } = await import('firebase/firestore');
            const firebaseConfig = {
                apiKey: process.env.NEXT_PUBLIC_APIKEY || '',
                authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN || '',
                projectId: process.env.NEXT_PUBLIC_PROJECTID || '',
                storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET || '',
                messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID || '',
                appId: process.env.NEXT_PUBLIC_APPID || ''
            };

            console.log('[getFirestoreClient] Firebase config loaded:', {
                hasApiKey: !!firebaseConfig.apiKey,
                projectId: firebaseConfig.projectId
            });

            if (!firebaseConfig.apiKey) {
                console.error('[getFirestoreClient] Firebase config missing apiKey!');
                return null;
            }

            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
            db = getFirestore(app);
            console.log('[getFirestoreClient] ✅ Firebase initialized successfully');
            isInitializing = false;
            return db;
        } catch (err) {
            console.error('[getFirestoreClient] ❌ Firebase init failed:', err);
            isInitializing = false;
            return null;
        }
    })();

    return initPromise;
}

interface UseRealtimeMessagesProps {
    conversationId: string | undefined;
    pageId: string | undefined;
    initialMessages?: ChatMessage[];
}

export function useRealtimeMessages({ conversationId, pageId, initialMessages = [] }: UseRealtimeMessagesProps) {
    const initialRef = useRef<ChatMessage[]>(initialMessages);
    const [messages, setMessages] = useState<ChatMessage[]>(initialRef.current);
    const [loading, setLoading] = useState(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const areMessagesEqual = (a: ChatMessage[], b: ChatMessage[]) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            const am = a[i];
            const bm = b[i];
            if (am.id !== bm.id || am.at !== bm.at || am.text !== bm.text) return false;
        }
        return true;
    };

    useEffect(() => {
        console.log('[useRealtimeMessages] 🔄 Effect triggered - conversationId:', conversationId, 'pageId:', pageId);

        if (!conversationId || !pageId || typeof window === 'undefined') {
            console.log('[useRealtimeMessages] ⏭️ Skipping - missing params or SSR');
            setMessages(initialRef.current);
            return;
        }

        let mounted = true;
        let setupComplete = false;
        setLoading(true);

        (async () => {
            try {
                console.log('[useRealtimeMessages] 📡 Getting Firestore client...');
                const firestoreDb = await getFirestoreClient();

                if (!mounted) {
                    console.log('[useRealtimeMessages] ❌ Component unmounted before Firestore ready');
                    return;
                }

                if (!firestoreDb) {
                    console.error('[useRealtimeMessages] ❌ No Firestore client available');
                    setMessages(initialRef.current);
                    setLoading(false);
                    return;
                }

                console.log('[useRealtimeMessages] ✅ Firestore client ready');

                // Dynamic imports for Firebase functions
                const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');

                if (!mounted) {
                    console.log('[useRealtimeMessages] ❌ Unmounted after imports');
                    return;
                }

                // Listen to Firestore realtime updates
                console.log('[useRealtimeMessages] 🔊 Setting up listener for:', conversationId);
                const messagesRef = collection(firestoreDb, 'conversations', conversationId, 'messages');
                const q = query(
                    messagesRef,
                    orderBy('at', 'desc'),
                    limit(100) // Last 100 messages
                );

                unsubscribeRef.current = onSnapshot(q, (snapshot) => {
                    if (!mounted) {
                        console.log('[useRealtimeMessages] ❌ Snapshot ignored - unmounted');
                        return;
                    }

                    console.log('[useRealtimeMessages] 📬 NEW MESSAGE SNAPSHOT! Count:', snapshot.docs.length);
                    const newMessages: ChatMessage[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        newMessages.push({
                            id: data.id || doc.id,
                            from: data.from,
                            text: data.text || '',
                            at: data.at,
                            attachments: data.attachments || []
                        });
                    });

                    // Sort by timestamp ascending (oldest first)
                    newMessages.sort((a, b) => a.at.localeCompare(b.at));
                    console.log('[useRealtimeMessages] ✅ Snapshot processed with', newMessages.length, 'messages');
                    setMessages((prev) => (areMessagesEqual(prev, newMessages) ? prev : newMessages));
                    setLoading(false);
                }, (error) => {
                    console.error('[useRealtimeMessages] ❌ Snapshot error:', error);
                    // Fallback to initial messages on error
                    if (mounted) {
                        setMessages(initialRef.current);
                        setLoading(false);
                    }
                });

                setupComplete = true;
                console.log('[useRealtimeMessages] ✅ Listener setup complete for:', conversationId);

            } catch (error) {
                console.error('[useRealtimeMessages] ❌ Setup failed:', error);
                if (mounted) {
                    setMessages(initialMessages);
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
            if (unsubscribeRef.current) {
                console.log('[useRealtimeMessages] 🧹 Cleaning up listener for:', conversationId);
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            } else if (!setupComplete) {
                console.log('[useRealtimeMessages] ⚠️ Cleanup called before setup complete');
            }
        };
    }, [conversationId, pageId]);

    return { messages, loading };
}
