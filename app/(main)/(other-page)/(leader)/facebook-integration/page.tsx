"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/messages');
    }, [router]);

    return (
        <div style={{ padding: 24, textAlign: 'center' }}>
            <p>Redirecting to messages...</p>
        </div>
    );
}
