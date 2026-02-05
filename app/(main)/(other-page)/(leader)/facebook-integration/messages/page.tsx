'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoadState = 'loading' | 'empty' | 'error';

export default function MessagesPage() {
    const router = useRouter();
    const [state, setState] = useState<LoadState>('loading');
    const [error, setError] = useState<string | null>(null);

    const fetchAndRedirect = async () => {
        setState('loading');
        setError(null);
        try {
            const res = await fetch('/api/messages?limit=1');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'Không thể tải cuộc hội thoại');
            }

            const first = data.conversations?.[0];
            if (first?.conversationId) {
                router.push(`/facebook-integration/messages/${first.conversationId}`);
                return;
            }

            setState('empty');
        } catch (err) {
            console.error('Failed to load first conversation:', err);
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            setState('error');
        }
    };

    useEffect(() => {
        fetchAndRedirect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex min-h-[calc(90vh-90px)] items-center justify-center bg-white px-6 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                {state === 'loading' && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Đang tải" />
                        <p className="text-gray-700 dark:text-gray-200">Đang tải cuộc hội thoại đầu tiên...</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vui lòng chờ trong giây lát</p>
                    </div>
                )}

                {state === 'empty' && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="font-medium text-gray-800 dark:text-gray-100">Chưa có cuộc hội thoại</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hãy tạo hoặc chờ tin nhắn mới từ khách hàng.</p>
                        <button
                            onClick={fetchAndRedirect}
                            className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {state === 'error' && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="font-medium text-red-600 dark:text-red-400">Không thể tải cuộc hội thoại</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}</p>
                        <button
                            onClick={fetchAndRedirect}
                            className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                            Thử lại
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
