export interface Attachment {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name?: string;
}

export interface ChatMessage {
    id?: string;
    from: 'customer' | 'agent';
    text: string;
    at: string;
    attachments?: Attachment[];
    senderName?: string; // Admin name if from 'agent'
}

export interface Conversation {
    conversationId: string;
    pageId: string;
    psid: string;
    customerName: string;
    customerPicture?: string;
    updatedAt: string;
    messages: ChatMessage[];
    unread?: boolean;
}
