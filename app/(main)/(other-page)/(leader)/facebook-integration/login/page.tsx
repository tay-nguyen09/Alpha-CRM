'use client';
import { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserInfo {
    name: string;
    picture: string;
    connectedAt: string;
}

interface PageInfo {
    pageId: string;
    name: string;
    category: string;
    fetchedAt: string;
}

export default function LoginPage() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [disconnectingPageId, setDisconnectingPageId] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    async function loadStatus() {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();
            if (res.ok) {
                setUser(data.user);
                setPages(data.pages || []);
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }

    const handleDisconnect = async () => {
        try {
            const res = await fetch('/api/meta/disconnect', { method: 'POST' });
            if (res.ok) {
                setUser(null);
                setPages([]);
            }
        } catch (err) {
            console.error('Failed to disconnect:', err);
        }
    };

    const handleDisconnectPage = async (pageId: string) => {
        try {
            setDisconnectingPageId(pageId);
            const res = await fetch(`/api/meta/pages/${pageId}/disconnect`, { method: 'POST' });
            if (res.ok) {
                setPages((prev) => prev.filter((p) => p.pageId !== pageId));
            }
        } catch (err) {
            console.error('Failed to disconnect page:', err);
        } finally {
            setDisconnectingPageId(null);
        }
    };

    const appId = process.env.NEXT_PUBLIC_META_APP_ID || 'YOUR_APP_ID';
    const redirectBase = process.env.NEXT_PUBLIC_META_REDIRECT_URI;
    const getRedirectUri = () => {
        if (redirectBase) return redirectBase;
        if (typeof window !== 'undefined') {
            const origin = window.location.origin;
            // Use HTTP for localhost to avoid SSL errors
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return origin.replace('https://', 'http://') + '/api/meta/oauth/callback';
            }
            return origin + '/api/meta/oauth/callback';
        }
        return 'http://localhost:3000/api/meta/oauth/callback';
    };
    const redirectUri = encodeURIComponent(getRedirectUri());
    const scope = encodeURIComponent('pages_show_list,pages_messaging,business_management,pages_manage_metadata');
    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${Date.now()}`;

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Facebook Integration" />

            <ComponentCard title="Meta Pages Command Center" desc="Kết nối tài khoản Facebook và xem các Page đã liên kết.">
                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        <div className="h-20 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                        <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                    </div>
                )}

                {/* Connected user */}
                {!loading && user && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/5">
                        {user.picture && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.picture} alt={user.name} className="size-12 rounded-full" />
                        )}
                        <div>
                            <div className="font-semibold text-gray-800 dark:text-white/90">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Connected {user.connectedAt ? new Date(user.connectedAt).toLocaleString() : ''}
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Button variant="outline" onClick={handleDisconnect}>
                                Ngắt kết nối
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pages list */}
                {!loading && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Connected Pages ({pages.length})</h3>
                            <div className="flex items-center gap-2">
                                <Button asChild variant="outline">
                                    <a href={oauthUrl}>Reconnect</a>
                                </Button>
                                <Button variant="destructive" onClick={handleDisconnect}>
                                    Logout Meta
                                </Button>
                                <Button asChild>
                                    <Link href="/facebook-integration/messages">Go to Messages</Link>
                                </Button>
                            </div>
                        </div>

                        {pages.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {pages.map((p) => (
                                    <div key={p.pageId} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
                                        <div className="font-medium text-gray-800 dark:text-white/90">{p.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.category} • ID: {p.pageId}</div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDisconnectPage(p.pageId)}
                                                disabled={disconnectingPageId === p.pageId}
                                            >
                                                {disconnectingPageId === p.pageId ? 'Đang ngắt...' : 'Ngắt kết nối trang'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có Page nào được kết nối.</p>
                        )}
                    </div>
                )}

                {/* Login CTA when not connected */}
                {!loading && !user && pages.length === 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Đăng nhập bằng tài khoản Facebook để quản lý Pages.</p>
                        <Button asChild>
                            <a href={oauthUrl}>🔐 Login with Facebook</a>
                        </Button>
                    </div>
                )}
            </ComponentCard>
        </div>
    );
}
