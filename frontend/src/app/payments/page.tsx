'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NET_BANKING', 'RAZORPAY', 'STRIPE'];
const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function PaymentsContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [form, setForm] = useState({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Quick Add Student Modal State
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({ name: '', class: 'Electrician', section: 'A', rollNumber: '', photo: '', parentName: '', parentPhone: '', parentEmail: '' });
    const [quickAdding, setQuickAdding] = useState(false);

    // Full-Res Image Viewer Modal State
    const [viewImageModal, setViewImageModal] = useState<{ url: string; title: string; filename: string } | null>(null);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchStudentsList = (query: string) => {
        api.get(`/students?search=${query}&limit=30`).then(({ data }) => setStudents(data.data || [])).catch(() => { });
    };

    useEffect(() => {
        if (!user || effectiveRole === 'TEACHER') return;
        fetchStudentsList(studentSearch);
    }, [user, effectiveRole, studentSearch]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        setSelectedStudent(student || null);
        if (student && student.studentFees && student.studentFees.length > 0) {
            setSelectedFee(student.studentFees[0]);
        } else {
            setSelectedFee(null);
        }
        setResult(null);
    };

    const handleQuickAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuickAdding(true);
        try {
            const { data } = await api.post('/students', {
                name: quickAddForm.name,
                class: quickAddForm.class,
                section: quickAddForm.section,
                rollNumber: quickAddForm.rollNumber || undefined,
                photo: quickAddForm.photo || undefined,
                parent: quickAddForm.parentName ? {
                    name: quickAddForm.parentName,
                    phone: quickAddForm.parentPhone,
                    email: quickAddForm.parentEmail,
                } : undefined,
            });
            const newStudent = data.data;

            // Auto-assign default fee structure to new student
            try {
                const feeRes = await api.get('/fee-structures');
                if (feeRes.data.data && feeRes.data.data.length > 0) {
                    await api.post('/fee-structures/assign', {
                        studentId: newStudent.id,
                        feeStructureId: feeRes.data.data[0].id,
                    });
                }
            } catch { }

            showToast(`✅ Student ${newStudent.name} (${newStudent.studentId}) admitted successfully!`);
            setShowQuickAddModal(false);
            setQuickAddForm({ name: '', class: 'Electrician', section: 'A', rollNumber: '', photo: '', parentName: '', parentPhone: '', parentEmail: '' });

            // Refresh & Select new student
            const refreshed = await api.get(`/students/${newStudent.id}`);
            const fullNewStudent = refreshed.data.data;
            setStudents(prev => [fullNewStudent, ...prev]);
            setSelectedStudent(fullNewStudent);
            if (fullNewStudent.studentFees && fullNewStudent.studentFees.length > 0) {
                setSelectedFee(fullNewStudent.studentFees[0]);
            }
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to add student'}`);
        } finally {
            setQuickAdding(false);
        }
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

            // Refresh student fee data
            if (selectedStudent) {
                const refreshed = await api.get(`/students/${selectedStudent.id}`);
                setSelectedStudent(refreshed.data.data);
                if (refreshed.data.data.studentFees) {
                    setSelectedFee(refreshed.data.data.studentFees.find((f: any) => f.id === selectedFee.id) || refreshed.data.data.studentFees[0]);
                }
            }
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Payment failed'}`);
        } finally { setSaving(false); }
    };

    if (loading || !user) return null;
    if (effectiveRole === 'TEACHER') {
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
    const inputAmountPaise = form.amount ? Math.round(parseFloat(form.amount) * 100) : 0;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">💳 Record Payment</div>
                        <div className="header-subtitle">Search/Select student, accept fees, and issue live receipts</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowQuickAddModal(true)}>
                        ➕ Quick Add Student
                    </button>
                </header>

                <div className="page-content">
                    <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'flex-start' }}>
                        {/* Left: Payment Form */}
                        <div>
                            <div className="card mb-4">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="card-title">Step 1: Select Student & Fee Record</div>
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => setShowQuickAddModal(true)}>
                                        ➕ New Student
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Search Student (Name, ID, Roll No, Trade)</label>
                                        <input
                                            className="form-control"
                                            placeholder="🔍 Search by name, ID, roll no, trade..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Select Student <span className="required">*</span></label>
                                        <select
                                            className="form-control"
                                            value={selectedStudent?.id || ''}
                                            onChange={(e) => handleStudentSelect(e.target.value)}
                                        >
                                            <option value="" disabled>— Choose student from list —</option>
                                            {students.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.studentId}) - {s.class}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedStudent && (
                                        <div className="form-group mb-0">
                                            <label className="form-label">Select Fee Allocation Record <span className="required">*</span></label>
                                            <select
                                                className="form-control"
                                                value={selectedFee?.id || ''}
                                                onChange={(e) => {
                                                    const fee = selectedStudent.studentFees?.find((f: any) => f.id === e.target.value);
                                                    setSelectedFee(fee || null);
                                                }}
                                            >
                                                {(selectedStudent.studentFees || []).map((f: any) => (
                                                    <option key={f.id} value={f.id}>
                                                        {f.feeStructure?.name || 'School Fee'} ({f.academicYear}) — Pending: {formatRupees(f.totalAmount - f.paidAmount)}
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
                                                    <label className="form-label">Amount (₹ INR) <span className="required">*</span></label>
                                                    <input className="form-control" type="number" step="1" min="1"
                                                        max={pendingBalance / 100} required value={form.amount}
                                                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                        placeholder={`e.g. 5000 (Max: ₹${(pendingBalance / 100).toLocaleString('en-IN')})`} />
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
                                                            onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. State Bank of India" />
                                                    </div>
                                                )}
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label className="form-label">Remarks / Note</label>
                                                    <input className="form-control" value={form.remarks}
                                                        onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional note for receipt" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !form.amount} style={{ width: '100%', justifyContent: 'center' }}>
                                                {saving ? '⏳ Processing...' : '✅ Record Payment'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-lg"
                                                disabled={saving || !selectedFee || pendingBalance <= 0}
                                                onClick={async () => {
                                                    const amountPaise = form.amount ? Math.round(parseFloat(form.amount) * 100) : pendingBalance;
                                                    if (amountPaise <= 0) return alert('Please enter a valid payment amount');
                                                    setSaving(true);
                                                    try {
                                                        const script = document.createElement('script');
                                                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                                                        document.body.appendChild(script);
                                                        await new Promise(r => setTimeout(r, 600));

                                                        const { data: orderRes } = await api.post('/payments/razorpay/order', {
                                                            studentFeeId: selectedFee.id,
                                                            amount: amountPaise
                                                        });

                                                        if (!orderRes.success || !orderRes.data) throw new Error('Order creation failed');
                                                        const order = orderRes.data;

                                                        const options = {
                                                            key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_TEUu7W94JCplrN',
                                                            amount: order.amount,
                                                            currency: order.currency,
                                                            name: 'Shri Sai I.T.I',
                                                            description: `Fee Payment - ${selectedStudent.name}`,
                                                            order_id: order.id,
                                                            handler: async function (response: any) {
                                                                try {
                                                                    const { data: verifyRes } = await api.post('/payments/razorpay/verify', {
                                                                        razorpayOrderId: response.razorpay_order_id || order.id,
                                                                        razorpayPaymentId: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                                                        razorpaySignature: response.razorpay_signature || 'mock_signature',
                                                                        studentFeeId: selectedFee.id,
                                                                        amount: order.amount
                                                                    });
                                                                    if (verifyRes.success) {
                                                                        setResult(verifyRes.data);
                                                                        showToast('✅ Razorpay Payment Successful! Receipt generated.');
                                                                        setForm({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });
                                                                    }
                                                                } catch (err: any) {
                                                                    showToast(`❌ Verification error: ${err.message}`);
                                                                }
                                                            },
                                                            prefill: { name: selectedStudent.name, phone: selectedStudent.parent?.phone || '' },
                                                            theme: { color: '#0f172a' }
                                                        };

                                                        if (order.id.startsWith('order_mock_')) {
                                                            const confirmPay = window.confirm(`[SANDBOX GATEWAY] Pay ₹${(amountPaise / 100).toLocaleString('en-IN')} via Razorpay?`);
                                                            if (confirmPay) {
                                                                await (options.handler as any)({
                                                                    razorpay_order_id: order.id,
                                                                    razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                                                    razorpay_signature: 'mock_signature'
                                                                });
                                                            }
                                                        } else {
                                                            const rzp = new (window as any).Razorpay(options);
                                                            rzp.open();
                                                        }
                                                    } catch (err: any) {
                                                        showToast(`❌ Razorpay Error: ${err.response?.data?.message || err.message}`);
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%', justifyContent: 'center',
                                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                                    color: '#ffffff', fontWeight: 700, border: 'none'
                                                }}
                                            >
                                                💳 Pay via Razorpay
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Right: Live Receipt Preview & QR Code */}
                        <div>
                            {result ? (
                                <div className="card">
                                    <div style={{ background: 'var(--accent)', padding: '20px 24px', borderRadius: '10px 10px 0 0', color: 'white', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40 }}>✅</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Payment Successful!</div>
                                        <div style={{ opacity: 0.85, fontSize: 13 }}>Official receipt has been generated</div>
                                    </div>
                                    <div className="card-body">
                                        {[
                                            ['Receipt No.', result.receipt?.receiptNumber],
                                            ['Amount Paid', formatRupees(result.payment?.amount || 0)],
                                            ['Payment Mode', result.payment?.mode],
                                            ['Date', new Date(result.payment?.createdAt || Date.now()).toLocaleDateString('en-IN')],
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
                                <div className="card mb-4" style={{ padding: 20 }}>
                                    {/* College Emblem & Header */}
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: 12, marginBottom: 14 }}>
                                        <img src="/sai_iti_logo.png" alt="Shri Sai ITI" style={{ height: 48, objectFit: 'contain', margin: '0 auto 6px' }} />
                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>SHRI SAI I.T.I COLLEGE</div>
                                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Official Payment Receipt Preview</div>
                                    </div>

                                    {selectedStudent ? (
                                        <div style={{ fontSize: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Student:</span>
                                                <b>{selectedStudent.name}</b>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Student ID:</span>
                                                <span className="badge badge-primary">{selectedStudent.studentId}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Trade / Class:</span>
                                                <b>{selectedStudent.class}</b>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Payment Mode:</span>
                                                <span className="badge badge-info">{form.mode}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                                                <span className="font-bold">Paying Amount:</span>
                                                <b style={{ fontSize: 16, color: 'var(--accent)' }}>{formatRupees(inputAmountPaise)}</b>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted text-sm" style={{ padding: '20px 0' }}>
                                            Select a student on the left to view live receipt calculation preview.
                                        </div>
                                    )}

                                    {/* Official Institute UPI QR Code */}
                                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.5px' }}>
                                            📲 Official Direct UPI QR Code
                                        </div>
                                        <div style={{ 
                                            background: '#ffffff', borderRadius: 14, padding: 12, border: '2px solid #0284c7',
                                            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)', display: 'inline-block', cursor: 'pointer', transition: 'transform 0.2s ease'
                                        }} onClick={() => setViewImageModal({ url: '/sai_iti_upi_qr.png', title: 'Official Shri Sai I.T.I UPI QR Code', filename: 'shri_sai_iti_upi_qr.png' })}>
                                            <img src="/sai_iti_upi_qr.png" alt="Official Shri Sai ITI UPI QR Code" style={{ width: 180, height: 'auto', borderRadius: 8, display: 'block' }} />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginTop: 8 }}>
                                            M/S. SHREE SAI KHAJAGI AUDYOGIK PRASHIKSHAN SANSTHA
                                        </div>
                                        <small className="text-muted" style={{ fontSize: 11 }}>Tap QR code to zoom full screen | Accepts GPay, PhonePe, Paytm, BHIM</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Student Modal */}
            {showQuickAddModal && (
                <div className="modal-overlay" onClick={() => setShowQuickAddModal(false)}>
                    <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">➕ Quick Student Admission</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowQuickAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleQuickAddStudent}>
                            <div className="modal-body">
                                <div className="form-group mb-3">
                                    <label className="form-label">Full Name <span className="required">*</span></label>
                                    <input className="form-control" required value={quickAddForm.name}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Amit Patil" />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Trade / Course <span className="required">*</span></label>
                                    <select className="form-control" value={quickAddForm.class}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, class: e.target.value }))}>
                                        <option>Electrician</option>
                                        <option>Fitter</option>
                                        <option>Welder</option>
                                        <option>Mechanic</option>
                                        <option>COPA</option>
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Student Photo Upload</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {quickAddForm.photo ? (
                                            <img src={quickAddForm.photo} alt="Preview" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📷</div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="form-control"
                                            style={{ padding: '6px 10px', fontSize: 13, height: 'auto', background: 'var(--surface-2)', border: '1px dashed var(--primary)' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setQuickAddForm(f => ({ ...f, photo: reader.result as string }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group mb-3" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: 'var(--primary)' }}>
                                    ℹ️ <b>Auto-Assigned:</b> Roll Number and Student ID are generated automatically per trade (e.g. SITI-2026-E01).
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Parent / Guardian Name</label>
                                    <input className="form-control" value={quickAddForm.parentName}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Suresh Patil" />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Parent Phone</label>
                                        <input className="form-control" value={quickAddForm.parentPhone}
                                            onChange={(e) => setQuickAddForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="e.g. +919876543210" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Parent Email</label>
                                        <input className="form-control" type="email" value={quickAddForm.parentEmail}
                                            onChange={(e) => setQuickAddForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@gmail.com" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={quickAdding}>
                                    {quickAdding ? 'Admitting...' : '💾 Admit Student & Select'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Full-Res Image & QR Viewer Modal */}
            {viewImageModal && (
                <div className="modal-overlay" onClick={() => setViewImageModal(null)}>
                    <div className="modal" style={{ maxWidth: 480, padding: 24, textAlign: 'center', background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ marginBottom: 16 }}>
                            <div className="modal-title" style={{ fontSize: 16, fontWeight: 700 }}>{viewImageModal.title}</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewImageModal(null)}>✕</button>
                        </div>
                        <div style={{ background: '#ffffff', padding: 16, borderRadius: 12, border: '2px solid #0284c7', display: 'inline-block', marginBottom: 16 }}>
                            <img src={viewImageModal.url} alt={viewImageModal.title} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <a href={viewImageModal.url} download={viewImageModal.filename} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                📥 Download Image / QR
                            </a>
                            <button className="btn btn-secondary" onClick={() => setViewImageModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="toast-wrap">
                    <div className={`toast ${toast.startsWith('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div>
                </div>
            )}
        </div>
    );
}

function SearchParamsLoader() {
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    return <PaymentsContent simulateParam={simulateParam} />;
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={<div className="layout"><Sidebar /><div className="main-content"><div className="page-content text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading payments...</div></div></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}


