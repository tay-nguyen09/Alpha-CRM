/**
 * Meta/Facebook Graph API type definitions
 */

export interface MetaMessage {
    id: string;
    from: {
        name: string;
        email?: string;
        id: string;
    };
    message?: string;
    attachments?: Array<{
        type: string;
        media?: {
            image?: {
                height: number;
                width: number;
                url: string;
            };
            video?: {
                length: number;
                url: string;
            };
        };
        target?: {
            id: string;
            url: string;
        };
        url?: string;
    }>;
    created_time: string;
    story?: string;
    type?: string;
}

export interface MetaConversation {
    id: string;
    senders: Array<{
        name: string;
        email?: string;
        id: string;
    }>;
    former_participants?: Array<{
        name: string;
        email?: string;
        id: string;
    }>;
    wallpaper?: string;
    theme?: string;
    former_participants_count?: number;
    updated_time?: string;
    is_subscribed?: boolean;
}

export interface MetaPage {
    id: string;
    name: string;
    access_token: string;
    category?: string;
}

export interface MetaUser {
    id: string;
    name: string;
    picture?: {
        data: {
            url: string;
            width: number;
            height: number;
        };
    };
}
