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

    // Quick Add Student Modal State
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({ name: '', class: 'Electrician', section: 'A', rollNumber: '', parentName: '', parentPhone: '', parentEmail: '' });
    const [quickAdding, setQuickAdding] = useState(false);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchStudentsList = (query: string) => {
        api.get(`/students?search=${query}&limit=30`).then(({ data }) => setStudents(data.data || [])).catch(() => { });
    };

    useEffect(() => {
        if (!user || user.role === 'TEACHER') return;
        fetchStudentsList(studentSearch);
    }, [user, studentSearch]);

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
                rollNumber: quickAddForm.rollNumber,
                parent: quickAddForm.parentPhone ? { name: quickAddForm.parentName, phone: quickAddForm.parentPhone, email: quickAddForm.parentEmail } : undefined,
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
            setQuickAddForm({ name: '', class: 'Electrician', section: 'A', rollNumber: '', parentName: '', parentPhone: '', parentEmail: '' });

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
                                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
                                            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !form.amount} style={{ width: '100%', justifyContent: 'center' }}>
                                                {saving ? '⏳ Processing Payment...' : '✅ Record Payment & Generate Receipt'}
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

                                    {/* QR Code Placeholder for Instant UPI Payment */}
                                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                                            📱 Scan & Pay via Institute UPI QR
                                        </div>
                                        <div style={{ width: 140, height: 140, margin: '0 auto 8px', border: '2px solid var(--border)', borderRadius: 8, padding: 8, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {/* Crisp SVG QR Code Graphic */}
                                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                                <path d="M0,0 h30 v30 h-30 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M80,10 h10 v10 h-10 z M0,40 h10 v20 h-10 z M30,40 h40 v10 h-40 z M80,40 h20 v30 h-20 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,60 h20 v40 h-20 z M70,80 h30 v20 h-30 z" fill="#1a3a7c" />
                                            </svg>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>UPI ID: saiiti@upi</div>
                                        <small className="text-muted" style={{ fontSize: 10 }}>Accepts Google Pay, PhonePe, Paytm, BHIM</small>
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
                                <div className="grid grid-2 mb-3">
                                    <div className="form-group">
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
                                    <div className="form-group">
                                        <label className="form-label">Roll Number</label>
                                        <input className="form-control" value={quickAddForm.rollNumber}
                                            onChange={(e) => setQuickAddForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 02" />
                                    </div>
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

            {toast && (
                <div className="toast-wrap">
                    <div className={`toast ${toast.startsWith('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div>
                </div>
            )}
        </div>
    );
}


