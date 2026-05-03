'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NET_BANKING', 'RAZORPAY', 'STRIPE'];
const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function PaymentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [form, setForm] = useState({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    useEffect(() => {
        if (!user || user.role === 'TEACHER') return;
        api.get(`/students?search=${studentSearch}&limit=20`).then(({ data }) => setStudents(data.data || [])).catch(() => { });
    }, [user, studentSearch]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const handleStudentSelect = async (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        setSelectedStudent(student || null);
        setSelectedFee(null);
        setResult(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFee) return;
        setSaving(true);
        try {
            const amountPaise = Math.round(parseFloat(form.amount) * 100);
            const { data } = await api.post('/payments', {
                studentFeeId: selectedFee.id,
                amount: amountPaise,
                mode: form.mode,
                transactionRef: form.transactionRef || undefined,
                bankName: form.bankName || undefined,
                remarks: form.remarks || undefined,
            });
            setResult(data.data);
            showToast('✅ Payment recorded! Receipt generated.');
            setForm({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Payment failed'}`);
        } finally { setSaving(false); }
    };

    if (loading || !user) return null;
    if (user.role === 'TEACHER') {
        return (
            <div className="layout"><Sidebar />
                <div className="main-content">
                    <header className="header"><div className="header-title">💳 Payments</div></header>
                    <div className="page-content"><div className="card card-body text-center text-muted" style={{ padding: 40 }}>⛔ Teachers cannot record payments.</div></div>
                </div>
            </div>
        );
    }

    const pendingBalance = selectedFee ? selectedFee.totalAmount - selectedFee.paidAmount : 0;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">💳 Record Payment</div>
                        <div className="header-subtitle">Record offline or online fee payments</div>
                    </div>
                </header>

                <div className="page-content">
                    <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'flex-start' }}>
                        {/* Left: Payment Form */}
                        <div>
                            <div className="card mb-4">
                                <div className="card-header"><div className="card-title">Step 1: Select Student</div></div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <label className="form-label">Search Student</label>
                                        <input className="form-control" placeholder="Type student name..." value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Select Student <span className="required">*</span></label>
                                        <select className="form-control" onChange={(e) => handleStudentSelect(e.target.value)} defaultValue="">
                                            <option value="" disabled>— Choose student —</option>
                                            {students.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.studentId}) - {s.class}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedStudent && (
                                        <div className="form-group">
                                            <label className="form-label">Select Fee Record <span className="required">*</span></label>
                                            <select className="form-control" onChange={(e) => {
                                                const fee = selectedStudent.studentFees?.find((f: any) => f.id === e.target.value);
                                                setSelectedFee(fee || null);
                                            }} defaultValue="">
                                                <option value="" disabled>— Choose fee record —</option>
                                                {(selectedStudent.studentFees || []).map((f: any) => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.feeStructure?.name || 'Fee'} — Pending: {formatRupees(f.totalAmount - f.paidAmount)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedFee && (
                                <div className="card">
                                    <div className="card-header"><div className="card-title">Step 2: Payment Details</div></div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="card-body">
                                            {/* Balance summary */}
                                            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
                                                {[
                                                    { label: 'Total Fee', value: formatRupees(selectedFee.totalAmount) },
                                                    { label: 'Paid', value: formatRupees(selectedFee.paidAmount), color: 'var(--accent)' },
                                                    { label: 'Pending', value: formatRupees(pendingBalance), color: pendingBalance > 0 ? 'var(--danger)' : 'var(--accent)' },
                                                ].map((item) => (
                                                    <div key={item.label}>
                                                        <div className="text-sm text-muted">{item.label}</div>
                                                        <div className="font-bold" style={{ fontSize: 18, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-2">
                                                <div className="form-group">
                                                    <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                                    <input className="form-control" type="number" step="0.01" min="1"
                                                        max={pendingBalance / 100} required value={form.amount}
                                                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                        placeholder={`Max: ₹${(pendingBalance / 100).toFixed(2)}`} />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Payment Mode <span className="required">*</span></label>
                                                    <select className="form-control" value={form.mode}
                                                        onChange={(e) => setForm(f => ({ ...f, mode: e.target.value }))}>
                                                        {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Transaction / Ref. No.</label>
                                                    <input className="form-control" value={form.transactionRef}
                                                        onChange={(e) => setForm(f => ({ ...f, transactionRef: e.target.value }))}
                                                        placeholder="Cheque/UTR/Ref number" />
                                                </div>
                                                {(form.mode === 'CHEQUE' || form.mode === 'BANK_TRANSFER') && (
                                                    <div className="form-group">
                                                        <label className="form-label">Bank Name</label>
                                                        <input className="form-control" value={form.bankName}
                                                            onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. SBI" />
                                                    </div>
                                                )}
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label className="form-label">Remarks</label>
                                                    <input className="form-control" value={form.remarks}
                                                        onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional note" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
                                            <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                                                {saving ? '⏳ Processing...' : '✅ Record Payment & Generate Receipt'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Right: Receipt Preview */}
                        <div>
                            {result ? (
                                <div className="card">
                                    <div style={{ background: 'var(--accent)', padding: '20px 24px', borderRadius: '10px 10px 0 0', color: 'white', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40 }}>✅</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Payment Successful!</div>
                                        <div style={{ opacity: 0.85, fontSize: 13 }}>Receipt has been generated</div>
                                    </div>
                                    <div className="card-body">
                                        {[
                                            ['Receipt No.', result.receipt?.receiptNumber],
                                            ['Amount Paid', formatRupees(result.payment?.amount || 0)],
                                            ['Payment Mode', result.payment?.mode],
                                            ['Date', new Date(result.payment?.createdAt || Date.now()).toLocaleString('en-IN')],
                                        ].map(([label, value]) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className="text-muted">{label}</span>
                                                <b>{value}</b>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${result.receipt?.pdfUrl}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                                                📄 Download Receipt PDF
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                                    <div style={{ fontSize: 60, margin: '0 auto 16px' }}>🧾</div>
                                    <div className="font-bold" style={{ fontSize: 16 }}>Receipt Preview</div>
                                    <div className="text-muted text-sm" style={{ marginTop: 8 }}>Complete the payment form to see the generated receipt here.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div className="toast-wrap">
                    <div className={`toast ${toast.startsWith('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div>
                </div>
            )}
        </div>
    );
}

