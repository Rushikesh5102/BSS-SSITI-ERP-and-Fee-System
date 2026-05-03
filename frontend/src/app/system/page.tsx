'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SystemHealthPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [health, setHealth] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        if (showWelcome) {
            const timer = setTimeout(() => setShowWelcome(false), 3500);
            return () => clearTimeout(timer);
        }
    }, [showWelcome]);

    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            else if (user.role !== 'DEVELOPER') router.push('/dashboard');
        }
    }, [user, loading, router]);

    const fetchHealth = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/health/system');
            setHealth(data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'DEVELOPER') {
            fetchHealth();
            const interval = setInterval(fetchHealth, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading || !user || user.role !== 'DEVELOPER') return null;

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    return (
        <div className="layout">
            {/* Developer Welcome Animation Overlay */}
            {showWelcome && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#020617', zIndex: 99999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', color: '#38bdf8',
                    animation: 'fadeOut 0.5s ease 3s forwards'
                }}>
                    <div style={{ animation: 'glitch 1s infinite alternate', fontSize: '3rem', fontWeight: 900, letterSpacing: '8px', textShadow: '0 0 20px #38bdf8' }}>
                        SYS_ADMIN_ROOT
                    </div>
                    <div style={{ marginTop: 20, color: '#94a3b8', fontSize: '1.2rem', overflow: 'hidden', whiteSpace: 'nowrap', borderRight: '2px solid #38bdf8', animation: 'typing 1.5s steps(30, end), blink-caret .75s step-end infinite' }}>
                        Welcome back, Architect. Initializing diagnostic protocols...
                    </div>
                    <div style={{ marginTop: 40, width: '300px', height: '2px', background: '#1e293b', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: '#38bdf8', animation: 'loadingBar 2s ease-in-out forwards', boxShadow: '0 0 15px #38bdf8' }}></div>
                    </div>
                </div>
            )}

            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">💻 Developer Console</div>
                        <div className="header-subtitle">Real-time System Vitals & Edge Diagnostics</div>
                    </div>
                </header>

                <div className="page-content">
                    {fetching && !health ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto', borderColor: 'var(--text-primary)' }} />
                            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Connecting to diagnostics telemetry...</p>
                        </div>
                    ) : health ? (
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
                            {/* Hero Status */}
                            <div className="card" style={{ gridColumn: 'span 12', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 8 }}>Primary Engine Status</div>
                                        <div style={{ fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)' }}>
                                            <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)' }}></span>
                                            {health.status}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Database Integrity</div>
                                        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>{health.databaseStatus}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Vitals Grid */}
                            {[
                                { label: 'Server Uptime', value: formatUptime(health.uptime), icon: '⏱️' },
                                { label: 'Active TCP Connections', value: health.activeConnections, icon: '🔌' },
                                { label: 'Available Memory', value: formatBytes(health.freeMem), icon: '💾' },
                                { label: 'Heap Used (Node)', value: formatBytes(health.memoryUsage.heapUsed), icon: '🧠' },
                            ].map((stat, i) => (
                                <div key={i} className="card" style={{ gridColumn: 'span 3' }}>
                                    <div className="card-body" style={{ padding: '24px' }}>
                                        <div style={{ fontSize: 24, marginBottom: 12 }}>{stat.icon}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{stat.label}</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                    </div>
                                </div>
                            ))}

                            {/* Error Logs */}
                            <div className="card" style={{ gridColumn: 'span 12' }}>
                                <div className="card-header">
                                    <div className="card-title">🚨 Application Alerts & Stream Logs</div>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    <table className="table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Timestamp</th>
                                                <th>Severity</th>
                                                <th>Event Detail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {health.latestErrors.length === 0 ? (
                                                <tr><td colSpan={3} className="text-center text-muted" style={{ padding: 30 }}>No major alerts logged in the last 24 hours.</td></tr>
                                            ) : (
                                                health.latestErrors.map((err: any) => (
                                                    <tr key={err.id}>
                                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(err.time).toLocaleTimeString()}</td>
                                                        <td>
                                                            <span className={err.type === 'WARNING' ? 'badge badge-warning' : 'badge badge-primary'}>
                                                                {err.type}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 500 }}>{err.message}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'red', padding: 20 }}>Failed to load system diagnostics.</div>
                    )}
                </div>                <footer className="footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>&copy; 2026 Shri Sai I.T.I All rights reserved.</span>
                        <Link href="/terms" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 500, fontSize: '13px' }}>
                            Terms and Conditions
                        </Link>
                    </div>
                    <div>Developed by Rushikesh Pattiwar</div>
                </footer>
            </div>
        </div>
    );
}
