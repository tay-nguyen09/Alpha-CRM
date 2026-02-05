/**
 * Application Constants
 * Centralized configuration for magic numbers and settings
 */

// Pagination & Limits
export const MESSAGE_PAGE_SIZE = 20;
export const ADMIN_MESSAGE_BATCH_SIZE = 50;
export const FIRESTORE_MESSAGE_LIMIT = 50;
export const CONVERSATIONS_PER_PAGE = 20;

// Cache & Timeouts
export const TOKEN_CACHE_TTL_MS = 3600000; // 1 hour
export const TOKEN_CACHE_REFRESH_MS = 300000; // 5 minutes before expiry
export const API_TIMEOUT_MS = 30000; // 30 seconds

// Scroll & UI
export const SCROLL_DEBOUNCE_MS = 150;
export const SCROLL_TRIGGER_PX = 100; // Pixels from top to trigger load more
export const SCROLL_OFFSET_BUFFER_PX = 150; // Buffer for scroll position
export const SCROLL_SMOOTH_DELAY_MS = 50; // Delay before smooth scroll

// Rate Limiting
export const RATE_LIMIT_MESSAGES_PER_HOUR = 100;
export const RATE_LIMIT_API_CALLS_PER_MINUTE = 60;
export const RATE_LIMIT_WEBHOOK_PER_SECOND = 10;

// Meta Graph API
export const META_GRAPH_VERSION = 'v24.0';
export const META_WEBHOOK_TIMEOUT_MS = 5000; // Must respond within 5s
export const META_MESSAGE_FIELDS = 'from,to,message,created_time,attachments';

// Firebase
export const FIRESTORE_COLLECTIONS = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    PAGES: 'pages',
    WEBHOOK_EVENTS: 'webhook_events',
    AUDIT_LOGS: 'auditLogs',
    OAUTH_TOKENS: 'oauth_tokens',
    CAMPAIGNS: 'campaigns' // added
} as const;

// Image & Attachments
export const MAX_IMAGE_SIZE_MB = 25;
export const MAX_FILE_SIZE_MB = 25;
export const IMAGE_DISPLAY_WIDTH_PX = 200;
export const IMAGE_DISPLAY_HEIGHT_PX = 200;
export const SUPPORTED_ATTACHMENT_TYPES = ['image', 'video', 'audio', 'file'] as const;

// Retry Configuration
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 1000; // Start at 1s, double each attempt

// Log Levels
export const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
} as const;

// UI Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    AUTH_ERROR: 'Authentication failed. Please login again.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    INVALID_INPUT: 'Invalid input. Please check your data.',
    SERVER_ERROR: 'Server error. Please try again later.'
} as const;

export const SUCCESS_MESSAGES = {
    MESSAGE_SENT: 'Message sent successfully',
    MESSAGE_MARKED_READ: 'Conversation marked as read',
    OAUTH_SUCCESS: 'Authentication successful'
} as const;
