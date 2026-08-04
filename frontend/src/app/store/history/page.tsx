'use client';

import { Suspense } from 'react';
import StoreModuleContent from '../../../components/StoreModuleContent';

export default function StoreHistoryPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <StoreModuleContent initialTab="history" />
        </Suspense>
    );
}
