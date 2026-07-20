'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState<any>(null);
    const [yearlyReport, setYearlyReport] = useState<any>(null);
    const [pending, setPending] = useState<any>(null);
    const [storageStats, setStorageStats] = useState<any>(null);
    const [fetching, setFetching] = useState(false);
    const [purging, setPurging] = useState(false);
    const [purgeYear, setPurgeYear] = useState(new Date().getFullYear() - 1);
    const [purgeLogsOnly, setPurgeLogsOnly] = useState(true);
    const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'pending' | 'storage'>('monthly');
    const [toast, setToast] = useState('');

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const fetchMonthly = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/reports/monthly?year=${year}&month=${month}`);
            setReport(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    const fetchYearly = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/reports/yearly?year=${year}`);
            setYearlyReport(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    const fetchPending = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/reports/pending');
            setPending(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    const fetchStorageStats = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/reports/storage-stats');
            setStorageStats(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    useEffect(() => {
        if (user) {
            if (activeTab === 'monthly') fetchMonthly();
            else if (activeTab === 'yearly') fetchYearly();
            else if (activeTab === 'pending') fetchPending();
            else if (activeTab === 'storage') fetchStorageStats();
        }
    }, [user, activeTab, month, year]);

    const downloadReport = (format: 'excel' | 'csv' | 'pdf') => {
        const base = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? 'https://bss-ssiti-erp-and-fee-system.onrender.com/api'
            : (process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api');
        const token = localStorage.getItem('accessToken');
        let endpoint = `${base}/reports/${activeTab}?format=${format}`;
        if (activeTab === 'monthly') endpoint = `${base}/reports/monthly?year=${year}&month=${month}&format=${format}`;
        if (activeTab === 'yearly') endpoint = `${base}/reports/yearly?year=${year}&format=${format}`;

        window.open(`${endpoint}&token=${token}`, '_blank');
    };

    const handlePurgeData = async () => {
        if (!confirm(`⚠️ Are you sure you want to clear historical data older than or in year ${purgeYear}?\n\nMake sure you have exported your Excel / PDF backups first!`)) {
            return;
        }
        setPurging(true);
        try {
            const { data } = await api.post('/reports/purge-old-data', {
                year: purgeYear,
                purgeAuditLogs: true,
                purgeOldPayments: !purgeLogsOnly,
            });
            showToast(`✅ ${data.message}`);
            fetchStorageStats();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Purge failed'}`);
        } finally {
            setPurging(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">📈 Reports & Storage Management</div>
                        <div className="header-subtitle">Export collection reports and manage free database storage</div>
                    </div>
                    {activeTab !== 'storage' && (
                        <div className="header-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('excel')}>📥 Excel</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('csv')}>📄 CSV</button>
                            <button className="btn btn-primary btn-sm" onClick={() => downloadReport('pdf')}>📕 PDF Report</button>
                        </div>
                    )}
                </header>

                <div className="page-content">
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {(['monthly', 'yearly', 'pending', ...(user.role === 'DEVELOPER' ? ['storage'] : [])] as const).map((tab) => (
                            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(tab as any)}>
                                {tab === 'monthly' && '📅 Monthly Collection'}
                                {tab === 'yearly' && '📊 Annual / Yearly Collection'}
                                {tab === 'pending' && '⏳ Outstanding Fees'}
                                {tab === 'storage' && '⚡ Storage & Free Quota Clear (Dev)'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'monthly' && (
                        <>
                            {/* Filters */}
                            <div className="card mb-4">
                                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
                                        <label className="form-label">Month</label>
                                        <select className="form-control" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 100 }}>
                                        <label className="form-label">Year</label>
                                        <select className="form-control" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={fetchMonthly} style={{ whiteSpace: 'nowrap', height: 42 }}>🔍 Generate Report</button>
                                </div>
                            </div>

                            {/* Summary */}
                            {report && (
                                <div className="grid grid-3 mb-4">
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#dbeafe' }}>💰</div>
                                        <div><div className="stat-label">Total Monthly Collection</div><div className="stat-value">{formatRupees(report.summary?.totalCollected || 0)}</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#d1fae5' }}>🧾</div>
                                        <div><div className="stat-label">Total Payment Transactions</div><div className="stat-value">{report.summary?.total || 0}</div></div>
                                    </div>
                                </div>
                            )}

                            <div className="card">
                                <div className="table-wrap" style={{ border: 'none' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th>Date</th><th>Student</th><th>Student ID</th><th>Class</th>
                                            <th>Amount</th><th>Mode</th><th>Transaction Ref</th><th>Recorded By</th>
                                        </tr></thead>
                                        <tbody>
                                            {fetching ? (
                                                <tr><td colSpan={8} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                            ) : (report?.payments || []).length === 0 ? (
                                                <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No payments found for this period</td></tr>
                                            ) : (report?.payments || []).map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td><b>{p.studentFee?.student?.name}</b></td>
                                                    <td>{p.studentFee?.student?.studentId}</td>
                                                    <td>{p.studentFee?.student?.class}</td>
                                                    <td><b>{formatRupees(p.amount)}</b></td>
                                                    <td><span className="badge badge-info">{p.mode}</span></td>
                                                    <td>{p.transactionRef || '—'}</td>
                                                    <td>{p.recordedBy?.name || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'yearly' && (
                        <>
                            {/* Filters */}
                            <div className="card mb-4">
                                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Academic / Financial Year</label>
                                        <select className="form-control" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={fetchYearly}>🔍 Generate Annual Report</button>
                                </div>
                            </div>

                            {/* Summary */}
                            {yearlyReport && (
                                <div className="grid grid-3 mb-4">
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#dbeafe' }}>🏛️</div>
                                        <div><div className="stat-label">Total Annual Collection</div><div className="stat-value">{formatRupees(yearlyReport.summary?.totalCollected || 0)}</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#d1fae5' }}>📄</div>
                                        <div><div className="stat-label">Total Transactions ({year})</div><div className="stat-value">{yearlyReport.summary?.total || 0}</div></div>
                                    </div>
                                </div>
                            )}

                            <div className="card">
                                <div className="table-wrap" style={{ border: 'none' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th>Date</th><th>Student</th><th>Student ID</th><th>Class</th>
                                            <th>Amount</th><th>Mode</th><th>Transaction Ref</th><th>Recorded By</th>
                                        </tr></thead>
                                        <tbody>
                                            {fetching ? (
                                                <tr><td colSpan={8} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                            ) : (yearlyReport?.payments || []).length === 0 ? (
                                                <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No payments found for year {year}</td></tr>
                                            ) : (yearlyReport?.payments || []).map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td><b>{p.studentFee?.student?.name}</b></td>
                                                    <td>{p.studentFee?.student?.studentId}</td>
                                                    <td>{p.studentFee?.student?.class}</td>
                                                    <td><b>{formatRupees(p.amount)}</b></td>
                                                    <td><span className="badge badge-info">{p.mode}</span></td>
                                                    <td>{p.transactionRef || '—'}</td>
                                                    <td>{p.recordedBy?.name || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'pending' && (
                        <>
                            {pending && (
                                <div className="grid grid-3 mb-4">
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#fef3c7' }}>⏳</div>
                                        <div><div className="stat-label">Pending Students</div><div className="stat-value">{pending.summary?.count || 0}</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#fee2e2' }}>💸</div>
                                        <div><div className="stat-label">Total Outstanding</div><div className="stat-value">{formatRupees(pending.summary?.totalPending || 0)}</div></div>
                                    </div>
                                </div>
                            )}

                            <div className="card">
                                <div className="table-wrap" style={{ border: 'none' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th>Student ID</th><th>Name</th><th>Class</th><th>Fee Structure</th>
                                            <th>Total</th><th>Paid</th><th>Pending</th><th>Due Date</th><th>Parent Phone</th>
                                        </tr></thead>
                                        <tbody>
                                            {fetching ? (
                                                <tr><td colSpan={9} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                            ) : (pending?.studentFees || []).length === 0 ? (
                                                <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>🎉 No outstanding fees!</td></tr>
                                            ) : (pending?.studentFees || []).map((sf: any) => {
                                                const pendingAmt = sf.totalAmount - sf.paidAmount;
                                                return (
                                                    <tr key={sf.id}>
                                                        <td><span className="badge badge-primary">{sf.student?.studentId}</span></td>
                                                        <td><b>{sf.student?.name}</b></td>
                                                        <td>{sf.student?.class}</td>
                                                        <td>{sf.feeStructure?.name}</td>
                                                        <td>{formatRupees(sf.totalAmount)}</td>
                                                        <td className="text-success">{formatRupees(sf.paidAmount)}</td>
                                                        <td><b className="text-danger">{formatRupees(pendingAmt)}</b></td>
                                                        <td>{sf.dueDate ? new Date(sf.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                                                        <td>{sf.student?.parent?.phone || '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'storage' && (
                        <div>
                            <div className="card mb-4">
                                <div className="card-header"><div className="card-title">⚡ Database & Disk Storage Monitoring</div></div>
                                <div className="card-body">
                                    {fetching ? (
                                        <div className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                                    ) : storageStats ? (
                                        <div>
                                            <div style={{ marginBottom: 20 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                                                    <span><b>Storage Quota Usage:</b> {storageStats.dbUsedMb + storageStats.fileUsedMb} MB / {storageStats.dbLimitMb + storageStats.fileLimitMb} MB</span>
                                                    <b>{storageStats.totalUsedPercent}%</b>
                                                </div>
                                                <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${Math.max(5, storageStats.totalUsedPercent)}%`, background: storageStats.totalUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)', transition: 'width 0.3s' }} />
                                                </div>
                                            </div>

                                            <div className="grid grid-4 mb-4" style={{ gap: 16 }}>
                                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DATABASE ROWS</div>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{storageStats.counts.students + storageStats.counts.payments + storageStats.counts.receipts + storageStats.counts.auditLogs}</div>
                                                    <small className="text-muted">Est. {storageStats.dbUsedMb} MB / 500 MB</small>
                                                </div>
                                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PAYMENT RECORDS</div>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{storageStats.counts.payments}</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GENERATED RECEIPT PDFS</div>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{storageStats.counts.pdfFiles}</div>
                                                    <small className="text-muted">{storageStats.fileUsedMb} MB disk</small>
                                                </div>
                                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SYSTEM AUDIT LOGS</div>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{storageStats.counts.auditLogs}</div>
                                                </div>
                                            </div>
                                            {storageStats.totalUsedPercent >= 75 && (
                                                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 24 }}>⚠️</span>
                                                    <div>
                                                        <b>Timely Storage Warning:</b> Database and file storage usage has exceeded {storageStats.totalUsedPercent}%. Please contact system Developer/Architect to purge old historical logs to prevent service interruption.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Purge & Clear Storage Utility (DEVELOPER ONLY) */}
                            {user.role === 'DEVELOPER' ? (
                                <div className="card">
                                    <div className="card-header"><div className="card-title">🧹 Clear Historical Data for Infinite Free Storage (Developer Tool)</div></div>
                                    <div className="card-body">
                                        <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
                                            Export your monthly/yearly Excel & PDF backups first. Then use this tool to clear old audit logs and transaction history to free up database rows and disk space permanently.
                                        </p>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Purge Data For Year</label>
                                                <select className="form-control" value={purgeYear} onChange={(e) => setPurgeYear(parseInt(e.target.value))}>
                                                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>Year {y} & Earlier</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Purge Scope</label>
                                                <select className="form-control" value={purgeLogsOnly ? 'logs' : 'all'} onChange={(e) => setPurgeLogsOnly(e.target.value === 'logs')}>
                                                    <option value="logs">Clear System Audit Logs Only (Safe)</option>
                                                    <option value="all">Clear Audit Logs + Old Receipts & Payments</option>
                                                </select>
                                            </div>
                                            <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handlePurgeData} disabled={purging}>
                                                {purging ? 'Purging Storage...' : '🧹 Purge Storage & Clear Space'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card card-body text-center text-muted" style={{ padding: 20 }}>
                                    🔒 Storage clearing and cache purging tools are managed exclusively by the System Developer / Architect.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <footer className="footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>&copy; 2026 Shri Sai I.T.I All rights reserved.</span>
                        <Link href="/terms" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 500, fontSize: '13px' }}>
                            Terms and Conditions
                        </Link>
                    </div>
                    <div>Developed by Rushikesh Pattiwar</div>
                </footer>
            </div>

            {/* Toast */}
            {toast && (
                <div className="toast-wrap">
                    <div className={`toast ${toast.startsWith('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div>
                </div>
            )}
        </div>
    );
}
