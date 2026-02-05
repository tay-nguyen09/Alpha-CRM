import { getFirestore } from './firebaseAdmin';
import { decrypt } from './encrypt';

interface CachedToken {
    token: string;
    expiresAt: number;
}

// In-memory cache for page access tokens
const tokenCache = new Map<string, CachedToken>();

// Cache duration: 1 hour (tokens typically last 60 days but we refresh hourly to be safe)
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * Get page access token with caching
 * - First checks memory cache
 * - If expired or not found, fetches from Firestore
 * - Falls back to environment variables
 */
export async function getPageAccessToken(pageId: string): Promise<string> {
    // Check cache first
    const cached = tokenCache.get(pageId);
    if (cached && cached.expiresAt > Date.now()) {
        console.log(`[TokenCache] Using cached token for page ${pageId} (expires in ${Math.round((cached.expiresAt - Date.now()) / 1000)}s)`);
        return cached.token;
    }

    console.log(`[TokenCache] Cache miss or expired for page ${pageId}, fetching from Firestore...`);

    // Fetch from Firestore
    try {
        const db = getFirestore();
        const pageDoc = await db.collection('pages').doc(String(pageId)).get();

        if (pageDoc.exists) {
            const data = pageDoc.data();
            if (data?.accessTokenEncrypted && data?.accessTokenIv) {
                const token = decrypt(data.accessTokenIv, data.accessTokenEncrypted);

                // Cache the token
                tokenCache.set(pageId, {
                    token,
                    expiresAt: Date.now() + CACHE_DURATION_MS
                });

                console.log(`[TokenCache] Fetched and cached token for page ${pageId}`);
                return token;
            }
        }
    } catch (err) {
        console.error(`[TokenCache] Error fetching token for page ${pageId}:`, err);
    }

    // Fallback to environment variables
    const envKey = `META_PAGE_ACCESS_TOKEN_${pageId}`;
    const specificToken = process.env[envKey];
    if (specificToken) {
        console.log(`[TokenCache] Using env token from ${envKey}`);
        return specificToken;
    }

    const fallback = process.env.META_PAGE_ACCESS_TOKEN || '';
    console.log(`[TokenCache] Using fallback META_PAGE_ACCESS_TOKEN`);
    return fallback;
}

/**
 * Invalidate cached token for a page (useful when token expires)
 */
export function invalidateToken(pageId: string): void {
    tokenCache.delete(pageId);
    console.log(`[TokenCache] Invalidated cache for page ${pageId}`);
}

/**
 * Clear all cached tokens
 */
export function clearCache(): void {
    tokenCache.clear();
    console.log(`[TokenCache] Cleared all cached tokens`);
}
