'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AutoRecoverBanner from '../../components/AutoRecoverBanner';
import { safeStorage } from '../../utils/safeStorage';

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NET_BANKING', 'RAZORPAY', 'STRIPE'];
const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function PaymentsContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [students, setStudents] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    
    // Payment Form state with Fee Head Selection & Auto-fill / Custom on-the-spot creation
    const [form, setForm] = useState({ 
        feeHeadType: 'FULL_BALANCE',
        feeHeadLabel: 'Academic Course Fee',
        customFeeHeadName: '',
        amount: '', 
        mode: 'CASH', 
        transactionRef: '', 
        bankName: '', 
        remarks: '' 
    });
    
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [toast, setToast] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Auto-Recover Draft State for Payment Form
    const [hasPaymentDraft, setHasPaymentDraft] = useState(false);
    const [paymentDraftTime, setPaymentDraftTime] = useState<string | null>(null);

    useEffect(() => {
        const saved = safeStorage.get<any>('draft_fee_payment', null);
        if (saved && (saved.amount || saved.transactionRef || saved.remarks || saved.feeHeadType)) {
            setHasPaymentDraft(true);
            setPaymentDraftTime(saved.savedAt);
        }
    }, []);

    useEffect(() => {
        if (form.amount || form.transactionRef || form.remarks || form.customFeeHeadName) {
            const timer = setTimeout(() => {
                safeStorage.set('draft_fee_payment', {
                    ...form,
                    savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [form]);

    const handleRestorePaymentDraft = () => {
        const saved = safeStorage.get<any>('draft_fee_payment', null);
        if (saved) {
            setForm({
                feeHeadType: saved.feeHeadType || 'FULL_BALANCE',
                feeHeadLabel: saved.feeHeadLabel || 'Academic Course Fee',
                customFeeHeadName: saved.customFeeHeadName || '',
                amount: saved.amount || '',
                mode: saved.mode || 'CASH',
                transactionRef: saved.transactionRef || '',
                bankName: saved.bankName || '',
                remarks: saved.remarks || ''
            });
            setHasPaymentDraft(false);
        }
    };

    const handleDiscardPaymentDraft = () => {
        safeStorage.remove('draft_fee_payment');
        setHasPaymentDraft(false);
    };

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

    const fetchFeeStructures = () => {
        api.get('/fee-structures').then(({ data }) => setFeeStructures(data.data || [])).catch(() => { });
    };

    useEffect(() => {
        if (!user) return;
        fetchStudentsList(studentSearch);
        fetchFeeStructures();
    }, [user, effectiveRole, studentSearch]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        setSelectedStudent(student || null);
        if (student && student.studentFees && student.studentFees.length > 0) {
            const sf = student.studentFees[0];
            setSelectedFee(sf);
            const due = (sf.totalAmount - sf.paidAmount) / 100;
            setForm(f => ({
                ...f,
                feeHeadType: 'FULL_BALANCE',
                feeHeadLabel: 'Academic Course Fee',
                amount: due > 0 ? due.toString() : '',
                remarks: 'Paid towards Academic Course Fee'
            }));
        } else {
            setSelectedFee(null);
        }
        setResult(null);
    };

    // ─── Intelligent Fee Amount Resolvers (Admission vs Fee Structure vs Master Template) ──
    const getTuitionAmount = (): number => {
        if (!selectedStudent) return 15000;
        if (selectedStudent.tuitionFee && parseFloat(selectedStudent.tuitionFee) > 0) {
            return parseFloat(selectedStudent.tuitionFee);
        }
        if (selectedStudent.educationDetails?.tuitionFee && parseFloat(selectedStudent.educationDetails.tuitionFee) > 0) {
            return parseFloat(selectedStudent.educationDetails.tuitionFee);
        }
        const assignedItems = selectedFee?.feeStructure?.items || [];
        const tuitionItem = assignedItems.find((i: any) => (i.feeCategory?.name || '').toLowerCase().includes('tuition'));
        if (tuitionItem && tuitionItem.amount > 0) return tuitionItem.amount / 100;

        for (const fs of feeStructures) {
            if (fs.class === selectedStudent.class || fs.name?.toLowerCase().includes(selectedStudent.class?.toLowerCase())) {
                const item = (fs.items || []).find((i: any) => (i.feeCategory?.name || '').toLowerCase().includes('tuition'));
                if (item && item.amount > 0) return item.amount / 100;
            }
        }
        return 15000;
    };

    const getExamAmount = (): number => {
        if (!selectedStudent) return 2000;
        if (selectedStudent.examFee && parseFloat(selectedStudent.examFee) > 0) {
            return parseFloat(selectedStudent.examFee);
        }
        if (selectedStudent.educationDetails?.examFee && parseFloat(selectedStudent.educationDetails.examFee) > 0) {
            return parseFloat(selectedStudent.educationDetails.examFee);
        }
        const assignedItems = selectedFee?.feeStructure?.items || [];
        const examItem = assignedItems.find((i: any) => (i.feeCategory?.name || '').toLowerCase().includes('exam'));
        if (examItem && examItem.amount > 0) return examItem.amount / 100;

        for (const fs of feeStructures) {
            if (fs.class === selectedStudent.class || fs.name?.toLowerCase().includes(selectedStudent.class?.toLowerCase())) {
                const item = (fs.items || []).find((i: any) => (i.feeCategory?.name || '').toLowerCase().includes('exam'));
                if (item && item.amount > 0) return item.amount / 100;
            }
        }
        return 2000;
    };

    const getDressMaterialAmount = (): number => {
        if (!selectedStudent) return 3000;
        if (selectedStudent.dressMaterialFee && parseFloat(selectedStudent.dressMaterialFee) > 0) {
            return parseFloat(selectedStudent.dressMaterialFee);
        }
        if (selectedStudent.educationDetails?.dressMaterialFee && parseFloat(selectedStudent.educationDetails.dressMaterialFee) > 0) {
            return parseFloat(selectedStudent.educationDetails.dressMaterialFee);
        }
        const assignedItems = selectedFee?.feeStructure?.items || [];
        const dressItem = assignedItems.find((i: any) => {
            const n = (i.feeCategory?.name || '').toLowerCase();
            return n.includes('dress') || n.includes('material') || n.includes('uniform');
        });
        if (dressItem && dressItem.amount > 0) return dressItem.amount / 100;

        for (const fs of feeStructures) {
            if (fs.class === selectedStudent.class || fs.name?.toLowerCase().includes(selectedStudent.class?.toLowerCase())) {
                const item = (fs.items || []).find((i: any) => {
                    const n = (i.feeCategory?.name || '').toLowerCase();
                    return n.includes('dress') || n.includes('material') || n.includes('uniform');
                });
                if (item && item.amount > 0) return item.amount / 100;
            }
        }
        return 3000;
    };

    const handleFeeHeadChange = (type: string) => {
        let resolvedAmt = '';
        let headLabel = 'Academic Course Fee';
        const pendingRupees = selectedFee ? (selectedFee.totalAmount - selectedFee.paidAmount) / 100 : 0;

        if (type === 'TUITION') {
            headLabel = 'Tuition Fees';
            const val = getTuitionAmount();
            resolvedAmt = (pendingRupees > 0 ? Math.min(val, pendingRupees) : val).toString();
        } else if (type === 'EXAM') {
            headLabel = 'Exam Fees';
            const val = getExamAmount();
            resolvedAmt = (pendingRupees > 0 ? Math.min(val, pendingRupees) : val).toString();
        } else if (type === 'DRESS_MATERIAL') {
            headLabel = 'Dress & Material Fees';
            const val = getDressMaterialAmount();
            resolvedAmt = (pendingRupees > 0 ? Math.min(val, pendingRupees) : val).toString();
        } else if (type === 'FULL_BALANCE') {
            headLabel = 'Academic Course Fee';
            resolvedAmt = pendingRupees > 0 ? pendingRupees.toString() : '';
        } else if (type === 'CUSTOM') {
            headLabel = form.customFeeHeadName || 'Custom Fee';
            resolvedAmt = '';
        }

        setForm(f => ({
            ...f,
            feeHeadType: type,
            feeHeadLabel: headLabel,
            amount: resolvedAmt,
            remarks: `Paid towards ${headLabel}`
        }));
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
            const effectiveFeesFor = form.feeHeadType === 'CUSTOM' 
                ? (form.customFeeHeadName || 'Custom Fee')
                : form.feeHeadLabel;

            const { data } = await api.post('/payments', {
                studentFeeId: selectedFee.id,
                amount: amountPaise,
                mode: form.mode,
                transactionRef: form.transactionRef || undefined,
                bankName: form.bankName || undefined,
                remarks: form.remarks || `Paid towards ${effectiveFeesFor}`,
                feesFor: effectiveFeesFor,
            });
            setResult(data.data);
            showToast('✅ Payment recorded! Receipt generated.');
            safeStorage.remove('draft_fee_payment');
            setHasPaymentDraft(false);
            setForm({ feeHeadType: 'FULL_BALANCE', feeHeadLabel: 'Academic Course Fee', customFeeHeadName: '', amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });

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

    const pendingBalance = selectedFee ? selectedFee.totalAmount - selectedFee.paidAmount : 0;
    const inputAmountPaise = form.amount ? Math.round(parseFloat(form.amount) * 100) : 0;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">💳 Record Payment</div>
                        <div className="header-subtitle">Select student, choose fee component (Tuition, Exam, Dress, Custom), and issue live receipt</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowQuickAddModal(true)}>
                        ➕ Quick Add Student
                    </button>
                </header>

                <div className="page-content">
                    <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'flex-start' }}>
                        {/* Left: Payment Form */}
                        <div>
                            <div className="card mb-4" style={{ overflow: 'visible' }}>
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="card-title">Step 1: Select Student & Fee Record</div>
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => setShowQuickAddModal(true)}>
                                        ➕ New Student
                                    </button>
                                </div>
                                <div className="card-body" style={{ overflow: 'visible', position: 'relative' }}>
                                    <div className="form-group mb-3" style={{ position: 'relative' }}>
                                        <label className="form-label">Search & Select Student <span className="required">*</span></label>
                                        <input
                                            className="form-control"
                                            placeholder="🔍 Type student name, ID, roll no, or trade..."
                                            value={studentSearch}
                                            onChange={(e) => {
                                                setStudentSearch(e.target.value);
                                                setShowDropdown(true);
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                        />
                                        {showDropdown && (
                                            <div 
                                                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                                                onClick={() => setShowDropdown(false)} 
                                            />
                                        )}
                                        {showDropdown && (
                                            students.filter(s => {
                                                if (!studentSearch.trim()) return true;
                                                const q = studentSearch.toLowerCase();
                                                return s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q) || s.class?.toLowerCase().includes(q);
                                            }).length > 0
                                        ) && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: 'var(--surface)', border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                                                maxHeight: '250px', overflowY: 'auto', zIndex: 999, marginTop: 4
                                            }}>
                                                {students.filter(s => {
                                                    if (!studentSearch.trim()) return true;
                                                    const q = studentSearch.toLowerCase();
                                                    return s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q) || s.class?.toLowerCase().includes(q);
                                                }).map((s) => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => {
                                                            handleStudentSelect(s.id);
                                                            setStudentSearch(`${s.name} (${s.studentId})`);
                                                            setShowDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                                                            fontSize: 13, color: 'var(--text-primary)', transition: 'background 0.15s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <b>{s.name}</b> ({s.studentId}) - {s.class} (Roll: {s.rollNumber || '—'})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                                                        {f.feeStructure?.name || 'Trade Fee'} ({f.academicYear}) — Pending: {formatRupees(f.totalAmount - f.paidAmount)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedFee && (
                                <div className="card">
                                    <div className="card-header"><div className="card-title">Step 2: Payment & Fee Component Details</div></div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="card-body">
                                            <AutoRecoverBanner
                                                show={hasPaymentDraft}
                                                savedAt={paymentDraftTime}
                                                onRestore={handleRestorePaymentDraft}
                                                onDiscard={handleDiscardPaymentDraft}
                                            />

                                            {/* Balance summary */}
                                            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
                                                {[
                                                    { label: 'Total Agreed Fee', value: formatRupees(selectedFee.totalAmount) },
                                                    { label: 'Paid Till Date', value: formatRupees(selectedFee.paidAmount), color: 'var(--accent)' },
                                                    { label: 'Remaining Balance', value: formatRupees(pendingBalance), color: pendingBalance > 0 ? 'var(--danger)' : 'var(--accent)' },
                                                ].map((item) => (
                                                    <div key={item.label}>
                                                        <div className="text-sm text-muted">{item.label}</div>
                                                        <div className="font-bold" style={{ fontSize: 18, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ─── NEW: Select What Fee Student is Paying (Tuition, Exam, Dress, Custom) ── */}
                                            <div className="form-group mb-3" style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1.5px solid var(--border)' }}>
                                                <label className="form-label font-bold" style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>🎯 Select Fee Component Paid For</span>
                                                    <span className="badge badge-primary" style={{ fontSize: 11 }}>Auto-Prefill & Custom</span>
                                                </label>
                                                <div className="text-xs text-muted mb-2">
                                                    Select the specific fee component. Decided amount from admission / fee structure will automatically be populated, or you can create a custom fee head right here!
                                                </div>
                                                <select 
                                                    className="form-control"
                                                    value={form.feeHeadType}
                                                    onChange={(e) => handleFeeHeadChange(e.target.value)}
                                                    style={{ fontSize: 13, fontWeight: 700 }}
                                                >
                                                    <option value="FULL_BALANCE">🏢 Full / General Academic Course Fee (Total Pending: ₹{(pendingBalance / 100).toLocaleString('en-IN')})</option>
                                                    <option value="TUITION">🎓 Tuition Fees (Standard: ₹{getTuitionAmount().toLocaleString('en-IN')})</option>
                                                    <option value="EXAM">📝 Exam Fees (Standard: ₹{getExamAmount().toLocaleString('en-IN')})</option>
                                                    <option value="DRESS_MATERIAL">🥼 Dress & Material Fees (Standard: ₹{getDressMaterialAmount().toLocaleString('en-IN')})</option>
                                                    <option value="CUSTOM">➕ Custom / Other Fee Head (Create On The Spot...)</option>
                                                </select>

                                                {/* On-The-Spot Custom Fee Head Inputs */}
                                                {form.feeHeadType === 'CUSTOM' && (
                                                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>Custom Fee Head Name <span className="required">*</span></label>
                                                            <input 
                                                                className="form-control"
                                                                placeholder="e.g. Workshop Tool Kit, Caution Deposit, Late Fine..."
                                                                value={form.customFeeHeadName}
                                                                onChange={(e) => {
                                                                    const name = e.target.value;
                                                                    setForm(f => ({
                                                                        ...f,
                                                                        customFeeHeadName: name,
                                                                        feeHeadLabel: name || 'Custom Fee',
                                                                        remarks: name ? `Paid towards ${name}` : 'Fee Payment Received'
                                                                    }));
                                                                }}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>Custom Amount (₹) <span className="required">*</span></label>
                                                            <input 
                                                                type="number"
                                                                step="1"
                                                                className="form-control"
                                                                placeholder="Enter amount ₹"
                                                                value={form.amount}
                                                                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-2">
                                                <div className="form-group">
                                                    <label className="form-label">Payment Amount (₹ INR) <span className="required">*</span></label>
                                                    <input className="form-control" type="number" step="1" min="1"
                                                        required value={form.amount}
                                                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                        placeholder="Amount in Rupees" />
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
                                                    <label className="form-label">Remarks / Note (Printed on Receipt)</label>
                                                    <input className="form-control" value={form.remarks}
                                                        onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Note for receipt" />
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
                                                disabled={saving || !selectedFee || (!form.amount && pendingBalance <= 0)}
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
                                                            description: `Fee Payment (${form.feeHeadType === 'CUSTOM' ? (form.customFeeHeadName || 'Custom Fee') : form.feeHeadLabel}) - ${selectedStudent.name}`,
                                                            order_id: order.id,
                                                            handler: async function (response: any) {
                                                                try {
                                                                    const effectiveFeesFor = form.feeHeadType === 'CUSTOM' ? (form.customFeeHeadName || 'Custom Fee') : form.feeHeadLabel;
                                                                    const { data: verifyRes } = await api.post('/payments/razorpay/verify', {
                                                                        razorpayOrderId: response.razorpay_order_id || order.id,
                                                                        razorpayPaymentId: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                                                        razorpaySignature: response.razorpay_signature || 'mock_signature',
                                                                        studentFeeId: selectedFee.id,
                                                                        amount: order.amount,
                                                                        feesFor: effectiveFeesFor,
                                                                        remarks: form.remarks || `Paid towards ${effectiveFeesFor}`
                                                                    });
                                                                    if (verifyRes.success) {
                                                                        setResult(verifyRes.data);
                                                                        showToast('✅ Razorpay Payment Successful! Receipt generated.');
                                                                        setForm({ feeHeadType: 'FULL_BALANCE', feeHeadLabel: 'Academic Course Fee', customFeeHeadName: '', amount: '', mode: 'CASH', transactionRef: '', bankName: '', remarks: '' });
                                                                    }
                                                                } catch (err: any) {
                                                                    showToast(`❌ Verification error: ${err.message}`);
                                                                }
                                                            },
                                                            prefill: { name: selectedStudent.name, phone: selectedStudent.parent?.phone || '' },
                                                            theme: { color: '#0f172a' }
                                                        };

                                                        if (order.id.startsWith('order_mock_')) {
                                                             const confirmPay = window.confirm(`[SANDBOX GATEWAY] Pay ₹${(amountPaise / 100).toLocaleString('en-IN')} towards ${form.feeHeadType === 'CUSTOM' ? (form.customFeeHeadName || 'Custom Fee') : form.feeHeadLabel} via Razorpay?`);
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
                                            ['Remarks / Notes', result.payment?.remarks || 'Fee Payment Received'],
                                        ].map(([label, value]) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className="text-muted">{label}</span>
                                                <b>{value}</b>
                                            </div>
                                        ))}

                                        {selectedFee && (
                                            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className="text-muted">Total Agreed Course Fee:</span>
                                                    <b>{formatRupees(selectedFee.totalAmount)}</b>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <span className="text-muted">Total Paid Till Date:</span>
                                                    <b style={{ color: 'var(--accent)' }}>{formatRupees((selectedFee.paidAmount || 0) + (result.payment?.amount || 0))}</b>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <span className="text-muted">Remaining Balance:</span>
                                                    <b style={{ color: Math.max(0, selectedFee.totalAmount - (selectedFee.paidAmount || 0) - (result.payment?.amount || 0)) > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                                                        {formatRupees(Math.max(0, selectedFee.totalAmount - (selectedFee.paidAmount || 0) - (result.payment?.amount || 0)))}
                                                    </b>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button 
                                                onClick={() => window.print()}
                                                className="btn btn-secondary" 
                                                style={{ justifyContent: 'center' }}
                                            >
                                                🖨️ Print Slip
                                            </button>
                                            <a 
                                                href={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'https://bss-ssiti-erp-and-fee-system.onrender.com' : 'http://localhost:4000'}${result.receipt?.pdfUrl?.startsWith('/api') ? result.receipt.pdfUrl : `/api${result.receipt?.pdfUrl}`}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-primary" 
                                                style={{ justifyContent: 'center' }}
                                            >
                                                📄 PDF Receipt
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
                                                <span className="text-muted">Fee Head:</span>
                                                <span className="badge badge-primary">{form.feeHeadType === 'CUSTOM' ? (form.customFeeHeadName || 'Custom Fee') : form.feeHeadLabel}</span>
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
                                            Select a student on the left to view live fee component breakdown & receipt calculation preview.
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
                <Footer />
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
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="grid grid-2 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Class / Trade <span className="required">*</span></label>
                                        <select className="form-control" value={quickAddForm.class}
                                            onChange={(e) => setQuickAddForm(f => ({ ...f, class: e.target.value }))}>
                                            <option value="Electrician">Electrician</option>
                                            <option value="Fitter">Fitter</option>
                                            <option value="Welder">Welder</option>
                                            <option value="Mechanic">Mechanic</option>
                                            <option value="COPA">COPA</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section</label>
                                        <input className="form-control" value={quickAddForm.section}
                                            onChange={(e) => setQuickAddForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" />
                                    </div>
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Roll Number (Optional)</label>
                                    <input className="form-control" value={quickAddForm.rollNumber}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 101" />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Parent / Guardian Name</label>
                                    <input className="form-control" value={quickAddForm.parentName}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Suresh Sharma" />
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Parent Phone</label>
                                    <input className="form-control" type="tel" value={quickAddForm.parentPhone}
                                        onChange={(e) => setQuickAddForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="e.g. 9876543210" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={quickAdding}>
                                    {quickAdding ? 'Admitting...' : '✅ Save & Select Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
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
        <Suspense fallback={<div className="layout-loading"><div className="spinner" /></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}
