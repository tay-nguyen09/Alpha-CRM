import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirestore } from '../../../../../lib/firebaseAdmin';
import { encrypt } from '../../../../../lib/encrypt';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 });

        const appId = process.env.META_APP_ID!;
        const secret = process.env.META_APP_SECRET!;
        const redirect = process.env.META_REDIRECT_URI!;

        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${secret}&redirect_uri=${encodeURIComponent(redirect)}&code=${encodeURIComponent(code)}`);
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) return NextResponse.json({ error: tokenJson }, { status: 400 });

        const { access_token, token_type, expires_in } = tokenJson;
        const enc = encrypt(access_token);
        const db = getFirestore();

        // Fetch user info from Facebook
        let userName = 'User';
        let userPicture = '';
        try {
            const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${encodeURIComponent(access_token)}`);
            const meJson = await meRes.json();
            if (meRes.ok) {
                userName = meJson.name || 'User';
                userPicture = meJson.picture?.data?.url || '';
            }
        } catch (err) {
            console.error('[OAuth] Failed to fetch Facebook user info:', err);
        }

        // Store user token under clerk_users/{userId}/oauth_tokens/facebook
        const tokenData: any = {
            provider: 'facebook',
            encrypted: enc.cipher,
            iv: enc.iv,
            authTag: enc.authTag,
            userName,
            userPicture,
            createdAt: new Date().toISOString()
        };
        if (token_type) tokenData.token_type = token_type;
        if (expires_in) tokenData.expires_in = expires_in;

        const tokenRef = db.collection('clerk_users').doc(userId).collection('oauth_tokens').doc('facebook');
        await tokenRef.set(tokenData, { merge: true });

        // Fetch Pages and store page access tokens encrypted per user
        try {
            const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(access_token)}`);
            const pagesJson = await pagesRes.json();
            if (pagesRes.ok && Array.isArray(pagesJson.data)) {
                const batch = db.batch();
                pagesJson.data.forEach((p: any) => {
                    if (!p?.id || !p?.access_token) return;
                    const pageEnc = encrypt(p.access_token as string);
                    const pageRef = db.collection('clerk_users').doc(userId).collection('platforms').doc('facebook').collection('pages').doc(String(p.id));
                    batch.set(pageRef, {
                        pageId: String(p.id),
                        name: p.name || '',
                        category: p.category || '',
                        accessTokenEncrypted: pageEnc.cipher,
                        accessTokenIv: pageEnc.iv,
                        accessTokenAuthTag: pageEnc.authTag,
                        fetchedAt: new Date().toISOString()
                    }, { merge: true });
                });
                await batch.commit();
            }
        } catch (err) {
            console.error('[OAuth] Failed to fetch/store pages:', err);
        }

        // Redirect user back to the integration login page where pages are listed
        // Use HTTP for localhost to avoid SSL errors during development
        let redirectOrigin = url.origin;
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            redirectOrigin = url.protocol === 'https:' ? url.origin.replace('https://', 'http://') : url.origin;
        }
        const redirectUrl = new URL('/facebook-integration/login', redirectOrigin);
        return NextResponse.redirect(redirectUrl);
    } catch (err: any) {
        console.error('[OAuth Callback] Fatal error:', err);
        return NextResponse.json({ error: err?.message || 'OAuth callback failed' }, { status: 500 });
    }
}
