import { Conversation } from './types';
import { memo } from 'react';

interface ConversationListProps {
    conversations: Conversation[];
    active: Conversation | undefined;
    pages: { pageId: string; name: string }[];
    selectedPageId: string;
    loading: boolean;
    cursor: string | null;
    isPolling: boolean;
    readConversationIds: Record<string, boolean>;
    onSelectConversation: (id: string) => void;
    onLoadMore: () => void;
    onTogglePolling: () => void;
    onPageChange: (pageId: string) => void;
    onRefresh: () => void;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function ConversationList({
    conversations,
    active,
    pages,
    selectedPageId,
    loading,
    cursor,
    isPolling,
    readConversationIds,
    onSelectConversation,
    onLoadMore,
    onTogglePolling,
    onPageChange,
    onRefresh,
    onScroll
}: ConversationListProps) {
    // Removed excessive logging - only log when count changes

    function getPageColor(pageId: string): string {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        let hash = 0;
        for (let i = 0; i < pageId.length; i++) {
            hash = pageId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    function isUnread(conv: Conversation): boolean {
        // Check if manually marked as read
        if (readConversationIds[conv.conversationId]) return false;

        // Check unread field from Firestore (set by webhook)
        if (conv.unread !== undefined) return conv.unread;

        // Fallback: check last message if messages exist
        const lastMsg = conv.messages[conv.messages.length - 1];
        return lastMsg?.from === 'customer';
    }

    return (
        <aside className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto thin-scrollbar" onScroll={onScroll}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 grid gap-2 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <strong className="text-gray-900 dark:text-white">Các Cuộc Trò Chuyện</strong>
                        <span className="text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950">
                            {conversations.length}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedPageId}
                        onChange={(e) => onPageChange(e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="all">Tất cả pages</option>
                        {pages.map((p, index) => (
                            <option key={`${p.pageId}-${index}`} value={p.pageId}>
                                {p.name}
                                {/* ({p.pageId}) */}
                            </option>
                        ))}
                    </select>
                    {/* <button onClick={onRefresh} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 text-gray-900 dark:text-white" disabled={loading}>
                        {loading ? '...' : ''}
                    </button> */}
                </div>
            </div>

            {/* Show loading skeleton only on initial load */}
            {loading && conversations.length === 0 ? (
                <div className="p-4 flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-18 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {conversations.map((c) => {
                        const pageColor = getPageColor(c.pageId);
                        const pageName = pages.find(p => p.pageId === c.pageId)?.name || c.pageId;
                        const unread = isUnread(c);
                        return (
                            <button
                                key={c.conversationId}
                                onClick={() => onSelectConversation(c.conversationId)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors text-gray-900 dark:text-white ${active?.conversationId === c.conversationId
                                    ? 'bg-blue-50 dark:bg-blue-950'
                                    : unread ? 'bg-yellow-50 dark:bg-yellow-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    } ${unread ? 'font-semibold' : 'font-normal'}`}
                                style={{ borderLeft: `4px solid ${pageColor}` }}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pageColor }} />
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{pageName}</span>
                                    {unread && (
                                        <span className="ml-auto bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                            NEW
                                        </span>
                                    )}
                                </div>
                                <div className="font-semibold text-sm text-gray-900 dark:text-white">{c.customerName}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Last: {new Date(c.updatedAt).toLocaleString()}
                                </div>
                            </button>
                        );
                    })}
                    {cursor && (
                        <div className="p-3">
                            <button onClick={onLoadMore} disabled={loading} className="w-full py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 text-sm text-gray-900 dark:text-white">
                                {loading ? 'đang tải...' : 'Tải thêm'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
}

// Custom comparison to avoid rerender when read flags are unchanged
function arePropsEqual(prevProps: ConversationListProps, nextProps: ConversationListProps) {
    // Check if read maps have same keys
    const prevKeys = Object.keys(prevProps.readConversationIds);
    const nextKeys = Object.keys(nextProps.readConversationIds);
    if (prevKeys.length !== nextKeys.length) return false;
    for (let i = 0; i < prevKeys.length; i++) {
        if (!nextProps.readConversationIds[prevKeys[i]]) return false;
    }

    // Check other props
    return (
        prevProps.conversations === nextProps.conversations &&
        prevProps.active?.conversationId === nextProps.active?.conversationId &&
        prevProps.pages === nextProps.pages &&
        prevProps.selectedPageId === nextProps.selectedPageId &&
        prevProps.loading === nextProps.loading &&
        prevProps.cursor === nextProps.cursor &&
        prevProps.isPolling === nextProps.isPolling &&
        prevProps.onSelectConversation === nextProps.onSelectConversation &&
        prevProps.onLoadMore === nextProps.onLoadMore &&
        prevProps.onTogglePolling === nextProps.onTogglePolling &&
        prevProps.onPageChange === nextProps.onPageChange &&
        prevProps.onRefresh === nextProps.onRefresh &&
        prevProps.onScroll === nextProps.onScroll
    );
}

export default memo(ConversationList, arePropsEqual);
