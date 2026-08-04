'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StoreModuleContent from '../../components/StoreModuleContent';

function StorePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');
    const simulate = searchParams.get('simulate');

    useEffect(() => {
        if (!tab) {
            let url = '/store/items';
            if (simulate) url += `?simulate=${simulate}`;
            router.replace(url);
        }
    }, [tab, simulate, router]);

    return <StoreModuleContent />;
}

export default function StoreModulePage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <StorePageContent />
        </Suspense>
    );
}
