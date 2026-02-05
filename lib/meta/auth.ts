export const NEXT_PUBLIC_META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;

export function getMetaOAuthUrl(state?: string) {
    const appId = NEXT_PUBLIC_META_APP_ID || 'YOUR_APP_ID';
    const redirectUri = encodeURIComponent(
        `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/meta/oauth/callback`
    );
    const scope = encodeURIComponent(
        'pages_show_list,pages_messaging'
    );
    const st = state || String(Date.now());
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${st}`;
}
