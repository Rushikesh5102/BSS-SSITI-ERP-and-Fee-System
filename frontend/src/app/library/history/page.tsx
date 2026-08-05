'use client';

import { Suspense } from 'react';
import LibraryModuleContent from '../../../components/LibraryModuleContent';

export default function BookHistoryPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <LibraryModuleContent activeTab="history" />
        </Suspense>
    );
}
