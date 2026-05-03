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
    const [pending, setPending] = useState<any>(null);
    const [fetching, setFetching] = useState(false);
    const [activeTab, setActiveTab] = useState<'monthly' | 'pending'>('monthly');

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchMonthly = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/reports/monthly?year=${year}&month=${month}`);
            setReport(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    const fetchPending = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/reports/pending');
            setPending(data.data);
        } catch { /* */ } finally { setFetching(false); }
    };

    useEffect(() => { if (user) { if (activeTab === 'monthly') fetchMonthly(); else fetchPending(); } }, [user, activeTab, month, year]);

    const downloadReport = (format: 'excel' | 'csv') => {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const token = localStorage.getItem('accessToken');
        const url = activeTab === 'monthly'
            ? `${base}/reports/monthly?year=${year}&month=${month}&format=${format}`
            : `${base}/reports/pending?format=${format}`;
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('Authorization', `Bearer ${token}`);
        a.download = `report.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        // Open in new tab for authenticated download
        window.open(`${url}&token=${token}`, '_blank');
    };

    if (loading || !user) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">📈 Reports</div>
                        <div className="header-subtitle">Export collection and outstanding fee reports</div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('excel')}>📥 Excel</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('csv')}>📄 CSV</button>
                    </div>
                </header>

                <div className="page-content">
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {(['monthly', 'pending'] as const).map((tab) => (
                            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(tab)}>
                                {tab === 'monthly' ? '📅 Monthly Collection' : '⏳ Outstanding Fees'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'monthly' && (
                        <>
                            {/* Filters */}
                            <div className="card mb-4">
                                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Month</label>
                                        <select className="form-control" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Year</label>
                                        <select className="form-control" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={fetchMonthly}>🔍 Generate</button>
                                </div>
                            </div>

                            {/* Summary */}
                            {report && (
                                <div className="grid grid-3 mb-4">
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#dbeafe' }}>💰</div>
                                        <div><div className="stat-label">Total Collected</div><div className="stat-value">{formatRupees(report.summary?.totalCollected || 0)}</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#d1fae5' }}>🧾</div>
                                        <div><div className="stat-label">Total Payments</div><div className="stat-value">{report.summary?.total || 0}</div></div>
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
