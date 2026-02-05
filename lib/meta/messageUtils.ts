/**
 * Message Utility Functions
 * Helper functions for message processing, deduplication, and formatting
 */

import { ChatMessage } from '@/components/messages/types';

/**
 * Deduplicates messages by ID and sorts by timestamp
 * Used to merge messages from different sources (Meta API + Firestore)
 * 
 * @example
 * const merged = deduplicateMessages([...metaMessages, ...firestoreMessages]);
 */
export function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
    const map = new Map<string, ChatMessage>();

    // Add all messages, later ones override earlier (Firestore > Meta API)
    messages.forEach(m => {
        if (m.id) {
            map.set(m.id, m);
        }
    });

    // Convert back to array and sort by timestamp
    return Array.from(map.values()).sort((a, b) =>
        new Date(a.at).getTime() - new Date(b.at).getTime()
    );
}

/**
 * Calculates scroll position to maintain user position after loading old messages
 * Formula: newHeight - prevHeight + offset
 * 
 * @example
 * const targetScroll = calculateScrollPosition(1200, 800, 150);
 * // Result: Math.max(150, 1200 - 800 + 150) = 550
 */
export function calculateScrollPosition(
    newHeight: number,
    prevHeight: number,
    offsetBuffer: number = 150
): number {
    const diff = newHeight - prevHeight;
    return Math.max(offsetBuffer, diff + offsetBuffer);
}

/**
 * Formats admin display name as "Page Name (Admin Name)"
 * Used for message sender identification
 * 
 * @example
 * const name = formatAdminName('Meta Page', 'Tuan Tran');
 * // Result: "Meta Page (Tuan Tran)"
 */
export function formatAdminName(pageName: string, adminName: string): string {
    if (!pageName || !adminName) {
        return pageName || adminName || 'Unknown';
    }
    return `${pageName} (${adminName})`;
}

/**
 * Checks if user is scrolled to bottom of message list
 * Used to determine if new messages should auto-scroll
 * 
 * @example
 * const atBottom = isScrolledToBottom(container, 100);
 */
export function isScrolledToBottom(
    container: HTMLElement | null,
    threshold: number = 100
): boolean {
    if (!container) return true;

    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom < threshold;
}

/**
 * Extracts conversation ID from message
 * Format: pageId_psid
 * 
 * @example
 * const { pageId, psid } = parseConversationId('123456_789');
 */
export function parseConversationId(conversationId: string): {
    pageId: string;
    psid: string;
} {
    const [pageId, psid] = conversationId.split('_');
    return { pageId, psid };
}

/**
 * Constructs conversation ID from page and PSID
 * Format: pageId_psid
 * 
 * @example
 * const convId = buildConversationId('123456', '789');
 * // Result: "123456_789"
 */
export function buildConversationId(pageId: string, psid: string): string {
    return `${pageId}_${psid}`;
}

/**
 * Checks if message is from agent (page owner)
 * 
 * @example
 * if (isAgentMessage(message)) {
 *   // Highlight as outgoing
 * }
 */
export function isAgentMessage(message: ChatMessage): boolean {
    return message.from === 'agent';
}

/**
 * Sanitizes HTML to prevent XSS
 * Strips dangerous tags and attributes
 * 
 * @example
 * const safe = sanitizeHTML(userInput);
 */
export function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html; // Uses textContent instead of innerHTML
    return div.innerHTML;
}

/**
 * Formats timestamp for display
 * Shows "Today 14:30" or "Dec 16, 14:30"
 * 
 * @example
 * const display = formatMessageTime('2025-12-16T14:30:00Z');
 */
export function formatMessageTime(isoString: string): string {
    const date = new Date(isoString);
    const today = new Date();

    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
        return `Today ${date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })}`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Groups messages by date for display
 * Returns array of [date, messages] tuples
 * 
 * @example
 * const grouped = groupMessagesByDate(messages);
 * // Result: [[2025-12-16, [...messages]], [2025-12-15, [...]]]
 */
export function groupMessagesByDate(messages: ChatMessage[]): [Date, ChatMessage[]][] {
    const groups = new Map<string, ChatMessage[]>();

    messages.forEach(msg => {
        const date = new Date(msg.at);
        const dateKey = date.toDateString();

        if (!groups.has(dateKey)) {
            groups.set(dateKey, []);
        }
        groups.get(dateKey)!.push(msg);
    });

    return Array.from(groups.entries())
        .map(([dateStr, msgs]): [Date, ChatMessage[]] => [new Date(dateStr), msgs])
        .sort(([a], [b]) => a.getTime() - b.getTime());
}

/**
 * Checks if message content is empty
 * 
 * @example
 * if (!isEmptyMessage(message)) {
 *   // Show message
 * }
 */
export function isEmptyMessage(message: ChatMessage): boolean {
    const hasText = message.text && message.text.trim().length > 0;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    return !hasText && !hasAttachments;
}

/**
 * Creates a temporary/optimistic message for UI
 * Used before server confirmation
 * 
 * @example
 * const tempMsg = createTempMessage('Hello', 'agent', displayName);
 */
export function createTempMessage(
    text: string,
    from: 'agent' | 'customer',
    senderName?: string
): ChatMessage {
    return {
        from,
        text,
        at: new Date().toISOString(),
        senderName,
        attachments: []
    };
}
