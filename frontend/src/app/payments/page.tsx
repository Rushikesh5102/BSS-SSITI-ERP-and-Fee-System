'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { safeStorage } from '../../utils/safeStorage';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'DD', 'CARD', 'NET_BANKING', 'RAZORPAY', 'OTHER'];
const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

// Dynamic Fee Head Items with Dropdowns (matching Fee Structure style)
interface PaymentFeeItem {
    type: 'TUITION' | 'DRESS_MATERIAL' | 'EXAM' | 'SUPPLEMENTARY' | 'BALANCE' | 'OTHER' | 'CUSTOM';
    name?: string;
    subject?: string;
    amount: string;
}

// Split / Multi-Mode Payment Item
interface SplitPaymentItem {
    mode: string;
    amount: string;
    transactionRef?: string;
    bankName?: string;
    chequeDate?: string;
}

function PaymentsContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [students, setStudents] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    
    // Clean initial fee items - strictly no pre-filled amounts
    const [feeItems, setFeeItems] = useState<PaymentFeeItem[]>([
        { type: 'TUITION', amount: '' }
    ]);

    // Split / Multi-Mode Payment State - clean empty amounts
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    const [splitItems, setSplitItems] = useState<SplitPaymentItem[]>([
        { mode: 'CASH', amount: '', transactionRef: '' },
        { mode: 'UPI', amount: '', transactionRef: '' }
    ]);

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

    // Ensure any legacy draft cache is purged on load
    useEffect(() => {
        safeStorage.remove('draft_fee_payment_v3');
    }, []);

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

    // Calculate Dynamic Fee Heads Total and Update Form Amount & Remarks
    const updatePaymentTotals = (items: PaymentFeeItem[]) => {
        let sum = 0;
        const parts: string[] = [];

        items.forEach(item => {
            const amt = parseFloat(item.amount) || 0;
            sum += amt;
            if (amt > 0) {
                let label = 'Fee';
                if (item.type === 'TUITION') label = 'Tuition';
                else if (item.type === 'DRESS_MATERIAL') label = 'Dress Material';
                else if (item.type === 'EXAM') label = 'Exam Fee';
                else if (item.type === 'SUPPLEMENTARY') label = `Supp. Exam (${item.subject?.trim() || 'Back Paper'})`;
                else if (item.type === 'BALANCE') label = 'Course Balance';
                else if (item.type === 'OTHER') label = item.name?.trim() || 'Other ITI Dues';
                else if (item.type === 'CUSTOM') label = item.name?.trim() || 'Custom Fee';

                parts.push(`${label}: ₹${amt.toLocaleString('en-IN')}`);
            }
        });

        setForm(f => ({
            ...f,
            amount: sum > 0 ? sum.toString() : '',
            remarks: parts.length > 0 ? parts.join(' | ') : 'Fee Payment Received'
        }));
    };

    const addFeeItem = () => {
        const usedTypes = feeItems.map(i => i.type);
        let nextType: PaymentFeeItem['type'] = 'DRESS_MATERIAL';
        if (!usedTypes.includes('DRESS_MATERIAL')) nextType = 'DRESS_MATERIAL';
        else if (!usedTypes.includes('EXAM')) nextType = 'EXAM';
        else if (!usedTypes.includes('SUPPLEMENTARY')) nextType = 'SUPPLEMENTARY';
        else if (!usedTypes.includes('OTHER')) nextType = 'OTHER';
        else nextType = 'CUSTOM';

        const updated: PaymentFeeItem[] = [...feeItems, { type: nextType, amount: '', name: '', subject: '' }];
        setFeeItems(updated);
        updatePaymentTotals(updated);
    };

    const removeFeeItem = (idx: number) => {
        if (feeItems.length <= 1) return;
        const updated = feeItems.filter((_, i) => i !== idx);
        setFeeItems(updated);
        updatePaymentTotals(updated);
    };

    const updateFeeItem = (idx: number, field: keyof PaymentFeeItem, val: string) => {
        const updated = feeItems.map((item, i) => {
            if (i !== idx) return item;
            return { ...item, [field]: val };
        });
        setFeeItems(updated);
        updatePaymentTotals(updated);
    };

    // ─── Split / Multi-Mode Payment Helpers ────────────────────────────────────
    const addSplitItem = () => {
        const usedModes = splitItems.map(i => i.mode);
        let nextMode = 'UPI';
        if (!usedModes.includes('UPI')) nextMode = 'UPI';
        else if (!usedModes.includes('BANK_TRANSFER')) nextMode = 'BANK_TRANSFER';
        else if (!usedModes.includes('CHEQUE')) nextMode = 'CHEQUE';
        else nextMode = 'CARD';

        setSplitItems(prev => [...prev, { mode: nextMode, amount: '', transactionRef: '' }]);
    };

    const removeSplitItem = (idx: number) => {
        if (splitItems.length <= 1) return;
        setSplitItems(prev => prev.filter((_, i) => i !== idx));
    };

    const updateSplitItem = (idx: number, field: keyof SplitPaymentItem, val: string) => {
        setSplitItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    };

    const autoFillSplitRemainder = (idx: number) => {
        const targetTotal = parseFloat(form.amount) || 0;
        const currentOtherSum = splitItems
            .filter((_, i) => i !== idx)
            .reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        const remainder = Math.max(0, targetTotal - currentOtherSum);
        updateSplitItem(idx, 'amount', remainder > 0 ? remainder.toString() : '');
    };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find((s) => s.id === studentId);
        setSelectedStudent(student || null);
        if (student && student.studentFees && student.studentFees.length > 0) {
            const sf = student.studentFees[0];
            setSelectedFee(sf);
            
            // Clean initial state with zero prefilled numbers
            const initial: PaymentFeeItem[] = [
                { type: 'TUITION', amount: '' }
            ];
            setFeeItems(initial);
            setForm(f => ({ ...f, amount: '', remarks: '' }));
            setSplitItems([
                { mode: 'CASH', amount: '', transactionRef: '' },
                { mode: 'UPI', amount: '', transactionRef: '' }
            ]);
        } else {
            setSelectedFee(null);
            setFeeItems([{ type: 'TUITION', amount: '' }]);
            setForm(f => ({ ...f, amount: '', remarks: '' }));
        }
        setResult(null);
    };

    const handleClearAllFields = () => {
        setFeeItems([{ type: 'TUITION', amount: '' }]);
        setForm({
            amount: '',
            mode: 'CASH',
            transactionRef: '',
            bankName: '',
            chequeDate: '',
            remarks: ''
        });
        setSplitItems([
            { mode: 'CASH', amount: '', transactionRef: '' },
            { mode: 'UPI', amount: '', transactionRef: '' }
        ]);
        setIsSplitPayment(false);
        showToast('🧹 All payment fields cleared!');
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

            const isSupplementary = feeItems.some(i => i.type === 'SUPPLEMENTARY');
            const suppItems = feeItems.filter(i => i.type === 'SUPPLEMENTARY');
            const supplementarySubject = suppItems.map(i => i.subject?.trim() || 'Back Paper / Supplementary Exam').join(', ');

            const feeBreakdown = feeItems
                .filter(i => (parseFloat(i.amount) || 0) > 0)
                .map(i => {
                    let name = 'Fee';
                    if (i.type === 'TUITION') name = 'Tuition Fees';
                    else if (i.type === 'DRESS_MATERIAL') name = 'Dress Material & Uniform Fees';
                    else if (i.type === 'EXAM') name = 'Regular Examination Fees';
                    else if (i.type === 'SUPPLEMENTARY') name = `Supplementary Exam (${i.subject?.trim() || 'Back Paper'})`;
                    else if (i.type === 'BALANCE') name = 'General Course Balance';
                    else if (i.type === 'OTHER') name = i.name?.trim() || 'Other ITI Dues';
                    else if (i.type === 'CUSTOM') name = i.name?.trim() || 'Custom Fee Head';

                    return {
                        name,
                        amount: Math.round((parseFloat(i.amount) || 0) * 100)
                    };
                });

            const effectiveFeesFor = isSupplementary && feeItems.length === 1
                ? `Supplementary / Back Paper Exam Fee: ${supplementarySubject}`
                : feeBreakdown.map(b => `${b.name} (₹${(b.amount / 100).toLocaleString('en-IN')})`).join(', ') || selectedFee.feeStructure?.name || 'Academic Course Fee';

            // Split Payment validation & payload construction
            let splitPaymentPayload: any = undefined;
            if (isSplitPayment) {
                const validSplits = splitItems
                    .filter(i => (parseFloat(i.amount) || 0) > 0)
                    .map(i => ({
                        mode: i.mode,
                        amount: Math.round((parseFloat(i.amount) || 0) * 100),
                        transactionRef: i.transactionRef?.trim() || undefined,
                        bankName: i.bankName?.trim() || undefined,
                        chequeDate: i.chequeDate || undefined
                    }));

                if (validSplits.length === 0) {
                    throw new Error('Please enter amounts for the split payment modes');
                }

                const splitSumPaise = validSplits.reduce((acc, i) => acc + i.amount, 0);
                if (Math.abs(splitSumPaise - amountPaise) > 1) {
                    throw new Error(`Sum of split modes (₹${(splitSumPaise / 100).toLocaleString('en-IN')}) must equal total payment amount (₹${(amountPaise / 100).toLocaleString('en-IN')})`);
                }

                splitPaymentPayload = validSplits;
            }

            const { data } = await api.post('/payments', {
                studentFeeId: selectedFee.id,
                amount: amountPaise,
                mode: isSplitPayment ? 'SPLIT' : form.mode,
                transactionRef: form.transactionRef || undefined,
                bankName: form.bankName || undefined,
                chequeDate: form.chequeDate || undefined,
                remarks: form.remarks || `Paid towards ${effectiveFeesFor}`,
                feesFor: effectiveFeesFor,
                isSupplementary,
                supplementarySubject: isSupplementary ? supplementarySubject : undefined,
                feeBreakdown: feeBreakdown.length > 0 ? feeBreakdown : undefined,
                splitPayment: splitPaymentPayload,
            });
            
            setResult(data.data);
            showToast('✅ Payment recorded! Receipt generated.');
            safeStorage.remove('draft_fee_payment_v3');
            
            // Reset form
            setForm({ amount: '', mode: 'CASH', transactionRef: '', bankName: '', chequeDate: '', remarks: '' });
            setFeeItems([{ type: 'TUITION', amount: '' }]);

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
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <div className="card-title">Step 2: Payment Allocation & Fee Head Breakdown</div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-xs"
                                            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px' }}
                                            onClick={handleClearAllFields}
                                            title="Clear all fee amounts, split modes, and remarks"
                                        >
                                            🧹 Clear All Fields
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="card-body">
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

                                            {/* ─── DYNAMIC FEE HEAD ITEMS LIST (DROPDOWN + CUSTOMIZATION) ─── */}
                                            <div style={{ marginBottom: 18 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <label className="form-label font-bold" style={{ color: 'var(--primary)', margin: 0, fontSize: 13 }}>
                                                        📋 Fee Heads & Component Allocation
                                                    </label>
                                                    <span className="text-xs text-muted">Select fee type & amount for each head</span>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    {feeItems.map((item, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            style={{ 
                                                                background: item.type === 'SUPPLEMENTARY' ? '#fffbeb' : 'var(--surface-2)', 
                                                                border: item.type === 'SUPPLEMENTARY' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
                                                                borderRadius: 8, 
                                                                padding: '12px 14px',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            <div style={{ display: 'grid', gridTemplateColumns: feeItems.length > 1 ? '1.3fr 1fr auto' : '1.3fr 1fr', gap: 10, alignItems: 'center' }}>
                                                                {/* Dropdown for Fee Head */}
                                                                <div>
                                                                    <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>
                                                                        Fee Category / Head #{idx + 1}
                                                                    </label>
                                                                    <select
                                                                        className="form-control"
                                                                        style={{ 
                                                                            fontSize: 13, fontWeight: 600,
                                                                            borderColor: item.type === 'SUPPLEMENTARY' ? '#f59e0b' : undefined 
                                                                        }}
                                                                        value={item.type}
                                                                        onChange={(e) => updateFeeItem(idx, 'type', e.target.value as any)}
                                                                    >
                                                                        <option value="TUITION">🎓 Tuition Fees</option>
                                                                        <option value="DRESS_MATERIAL">🥼 Dress Material & Uniform</option>
                                                                        <option value="EXAM">📝 Regular Examination Fees</option>
                                                                        <option value="SUPPLEMENTARY">📋 Supplementary / Back Paper Exam Fee</option>
                                                                        <option value="BALANCE">🏢 General Course Balance</option>
                                                                        <option value="OTHER">📦 Other ITI / Workshop Dues</option>
                                                                        <option value="CUSTOM">➕ Custom Fee Head (Write-in...)</option>
                                                                    </select>
                                                                </div>

                                                                {/* Amount Input */}
                                                                <div>
                                                                    <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>
                                                                        Amount (₹) <span className="required">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="1"
                                                                        min="0"
                                                                        className="form-control"
                                                                        style={{ 
                                                                            fontSize: 13, fontWeight: 700,
                                                                            borderColor: item.type === 'SUPPLEMENTARY' ? '#f59e0b' : undefined 
                                                                        }}
                                                                        placeholder="₹ Amount"
                                                                        value={item.amount}
                                                                        onChange={(e) => updateFeeItem(idx, 'amount', e.target.value)}
                                                                    />
                                                                </div>

                                                                {/* Remove Button */}
                                                                {feeItems.length > 1 && (
                                                                    <div style={{ paddingTop: 18 }}>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{ color: 'var(--danger)', padding: '6px 10px', fontSize: 13 }}
                                                                            onClick={() => removeFeeItem(idx)}
                                                                            title="Remove Fee Head"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Supplementary Back Paper Subject Input & Guarantee */}
                                                            {item.type === 'SUPPLEMENTARY' && (
                                                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #fcd34d' }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                                        <div>
                                                                            <label className="form-label" style={{ fontSize: 11, color: '#92400e', marginBottom: 2 }}>
                                                                                Back Paper / Subject Name(s) <span className="required">*</span>
                                                                            </label>
                                                                            <input
                                                                                className="form-control"
                                                                                style={{ fontSize: 12, borderColor: '#fcd34d', background: '#ffffff' }}
                                                                                placeholder="e.g. Theory Paper II, Practical, Workshop Calc..."
                                                                                value={item.subject || ''}
                                                                                onChange={(e) => updateFeeItem(idx, 'subject', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                                                                            ⚡ <b>Non-Deductible Guarantee:</b> Back paper fee is recorded independently and will <b>NOT</b> reduce the student's regular course tuition balance.
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Custom / Other Fee Head Name Input */}
                                                            {(item.type === 'CUSTOM' || item.type === 'OTHER') && (
                                                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                                                                    <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>
                                                                        {item.type === 'CUSTOM' ? 'Specify Custom Fee Head Name' : 'Specify Other ITI Dues Name'}
                                                                    </label>
                                                                    <input
                                                                        className="form-control"
                                                                        style={{ fontSize: 12 }}
                                                                        placeholder="e.g. Caution Deposit, Tool Kit, ID Card Reissue..."
                                                                        value={item.name || ''}
                                                                        onChange={(e) => updateFeeItem(idx, 'name', e.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* ➕ Add Fee Component Button (Like in Fee Structures) */}
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ 
                                                            border: '1.5px dashed var(--border)', 
                                                            justifyContent: 'center', 
                                                            padding: '8px 12px',
                                                            fontWeight: 700,
                                                            color: 'var(--primary)',
                                                            background: 'var(--surface)'
                                                        }}
                                                        onClick={addFeeItem}
                                                    >
                                                        ➕ Add Another Fee Component
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ─── PAYMENT TRANSACTION DETAILS & MODES ──────────────────── */}
                                            <div style={{ marginTop: 16 }}>
                                                {/* Mode Type Segmented Switcher */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                                    <label className="form-label font-bold" style={{ margin: 0, fontSize: 13, color: 'var(--primary)' }}>
                                                        💳 Payment Mode & Settlement Method
                                                    </label>
                                                    <div style={{ display: 'inline-flex', background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsSplitPayment(false)}
                                                            style={{
                                                                padding: '5px 12px',
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                borderRadius: 6,
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                background: !isSplitPayment ? 'var(--primary)' : 'transparent',
                                                                color: !isSplitPayment ? '#ffffff' : 'var(--text-secondary)',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            💵 Single Mode
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsSplitPayment(true);
                                                                setSplitItems([
                                                                    { mode: 'CASH', amount: '', transactionRef: '' },
                                                                    { mode: 'UPI', amount: '', transactionRef: '' }
                                                                ]);
                                                            }}
                                                            style={{
                                                                padding: '5px 12px',
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                borderRadius: 6,
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                background: isSplitPayment ? 'var(--accent)' : 'transparent',
                                                                color: isSplitPayment ? '#ffffff' : 'var(--text-secondary)',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            🔀 Split Payment (Cash + UPI / Bank)
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Total Payment Amount Header Field - Synchronized with Fee Components */}
                                                <div className="form-group" style={{ marginBottom: 14 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <label className="form-label font-bold" style={{ color: 'var(--primary)', fontSize: 12, margin: 0 }}>
                                                            {isSplitPayment ? 'Total Amount to Split (from Component Allocation above) (₹ INR)' : 'Total Payment Amount (₹ INR)'} <span className="required">*</span>
                                                        </label>
                                                        <span className="text-xs text-muted">
                                                            {isSplitPayment ? '🔒 Auto-synced from Fee Heads' : 'Derived from Fee Heads above'}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        className="form-control" 
                                                        type="number" 
                                                        step="1" 
                                                        min="1"
                                                        required 
                                                        value={form.amount}
                                                        readOnly={isSplitPayment}
                                                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                                        placeholder="Enter fee component amount(s) above" 
                                                        style={{ 
                                                            fontSize: 16, 
                                                            fontWeight: 800, 
                                                            color: 'var(--accent)', 
                                                            background: isSplitPayment ? 'var(--surface-2)' : 'var(--surface)',
                                                            cursor: isSplitPayment ? 'not-allowed' : 'text'
                                                        }}
                                                    />
                                                </div>

                                                {/* SINGLE MODE VIEW */}
                                                {!isSplitPayment && (
                                                    <div className="grid grid-2">
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
                                                    </div>
                                                )}

                                                {/* SPLIT / MULTI-MODE PAYMENT VIEW */}
                                                {isSplitPayment && (
                                                    <div style={{ background: 'var(--surface-2)', border: '1.5px solid var(--accent)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                                                            <div>
                                                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    🔀 Multi-Mode Split Breakdown ({splitItems.length} Modes)
                                                                </span>
                                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                                    Split the total <b>₹{(parseFloat(form.amount) || 0).toLocaleString('en-IN')}</b> across payment modes in your own way.
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {(() => {
                                                                    const targetTotal = parseFloat(form.amount) || 0;
                                                                    const currentSplitSum = splitItems.reduce((acc, sp) => acc + (parseFloat(sp.amount) || 0), 0);
                                                                    const diff = targetTotal - currentSplitSum;

                                                                    if (targetTotal <= 0) {
                                                                        return <span className="badge badge-warning">⚠️ Enter fee component amounts above</span>;
                                                                    }
                                                                    if (Math.abs(diff) <= 0.01 && currentSplitSum > 0) {
                                                                        return <span className="badge badge-success" style={{ fontWeight: 700 }}>✅ Split matches total (₹{currentSplitSum.toLocaleString('en-IN')})</span>;
                                                                    }
                                                                    if (diff > 0) {
                                                                        return <span className="badge badge-warning" style={{ fontWeight: 700 }}>⚠️ ₹{diff.toLocaleString('en-IN')} remaining to split</span>;
                                                                    }
                                                                    return <span className="badge badge-danger" style={{ fontWeight: 700 }}>❌ Exceeds by ₹{Math.abs(diff).toLocaleString('en-IN')}</span>;
                                                                })()}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                             {splitItems.map((item, idx) => {
                                                                 const otherSum = splitItems
                                                                     .filter((_, i) => i !== idx)
                                                                     .reduce((acc, sp) => acc + (parseFloat(sp.amount) || 0), 0);
                                                                 const targetTotal = parseFloat(form.amount) || 0;
                                                                 const rem = Math.max(0, targetTotal - otherSum);

                                                                 return (
                                                                     <div 
                                                                         key={idx}
                                                                         style={{ 
                                                                             background: 'var(--surface)', 
                                                                             border: '1px solid var(--border)', 
                                                                             borderRadius: 8, 
                                                                             padding: '10px 12px' 
                                                                         }}
                                                                     >
                                                                         <div style={{ display: 'grid', gridTemplateColumns: splitItems.length > 1 ? '1.2fr 1fr 1fr auto' : '1.2fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                                                                             {/* Split Mode Selector */}
                                                                             <div>
                                                                                 <label className="form-label" style={{ fontSize: 10.5, marginBottom: 2 }}>
                                                                                     Mode #{idx + 1}
                                                                                 </label>
                                                                                 <select
                                                                                     className="form-control"
                                                                                     style={{ fontSize: 12, fontWeight: 700 }}
                                                                                     value={item.mode}
                                                                                     onChange={(e) => updateSplitItem(idx, 'mode', e.target.value)}
                                                                                 >
                                                                                     <option value="CASH">💵 CASH</option>
                                                                                     <option value="UPI">📱 UPI / Online</option>
                                                                                     <option value="BANK_TRANSFER">🏦 Bank Transfer (NEFT/RTGS)</option>
                                                                                     <option value="CHEQUE">🧾 Cheque</option>
                                                                                     <option value="DD">🏛️ Demand Draft</option>
                                                                                     <option value="CARD">💳 Debit/Credit Card</option>
                                                                                     <option value="OTHER">💼 Other Mode</option>
                                                                                 </select>
                                                                             </div>

                                                                             {/* Split Amount Input */}
                                                                             <div>
                                                                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                                                     <label className="form-label" style={{ fontSize: 10.5, margin: 0 }}>
                                                                                         Amount (₹) <span className="required">*</span>
                                                                                     </label>
                                                                                     {rem > 0 && item.amount !== rem.toString() && (
                                                                                         <button
                                                                                             type="button"
                                                                                             onClick={() => autoFillSplitRemainder(idx)}
                                                                                             style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                                                             title={`Auto-fill remaining ₹${rem.toLocaleString('en-IN')}`}
                                                                                         >
                                                                                             Fill ₹{rem.toLocaleString('en-IN')}
                                                                                         </button>
                                                                                     )}
                                                                                 </div>
                                                                                 <input
                                                                                     type="number"
                                                                                     step="1"
                                                                                     min="0"
                                                                                     className="form-control"
                                                                                     style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}
                                                                                     placeholder="₹ Amount"
                                                                                     value={item.amount}
                                                                                     onChange={(e) => updateSplitItem(idx, 'amount', e.target.value)}
                                                                                 />
                                                                             </div>

                                                                             {/* Reference / UTR Number */}
                                                                             <div>
                                                                                 <label className="form-label" style={{ fontSize: 10.5, marginBottom: 2 }}>
                                                                                     {item.mode === 'CASH' ? 'Receipt Memo' : item.mode === 'UPI' ? 'UPI UTR / Trx ID' : item.mode === 'CHEQUE' ? 'Cheque No.' : 'Ref / Trx ID'}
                                                                                 </label>
                                                                                 <input
                                                                                     className="form-control"
                                                                                     style={{ fontSize: 12 }}
                                                                                     placeholder={item.mode === 'CASH' ? 'Cash counter memo' : item.mode === 'UPI' ? 'e.g. 483920194821' : 'Reference number'}
                                                                                     value={item.transactionRef || ''}
                                                                                     onChange={(e) => updateSplitItem(idx, 'transactionRef', e.target.value)}
                                                                                 />
                                                                             </div>

                                                                             {/* Remove Mode Button */}
                                                                             {splitItems.length > 1 && (
                                                                                 <div style={{ paddingTop: 14 }}>
                                                                                     <button
                                                                                         type="button"
                                                                                         className="btn btn-secondary btn-sm"
                                                                                         style={{ color: 'var(--danger)', padding: '5px 8px', fontSize: 12 }}
                                                                                         onClick={() => removeSplitItem(idx)}
                                                                                         title="Remove this payment mode"
                                                                                     >
                                                                                         ✕
                                                                                     </button>
                                                                                 </div>
                                                                             )}
                                                                         </div>

                                                                         {/* Bank Name / Date if Cheque or Bank Transfer */}
                                                                         {(item.mode === 'CHEQUE' || item.mode === 'DD' || item.mode === 'BANK_TRANSFER') && (
                                                                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                                                                                 <div>
                                                                                     <label className="form-label" style={{ fontSize: 10, marginBottom: 2 }}>Bank Name</label>
                                                                                     <input
                                                                                         className="form-control"
                                                                                         style={{ fontSize: 11 }}
                                                                                         placeholder="e.g. State Bank of India"
                                                                                         value={item.bankName || ''}
                                                                                         onChange={(e) => updateSplitItem(idx, 'bankName', e.target.value)}
                                                                                     />
                                                                                 </div>
                                                                                 {item.mode === 'CHEQUE' && (
                                                                                     <div>
                                                                                         <label className="form-label" style={{ fontSize: 10, marginBottom: 2 }}>Cheque Date</label>
                                                                                         <input
                                                                                             type="date"
                                                                                             className="form-control"
                                                                                             style={{ fontSize: 11 }}
                                                                                             value={item.chequeDate || ''}
                                                                                             onChange={(e) => updateSplitItem(idx, 'chequeDate', e.target.value)}
                                                                                         />
                                                                                     </div>
                                                                                 )}
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                 );
                                                             })}

                                                             {/* ➕ Add Another Payment Mode */}
                                                             <button
                                                                 type="button"
                                                                 className="btn btn-secondary btn-sm"
                                                                 style={{ 
                                                                     border: '1.5px dashed var(--accent)', 
                                                                     justifyContent: 'center', 
                                                                     padding: '7px 12px',
                                                                     fontWeight: 700,
                                                                     color: 'var(--accent)',
                                                                     background: 'var(--surface)'
                                                                 }}
                                                                 onClick={addSplitItem}
                                                             >
                                                                 ➕ Add Another Payment Mode (e.g. Cheque / Card / DD)
                                                             </button>

                                                             {/* Live Split Sum Verification Bar */}
                                                             {(() => {
                                                                 const splitSum = splitItems.reduce((acc, sp) => acc + (parseFloat(sp.amount) || 0), 0);
                                                                 const totalTarget = parseFloat(form.amount) || 0;
                                                                 const isBalanced = totalTarget > 0 && Math.abs(splitSum - totalTarget) <= 0.01;
                                                                 const diff = totalTarget - splitSum;

                                                                 return (
                                                                     <div 
                                                                         style={{ 
                                                                             display: 'flex', 
                                                                             alignItems: 'center', 
                                                                             justifyContent: 'space-between',
                                                                             background: isBalanced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                                                             border: isBalanced ? '1px solid #10b981' : '1px solid #f59e0b',
                                                                             borderRadius: 6,
                                                                             padding: '6px 10px',
                                                                             fontSize: 12,
                                                                             fontWeight: 700
                                                                         }}
                                                                     >
                                                                         <span style={{ color: isBalanced ? '#065f46' : '#92400e' }}>
                                                                             {isBalanced 
                                                                                 ? `✅ Balanced: ₹${splitSum.toLocaleString('en-IN')} allocated across ${splitItems.filter(i => (parseFloat(i.amount) || 0) > 0).length} modes` 
                                                                                 : diff > 0 
                                                                                     ? `⚠️ Unallocated: ₹${diff.toLocaleString('en-IN')} remaining of ₹${totalTarget.toLocaleString('en-IN')}` 
                                                                                     : `⚠️ Excess: Split modes exceed total by ₹${Math.abs(diff).toLocaleString('en-IN')}`
                                                                             }
                                                                         </span>
                                                                         <span style={{ color: 'var(--text-secondary)' }}>
                                                                             Split Sum: ₹{splitSum.toLocaleString('en-IN')} / ₹{totalTarget.toLocaleString('en-IN')}
                                                                         </span>
                                                                     </div>
                                                                 );
                                                             })()}
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Remarks Input */}
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
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary btn-lg" 
                                                disabled={
                                                    saving || 
                                                    !form.amount || 
                                                    (parseFloat(form.amount) <= 0) ||
                                                    (isSplitPayment && Math.abs(splitItems.reduce((acc, sp) => acc + (parseFloat(sp.amount) || 0), 0) - (parseFloat(form.amount) || 0)) > 0.01)
                                                } 
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
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

                                                        const isSupp = feeItems.some(i => i.type === 'SUPPLEMENTARY');
                                                        const suppSubj = feeItems.filter(i => i.type === 'SUPPLEMENTARY').map(i => i.subject?.trim() || 'Back Paper').join(', ');
                                                        const effectiveFeesFor = isSupp && feeItems.length === 1
                                                            ? `Supplementary / Back Paper Exam Fee: ${suppSubj}`
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
                                                                        isSupplementary: isSupp,
                                                                        supplementarySubject: isSupp ? suppSubj : undefined
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
                                    <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '20px 24px', borderRadius: '10px 10px 0 0', color: 'white', textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, marginBottom: 4 }}>🎉</div>
                                        <div style={{ fontSize: 18, fontWeight: 800 }}>Payment Recorded Successfully!</div>
                                        <div style={{ opacity: 0.9, fontSize: 12.5 }}>Official receipt generated & stored</div>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-muted">Receipt Number</span>
                                            <span className="badge badge-primary" style={{ fontSize: 12, fontWeight: 800 }}>{result.receipt?.receiptNumber || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-muted">Received Amount (This Receipt)</span>
                                            <b style={{ color: 'var(--accent)', fontSize: 15 }}>{formatRupees(result.payment?.amount || 0)}</b>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-muted">Payment Mode</span>
                                            <span className="badge badge-neutral">{result.payment?.mode}</span>
                                        </div>
                                        {result.payment?.transactionRef && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className="text-muted">Reference / Trx No.</span>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{result.payment.transactionRef}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-muted">Transaction Date</span>
                                            <b>{new Date(result.payment?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-muted">Remarks / Fee Head</span>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.payment?.remarks || 'Fee Payment Received'}</span>
                                        </div>

                                        {/* ─── Clear Total, Received, and Balance Ledger Breakdown ─── */}
                                        {(() => {
                                            const totalAmt = result.studentFee?.totalAmount ?? (selectedFee?.totalAmount || 0);
                                            const totalPaid = result.studentFee?.paidAmount ?? (selectedFee?.paidAmount || 0);
                                            const balDue = result.studentFee?.balanceDue ?? Math.max(0, totalAmt - totalPaid);

                                            return (
                                                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.5px' }}>
                                                        📊 Official Account Balance Summary
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                        <span className="text-muted">Total Agreed Course Fee:</span>
                                                        <b>{formatRupees(totalAmt)}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                        <span className="text-muted">Received Amount (This Receipt):</span>
                                                        <b style={{ color: 'var(--accent)' }}>{formatRupees(result.payment?.amount || 0)}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                        <span className="text-muted">Total Paid Till Date:</span>
                                                        <b style={{ color: '#10b981' }}>{formatRupees(totalPaid)}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, paddingTop: 6, borderTop: '1px dashed var(--border)', marginTop: 4 }}>
                                                        <span className="font-bold">Remaining Balance Due:</span>
                                                        <b style={{ color: balDue > 0 ? '#ef4444' : '#10b981', fontSize: 14.5 }}>
                                                            {balDue > 0 ? formatRupees(balDue) : '✅ Fully Paid (₹0)'}
                                                        </b>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button 
                                                onClick={() => window.print()}
                                                className="btn btn-secondary" 
                                                style={{ justifyContent: 'center', fontWeight: 700 }}
                                            >
                                                🖨️ Print Slip
                                            </button>
                                            <a 
                                                href={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'https://bss-ssiti-erp-and-fee-system.onrender.com' : 'http://localhost:4000'}${result.receipt?.pdfUrl?.startsWith('/api') ? result.receipt.pdfUrl : `/api${result.receipt?.pdfUrl}`}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-primary" 
                                                style={{ justifyContent: 'center', fontWeight: 700 }}
                                            >
                                                📄 View / Download PDF
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

                                            {/* Itemized Fee Breakdown List in Preview */}
                                            {feeItems.some(i => (parseFloat(i.amount) || 0) > 0) && (
                                                <div style={{ margin: '8px 0', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Fee Heads Itemized:</div>
                                                    {feeItems.map((item, idx) => {
                                                        const amt = parseFloat(item.amount) || 0;
                                                        if (amt <= 0) return null;
                                                        let icon = '💳';
                                                        let label = 'Fee';
                                                        if (item.type === 'TUITION') { icon = '🎓'; label = 'Tuition Fee'; }
                                                        else if (item.type === 'DRESS_MATERIAL') { icon = '🥼'; label = 'Dress Material'; }
                                                        else if (item.type === 'EXAM') { icon = '📝'; label = 'Exam Fee'; }
                                                        else if (item.type === 'SUPPLEMENTARY') { icon = '🛡️'; label = `Supplementary (${item.subject || 'Back Paper'})`; }
                                                        else if (item.type === 'BALANCE') { icon = '🏢'; label = 'Course Balance'; }
                                                        else if (item.type === 'OTHER') { icon = '📦'; label = item.name || 'Other Dues'; }
                                                        else if (item.type === 'CUSTOM') { icon = '➕'; label = item.name || 'Custom Fee'; }

                                                        return (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12 }}>
                                                                <span>{icon} {label}:</span>
                                                                <b>₹{amt.toLocaleString('en-IN')}</b>
                                                            </div>
                                                        );
                                                    })}
                                                    {feeItems.some(i => i.type === 'SUPPLEMENTARY') && (
                                                        <div style={{ fontSize: 10, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>
                                                            * Supplementary exam fee will not deduct from course tuition balance.
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span className="text-muted">Payment Mode:</span>
                                                <span className="badge badge-info">{isSplitPayment ? '🔀 Split Payment' : form.mode}</span>
                                            </div>

                                            {selectedFee && (
                                                <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                                        <span className="text-muted">Total Agreed Fee:</span>
                                                        <b>{formatRupees(selectedFee.totalAmount)}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                                        <span className="text-muted">Paid Till Date:</span>
                                                        <b style={{ color: '#10b981' }}>{formatRupees(selectedFee.paidAmount)}</b>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--accent)', fontWeight: 800, padding: '4px 0', borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', margin: '4px 0' }}>
                                                        <span>Amount Receiving Now:</span>
                                                        <span>{formatRupees(inputAmountPaise)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
                                                        <span>Estimated Remaining Balance:</span>
                                                        <span style={{ color: Math.max(0, pendingBalance - inputAmountPaise) > 0 ? '#ef4444' : '#10b981' }}>
                                                            {formatRupees(Math.max(0, pendingBalance - inputAmountPaise))}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
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
