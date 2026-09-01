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

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'DD', 'CARD', 'NET_BANKING', 'RAZORPAY', 'OTHER'];
const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function PaymentsContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [students, setStudents] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    
    // Allocation Mode: 'MULTI' (Component Breakdown) | 'SUPPLEMENTARY' (Back Paper Exam Fee) | 'LUMP_SUM' (Quick General Balance)
    const [allocationMode, setAllocationMode] = useState<'MULTI' | 'SUPPLEMENTARY' | 'LUMP_SUM'>('MULTI');

    // Multi-Component Fee Heads Breakdown State
    const [multiBreakdown, setMultiBreakdown] = useState({
        tuition: '',
        exam: '',
        dressMaterial: '',
        other: '',
        otherName: 'Other ITI / Workshop Dues',
        custom: '',
        customName: ''
    });

    // Supplementary / Back Paper Exam State
    const [supplementaryForm, setSupplementaryForm] = useState({
        subject: '',
        examSession: 'Winter 2026 / Regular Supplementary',
        amount: ''
    });

    // Main Payment Form state
    const [form, setForm] = useState({ 
        amount: '', 
        mode: 'CASH', 
        transactionRef: '', 
        bankName: '', 
        chequeDate: '',
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
        const saved = safeStorage.get<any>('draft_fee_payment_v2', null);
        if (saved && (saved.form?.amount || saved.form?.transactionRef || saved.multiBreakdown?.tuition || saved.supplementaryForm?.subject)) {
            setHasPaymentDraft(true);
            setPaymentDraftTime(saved.savedAt);
        }
    }, []);

    useEffect(() => {
        if (form.amount || form.transactionRef || multiBreakdown.tuition || multiBreakdown.dressMaterial || supplementaryForm.amount) {
            const timer = setTimeout(() => {
                safeStorage.set('draft_fee_payment_v2', {
                    allocationMode,
                    multiBreakdown,
                    supplementaryForm,
                    form,
                    savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [form, allocationMode, multiBreakdown, supplementaryForm]);

    const handleRestorePaymentDraft = () => {
        const saved = safeStorage.get<any>('draft_fee_payment_v2', null);
        if (saved) {
            if (saved.allocationMode) setAllocationMode(saved.allocationMode);
            if (saved.multiBreakdown) setMultiBreakdown(saved.multiBreakdown);
            if (saved.supplementaryForm) setSupplementaryForm(saved.supplementaryForm);
            if (saved.form) setForm(saved.form);
            setHasPaymentDraft(false);
        }
    };

    const handleDiscardPaymentDraft = () => {
        safeStorage.remove('draft_fee_payment_v2');
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

    // Intelligent Fee Amount Resolvers (Admission vs Fee Structure vs Master Template)
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

    // Calculate Multi-Component Total and Update Form Amount & Remarks
    const updateMultiTotal = (nextBreakdown: typeof multiBreakdown) => {
        const t = parseFloat(nextBreakdown.tuition) || 0;
        const ex = parseFloat(nextBreakdown.exam) || 0;
        const dr = parseFloat(nextBreakdown.dressMaterial) || 0;
        const ot = parseFloat(nextBreakdown.other) || 0;
        const cs = parseFloat(nextBreakdown.custom) || 0;
        const sum = t + ex + dr + ot + cs;

        const parts: string[] = [];
        if (t > 0) parts.push(`Tuition: ₹${t.toLocaleString('en-IN')}`);
        if (ex > 0) parts.push(`Exam: ₹${ex.toLocaleString('en-IN')}`);
        if (dr > 0) parts.push(`Dress Material: ₹${dr.toLocaleString('en-IN')}`);
        if (ot > 0) parts.push(`${nextBreakdown.otherName || 'Other'}: ₹${ot.toLocaleString('en-IN')}`);
        if (cs > 0) parts.push(`${nextBreakdown.customName || 'Custom Fee'}: ₹${cs.toLocaleString('en-IN')}`);

        const generatedRemarks = parts.length > 0 ? parts.join(' | ') : 'Fee Payment Received';

        setForm(f => ({
            ...f,
            amount: sum > 0 ? sum.toString() : '',
            remarks: generatedRemarks
        }));
    };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        setSelectedStudent(student || null);
        if (student && student.studentFees && student.studentFees.length > 0) {
            const sf = student.studentFees[0];
            setSelectedFee(sf);
            const due = (sf.totalAmount - sf.paidAmount) / 100;
            
            // Set default multi-breakdown prefill
            const initialMulti = {
                tuition: due > 0 ? due.toString() : '',
                exam: '',
                dressMaterial: '',
                other: '',
                otherName: 'Other ITI / Workshop Dues',
                custom: '',
                customName: ''
            };
            setMultiBreakdown(initialMulti);
            updateMultiTotal(initialMulti);
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
            if (isNaN(amountPaise) || amountPaise <= 0) {
                throw new Error('Please enter a valid payment amount greater than 0');
            }

            let effectiveFeesFor = selectedFee.feeStructure?.name || 'Academic Fee';
            let isSupplementary = false;
            let supplementarySubject = '';
            let feeBreakdown: Array<{ name: string; amount: number }> = [];

            if (allocationMode === 'SUPPLEMENTARY') {
                isSupplementary = true;
                supplementarySubject = supplementaryForm.subject.trim() || 'Back Paper / Supplementary Exam';
                effectiveFeesFor = `Supplementary / Back Paper Exam Fee: ${supplementarySubject}`;
            } else if (allocationMode === 'MULTI') {
                const t = parseFloat(multiBreakdown.tuition) || 0;
                const ex = parseFloat(multiBreakdown.exam) || 0;
                const dr = parseFloat(multiBreakdown.dressMaterial) || 0;
                const ot = parseFloat(multiBreakdown.other) || 0;
                const cs = parseFloat(multiBreakdown.custom) || 0;

                if (t > 0) feeBreakdown.push({ name: 'Tuition Fees', amount: Math.round(t * 100) });
                if (ex > 0) feeBreakdown.push({ name: 'Exam Fees', amount: Math.round(ex * 100) });
                if (dr > 0) feeBreakdown.push({ name: 'Dress Material & Uniform Fees', amount: Math.round(dr * 100) });
                if (ot > 0) feeBreakdown.push({ name: multiBreakdown.otherName || 'Other ITI Dues', amount: Math.round(ot * 100) });
                if (cs > 0) feeBreakdown.push({ name: multiBreakdown.customName || 'Custom Fee Head', amount: Math.round(cs * 100) });

                effectiveFeesFor = feeBreakdown.map(b => `${b.name} (₹${(b.amount / 100).toLocaleString('en-IN')})`).join(', ') || 'Academic Course Fee';
            }

            const { data } = await api.post('/payments', {
                studentFeeId: selectedFee.id,
                amount: amountPaise,
                mode: form.mode,
                transactionRef: form.transactionRef || undefined,
                bankName: form.bankName || undefined,
                chequeDate: form.chequeDate || undefined,
                remarks: form.remarks || `Paid towards ${effectiveFeesFor}`,
                feesFor: effectiveFeesFor,
                isSupplementary,
                supplementarySubject: isSupplementary ? supplementarySubject : undefined,
                feeBreakdown: feeBreakdown.length > 0 ? feeBreakdown : undefined,
            });
            
            setResult(data.data);
            showToast('✅ Payment recorded! Receipt generated.');
            safeStorage.remove('draft_fee_payment_v2');
            setHasPaymentDraft(false);
            
            // Reset form
            setForm({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', chequeDate: '', remarks: '' });
            setMultiBreakdown({ tuition: '', exam: '', dressMaterial: '', other: '', otherName: 'Other ITI / Workshop Dues', custom: '', customName: '' });
            setSupplementaryForm({ subject: '', examSession: 'Winter 2026 / Regular Supplementary', amount: '' });

            // Refresh student fee data
            if (selectedStudent) {
                const refreshed = await api.get(`/students/${selectedStudent.id}`);
                setSelectedStudent(refreshed.data.data);
                if (refreshed.data.data.studentFees) {
                    setSelectedFee(refreshed.data.data.studentFees.find((f: any) => f.id === selectedFee.id) || refreshed.data.data.studentFees[0]);
                }
            }
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || err.message || 'Payment failed'}`);
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
                        <div className="header-title">💳 Record Payment & Fee Allocation</div>
                        <div className="header-subtitle">Pay towards multiple fee heads (Tuition, Dress, Exam), issue back-paper supplementary exam fees, and generate official receipts</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowQuickAddModal(true)}>
                        ➕ Quick Add Student
                    </button>
                </header>

                <div className="page-content">
                    <div className="grid" style={{ gridTemplateColumns: '1.25fr 1fr', gap: 24, alignItems: 'flex-start' }}>
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
                                    <div className="card-header"><div className="card-title">Step 2: Payment Allocation & Fee Head Breakdown</div></div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="card-body">
                                            <AutoRecoverBanner
                                                show={hasPaymentDraft}
                                                savedAt={paymentDraftTime}
                                                onRestore={handleRestorePaymentDraft}
                                                onDiscard={handleDiscardPaymentDraft}
                                            />

                                            {/* Balance summary */}
                                            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, textAlign: 'center' }}>
                                                {[
                                                    { label: 'Total Agreed Fee', value: formatRupees(selectedFee.totalAmount) },
                                                    { label: 'Paid Till Date', value: formatRupees(selectedFee.paidAmount), color: 'var(--accent)' },
                                                    { label: 'Regular Balance Due', value: formatRupees(pendingBalance), color: pendingBalance > 0 ? 'var(--danger)' : 'var(--accent)' },
                                                ].map((item) => (
                                                    <div key={item.label}>
                                                        <div className="text-xs text-muted">{item.label}</div>
                                                        <div className="font-bold" style={{ fontSize: 16, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ─── 3 ALLOCATION MODE SWITCHER TABS ───────────────────────── */}
                                            <div style={{ marginBottom: 16 }}>
                                                <label className="form-label font-bold" style={{ color: 'var(--primary)', marginBottom: 8, display: 'block' }}>
                                                    🎯 Fee Allocation Method
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1fr', gap: 8 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAllocationMode('MULTI');
                                                            updateMultiTotal(multiBreakdown);
                                                        }}
                                                        style={{
                                                            padding: '10px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                            border: allocationMode === 'MULTI' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                            background: allocationMode === 'MULTI' ? 'var(--surface)' : 'var(--surface-2)',
                                                            color: allocationMode === 'MULTI' ? 'var(--primary)' : 'var(--text-secondary)',
                                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <span>🧩 Multi-Component Fee</span>
                                                        <span style={{ fontSize: 10, opacity: 0.8 }}>Split (Tuition, Dress, Exam)</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAllocationMode('SUPPLEMENTARY');
                                                            const amt = parseFloat(supplementaryForm.amount) || 0;
                                                            setForm(f => ({
                                                                ...f,
                                                                amount: amt > 0 ? amt.toString() : '',
                                                                remarks: `Supplementary Exam Fee - ${supplementaryForm.subject || 'Back Paper'}`
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: '10px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                            border: allocationMode === 'SUPPLEMENTARY' ? '2px solid #d97706' : '1px solid var(--border)',
                                                            background: allocationMode === 'SUPPLEMENTARY' ? '#fffbeb' : 'var(--surface-2)',
                                                            color: allocationMode === 'SUPPLEMENTARY' ? '#b45309' : 'var(--text-secondary)',
                                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <span>📋 Back Paper / Supp. Fee</span>
                                                        <span style={{ fontSize: 10, color: '#d97706', fontWeight: 800 }}>⚡ Independent (No Deduction)</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAllocationMode('LUMP_SUM');
                                                            const due = (selectedFee.totalAmount - selectedFee.paidAmount) / 100;
                                                            setForm(f => ({
                                                                ...f,
                                                                amount: due > 0 ? due.toString() : '',
                                                                remarks: 'Paid towards Academic Course Fee'
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: '10px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                            border: allocationMode === 'LUMP_SUM' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                            background: allocationMode === 'LUMP_SUM' ? 'var(--surface)' : 'var(--surface-2)',
                                                            color: allocationMode === 'LUMP_SUM' ? 'var(--primary)' : 'var(--text-secondary)',
                                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <span>🏢 Lump-Sum Balance</span>
                                                        <span style={{ fontSize: 10, opacity: 0.8 }}>General Course Balance</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ─── OPTION 1: MULTI-COMPONENT SPLIT ALLOCATION ────────────── */}
                                            {allocationMode === 'MULTI' && (
                                                <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 16 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                        <span className="font-bold" style={{ fontSize: 13, color: 'var(--primary)' }}>
                                                            🧩 Itemized Fee Breakdown (Enter Amounts to Auto-Sum)
                                                        </span>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ fontSize: 11, padding: '2px 8px' }}
                                                                onClick={() => {
                                                                    const stdDress = getDressMaterialAmount().toString();
                                                                    const updated = { ...multiBreakdown, dressMaterial: stdDress };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            >
                                                                + Add Dress (₹{getDressMaterialAmount().toLocaleString('en-IN')})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ fontSize: 11, padding: '2px 8px' }}
                                                                onClick={() => {
                                                                    const stdExam = getExamAmount().toString();
                                                                    const updated = { ...multiBreakdown, exam: stdExam };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            >
                                                                + Add Exam (₹{getExamAmount().toLocaleString('en-IN')})
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-2" style={{ gap: 10 }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>🎓 Tuition Fees (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 13 }}
                                                                placeholder={`e.g. ${getTuitionAmount()}`}
                                                                value={multiBreakdown.tuition}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, tuition: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>🥼 Dress Material / Uniform (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 13 }}
                                                                placeholder={`e.g. ${getDressMaterialAmount()}`}
                                                                value={multiBreakdown.dressMaterial}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, dressMaterial: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>📝 Regular Examination Fees (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 13 }}
                                                                placeholder={`e.g. ${getExamAmount()}`}
                                                                value={multiBreakdown.exam}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, exam: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12 }}>📦 Other ITI / Workshop Dues (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 13 }}
                                                                placeholder="e.g. 500"
                                                                value={multiBreakdown.other}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, other: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Custom Fee Head in Multi-Mode */}
                                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 11 }}>➕ Add Custom Fee Head (Optional)</label>
                                                            <input
                                                                className="form-control"
                                                                style={{ fontSize: 12 }}
                                                                placeholder="e.g. Tool Kit, Caution Deposit..."
                                                                value={multiBreakdown.customName}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, customName: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 11 }}>Custom Amount (₹)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 12 }}
                                                                placeholder="₹ Amount"
                                                                value={multiBreakdown.custom}
                                                                onChange={(e) => {
                                                                    const updated = { ...multiBreakdown, custom: e.target.value };
                                                                    setMultiBreakdown(updated);
                                                                    updateMultiTotal(updated);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ─── OPTION 2: SUPPLEMENTARY / BACK PAPER EXAM FEE ──────────── */}
                                            {allocationMode === 'SUPPLEMENTARY' && (
                                                <div style={{ background: '#fffbeb', padding: 14, borderRadius: 10, border: '1.5px solid #f59e0b', marginBottom: 16 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                        <span style={{ fontSize: 18 }}>🛡️</span>
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#b45309' }}>
                                                                Supplementary / Back Paper Exam Fee
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#78350f' }}>
                                                                ⚡ <b>Non-Deductible Guarantee:</b> This examination fee is tracked independently. It will <b>NOT</b> reduce or deduct from the student's regular tuition/course fee balance.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-2" style={{ gap: 10, marginTop: 10 }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12, color: '#92400e' }}>Back Paper / Subject Name(s) <span className="required">*</span></label>
                                                            <input
                                                                className="form-control"
                                                                style={{ fontSize: 13, borderColor: '#fcd34d' }}
                                                                placeholder="e.g. Theory Paper II, Practical, Workshop Calc"
                                                                value={supplementaryForm.subject}
                                                                onChange={(e) => {
                                                                    const subj = e.target.value;
                                                                    setSupplementaryForm(s => ({ ...s, subject: subj }));
                                                                    setForm(f => ({ ...f, remarks: `Supplementary Exam Fee - ${subj || 'Back Paper'}` }));
                                                                }}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: 12, color: '#92400e' }}>Supplementary Exam Fee (₹) <span className="required">*</span></label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                style={{ fontSize: 13, borderColor: '#fcd34d' }}
                                                                placeholder="e.g. 1200"
                                                                value={supplementaryForm.amount}
                                                                onChange={(e) => {
                                                                    const amt = e.target.value;
                                                                    setSupplementaryForm(s => ({ ...s, amount: amt }));
                                                                    setForm(f => ({ ...f, amount: amt }));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ─── OPTION 3: LUMP-SUM BALANCE ───────────────────────────── */}
                                            {allocationMode === 'LUMP_SUM' && (
                                                <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 16 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                                                        🏢 General Academic Course Balance Payment
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                        Enter any direct lump sum amount to be applied towards the student's overall outstanding course fee balance.
                                                    </div>
                                                </div>
                                            )}

                                            {/* ─── PAYMENT TRANSACTION DETAILS & MODES ──────────────────── */}
                                            <div className="grid grid-2">
                                                <div className="form-group">
                                                    <label className="form-label font-bold" style={{ color: 'var(--primary)' }}>
                                                        Total Payment Amount (₹ INR) <span className="required">*</span>
                                                    </label>
                                                    <input 
                                                        className="form-control" 
                                                        type="number" 
                                                        step="1" 
                                                        min="1"
                                                        required 
                                                        value={form.amount}
                                                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                        placeholder="Total Amount in ₹" 
                                                        style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label font-bold">Payment Mode <span className="required">*</span></label>
                                                    <select 
                                                        className="form-control" 
                                                        value={form.mode}
                                                        onChange={(e) => setForm(f => ({ ...f, mode: e.target.value }))}
                                                        style={{ fontWeight: 600 }}
                                                    >
                                                        {PAYMENT_MODES.map((m) => (
                                                            <option key={m} value={m}>
                                                                {m === 'CASH' && '💵 CASH'}
                                                                {m === 'UPI' && '📱 UPI (GPay / PhonePe / Paytm / BHIM)'}
                                                                {m === 'BANK_TRANSFER' && '🏦 Bank Transfer (NEFT / RTGS / IMPS)'}
                                                                {m === 'CHEQUE' && '🧾 Cheque'}
                                                                {m === 'DD' && '🏛️ Demand Draft (DD)'}
                                                                {m === 'CARD' && '💳 Debit / Credit Card'}
                                                                {m === 'NET_BANKING' && '💻 Net Banking'}
                                                                {m === 'RAZORPAY' && '⚡ Online Gateway (Razorpay)'}
                                                                {m === 'OTHER' && '💼 Other Mode'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Context-Aware Payment Mode Reference Fields */}
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        {form.mode === 'CHEQUE' ? 'Cheque Number' : form.mode === 'DD' ? 'DD Number' : form.mode === 'UPI' ? 'UPI UTR / Trx ID' : 'Transaction / Reference No.'}
                                                    </label>
                                                    <input 
                                                        className="form-control" 
                                                        value={form.transactionRef}
                                                        onChange={(e) => setForm(f => ({ ...f, transactionRef: e.target.value }))}
                                                        placeholder={form.mode === 'CHEQUE' ? 'e.g. CHQ-849201' : form.mode === 'DD' ? 'e.g. DD-09281' : 'e.g. UTR / Ref number'} 
                                                    />
                                                </div>

                                                {(form.mode === 'CHEQUE' || form.mode === 'DD' || form.mode === 'BANK_TRANSFER') && (
                                                    <div className="form-group">
                                                        <label className="form-label">Bank Name</label>
                                                        <input 
                                                            className="form-control" 
                                                            value={form.bankName}
                                                            onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))} 
                                                            placeholder="e.g. State Bank of India, HDFC Bank" 
                                                        />
                                                    </div>
                                                )}

                                                {(form.mode === 'CHEQUE' || form.mode === 'DD') && (
                                                    <div className="form-group">
                                                        <label className="form-label">{form.mode === 'DD' ? 'DD Date' : 'Cheque Date'}</label>
                                                        <input 
                                                            type="date"
                                                            className="form-control" 
                                                            value={form.chequeDate}
                                                            onChange={(e) => setForm(f => ({ ...f, chequeDate: e.target.value }))} 
                                                        />
                                                    </div>
                                                )}

                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label className="form-label">Remarks / Note (Printed on Receipt)</label>
                                                    <input 
                                                        className="form-control" 
                                                        value={form.remarks}
                                                        onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} 
                                                        placeholder="Note for receipt" 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                                            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !form.amount} style={{ width: '100%', justifyContent: 'center' }}>
                                                {saving ? '⏳ Processing & Generating Receipt...' : `✅ Record Payment (₹${(parseFloat(form.amount) || 0).toLocaleString('en-IN')})`}
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-lg"
                                                disabled={saving || !selectedFee || !form.amount}
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

                                                        const effectiveFeesFor = allocationMode === 'SUPPLEMENTARY'
                                                            ? `Supplementary / Back Paper Exam Fee: ${supplementaryForm.subject || 'Back Paper'}`
                                                            : form.remarks || 'Academic Fee';

                                                        const options = {
                                                            key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_TEUu7W94JCplrN',
                                                            amount: order.amount,
                                                            currency: order.currency,
                                                            name: 'Shri Sai I.T.I',
                                                            description: `Fee Payment - ${selectedStudent.name} (${effectiveFeesFor.substring(0, 30)})`,
                                                            order_id: order.id,
                                                            handler: async function (response: any) {
                                                                try {
                                                                    const { data: verifyRes } = await api.post('/payments/razorpay/verify', {
                                                                        razorpayOrderId: response.razorpay_order_id || order.id,
                                                                        razorpayPaymentId: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                                                        razorpaySignature: response.razorpay_signature || 'mock_signature',
                                                                        studentFeeId: selectedFee.id,
                                                                        amount: order.amount,
                                                                        feesFor: effectiveFeesFor,
                                                                        remarks: form.remarks || `Paid towards ${effectiveFeesFor}`,
                                                                        isSupplementary: allocationMode === 'SUPPLEMENTARY',
                                                                        supplementarySubject: allocationMode === 'SUPPLEMENTARY' ? supplementaryForm.subject : undefined
                                                                    });
                                                                    if (verifyRes.success) {
                                                                        setResult(verifyRes.data);
                                                                        showToast('✅ Razorpay Payment Successful! Receipt generated.');
                                                                        setForm({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', chequeDate: '', remarks: '' });
                                                                    }
                                                                } catch (err: any) {
                                                                    showToast(`❌ Verification error: ${err.message}`);
                                                                }
                                                            },
                                                            prefill: { name: selectedStudent.name, phone: selectedStudent.parent?.phone || '' },
                                                            theme: { color: '#0f172a' }
                                                        };

                                                        if (order.id.startsWith('order_mock_')) {
                                                            const confirmPay = window.confirm(`[SANDBOX GATEWAY] Pay ₹${(amountPaise / 100).toLocaleString('en-IN')} towards ${effectiveFeesFor} via Razorpay?`);
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
                                            
                                            {/* Allocation Mode Preview */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Allocation Mode:</span>
                                                <span className="badge" style={{
                                                    background: allocationMode === 'SUPPLEMENTARY' ? '#fef3c7' : 'var(--surface-2)',
                                                    color: allocationMode === 'SUPPLEMENTARY' ? '#b45309' : 'var(--primary)',
                                                    fontWeight: 700
                                                }}>
                                                    {allocationMode === 'MULTI' && '🧩 Multi-Component'}
                                                    {allocationMode === 'SUPPLEMENTARY' && '📋 Supplementary Exam'}
                                                    {allocationMode === 'LUMP_SUM' && '🏢 General Balance'}
                                                </span>
                                            </div>

                                            {/* Multi-Component Breakdown List in Preview */}
                                            {allocationMode === 'MULTI' && (
                                                <div style={{ margin: '8px 0', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Fee Heads Itemized:</div>
                                                    {parseFloat(multiBreakdown.tuition) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                            <span>🎓 Tuition Fee:</span>
                                                            <b>₹{parseFloat(multiBreakdown.tuition).toLocaleString('en-IN')}</b>
                                                        </div>
                                                    )}
                                                    {parseFloat(multiBreakdown.dressMaterial) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                            <span>🥼 Dress Material:</span>
                                                            <b>₹{parseFloat(multiBreakdown.dressMaterial).toLocaleString('en-IN')}</b>
                                                        </div>
                                                    )}
                                                    {parseFloat(multiBreakdown.exam) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                            <span>📝 Exam Fee:</span>
                                                            <b>₹{parseFloat(multiBreakdown.exam).toLocaleString('en-IN')}</b>
                                                        </div>
                                                    )}
                                                    {parseFloat(multiBreakdown.other) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                            <span>📦 {multiBreakdown.otherName || 'Other Dues'}:</span>
                                                            <b>₹{parseFloat(multiBreakdown.other).toLocaleString('en-IN')}</b>
                                                        </div>
                                                    )}
                                                    {parseFloat(multiBreakdown.custom) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                            <span>➕ {multiBreakdown.customName || 'Custom Fee'}:</span>
                                                            <b>₹{parseFloat(multiBreakdown.custom).toLocaleString('en-IN')}</b>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Supplementary Exam Details in Preview */}
                                            {allocationMode === 'SUPPLEMENTARY' && (
                                                <div style={{ margin: '8px 0', padding: '8px 10px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fcd34d' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                                                        🛡️ Back Paper / Supplementary Exam
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                        <span style={{ color: '#78350f' }}>Paper / Subject:</span>
                                                        <b style={{ color: '#78350f' }}>{supplementaryForm.subject || 'Not specified'}</b>
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>
                                                        * Regular course tuition balance remains unchanged.
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Payment Mode:</span>
                                                <span className="badge badge-info">{form.mode}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                                                <span className="font-bold">Total Amount Receiving:</span>
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

            {/* Full-Screen Interactive QR Code & Image Viewer Modal */}
            {viewImageModal && (
                <div className="modal-overlay" onClick={() => setViewImageModal(null)} style={{ backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.85)', zIndex: 9999 }}>
                    <div className="modal" style={{ maxWidth: 460, textAlign: 'center', background: 'var(--surface)', border: '2px solid var(--primary)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
                            <div className="modal-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                                🔍 {viewImageModal.title}
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewImageModal(null)} style={{ fontSize: 18 }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ background: '#ffffff', padding: 16, borderRadius: 16, border: '2px solid #0284c7', boxShadow: '0 10px 30px rgba(2, 132, 199, 0.25)', display: 'inline-block', marginBottom: 16 }}>
                                <img
                                    src={viewImageModal.url}
                                    alt={viewImageModal.title}
                                    style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block', borderRadius: 8 }}
                                />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-dark, #0369a1)', marginBottom: 4 }}>
                                M/S. SHREE SAI KHAJAGI AUDYOGIK PRASHIKSHAN SANSTHA
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                Scan with any UPI app: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay
                            </div>
                            <div style={{ fontSize: 11, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 20, color: 'var(--text-muted)' }}>
                                💡 Tip: Keep phone camera steady over the QR code to auto-detect payment amount
                            </div>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center', gap: 10, background: 'var(--surface-2)', borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
                            <a
                                href={viewImageModal.url}
                                download={viewImageModal.filename}
                                className="btn btn-primary"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                            >
                                📥 Download QR Code
                            </a>
                            <button className="btn btn-secondary" onClick={() => setViewImageModal(null)}>Close</button>
                        </div>
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
