'use client';

import { useState, useEffect } from 'react';
import { getPendingOfflineCount, syncOfflineQueue } from '../utils/offlineSync';

export default function PwaInstallerAndOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        // Catch PWA Install Prompt
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPwaPrompt = e;
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        (window as any).installPwaApp = () => {
            const prompt = (window as any).deferredPwaPrompt;
            if (prompt) {
                prompt.prompt();
                prompt.userChoice.then((choiceResult: any) => {
                    if (choiceResult.outcome === 'accepted') {
                        setIsInstalled(true);
                    }
                    (window as any).deferredPwaPrompt = null;
                    setDeferredPrompt(null);
                });
            } else {
                alert('📲 App Installation:\n\nTo install this app on your device:\n• Chrome/Edge: Click the install icon in your address bar.\n• Android Chrome: Tap Menu (⋮) ➔ Add to Home Screen.\n• iPhone Safari: Tap Share (⎋) ➔ Add to Home Screen.');
            }
        };

        const checkPending = async () => {
            const count = await getPendingOfflineCount();
            setPendingCount(count);
        };
        checkPending();

        const handleOnline = async () => {
            setIsOnline(true);
            setSyncing(true);
            setSyncMsg('⚡ Internet reconnected! Auto-syncing offline data to cloud...');
            const result = await syncOfflineQueue((msg) => setSyncMsg(msg));
            setSyncing(false);
            if (result.synced > 0) {
                setSyncMsg(`✅ Successfully synced ${result.synced} offline items to Cloud Database!`);
                setTimeout(() => setSyncMsg(''), 4000);
            } else {
                setSyncMsg('');
            }
            checkPending();
        };

        const handleOffline = () => {
            setIsOnline(false);
            checkPending();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(checkPending, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleInstallPwa = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    setIsInstalled(true);
                }
                setDeferredPrompt(null);
            });
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {/* Offline / Online Sync Status Indicator */}
            {(!isOnline || pendingCount > 0 || syncing || syncMsg) && (
                <div style={{
                    background: !isOnline ? '#ef4444' : syncing ? '#f59e0b' : '#10b981',
                    color: '#ffffff', fontSize: 12, fontWeight: 700,
                    padding: '8px 14px', borderRadius: 20,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {!isOnline ? (
                        <>⚡ OFFLINE MODE (Data saved locally {pendingCount > 0 ? `• ${pendingCount} queued` : ''})</>
                    ) : syncing ? (
                        <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {syncMsg || 'Syncing to Cloud...'}</>
                    ) : (
                        <>{syncMsg || `🟢 Cloud Synced (${pendingCount} pending)`}</>
                    )}
                </div>
            )}
        </div>
    );
}
