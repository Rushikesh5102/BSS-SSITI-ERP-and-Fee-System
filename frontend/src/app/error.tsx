'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled UI Exception:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center'
        }}>
            <h2 style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '1rem' }}>Something went wrong!</h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: '500px' }}>
                We apologize for the inconvenience. Our technical team has been notified of this error.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white',
                        border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Try again
                </button>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    style={{
                        padding: '0.75rem 1.5rem', backgroundColor: '#e5e7eb', color: '#374151',
                        border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
