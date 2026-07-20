'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

function SettingsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/access');
    }, [router]);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div className="page-content text-center text-muted" style={{ padding: 40 }}>
                    <span className="spinner" /> Redirecting to Access Control...
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="layout">
                <Sidebar />
                <div className="main-content">
                    <div className="page-content text-center text-muted" style={{ padding: 40 }}>
                        <span className="spinner" /> Loading...
                    </div>
                </div>
            </div>
        }>
            <SettingsRedirect />
        </Suspense>
    );
}
