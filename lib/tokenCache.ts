import { getFirestore } from './firebaseAdmin';
import { decrypt } from './encrypt';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface CachedToken {
    token: string;
    cachedAt: number;
}

// In-memory cache with composite key: userId_pageId
const tokenCache = new Map<string, CachedToken>();

/**
 * Fetch and cache page access token (user-scoped)
 * Tokens are cached in memory for up to 1 hour
 */
export async function getPageAccessToken(userId: string, pageId: string): Promise<string> {
    const now = Date.now();
    const cacheKey = `${userId}_${pageId}`;

    // Check memory cache
    const cached = tokenCache.get(cacheKey);
    if (cached && now - cached.cachedAt < CACHE_DURATION_MS) {
        return cached.token;
    }

    // Fetch from Firestore (user-scoped: clerk_users/{userId}/platforms/facebook/pages/{pageId})
    try {
        const db = getFirestore();
        const pageDoc = await db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .doc(pageId)
            .get();

        if (!pageDoc.exists) {
            throw new Error(`Page ${pageId} not found for user ${userId}`);
        }

        const data = pageDoc.data();
        if (!data?.accessTokenEncrypted || !data?.accessTokenIv) {
            throw new Error(`No access token found for page ${pageId}`);
        }

        // Decrypt token
        const token = decrypt(data.accessTokenIv, data.accessTokenEncrypted, data.accessTokenAuthTag);

        // Cache it
        tokenCache.set(cacheKey, { token, cachedAt: now });

        return token;
    } catch (error) {
        throw error;
    }
}

/**
 * Invalidate cached token (call after token refresh)
 */
export function invalidateCache(userId: string, pageId: string): void {
    const cacheKey = `${userId}_${pageId}`;
    tokenCache.delete(cacheKey);
}
