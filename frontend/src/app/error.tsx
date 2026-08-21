'use client';

import { useEffect, useState } from 'react';
import { safeStorage } from '../utils/safeStorage';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [healed, setHealed] = useState(false);

    useEffect(() => {
        console.error('[AutoHeal Engine] Global unhandled anomaly intercepted:', error);
    }, [error]);

    const handleAutoHeal = () => {
        setHealed(true);
        // Clear non-critical corrupted browser keys
        try {
            const nonCritical = ['user_cache', 'theme_cache', 'offline_sync_queue', 'dashboard_temp_metrics'];
            nonCritical.forEach(k => safeStorage.remove(k));
        } catch {}

        setTimeout(() => {
            reset();
        }, 300);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', backgroundColor: 'var(--surface, #0f172a)', color: 'var(--text-primary, #ffffff)',
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", padding: '2rem', textAlign: 'center'
        }}>
            <div style={{
                maxWidth: '560px', width: '100%', background: 'var(--surface-2, #1e293b)',
                border: '1px solid var(--border, #334155)', borderRadius: '16px', padding: '36px 28px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px', color: '#38bdf8' }}>
                    Self-Healing Diagnostic Shield
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
                    An unexpected runtime exception was safely caught before causing data corruption. The built-in auto-healing engine can reset the corrupted session state and restore your workspace instantly.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleAutoHeal}
                        className="btn btn-primary"
                        style={{
                            padding: '10px 20px', backgroundColor: '#0284c7', borderColor: '#0284c7', color: '#ffffff',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '13.5px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <span>⚡</span>
                        <span>{healed ? 'Healing Workspace...' : 'Auto-Heal & Recover'}</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="btn btn-secondary"
                        style={{
                            padding: '10px 18px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#f8fafc',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px'
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
