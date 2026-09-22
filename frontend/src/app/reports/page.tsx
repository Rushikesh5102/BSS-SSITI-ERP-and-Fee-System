'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
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
    const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'pending'>('monthly');
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
        }
    }, [user, activeTab, month, year]);

    const downloadReport = (format: 'excel' | 'csv' | 'pdf') => {
        if (format === 'pdf') {
            window.print();
            return;
        }

        const list = activeTab === 'monthly' ? (report?.payments || []) : (activeTab === 'yearly' ? (yearlyReport?.payments || []) : (pending?.students || []));

        if (format === 'excel') {
            const periodTitle = activeTab === 'monthly'
                ? `Monthly Fee Report - ${new Date(0, month - 1).toLocaleString('en-IN', { month: 'long' })} ${year}`
                : (activeTab === 'yearly' ? `Annual Fee Report - Year ${year}` : 'Outstanding Fees Report');

            const totalSum = list.reduce((s: number, p: any) => s + (p.amount || p.pendingAmount || 0), 0);

            const excelHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="utf-8"/><style>
                    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
                    .header { font-size: 16pt; font-weight: bold; color: #0284c7; }
                    .th { background: #0284c7; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #0369a1; font-size: 10pt; }
                    .td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 9.5pt; }
                    .amount { text-align: right; font-weight: bold; color: #0284c7; }
                    .total-row { background: #e0f2fe; font-weight: bold; border-top: 2px solid #0284c7; }
                </style></head>
                <body>
                    <table>
                        <tr><td colspan="7" class="header">BHARAT SHIKSHAN SANSTHA'S SHRI SAI PRIVATE ITI</td></tr>
                        <tr><td colspan="7"><b>Official Fee Management Report:</b> ${periodTitle} | <b>Generated:</b> ${new Date().toLocaleString('en-IN')}</td></tr>
                        <tr><td colspan="7"></td></tr>
                        <thead>
                            <tr>
                                <th class="th">Sr</th>
                                <th class="th">Date</th>
                                <th class="th">Student Name</th>
                                <th class="th">Student ID</th>
                                <th class="th">Class / Trade</th>
                                <th class="th">Payment Mode</th>
                                <th class="th" style="text-align: right;">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map((p: any, i: number) => `
                                <tr>
                                    <td class="td" style="text-align: center;">${i + 1}</td>
                                    <td class="td">${new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN')}</td>
                                    <td class="td"><b>${p.studentFee?.student?.name || p.name || '—'}</b></td>
                                    <td class="td">${p.studentFee?.student?.studentId || p.studentId || '—'}</td>
                                    <td class="td">${p.studentFee?.student?.class || p.class || '—'}</td>
                                    <td class="td">${p.mode || 'Direct'}</td>
                                    <td class="td amount">₹${((p.amount || p.pendingAmount || 0) / 100).toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="6" class="td" style="text-align: right; font-weight: bold;">TOTAL:</td>
                                <td class="td amount" style="font-size: 11pt;">₹${(totalSum / 100).toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
                </html>
            `;
            const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sai_ITI_Fee_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.xls`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }

        if (format === 'csv') {
            let csv = 'Sr No,Date,Student Name,Student ID,Class / Trade,Payment Mode,Amount (INR)\n';
            list.forEach((p: any, i: number) => {
                csv += `${i + 1},"${new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN')}","${p.studentFee?.student?.name || p.name || '—'}","${p.studentFee?.student?.studentId || p.studentId || '—'}","${p.studentFee?.student?.class || p.class || '—'}","${p.mode || 'Direct'}",${((p.amount || p.pendingAmount || 0) / 100)}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sai_ITI_Fee_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }
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

    const handleClearMockData = async () => {
        if (!confirm('🚨 CRITICAL WARNING: Are you sure you want to permanently delete ALL testing students, fee records, payment transactions, and PDF receipts?\n\nThis will reset your database to 0 records so you can start with a 100% clean production system.')) {
            return;
        }
        setPurging(true);
        try {
            const { data } = await api.post('/reports/clear-all-mock-data');
            showToast(`✅ ${data.message || 'All mock data cleared!'}`);
            fetchStorageStats();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Mock data wipe failed'}`);
        } finally {
            setPurging(false);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div className="header-title">📈 Fee Collection Reports</div>
                        <div className="header-subtitle">Official collection registers, yearly reports & fee ledger audits</div>
                    </div>
                    <div className="header-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('excel')}>📥 Excel</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadReport('csv')}>📄 CSV</button>
                        <button className="btn btn-primary btn-sm" onClick={() => downloadReport('pdf')}>📕 PDF Report</button>
                    </div>
                </header>

                <div className="page-content">
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {(['monthly', 'yearly', 'pending'] as const).map((tab) => (
                            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(tab as any)}>
                                {tab === 'monthly' && '📅 Monthly Collection'}
                                {tab === 'yearly' && '📊 Annual / Yearly Collection'}
                                {tab === 'pending' && '⏳ Outstanding Fees'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'monthly' && (
                        <>
                            {/* Filters */}
                            <div className="card mb-4">
                                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 160px', minWidth: 140 }}>
                                        <label className="form-label">Month</label>
                                        <select className="form-control" style={{ paddingRight: '28px' }} value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px', minWidth: 120 }}>
                                        <label className="form-label">Year</label>
                                        <select className="form-control" style={{ paddingRight: '28px' }} value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={fetchMonthly} style={{ whiteSpace: 'nowrap', height: 42, flexShrink: 0 }}>🔍 Generate Report</button>
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
                                <div className="table-wrap" style={{ border: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th style={{ paddingLeft: '16px' }}>Date</th><th>Student</th><th>Student ID</th><th>Class</th>
                                            <th>Amount</th><th>Mode</th><th>Transaction Ref</th><th>Recorded By</th>
                                        </tr></thead>
                                        <tbody>
                                            {fetching ? (
                                                <tr><td colSpan={8} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                            ) : (report?.payments || []).length === 0 ? (
                                                <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No payments found for this period</td></tr>
                                            ) : (report?.payments || []).map((p: any) => (
                                                <tr key={p.id}>
                                                    <td style={{ paddingLeft: '16px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
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
                                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 160px', minWidth: 140 }}>
                                        <label className="form-label">Academic / Financial Year</label>
                                        <select className="form-control" style={{ paddingRight: '28px' }} value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" onClick={fetchYearly} style={{ whiteSpace: 'nowrap', height: 42, flexShrink: 0 }}>🔍 Generate Annual Report</button>
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
                                <div className="table-wrap" style={{ border: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th style={{ paddingLeft: '16px' }}>Date</th><th>Student</th><th>Student ID</th><th>Class</th>
                                            <th>Amount</th><th>Mode</th><th>Transaction Ref</th><th>Recorded By</th>
                                        </tr></thead>
                                        <tbody>
                                            {fetching ? (
                                                <tr><td colSpan={8} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                            ) : (yearlyReport?.payments || []).length === 0 ? (
                                                <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No payments found for year {year}</td></tr>
                                            ) : (yearlyReport?.payments || []).map((p: any) => (
                                                <tr key={p.id}>
                                                    <td style={{ paddingLeft: '16px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
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
                                <div className="table-wrap" style={{ border: 'none', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                                    <table className="table">
                                        <thead><tr>
                                            <th style={{ paddingLeft: '16px' }}>Student ID</th><th>Name</th><th>Class</th><th>Fee Structure</th>
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
                                                        <td style={{ paddingLeft: '16px' }}><span className="badge badge-primary">{sf.student?.studentId}</span></td>
                                                        <td><b>{sf.student?.name}</b></td>
                                                        <td>{sf.student?.class}</td>
                                                        <td>{(sf.feeStructure?.name || 'Trade Fee').replace(/\s*—\s*\d{4}[-–]\d{2,4}/g, '')} ({sf.academicYear || '2026-2028'})</td>
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


                </div>

                <Footer />
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
