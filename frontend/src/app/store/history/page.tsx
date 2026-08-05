'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import WelcomeOverlay from '../../../components/WelcomeOverlay';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

function MovementHistoryContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');

    const [showWelcome, setShowWelcome] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [storageStats, setStorageStats] = useState<any>(null);

    // Filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('');

    const fetchHistory = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/store/transactions');
            setHistoryLogs(data.data || []);
            api.get('/reports/storage-stats').then(({ data: st }) => setStorageStats(st.data)).catch(() => { });
        } catch (err) {
            console.error('Error fetching movement history:', err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchHistory();
    }, [user]);

    const filteredHistory = historyLogs.filter(log => {
        if (historyTypeFilter && log.type !== historyTypeFilter) return false;
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
            log.item?.name?.toLowerCase().includes(q) ||
            log.student?.name?.toLowerCase().includes(q) ||
            log.staffName?.toLowerCase().includes(q) ||
            log.remarks?.toLowerCase().includes(q) ||
            log.recordedBy?.name?.toLowerCase().includes(q)
        );
    });

    const downloadCSV = () => {
        const rows = [
            ['Date & Time', 'Action Type', 'Asset / Tool', 'Quantity', 'Recipient Person', 'Recorded By', 'Remarks'],
            ...filteredHistory.map(log => [
                new Date(log.createdAt).toLocaleString('en-IN'),
                log.type,
                log.item?.name || 'N/A',
                (log.quantity || 1).toString(),
                log.recipientType === 'STUDENT' ? log.student?.name || 'Student' : log.staffName ? log.staffName : 'N/A',
                log.recordedBy?.name || 'System',
                log.remarks || ''
            ])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => '"' + (cell || '').toString().split('"').join('""') + '"').join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Movement_History_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    const issuesCount = historyLogs.filter(l => l.type === 'ISSUE').length;
    const returnsCount = historyLogs.filter(l => l.type === 'RETURN').length;
    const maintenanceCount = historyLogs.filter(l => l.type === 'MAINTENANCE').length;
    const damageCount = historyLogs.filter(l => l.type === 'DAMAGE' || l.type === 'LOSS').length;

    return (
        <div className="layout">
            {showWelcome && <WelcomeOverlay role={user.role} />}
            <Sidebar />

            <div className="main-content" style={{ paddingBottom: '40px' }}>
                {/* Header */}
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
                            Workshop Audit Log & Tracking
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            🔄 Movement History Log
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={downloadCSV} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            📊 Export CSV Log
                        </button>
                        <button onClick={() => router.push('/store')} className="btn btn-primary" style={{ fontSize: 13 }}>
                            🛠️ Tool Issue & Movement →
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Storage Alert (90% Warning Threshold) */}
                    {storageStats && storageStats.totalUsedPercent >= 80 && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.18) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                                        CRITICAL STORAGE WARNING: System Storage Reached {storageStats.totalUsedPercent}% Capacity!
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        PostgreSQL & file storage usage has crossed 90% threshold ({storageStats.dbUsedMb} MB / {storageStats.dbLimitMb} MB limit). Contact Administrator to purge audit logs.
                                    </div>
                                </div>
                            </div>
                            <a href="/system" className="btn" style={{ background: 'var(--danger)', color: '#ffffff', fontSize: 12, padding: '6px 14px', border: 'none' }}>
                                ⚙️ Manage System Storage
                            </a>
                        </div>
                    )}

                    {/* Stat Overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                        <div className="stat-card" style={{ padding: '12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL LOGS</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{historyLogs.length}</div>
                        </div>
                        <div className="stat-card" style={{ padding: '12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>ISSUES</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>{issuesCount}</div>
                        </div>
                        <div className="stat-card" style={{ padding: '12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>RETURNS</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{returnsCount}</div>
                        </div>
                        <div className="stat-card" style={{ padding: '12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>REPAIRS</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>{maintenanceCount}</div>
                        </div>
                        <div className="stat-card" style={{ padding: '12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>DAMAGED / LOST</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{damageCount}</div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Search Movement Log</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="🔍 Search asset, student, staff, remarks..."
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Action Type Filter</label>
                                <select className="form-control" value={historyTypeFilter} onChange={e => setHistoryTypeFilter(e.target.value)}>
                                    <option value="">All Movement Types</option>
                                    <option value="ISSUE">📤 Tool Issue</option>
                                    <option value="RETURN">📥 Tool Return</option>
                                    <option value="TRANSFER">🔄 Location Transfer</option>
                                    <option value="MAINTENANCE">🔧 Maintenance</option>
                                    <option value="DAMAGE">⚠️ Damage / Loss</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    {fetching ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto', width: 36, height: 36 }} />
                            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading Movement History...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>🔄</div>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>No Movement Logs Found</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                                Adjust your search filter or issue tools to populate history.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap" style={{ border: 'none', background: 'var(--surface-card)', borderRadius: '12px', overflow: 'hidden' }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Date & Time</th>
                                        <th style={{ textAlign: 'left', padding: '14px' }}>Action</th>
                                        <th style={{ textAlign: 'left', padding: '14px' }}>Asset / Tool</th>
                                        <th style={{ textAlign: 'center', padding: '14px' }}>Qty</th>
                                        <th style={{ textAlign: 'left', padding: '14px' }}>Recipient / Person</th>
                                        <th style={{ textAlign: 'left', padding: '14px' }}>Recorded By</th>
                                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((log) => {
                                        let badgeBg = 'var(--surface-2)';
                                        let badgeColor = 'var(--text-primary)';

                                        if (log.type === 'ISSUE') { badgeBg = 'rgba(2, 132, 199, 0.15)'; badgeColor = '#0284c7'; }
                                        else if (log.type === 'RETURN') { badgeBg = 'rgba(16, 185, 129, 0.15)'; badgeColor = '#10b981'; }
                                        else if (log.type === 'MAINTENANCE') { badgeBg = 'rgba(139, 92, 246, 0.15)'; badgeColor = '#8b5cf6'; }
                                        else if (log.type === 'DAMAGE' || log.type === 'LOSS') { badgeBg = 'rgba(239, 68, 68, 0.15)'; badgeColor = '#ef4444'; }

                                        return (
                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '14px 16px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {new Date(log.createdAt).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '14px' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: badgeBg, color: badgeColor }}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px', fontWeight: 700 }}>{log.item?.name || 'Item'}</td>
                                                <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800 }}>{log.quantity || 1}</td>
                                                <td style={{ padding: '14px', fontSize: 12 }}>
                                                    {log.recipientType === 'STUDENT' ? `🎓 ${log.student?.name || 'Student'}` : log.staffName ? `👔 ${log.staffName}` : '-'}
                                                </td>
                                                <td style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {log.recordedBy?.name || 'System'}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: 12 }}>{log.remarks || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MovementHistoryPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <MovementHistoryContent />
        </Suspense>
    );
}
