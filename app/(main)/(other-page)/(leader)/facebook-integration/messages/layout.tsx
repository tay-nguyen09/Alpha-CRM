'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useEffect } from 'react';
import ConversationList from '@/components/messages/ConversationList';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
    fetchConversationsAsync,
    fetchPagesAsync,
    markConversationReadLocal,
    selectSelectedPageId,
    selectIsLoadingConversations,
    selectCursor,
    selectHasMore,
    selectIsPolling,
    selectReadConversationIds,
    selectMessagesError,
    setActiveConversation,
    setCursor,
    setError,
    setIsPolling,
    setSelectedPageId,
    selectConversationsMemo,
    selectPagesMemo,
} from '@/lib/redux/features/messages/messagesSlice';

function MessagesLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const conversations = useAppSelector(selectConversationsMemo);
    const pages = useAppSelector(selectPagesMemo);
    const selectedPageId = useAppSelector(selectSelectedPageId);
    const loading = useAppSelector(selectIsLoadingConversations);
    const cursor = useAppSelector(selectCursor);
    const hasMore = useAppSelector(selectHasMore);
    const isPolling = useAppSelector(selectIsPolling);
    const readConversationIds = useAppSelector(selectReadConversationIds);
    const error = useAppSelector(selectMessagesError);

    const conversationId = useMemo(() => {
        const match = pathname.match(/\/facebook-integration\/messages\/([^/]+)/);
        return match ? match[1] : null;
    }, [pathname]);

    const activeConversation = useMemo(
        () => conversations.find((c) => c.conversationId === conversationId) || conversations[0],
        [conversations, conversationId]
    );

    useEffect(() => {
        dispatch(fetchPagesAsync({ apiBaseUrl: '' }));
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchConversationsAsync({ pageId: selectedPageId, append: false, limit: 10 }));
    }, [dispatch, selectedPageId]);

    useEffect(() => {
        if (conversationId) {
            dispatch(setActiveConversation(conversationId));
            dispatch(markConversationReadLocal(conversationId));
        }
    }, [conversationId, dispatch]);

    useEffect(() => {
        if (!isPolling) return;
        const intervalId = setInterval(() => {
            dispatch(fetchConversationsAsync({ pageId: selectedPageId, append: false, limit: 10 }));
        }, 30000);
        return () => clearInterval(intervalId);
    }, [dispatch, isPolling, selectedPageId]);

    const handleSelectConversation = useCallback((id: string) => {
        dispatch(setActiveConversation(id));
        dispatch(markConversationReadLocal(id));
        router.push(`/facebook-integration/messages/${id}`);
    }, [dispatch, router]);

    const handleLoadMore = useCallback(() => {
        if (!cursor || !hasMore || loading) return;
        dispatch(fetchConversationsAsync({ pageId: selectedPageId, cursor, append: true, limit: 10 }));
    }, [dispatch, selectedPageId, cursor, hasMore, loading]);

    const handleTogglePolling = useCallback(() => {
        dispatch(setIsPolling(!isPolling));
    }, [dispatch, isPolling]);

    const handlePageChange = useCallback((pageId: string) => {
        dispatch(setSelectedPageId(pageId));
    }, [dispatch]);

    const handleRefresh = useCallback(() => {
        dispatch(setCursor(null));
        dispatch(fetchConversationsAsync({ pageId: selectedPageId, append: false, limit: 10 }));
    }, [dispatch, selectedPageId]);

    const handleConversationScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (scrollBottom < 50 && !loading && hasMore && cursor) {
            dispatch(fetchConversationsAsync({ pageId: selectedPageId, cursor, append: true, limit: 10 }));
        }
    }, [dispatch, loading, hasMore, cursor, selectedPageId]);

    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: '320px 1fr', height: 'calc(90vh - 90px)' }}>
            <ConversationList
                conversations={conversations}
                active={activeConversation}
                pages={pages}
                selectedPageId={selectedPageId}
                loading={loading}
                cursor={cursor}
                isPolling={isPolling}
                readConversationIds={readConversationIds}
                onSelectConversation={handleSelectConversation}
                onLoadMore={handleLoadMore}
                onTogglePolling={handleTogglePolling}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
                onScroll={handleConversationScroll}
            />
            {children}
            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    background: '#f44336',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: 300,
                    animation: 'slideIn 0.3s ease-out',
                    zIndex: 1000
                }}>
                    {error}
                    <button
                        onClick={() => dispatch(setError(null))}
                        style={{
                            marginLeft: 12,
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 18
                        }}
                    >×</button>
                    <style>{`@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                </div>
            )}
        </div>
    );
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return <MessagesLayoutContent>{children}</MessagesLayoutContent>;
}
