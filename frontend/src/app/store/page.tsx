'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function StoreRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');

    useEffect(() => {
        router.replace(simulateParam ? `/store/items?simulate=${simulateParam}` : '/store/items');
    }, [router, simulateParam]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
        </div>
    );
}

export default function StoreLandingPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <StoreRedirectContent />
        </Suspense>
    );
}
