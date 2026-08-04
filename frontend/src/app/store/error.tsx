'use client';

import { useEffect } from 'react';

export default function StoreError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Store Module Error:', error);
    }, [error]);

    return (
        <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong in Store Module</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                {error?.message || 'An unexpected error occurred while loading workshop data.'}
            </p>
            <button onClick={() => reset()} className="btn btn-primary">
                🔄 Try Again
            </button>
        </div>
    );
}
