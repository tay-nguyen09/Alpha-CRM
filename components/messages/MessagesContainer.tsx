'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Conversation } from './types';
import ConversationList from './ConversationList';
import { MessageThread } from './MessageThread';

interface MessagesContainerProps {
    apiBaseUrl?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function MessagesContainer({ apiBaseUrl = '', className, style }: MessagesContainerProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [pages, setPages] = useState<{ pageId: string; name: string }[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('all');
    const [isPolling, setIsPolling] = useState(true);
    const [readConversationIds, setReadConversationIds] = useState<Record<string, boolean>>({});

    const handleSelectConversation = useCallback((id: string) => {
        setSelectedId(id);
        setReadConversationIds((prev) => ({ ...prev, [id]: true }));
    }, []);

    const handleTogglePolling = useCallback(() => {
        setIsPolling(prev => !prev);
    }, []);

    const handlePageChange = useCallback((pageId: string) => {
        setSelectedPageId(pageId);
    }, []);

    const handleRefresh = useCallback(() => {
        setCursor(null);
        loadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadPages() {
        try {
            const res = await fetch(`${apiBaseUrl}/api/pages`);
            const data = await res.json();
            if (res.ok && data.pages) {
                setPages(data.pages);
            }
        } catch {
            // Silent fail
        }
    }

    async function loadMessages(opts?: { append?: boolean }) {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (selectedPageId && selectedPageId !== 'all') params.set('pageId', selectedPageId);
            if (opts?.append && cursor) params.set('cursor', cursor);
            params.set('limit', '5');
            const qs = params.toString() ? `?${params.toString()}` : '';
            const r = await fetch(`${apiBaseUrl}/api/messages${qs}`);
            const data: Record<string, unknown> = {};
            try {
                const result = await r.json();
                Object.assign(data, result);
            } catch {
                throw new Error('Invalid response from server');
            }
            if (!r.ok) throw new Error(String(data.error || 'Failed to load'));

            // Always merge to preserve state, even on initial load
            const merged = new Map(conversations.map((c) => [c.conversationId, c]));
            const conversations_list = (data.conversations as Conversation[] | undefined) || [];
            conversations_list.forEach((c: Conversation) => {
                const existing = merged.get(c.conversationId);
                if (existing && opts?.append) {
                    // Append mode: merge messages
                    merged.set(c.conversationId, {
                        ...existing,
                        updatedAt: c.updatedAt > existing.updatedAt ? c.updatedAt : existing.updatedAt,
                        messages: [...existing.messages, ...c.messages].sort((a, b) => a.at.localeCompare(b.at))
                    });
                } else {
                    // Replace with new data
                    merged.set(c.conversationId, c);
                }
            });
            const mergedList = Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            setConversations(mergedList);

            // Only auto-select on first load when no conversation selected
            const convList = (data.conversations as Conversation[] | undefined) || [];
            if (convList.length > 0 && !selectedId) {
                setSelectedId(convList[0].conversationId);
            }
            setCursor((data.nextCursor as string | null) || null);
            setHasMore(!!(data.nextCursor));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to load conversations';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPages();
        loadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isPolling) return;

        // Poll conversation list every 30s to check for new conversations
        const listInterval = setInterval(() => {
            loadMessages();
        }, 30000);

        return () => clearInterval(listInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPolling, selectedPageId]);

    const active = useMemo(
        () => conversations.find((c) => c.conversationId === selectedId) || conversations[0],
        [conversations, selectedId]
    );

    const handleConversationScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (scrollBottom < 50 && !loading && hasMore && cursor) {
            loadMessages({ append: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, hasMore, cursor]);

    return (
        <div className={`grid gap-4`} style={{ gridTemplateColumns: '320px 1fr', height: 'calc(90vh - 90px)', ...style }}>
            <ConversationList
                conversations={conversations}
                active={active}
                pages={pages}
                selectedPageId={selectedPageId}
                loading={loading}
                cursor={cursor}
                isPolling={isPolling}
                readConversationIds={readConversationIds}
                onSelectConversation={handleSelectConversation}
                onLoadMore={() => loadMessages({ append: true })}
                onTogglePolling={handleTogglePolling}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
                onScroll={handleConversationScroll}
            />
            <MessageThread
                conversation={active}
                onCopyPSID={(psid) => alert('PSID copied: ' + psid)}
                apiBaseUrl={apiBaseUrl}
            />
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 dark:bg-red-700 text-white px-4 py-3 rounded max-w-sm z-1000 animate-in slide-in-from-right shadow-lg"
                    style={{ animation: 'slideIn 0.3s ease-out' }}>
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-3 bg-transparent border-none text-white cursor-pointer text-lg hover:opacity-80"
                    >×</button>
                    <style>{`@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                </div>
            )}
        </div>
    );
}
