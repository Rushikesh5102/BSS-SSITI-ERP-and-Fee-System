'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function ReceiptsContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [receipts, setReceipts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);
    const [search, setSearch] = useState('');
    const [viewReceipt, setViewReceipt] = useState<any | null>(null);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchReceipts = async (searchQuery: string = '') => {
        setFetching(true);
        try {
            const { data } = await api.get(`/receipts?limit=50&search=${searchQuery}`);
            setReceipts(data.data || []);
        } catch { /* */ } finally { setFetching(false); }
    };

    useEffect(() => {
        if (!user) return;
        const delayDebounceFn = setTimeout(() => {
            fetchReceipts(search);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [user, search]);

    if (loading || !user) return null;

    const filtered = receipts;

    const getBaseUrl = () => {
        return typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? 'https://bss-ssiti-erp-and-fee-system.onrender.com'
            : 'http://localhost:4000';
    };

    const canRefund = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER' || effectiveRole === 'SUPERADMIN' || effectiveRole === 'BRANCH_ADMIN';

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">🧾 Fee Receipts & Invoices</div>
                        <div className="header-subtitle">Official payment ledger with Remarks, Balances & Clerk Signatures</div>
                    </div>
                </header>

                <div className="page-content">
                    <div className="card mb-4">
                        <div className="card-body" style={{ padding: '12px 16px' }}>
                            <input
                                type="text" className="form-control" placeholder="🔍 Search receipt number, student name, or remarks..."
                                value={search} onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="table responsive-table">
                                <thead>
                                    <tr>
                                        <th>Receipt No.</th>
                                        <th>Student</th>
                                        <th>Amount Paid</th>
                                        <th>Payment Mode</th>
                                        <th>Remarks / Notes</th>
                                        <th>Issued Date</th>
                                        <th>Clerk / Cashier</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fetching ? (
                                        <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading receipts...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 40 }}>No receipts found</td></tr>
                                    ) : filtered.map((r) => (
                                        <tr key={r.id}>
                                            <td data-label="Receipt No.">
                                                <span className="badge badge-primary" style={{ fontWeight: 800 }}>{r.receiptNumber}</span>
                                            </td>
                                            <td data-label="Student">
                                                <b>{r.payment?.studentFee?.student?.name || '—'}</b>
                                                <div className="text-sm text-muted">{r.payment?.studentFee?.student?.studentId} • {r.payment?.studentFee?.student?.class}</div>
                                            </td>
                                            <td data-label="Amount Paid"><b style={{ color: 'var(--accent)', fontSize: 14 }}>{formatRupees(r.payment?.amount || 0)}</b></td>
                                            <td data-label="Mode"><span className="badge badge-neutral">{r.payment?.mode}</span></td>
                                            <td data-label="Remarks / Notes">
                                                {r.payment?.remarks ? (
                                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6 }}>
                                                        📝 {r.payment.remarks}
                                                    </span>
                                                ) : <span className="text-muted text-xs">—</span>}
                                            </td>
                                            <td data-label="Issued Date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td data-label="Clerk / Cashier">
                                                <span className="text-sm font-bold">{r.generatedBy?.name || 'Accounts Clerk'}</span>
                                            </td>
                                            <td data-label="Actions">
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        onClick={() => setViewReceipt(r)}
                                                        className="btn btn-secondary btn-sm"
                                                        title="View full printable receipt with balance & clerk signature"
                                                    >
                                                        👁️ View / Print
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            window.location.href = `${getBaseUrl()}${r.pdfUrl.startsWith('/api') ? r.pdfUrl : `/api${r.pdfUrl}`}`;
                                                        }}
                                                        className="btn btn-accent btn-sm"
                                                        title="Download Official PDF Receipt"
                                                    >
                                                        📄 PDF
                                                    </button>
                                                    {canRefund && r.payment?.status !== 'REFUNDED' && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            style={{ padding: '4px 8px', fontSize: 11 }}
                                                            onClick={async () => {
                                                                const reason = prompt('Reason for fee refund:');
                                                                if (!reason) return;
                                                                try {
                                                                    await api.post(`/payments/${r.paymentId}/refund`, { reason });
                                                                    alert('✅ Fee refunded successfully!');
                                                                    fetchReceipts();
                                                                } catch (err: any) {
                                                                    alert(`❌ ${err.response?.data?.message || 'Refund failed'}`);
                                                                }
                                                            }}
                                                        >
                                                            ↩ Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

            {/* Printable Receipt Modal with Remarks, Total, Balance & Clerk Signature */}
            {viewReceipt && (
                <div className="modal-overlay" onClick={() => setViewReceipt(null)}>
                    <div className="modal" style={{ maxWidth: 640, width: '92vw', padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                            <div className="modal-title" style={{ fontSize: 16 }}>🧾 Official Payment Receipt Preview</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewReceipt(null)}>✕</button>
                        </div>
                        
                        <div className="modal-body print-area" style={{ padding: 24, background: 'var(--surface)' }}>
                            {/* Header & Logo */}
                            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: 14, marginBottom: 16 }}>
                                <img src="/sai_iti_logo.png" alt="Shri Sai ITI" style={{ height: 50, objectFit: 'contain', margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                                    SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Ramnagar, Jain Mandir Road, Bhadrawati, Dist. Chandrapur, Maharashtra
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '6px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                                    <span>Receipt No: <span style={{ color: 'var(--primary)' }}>{viewReceipt.receiptNumber}</span></span>
                                    <span>Date: {new Date(viewReceipt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Student Details Grid */}
                            <div className="grid grid-2" style={{ gap: 10, fontSize: 12.5, marginBottom: 16 }}>
                                <div><span className="text-muted">Student Name:</span> <b>{viewReceipt.payment?.studentFee?.student?.name}</b></div>
                                <div><span className="text-muted">Student ID:</span> <span className="badge badge-primary">{viewReceipt.payment?.studentFee?.student?.studentId}</span></div>
                                <div><span className="text-muted">Trade / Course:</span> <b>{viewReceipt.payment?.studentFee?.student?.class}</b></div>
                                <div><span className="text-muted">Payment Mode:</span> <span className="badge badge-info">{viewReceipt.payment?.mode}</span></div>
                                {viewReceipt.payment?.transactionRef && (
                                    <div style={{ gridColumn: '1 / -1' }}><span className="text-muted">Ref / Trx No:</span> <b>{viewReceipt.payment.transactionRef}</b></div>
                                )}
                            </div>

                            {/* ─── Remarks / Notes Box (Requirement 1) ────────────────────── */}
                            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#b45309', marginBottom: 2 }}>
                                    📝 Payment Remarks / Notes:
                                </div>
                                <div style={{ fontSize: 13, color: '#78350f', fontWeight: 600 }}>
                                    {viewReceipt.payment?.remarks || 'Fee Payment Received with Thanks.'}
                                </div>
                            </div>

                            {/* ─── Total and Balance Breakdown (Requirement 3) ─────────────── */}
                            {(() => {
                                const sf = viewReceipt.payment?.studentFee || {};
                                const totalPaise = sf.totalAmount || (viewReceipt.payment?.amount || 0);
                                const paidPaise = sf.paidAmount || (viewReceipt.payment?.amount || 0);
                                const currentPaise = viewReceipt.payment?.amount || 0;
                                const balancePaise = Math.max(0, totalPaise - paidPaise);

                                return (
                                    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                                            💰 Account Ledger Breakdown
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                            <span className="text-muted">Total Agreed Course Fee:</span>
                                            <b>{formatRupees(totalPaise)}</b>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--primary)', fontWeight: 800, borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', margin: '4px 0' }}>
                                            <span>Amount Paid in this Receipt:</span>
                                            <span>{formatRupees(currentPaise)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                            <span className="text-muted">Total Fee Paid Till Date:</span>
                                            <b style={{ color: '#10b981' }}>{formatRupees(paidPaise)}</b>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                            <span className="text-muted">Remaining Balance Due:</span>
                                            <b style={{ color: balancePaise > 0 ? '#ef4444' : '#10b981', fontSize: 14 }}>
                                                {balancePaise > 0 ? formatRupees(balancePaise) : '✅ Fully Cleared (₹0)'}
                                            </b>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ─── Clerk Signature & Seal (Requirement 11) ────────────────── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 130, borderBottom: '1px solid var(--text-primary)', marginBottom: 4 }} />
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Student / Parent Signature</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 130, borderBottom: '1px solid var(--text-primary)', marginBottom: 4 }} />
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        ✍️ Clerk / Cashier Signature
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>({viewReceipt.generatedBy?.name || 'Accounts Clerk'})</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <img src="/sai_iti_principal_sign_stamp.jpg" alt="Stamp" style={{ height: 36, objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                                    <div style={{ width: 130, borderBottom: '1px solid var(--text-primary)', marginBottom: 4 }} />
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Principal Seal & Sign</div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-secondary" onClick={() => setViewReceipt(null)}>Close</button>
                            <button className="btn btn-primary" onClick={handlePrintReceipt}>🖨️ Print Receipt Slip</button>
                            <button 
                                className="btn btn-accent" 
                                onClick={() => {
                                    window.location.href = `${getBaseUrl()}${viewReceipt.pdfUrl.startsWith('/api') ? viewReceipt.pdfUrl : `/api${viewReceipt.pdfUrl}`}`;
                                }}
                            >
                                📄 Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SearchParamsLoader() {
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    return <ReceiptsContent simulateParam={simulateParam} />;
}

export default function ReceiptsPage() {
    return (
        <Suspense fallback={<div className="layout"><Sidebar /><div className="main-content"><div className="page-content text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading receipts...</div></div></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}
