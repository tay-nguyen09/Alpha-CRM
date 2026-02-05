import { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Conversation, ChatMessage } from './types';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

interface MessageThreadProps {
    conversation: Conversation | undefined;
    pages?: { pageId: string; name: string }[];
    onCopyPSID?: (psid: string) => void;
    apiBaseUrl?: string;
}

export function MessageThread({ conversation, pages = [], onCopyPSID, apiBaseUrl = '' }: MessageThreadProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(0); // Track message count for scroll trigger

    // Use Firestore realtime listener for new messages
    const { messages: realtimeMessages } = useRealtimeMessages({
        conversationId: conversation?.conversationId,
        pageId: conversation?.pageId,
        initialMessages: []
    });

    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeight = useRef(0);
    const isInitialMount = useRef(true);
    const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false); // Track loading state to prevent duplicate calls
    const lastScrollTop = useRef(0); // Track scroll direction
    const isProgrammaticScroll = useRef(false); // Track if scroll is from code, not user

    // Auto-scroll when new messages arrive, but only if user is near bottom
    useEffect(() => {
        if (messages.length > lastMessageCount) {
            const container = messagesContainerRef.current;
            const isNearBottom = container
                ? (container.scrollHeight - container.scrollTop - container.clientHeight) < 120
                : true;

            // Do not jump to bottom if we're loading older messages or user is reading history
            if (isNearBottom && !loadingMore) {
                setTimeout(() => scrollToBottom('smooth'), 50);
            }
            setLastMessageCount(messages.length);
        }
    }, [messages.length, lastMessageCount, loadingMore]);

    // Load initial message history from API
    useEffect(() => {
        if (!conversation?.conversationId || !conversation?.pageId) {
            setMessages([]);
            return;
        }

        setLoadingHistory(true);
        setHistoryLoaded(false);

        async function loadHistory() {
            try {
                const params = new URLSearchParams({
                    pageId: conversation!.pageId,
                    limit: '20'
                });
                const res = await fetch(`${apiBaseUrl}/api/conversation/${conversation!.conversationId}/messages?${params}`);
                const data = await res.json();

                if (res.ok && data.messages) {
                    console.log('[MessageThread] Loaded', data.messages.length, 'messages from API history');
                    setMessages(data.messages);
                    setCursor(data.nextCursor || null);
                    setHasMore(!!data.nextCursor);

                    setTimeout(() => {
                        scrollToBottom('auto');
                    }, 100);
                }
            } catch (err) {
                console.error('[MessageThread] Failed to load history:', err);
            } finally {
                setLoadingHistory(false);
                setHistoryLoaded(true);
            }
        }

        loadHistory();
    }, [conversation, apiBaseUrl]);

    // Merge realtime messages with history
    useEffect(() => {
        if (!historyLoaded) return;

        if (realtimeMessages.length > 0) {
            console.log('[MessageThread] Merging realtime messages:', realtimeMessages.length);

            setMessages(prev => {
                const merged = new Map<string, ChatMessage>();

                prev.forEach(msg => {
                    if (msg.id) merged.set(msg.id, msg);
                });

                realtimeMessages.forEach((msg: ChatMessage) => {
                    if (msg.id) merged.set(msg.id, msg);
                });

                const result = Array.from(merged.values()).sort((a, b) => a.at.localeCompare(b.at));

                if (result.length > prev.length) {
                    const container = messagesContainerRef.current;
                    const isAtBottom = container ?
                        (container.scrollHeight - container.scrollTop - container.clientHeight) < 100 : true;

                    if (isAtBottom) {
                        setTimeout(() => scrollToBottom('smooth'), 100);
                    }
                }

                return result;
            });
        }
    }, [realtimeMessages, historyLoaded]);

    // Scroll to bottom helper
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        const container = messagesContainerRef.current;
        if (container) {
            isProgrammaticScroll.current = true;
            container.scrollTo({
                top: container.scrollHeight,
                behavior
            });
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 100);
        }
    };

    // Handle conversation changes
    useEffect(() => {
        if (conversation) {
            // Reset state for new conversation
            setLastMessageCount(0);
            setLoadingMore(false);
            setCursor(null);
            setHasMore(true);

            // Scroll to bottom when switching conversation
            scrollToBottom(isInitialMount.current ? 'auto' : 'smooth');
            isInitialMount.current = false;
        }

        // Cleanup: Clear debounce timer on unmount
        return () => {
            if (scrollDebounceTimer.current) {
                clearTimeout(scrollDebounceTimer.current);
                scrollDebounceTimer.current = null;
            }
        };
    }, [conversation]);

    const loadMoreMessages = async () => {
        if (!conversation || !hasMore || loadingMore || !cursor) {
            console.log('[MessageThread] Skipping loadMore - conversation:', !!conversation, 'hasMore:', hasMore, 'loadingMore:', loadingMore, 'cursor:', cursor);
            return;
        }

        // Prevent duplicate calls using ref
        if (isLoadingRef.current) {
            console.log('[MessageThread] Already loading, skipping...');
            return;
        }

        console.log('[MessageThread] loadMoreMessages - cursor:', cursor, 'hasMore:', hasMore);
        isLoadingRef.current = true;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams({
                pageId: conversation.pageId,
                after: cursor,
                limit: '20'
            });
            const res = await fetch(`${apiBaseUrl}/api/conversation/${conversation.conversationId}/messages?${params.toString()}`);
            const data = await res.json();
            console.log('[MessageThread] loadMoreMessages - response:', data);

            if (res.ok && data.messages?.length > 0) {
                const container = messagesContainerRef.current;
                if (container) prevScrollHeight.current = container.scrollHeight;

                setMessages(prev => {
                    const merged = [...data.messages, ...prev];
                    // Use message ID as key to prevent duplicates (timestamps can be identical)
                    const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());
                    return unique.sort((a, b) => a.at.localeCompare(b.at));
                });
                setCursor(data.nextCursor);
                setHasMore(!!data.nextCursor);
                console.log('[MessageThread] Loaded', data.messages.length, 'more messages. Total now:', messages.length + data.messages.length, 'hasMore:', !!data.nextCursor, 'newCursor:', data.nextCursor);

                // Maintain scroll position - wait a bit for DOM update
                setTimeout(() => {
                    if (container) {
                        isProgrammaticScroll.current = true; // Mark as programmatic
                        const newScrollHeight = container.scrollHeight;
                        // Set scroll to maintain position and ensure we're away from trigger zone
                        const targetScroll = Math.max(150, newScrollHeight - prevScrollHeight.current);
                        container.scrollTop = targetScroll;
                        lastScrollTop.current = targetScroll; // Update last scroll to prevent immediate retrigger
                        console.log('[MessageThread] Adjusted scroll to', targetScroll, '(safe zone)');

                        // Reset flag after scroll event propagates
                        setTimeout(() => {
                            isProgrammaticScroll.current = false;
                        }, 100);
                    }
                }, 50);
            } else {
                setHasMore(false);
                console.log('[MessageThread] No more messages to load');
            }
        } catch (err) {
            console.error('Failed to load more messages:', err);
        } finally {
            setLoadingMore(false);
            isLoadingRef.current = false;
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const currentScrollTop = target.scrollTop;

        // Ignore programmatic scrolls (from our own code)
        if (isProgrammaticScroll.current) {
            console.log('[MessageThread] Ignoring programmatic scroll');
            return;
        }


        scrollDebounceTimer.current = setTimeout(() => {
            // Don't trigger if already loading
            if (isLoadingRef.current) {
                console.log('[MessageThread] Already loading, ignoring scroll event');
                lastScrollTop.current = currentScrollTop; // Update to prevent false triggers
                return;
            }

            // Only load if scrolling UP (decreasing scrollTop) and near top
            const isScrollingUp = currentScrollTop < lastScrollTop.current;
            const isNearTop = currentScrollTop < 100;

            console.log('[MessageThread] Scroll check - current:', currentScrollTop, 'last:', lastScrollTop.current, 'isScrollingUp:', isScrollingUp, 'isNearTop:', isNearTop, 'hasMore:', hasMore, 'cursor:', !!cursor);

            if (isScrollingUp && isNearTop && hasMore && !loadingMore && cursor) {
                console.log('[MessageThread] ✅ TRIGGERING load more');
                loadMoreMessages();
            } else {
                console.log('[MessageThread] ❌ Not loading - conditions not met');
            }

            // Always update last scroll position AFTER check
            lastScrollTop.current = currentScrollTop;
        }, 150);
    };

    if (!conversation) {
        return (
            <section className="flex flex-col items-center justify-center w-full h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg" style={{ maxHeight: 'calc(90vh - 90px)' }}>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Select a conversation to view messages</div>
            </section>
        );
    }

    // Show loading spinner while history is being fetched
    if (loadingHistory) {
        return (
            <section className="flex flex-col items-center justify-center w-full h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg gap-4" style={{ maxHeight: 'calc(90vh - 90px)' }}>
                <div className="w-12 h-12 border-4 border-gray-100 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading conversation...</div>
            </section>
        );
    }

    return (
        <section className="flex flex-col w-full h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ maxHeight: 'calc(90vh - 90px)' }}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-base text-gray-900 dark:text-white">{conversation.customerName}</div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(conversation.psid);
                            onCopyPSID?.(conversation.psid);
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                        title="Copy PSID"
                    >
                        📋 Copy PSID
                    </button>
                    <a
                        href={`https://business.facebook.com/latest/inbox/all?asset_id=${conversation.pageId}&mailbox_id=${conversation.psid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs border border-blue-500 bg-blue-500 text-white rounded no-underline hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        🔗 Business Suite
                    </a>
                </div>
                {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                    Page: {conversation.pageId} · PSID: {conversation.psid}
                </div> */}
            </div>
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 overflow-y-auto thin-scrollbar overflow-x-hidden flex flex-col gap-2 bg-gray-50 dark:bg-gray-800"
                style={{ minHeight: 0 }}
            >
                {loadingMore && (
                    <div className="text-center py-2 text-gray-600 dark:text-gray-400 text-xs">
                        đang tải thêm tin nhắn...
                    </div>
                )}
                {!hasMore && messages.length > 5 && (
                    <div className="text-center py-2 text-gray-600 dark:text-gray-400 text-xs">
                        • Đầu cuộc trò chuyện •
                    </div>
                )}
                {messages.map((m, idx) => {
                    const isLastMessage = idx === messages.length - 1;
                    const pageName = pages.find(p => p.pageId === conversation.pageId)?.name || conversation.pageId;
                    const senderName = m.senderName || (m.from === 'agent' ? pageName : conversation.customerName);
                    const profileUrl = m.from === 'agent'
                        ? `https://www.facebook.com/${conversation.pageId}`
                        : `https://www.facebook.com/messages/t/${conversation.psid}`;
                    return (
                        <div
                            key={idx}
                            className={`flex gap-2 max-w-3/4 ${m.from === 'agent' ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}
                        >
                            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                <img
                                    src={`https://graph.facebook.com/${m.from === 'agent' ? conversation.pageId : conversation.psid}/picture?type=large`}
                                    alt={senderName}
                                    className="w-8 h-8 rounded-full cursor-pointer object-cover"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = `w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${m.from === 'agent' ? 'bg-blue-500' : 'bg-gray-300'}`;
                                        fallback.textContent = senderName.charAt(0).toUpperCase();
                                        target.parentElement?.appendChild(fallback);
                                    }}
                                />
                            </a>
                            <div
                                className={`px-3 py-2 rounded-xl flex-1 ${m.from === 'agent' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                            >
                                <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold">{senderName}</div>
                                {m.text && <div className="text-sm text-gray-900 dark:text-white">{m.text}</div>}
                                {m.attachments?.map((att, attIdx) => (
                                    <div key={attIdx} className="mt-2">
                                        {att.type === 'image' && (
                                            <img
                                                src={att.url}
                                                alt={att.name || 'Image'}
                                                className="max-w-48 max-h-48 rounded-lg cursor-pointer object-cover"
                                                onClick={() => window.open(att.url, '_blank')}
                                            />
                                        )}
                                        {att.type === 'video' && (
                                            <video
                                                src={att.url}
                                                controls
                                                className="w-full max-w-sm rounded-lg"
                                            />
                                        )}
                                        {att.type === 'file' && (
                                            <a
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-600 no-underline text-blue-500 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                📎 {att.name || 'File'}
                                            </a>
                                        )}
                                    </div>
                                ))}
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    {new Date(m.at).toLocaleTimeString()}
                                    {m.from === 'agent' && isLastMessage && (
                                        <span className="ml-1">✓✓</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {selectedFiles.length > 0 && (
                    <div className="mb-2 flex gap-2 flex-wrap">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="relative px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs flex items-center gap-1 text-gray-900 dark:text-white">
                                {file.type.startsWith('image/') ? '🖼️' : '📎'} {file.name}
                                <button
                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="bg-transparent border-none cursor-pointer text-base p-0 ml-1 hover:text-red-600"
                                >×</button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) {
                                setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                        }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        className="p-2 bg-transparent border border-gray-200 dark:border-gray-700 rounded-full cursor-pointer text-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                        title="Attach file"
                    >
                        📎
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sending}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-full outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && messageInput.trim() && !sending) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <button
                        disabled={(!messageInput.trim() && selectedFiles.length === 0) || sending}
                        className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${(messageInput.trim() || selectedFiles.length > 0) && !sending ? 'bg-blue-500 cursor-pointer hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800' : 'bg-gray-300 cursor-not-allowed dark:bg-gray-600'}`}
                        onClick={handleSendMessage}
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </section>
    );

    async function handleSendMessage() {
        if (!conversation || (!messageInput.trim() && selectedFiles.length === 0) || sending) return;

        setSending(true);
        const text = messageInput.trim();
        const files = selectedFiles;
        setMessageInput('');
        setSelectedFiles([]);

        try {
            // Get admin name from Firebase Auth
            const auth = getAuth();
            const currentUser = auth.currentUser;
            const adminName = currentUser?.displayName || 'Unknown Admin';

            // Get page name
            const pageInfo = pages?.find(p => p.pageId === conversation.pageId);
            const pageName = pageInfo?.name || conversation.pageId;
            const displayName = `${pageName} (${adminName})`;

            // Optimistic UI update (no ID means it's temporary)
            const tempMessage: ChatMessage = {
                from: 'agent',
                text,
                at: new Date().toISOString(),
                senderName: displayName,
                attachments: files.map(f => ({
                    type: f.type.startsWith('image/') ? 'image' : 'file',
                    url: URL.createObjectURL(f),
                    name: f.name
                }))
            };
            setMessages(prev => [...prev, tempMessage]);

            // Scroll to bottom smoothly
            scrollToBottom('smooth');

            // Send text message if present
            if (text) {
                const res = await fetch(`${apiBaseUrl}/api/inbox/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pageId: conversation.pageId,
                        psid: conversation.psid,
                        message: text,
                        adminName
                    })
                });

                if (!res.ok) {
                    const error = await res.json();
                    if (res.status === 403 && (error?.code === 10 || String(error?.error || '').includes('24-hour'))) {
                        throw new Error('Tin nhắn nằm ngoài cửa sổ 24 giờ. Hãy yêu cầu khách hàng trả lời trước, hoặc sử dụng Business Suite/Tags phù hợp.');
                    }
                    throw new Error(error.error || 'Failed to send message');
                }
            }

            // Send attachments (files must be uploaded first to a public URL)
            // Note: Facebook requires files to be accessible via public URL
            // For now, we just show them in UI. To actually send, you'd need to:
            // 1. Upload files to cloud storage (Firebase Storage, S3, etc.)
            // 2. Get public URL
            // 3. Call API with attachmentUrl
            if (files.length > 0) {
                console.warn('File upload to Facebook requires public URLs. Files shown in UI only.');
                // Example for future implementation:
                // for (const file of files) {
                //     const publicUrl = await uploadToStorage(file);
                //     await fetch(`${apiBaseUrl}/api/inbox/send`, {
                //         method: 'POST',
                //         headers: { 'Content-Type': 'application/json' },
                //         body: JSON.stringify({
                //             pageId: conversation.pageId,
                //             psid: conversation.psid,
                //             attachmentUrl: publicUrl
                //         })
                //     });
                // }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
            console.error('Failed to send message:', err);
            alert(message);
            setMessageInput(text); // Restore message
            setSelectedFiles(files); // Restore files
        } finally {
            setSending(false);
        }
    }
}
