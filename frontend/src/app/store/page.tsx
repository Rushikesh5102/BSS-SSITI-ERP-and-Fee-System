'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';
import WelcomeOverlay from '../../components/WelcomeOverlay';
import Footer from '../../components/Footer';

interface StoreDashboardStats {
    totalItems: number;
    availableCount: number;
    issuedCount: number;
    issuedQuantity: number;
    overdueCount: number;
    damagedCount: number;
    maintenanceCount: number;
    lowStockCount: number;
}

const CATEGORIES = [
    'Electrical Tools',
    'Fitter & Machining',
    'Welding Equipment',
    'Electronics & IT',
    'Automotive & Mechanic',
    'Measurement & Calibration',
    'Safety & Protective Gear',
    'General Tools & Consumables'
];

function StoreDashboardContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');

    const [stats, setStats] = useState<StoreDashboardStats | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [recentTx, setRecentTx] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        let isMounted = true;
        setFetching(true);

        Promise.all([
            api.get('/store/dashboard-stats'),
            api.get('/store/items'),
            api.get('/store/transactions?limit=10')
        ]).then(([statsRes, itemsRes, txRes]) => {
            if (isMounted) {
                setStats(statsRes.data?.data || null);
                setItems(itemsRes.data?.data || []);
                setRecentTx(txRes.data?.data || []);
            }
        }).catch(() => {
            // Silently fallback if needed
        }).finally(() => {
            if (isMounted) setFetching(false);
        });

        return () => { isMounted = false; };
    }, [user, loading, router]);

    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    return (
        <div className="layout">
            {showWelcome && <WelcomeOverlay role={user.role} />}
            <Sidebar />

            <div className="main-content" style={{ paddingBottom: '40px', overflowX: 'hidden' }}>
                {/* Standard Page Header */}
                <div className="page-header" style={{
                    background: 'var(--surface-card)',
                    borderBottom: '1px solid var(--border)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Shri Sai I.T.I Workshop & Store
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            📊 Store & Workshop Inventory Dashboard
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => router.push(simulateParam ? `/store/items?simulate=${simulateParam}` : '/store/items')} className="btn btn-primary" style={{ fontSize: 13 }}>
                            ➕ Add Workshop Asset
                        </button>
                        <button onClick={() => router.push(simulateParam ? `/store/issue?simulate=${simulateParam}` : '/store/issue')} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            🛠️ Tool Issue & Movement
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Low stock alert banner */}
                    {lowStockItems.length > 0 && (
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#d97706', fontSize: 14 }}>
                                        Low Stock & Reorder Alert ({lowStockItems.length} Asset Types At/Below Minimum Threshold)
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        Consumables & tools requiring replenishment: <b>{lowStockItems.map(i => `${i.name} (${i.quantity} left)`).join(', ')}</b>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => router.push(simulateParam ? `/store/items?simulate=${simulateParam}` : '/store/items')} className="btn" style={{ background: '#f59e0b', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                                View Low Stock Assets →
                            </button>
                        </div>
                    )}

                    {/* Summary Stat Cards Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12
                    }}>
                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                📋
                            </div>
                            <div>
                                <div className="stat-label">Total Asset Types</div>
                                <div className="stat-value">{stats?.totalItems || items.length}</div>
                                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>active inventory</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                📤
                            </div>
                            <div>
                                <div className="stat-label">Issued Tools</div>
                                <div className="stat-value" style={{ color: '#0284c7' }}>{stats?.issuedCount || 0}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>with trainees/staff</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                🚨
                            </div>
                            <div>
                                <div className="stat-label">Overdue Returns</div>
                                <div className="stat-value" style={{ color: '#ef4444' }}>{stats?.overdueCount || 0}</div>
                                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>require return</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                ⚠️
                            </div>
                            <div>
                                <div className="stat-label">Low Stock Alerts</div>
                                <div className="stat-value" style={{ color: '#f59e0b' }}>{lowStockItems.length}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>reorder level hit</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                🔧
                            </div>
                            <div>
                                <div className="stat-label">Damaged / Maint.</div>
                                <div className="stat-value" style={{ color: '#a855f7' }}>{(stats?.damagedCount || 0) + (stats?.maintenanceCount || 0)}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>out for repair</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Shortcuts Bar */}
                    <div className="card" style={{ padding: 18 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
                            ⚡ Quick Store Actions
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            <button
                                onClick={() => router.push(simulateParam ? `/store/items?action=add&simulate=${simulateParam}` : '/store/items?action=add')}
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                            >
                                <span style={{ fontSize: 22 }}>➕</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>Add Workshop Asset</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>New tools & consumables</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(simulateParam ? `/store/issue?simulate=${simulateParam}` : '/store/issue')}
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                            >
                                <span style={{ fontSize: 22 }}>📤</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>Tool Issue & Return</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Issue/Return workshop items</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(simulateParam ? `/store/items?simulate=${simulateParam}` : '/store/items')}
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                            >
                                <span style={{ fontSize: 22 }}>📋</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>Asset Register</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Browse & edit inventory</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(simulateParam ? `/store/history?simulate=${simulateParam}` : '/store/history')}
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                            >
                                <span style={{ fontSize: 22 }}>📜</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>Movement Log</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Audit history transactions</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push(simulateParam ? `/store/reports?simulate=${simulateParam}` : '/store/reports')}
                                className="btn btn-secondary"
                                style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                            >
                                <span style={{ fontSize: 22 }}>📄</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>Reports & Export</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Print PDF / Excel CSV</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        {/* Workshop Category Breakdown */}
                        <div className="card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                                🛠️ Category Stock Distribution
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {CATEGORIES.map(cat => {
                                    const catItems = items.filter(i => i.category === cat);
                                    const totalQty = catItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
                                    const count = catItems.length;

                                    return (
                                        <div key={cat} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                <span>{cat}</span>
                                                <span>{count} assets ({totalQty} units)</span>
                                            </div>
                                            <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, count * 15)}%`, height: '100%', background: '#c084fc', borderRadius: 4 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Transactions Feed */}
                        <div className="card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
                                ⚡ Recent Stock Transactions
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {recentTx.length === 0 ? (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent stock transactions logged.</div>
                                ) : (
                                    recentTx.slice(0, 7).map((t: any) => (
                                        <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                                            <span style={{
                                                fontSize: 12,
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                fontWeight: 800,
                                                background: t.type === 'ISSUE' ? '#dbeafe' : (t.type === 'RETURN' ? '#d1fae5' : '#fee2e2'),
                                                color: t.type === 'ISSUE' ? '#1e40af' : (t.type === 'RETURN' ? '#065f46' : '#991b1b')
                                            }}>
                                                {t.type}
                                            </span>
                                            <div style={{ flex: 1, fontSize: 13 }}>
                                                <div style={{ fontWeight: 700 }}>{t.item?.name || 'Store Asset'} (Qty: {t.quantity})</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.remarks || t.recipientName || 'Stock movement'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                    {new Date(t.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}

export default function StoreDashboardPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <StoreDashboardContent />
        </Suspense>
    );
}
