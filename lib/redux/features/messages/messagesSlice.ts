import type { ReducerCreators } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import { createAppSlice } from "../../createAppSlice";
import type { Conversation, ChatMessage } from "@/components/messages/types";

type PageMeta = { pageId: string; name: string };

interface FetchConversationsResult {
    conversations: Conversation[];
    nextCursor: string | null;
    append: boolean;
}

interface ConversationsApiResponse {
    conversations?: Conversation[];
    nextCursor?: string | null;
    error?: string;
}

export interface MessagesSliceState {
    selectedPageId: string;
    activeConversationId: string | null;
    conversationsById: Record<string, Conversation>;
    conversationOrder: string[];
    pages: PageMeta[];
    cursor: string | null;
    hasMore: boolean;
    isPolling: boolean;
    readConversationIds: Record<string, boolean>;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    error: string | null;
    bootstrapDone: boolean;
}

const initialState: MessagesSliceState = {
    selectedPageId: "all",
    activeConversationId: null,
    conversationsById: {},
    conversationOrder: [],
    pages: [],
    cursor: null,
    hasMore: true,
    isPolling: false,
    readConversationIds: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    error: null,
    bootstrapDone: false,
};

function mergeMessages(existing: ChatMessage[] = [], incoming: ChatMessage[] = []) {
    const merged = [...existing];
    for (const msg of incoming) {
        const exists = merged.some(
            (m) => (m.id ?? "") === (msg.id ?? "") && m.at === msg.at
        );
        if (!exists) {
            merged.push(msg);
        }
    }
    merged.sort((a, b) => a.at.localeCompare(b.at));
    return merged;
}

function upsertConversationState(
    state: MessagesSliceState,
    conv: Conversation,
    appendMessages: boolean
) {
    const existing = state.conversationsById[conv.conversationId];
    const incomingMessages = conv.messages || [];

    if (existing) {
        state.conversationsById[conv.conversationId] = {
            ...existing,
            ...conv,
            messages: appendMessages
                ? mergeMessages(existing.messages, incomingMessages)
                : incomingMessages.length > 0
                    ? incomingMessages
                    : existing.messages,
        };
    } else {
        state.conversationsById[conv.conversationId] = {
            ...conv,
            messages: incomingMessages,
        };
        state.conversationOrder.push(conv.conversationId);
    }
}

function resort(state: MessagesSliceState) {
    state.conversationOrder.sort((a, b) => {
        const ca = state.conversationsById[a]?.updatedAt ?? "";
        const cb = state.conversationsById[b]?.updatedAt ?? "";
        return cb.localeCompare(ca);
    });
}

export const messagesSlice = createAppSlice({
    name: "messages",
    initialState,
    reducers: (create: ReducerCreators<MessagesSliceState>) => ({
        setSelectedPageId: create.reducer((state, action: { payload: string }) => {
            state.selectedPageId = action.payload;
            state.cursor = null;
            state.hasMore = true;
        }),
        setActiveConversation: create.reducer((state, action: { payload: string | null }) => {
            state.activeConversationId = action.payload;
        }),
        setIsPolling: create.reducer((state, action: { payload: boolean }) => {
            state.isPolling = action.payload;
        }),
        upsertConversations: create.reducer((state, action: { payload: Conversation[] }) => {
            action.payload.forEach((c) => upsertConversationState(state, c, false));
            resort(state);
        }),
        upsertMessages: create.reducer(
            (state, action: { payload: { conversationId: string; messages: ChatMessage[] } }) => {
                const { conversationId, messages } = action.payload;
                const conv = state.conversationsById[conversationId];
                if (!conv) return;
                conv.messages = mergeMessages(conv.messages, messages);
            }
        ),
        addMessage: create.reducer(
            (state, action: { payload: { conversationId: string; message: ChatMessage } }) => {
                const { conversationId, message } = action.payload;
                const conv = state.conversationsById[conversationId];
                if (!conv) return;
                conv.messages = mergeMessages(conv.messages, [message]);
            }
        ),
        markConversationReadLocal: create.reducer((state, action: { payload: string }) => {
            const id = action.payload;
            state.readConversationIds[id] = true;
            const conv = state.conversationsById[id];
            if (conv) {
                conv.unread = false;
            }
        }),
        setConversationsLoading: create.reducer((state, action: { payload: boolean }) => {
            state.isLoadingConversations = action.payload;
        }),
        setMessagesLoading: create.reducer((state, action: { payload: boolean }) => {
            state.isLoadingMessages = action.payload;
        }),
        setError: create.reducer((state, action: { payload: string | null }) => {
            state.error = action.payload;
        }),
        setBootstrapDone: create.reducer((state, action: { payload: boolean }) => {
            state.bootstrapDone = action.payload;
        }),
        setPages: create.reducer((state, action: { payload: PageMeta[] }) => {
            state.pages = action.payload;
        }),
        setCursor: create.reducer((state, action: { payload: string | null }) => {
            state.cursor = action.payload;
        }),
        setHasMore: create.reducer((state, action: { payload: boolean }) => {
            state.hasMore = action.payload;
        }),

        fetchPagesAsync: create.asyncThunk(
            async ({ apiBaseUrl = "" }: { apiBaseUrl?: string }) => {
                const res = await fetch(`${apiBaseUrl}/api/pages`);
                const raw = await res.json().catch(() => ({}));
                const data = raw as { pages?: PageMeta[]; error?: string };

                if (!res.ok) {
                    const message = typeof data?.error === "string" ? data.error : "Failed to load pages";
                    throw new Error(message);
                }

                return data.pages || [];
            },
            {
                pending: (state) => {
                    state.error = null;
                },
                fulfilled: (state, action) => {
                    state.pages = action.payload;
                },
                rejected: (state, action) => {
                    state.error = action.error?.message || "Failed to load pages";
                },
            }
        ),

        warmTokensAsync: create.asyncThunk(
            async ({ apiBaseUrl = "" }: { apiBaseUrl?: string }) => {
                const res = await fetch(`${apiBaseUrl}/api/bootstrap`, { method: "POST" });
                const raw = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const message = (raw as Record<string, unknown>)?.error as string | undefined;
                    throw new Error(message || "Bootstrap failed");
                }
                return raw as { success: boolean; warmed: number; total: number; pages: PageMeta[] };
            },
            {
                pending: (state) => {
                    state.error = null;
                },
                fulfilled: (state, action) => {
                    // Optionally update pages from bootstrap response
                    const resp = action.payload;
                    if (Array.isArray(resp.pages) && resp.pages.length > 0) {
                        state.pages = resp.pages;
                    }
                    state.bootstrapDone = true;
                },
                rejected: (state, action) => {
                    state.error = action.error?.message || "Bootstrap failed";
                },
            }
        ),

        fetchConversationsAsync: create.asyncThunk(
            async (
                {
                    pageId,
                    cursor,
                    append = false,
                    limit = 10,
                    apiBaseUrl = "",
                }: { pageId?: string; cursor?: string | null; append?: boolean; limit?: number; apiBaseUrl?: string }
            ) => {
                const params = new URLSearchParams();
                if (pageId && pageId !== "all") params.set("pageId", pageId);
                if (append && cursor) params.set("cursor", cursor);
                params.set("limit", String(limit));
                const qs = params.toString() ? `?${params.toString()}` : "";

                const res = await fetch(`${apiBaseUrl}/api/messages${qs}`);
                const raw = await res.json().catch(() => ({}));
                const data = raw as ConversationsApiResponse;

                if (!res.ok) {
                    const message = typeof data?.error === "string" ? data.error : "Failed to load conversations";
                    throw new Error(message);
                }

                return {
                    conversations: data.conversations || [],
                    nextCursor: data.nextCursor ?? null,
                    append,
                } as FetchConversationsResult;
            },
            {
                pending: (state) => {
                    state.isLoadingConversations = true;
                    state.error = null;
                },
                fulfilled: (state, action) => {
                    const { conversations, nextCursor, append } = action.payload;
                    conversations.forEach((c) => upsertConversationState(state, c, append));
                    resort(state);
                    state.cursor = nextCursor;
                    state.hasMore = !!nextCursor;
                    state.isLoadingConversations = false;

                    if (!state.activeConversationId && state.conversationOrder.length > 0) {
                        state.activeConversationId = state.conversationOrder[0];
                    }
                },
                rejected: (state, action) => {
                    state.isLoadingConversations = false;
                    state.error = action.error?.message || "Failed to load conversations";
                },
            }
        ),

        fetchConversationByIdAsync: create.asyncThunk(
            async ({ conversationId, apiBaseUrl = "" }: { conversationId: string; apiBaseUrl?: string }) => {
                const res = await fetch(`${apiBaseUrl}/api/conversations/${conversationId}`);
                const raw = await res.json().catch(() => ({}));

                if (!res.ok) {
                    const message = typeof (raw as Record<string, unknown>)?.error === "string"
                        ? (raw as Record<string, unknown>).error
                        : "Failed to load conversation";
                    throw new Error(message as string);
                }

                return raw as Conversation;
            },
            {
                pending: (state) => {
                    state.isLoadingMessages = true;
                    state.error = null;
                },
                fulfilled: (state, action) => {
                    const conversation = action.payload;
                    upsertConversationState(state, conversation, false);
                    state.activeConversationId = conversation.conversationId;
                    state.isLoadingMessages = false;
                },
                rejected: (state, action) => {
                    state.isLoadingMessages = false;
                    state.error = action.error?.message || "Failed to load conversation";
                },
            }
        ),

        // removed markConversationReadAsync (no longer needed)
    }),
    selectors: {
        selectSelectedPageId: (messages) => messages.selectedPageId,
        selectActiveConversationId: (messages) => messages.activeConversationId,
        selectConversationById: (messages, id: string) => messages.conversationsById[id],
        selectConversations: (messages) =>
            messages.conversationOrder
                .map((id) => messages.conversationsById[id])
                .filter(Boolean),
        selectPages: (messages) => messages.pages,
        selectCursor: (messages) => messages.cursor,
        selectHasMore: (messages) => messages.hasMore,
        selectIsPolling: (messages) => messages.isPolling,
        selectReadConversationIds: (messages) => messages.readConversationIds,
        selectIsLoadingConversations: (messages) => messages.isLoadingConversations,
        selectIsLoadingMessages: (messages) => messages.isLoadingMessages,
        selectMessagesError: (messages) => messages.error,
        selectBootstrapDone: (messages) => messages.bootstrapDone,
    },
});

export const {
    setSelectedPageId,
    setActiveConversation,
    setIsPolling,
    upsertConversations,
    upsertMessages,
    addMessage,
    markConversationReadLocal,
    setConversationsLoading,
    setMessagesLoading,
    setError,
    setBootstrapDone,
    setPages,
    setCursor,
    setHasMore,
    fetchPagesAsync,
    fetchConversationsAsync,
    warmTokensAsync,
    fetchConversationByIdAsync,
} = messagesSlice.actions;

export const {
    selectSelectedPageId,
    selectActiveConversationId,
    selectConversationById,
    selectConversations,
    selectPages,
    selectCursor,
    selectHasMore,
    selectIsPolling,
    selectReadConversationIds,
    selectIsLoadingConversations,
    selectIsLoadingMessages,
    selectMessagesError,
    selectBootstrapDone,
} = messagesSlice.selectors;

// Memoized selectors to avoid new references on each render
export const selectConversationsMemo = createSelector(
    [(state: { messages: MessagesSliceState }) => state.messages],
    (messages) =>
        messages.conversationOrder.map((id) => messages.conversationsById[id]).filter(Boolean)
);

export const selectPagesMemo = createSelector(
    [(state: { messages: MessagesSliceState }) => state.messages],
    (messages) => messages.pages
);
