'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AutoRecoverBanner from '../../components/AutoRecoverBanner';
import { safeStorage } from '../../utils/safeStorage';

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function FeeStructuresContent({ simulateParam }: { simulateParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [structures, setStructures] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    
    // Form state without course box; streamlined fee items with custom write-in support
    const [form, setForm] = useState({ 
        name: '', 
        academicYear: '2024-2026', 
        tuitionFee: '15000',
        examFee: '2000',
        dressMaterialFee: '3000',
        customItems: [] as { name: string; amount: string }[]
    });
    const [saving, setSaving] = useState(false);

    // Auto-Recover Draft State
    const [hasDraft, setHasDraft] = useState(false);
    const [draftTime, setDraftTime] = useState<string | null>(null);

    useEffect(() => {
        if (showModal && !editingId) {
            const saved = safeStorage.get<any>('draft_fee_structure_v2', null);
            if (saved && saved.name) {
                setHasDraft(true);
                setDraftTime(saved.savedAt);
            }
        }
    }, [showModal, editingId]);

    useEffect(() => {
        if (showModal && !editingId && form.name) {
            const timer = setTimeout(() => {
                safeStorage.set('draft_fee_structure_v2', {
                    ...form,
                    savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [form, showModal, editingId]);

    const handleRestoreDraft = () => {
        const saved = safeStorage.get<any>('draft_fee_structure_v2', null);
        if (saved) {
            setForm(saved);
            setHasDraft(false);
        }
    };

    const handleDiscardDraft = () => {
        safeStorage.remove('draft_fee_structure_v2');
        setHasDraft(false);
    };

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetch = async () => {
        const [s, c] = await Promise.all([
            api.get('/fee-structures').then(r => r.data.data).catch(() => []),
            api.get('/fee-structures/categories').then(r => r.data.data).catch(() => []),
        ]);
        setStructures(s); 
        // Filter out Transport, Hostel, and Miscellaneous categories
        setCategories((c || []).filter((cat: any) => {
            const name = (cat.name || '').toLowerCase();
            return !name.includes('transport') && !name.includes('hostel') && !name.includes('misc');
        }));
    };

    useEffect(() => { if (user) fetch(); }, [user]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ 
            name: '', 
            academicYear: '2024-2026', 
            tuitionFee: '15000',
            examFee: '2000',
            dressMaterialFee: '3000',
            customItems: []
        });
        setShowModal(true);
    };

    const openEditModal = (s: any) => {
        setEditingId(s.id);
        let t = '15000', ex = '2000', dr = '3000';
        const custom: { name: string; amount: string }[] = [];

        if (s.items && s.items.length > 0) {
            s.items.forEach((i: any) => {
                const cName = (i.feeCategory?.name || '').toLowerCase();
                const amt = (i.amount / 100).toString();
                if (cName.includes('tuition')) t = amt;
                else if (cName.includes('exam')) ex = amt;
                else if (cName.includes('dress') || cName.includes('material') || cName.includes('uniform')) dr = amt;
                else if (!cName.includes('transport') && !cName.includes('hostel') && !cName.includes('misc')) {
                    custom.push({ name: i.feeCategory?.name || 'Custom Fee', amount: amt });
                }
            });
        }

        setForm({
            name: s.name || '',
            academicYear: s.academicYear || '2024-2026',
            tuitionFee: t,
            examFee: ex,
            dressMaterialFee: dr,
            customItems: custom
        });
        setShowModal(true);
    };

    const addCustomItem = () => {
        setForm(f => ({ ...f, customItems: [...f.customItems, { name: '', amount: '' }] }));
    };

    const removeCustomItem = (idx: number) => {
        setForm(f => ({ ...f, customItems: f.customItems.filter((_, i) => i !== idx) }));
    };

    const updateCustomItem = (idx: number, field: 'name' | 'amount', val: string) => {
        setForm(f => ({
            ...f,
            customItems: f.customItems.map((item, i) => i === idx ? { ...item, [field]: val } : item)
        }));
    };

    const calculatedTotalPaise = (
        (parseFloat(form.tuitionFee) || 0) * 100 +
        (parseFloat(form.examFee) || 0) * 100 +
        (parseFloat(form.dressMaterialFee) || 0) * 100 +
        form.customItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0) * 100, 0)
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            // Map into standard categories or backend items
            const tuitionCat = categories.find(c => (c.name || '').toLowerCase().includes('tuition')) || categories[0];
            const examCat = categories.find(c => (c.name || '').toLowerCase().includes('exam')) || categories[1] || categories[0];
            const dressCat = categories.find(c => (c.name || '').toLowerCase().includes('dress') || (c.name || '').toLowerCase().includes('material')) || categories[2] || categories[0];

            const items: { feeCategoryId: string; amount: number }[] = [];
            if (tuitionCat && parseFloat(form.tuitionFee) > 0) {
                items.push({ feeCategoryId: tuitionCat.id, amount: Math.round(parseFloat(form.tuitionFee) * 100) });
            }
            if (examCat && parseFloat(form.examFee) > 0) {
                items.push({ feeCategoryId: examCat.id, amount: Math.round(parseFloat(form.examFee) * 100) });
            }
            if (dressCat && parseFloat(form.dressMaterialFee) > 0) {
                items.push({ feeCategoryId: dressCat.id, amount: Math.round(parseFloat(form.dressMaterialFee) * 100) });
            }

            // For custom write-in items, map to remaining category or first available
            form.customItems.forEach((cItem) => {
                if (cItem.name && parseFloat(cItem.amount) > 0) {
                    const fallbackCat = categories[0];
                    if (fallbackCat) {
                        items.push({ feeCategoryId: fallbackCat.id, amount: Math.round(parseFloat(cItem.amount) * 100) });
                    }
                }
            });

            const payload = {
                name: form.name,
                academicYear: form.academicYear,
                class: 'General ITI',
                items: items.length > 0 ? items : [{ feeCategoryId: categories[0]?.id, amount: calculatedTotalPaise }],
            };

            if (editingId) {
                await api.put(`/fee-structures/${editingId}`, payload);
                showToast('✅ Fee structure updated successfully!');
            } else {
                await api.post('/fee-structures', payload);
                showToast('✅ Fee structure created!');
            }
            setShowModal(false);
            setEditingId(null);
            safeStorage.remove('draft_fee_structure_v2');
            setHasDraft(false);
            fetch();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to save structure'}`);
        } finally { setSaving(false); }
    };

    const canEdit = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER' || effectiveRole === 'SUPERADMIN' || effectiveRole === 'BRANCH_ADMIN' || effectiveRole === 'ACCOUNTANT';

    if (loading || !user) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">📋 Fee Structures Master</div>
                        <div className="header-subtitle">Standard tuition, exam, dress & custom fee packages</div>
                    </div>
                    {canEdit && (
                        <button className="btn btn-primary" onClick={openCreateModal}>➕ Create Fee Structure</button>
                    )}
                </header>

                <div className="page-content">
                    {structures.length === 0 ? (
                        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                            <div style={{ fontSize: 50 }}>📋</div>
                            <div className="font-bold" style={{ marginTop: 12 }}>No fee structures defined</div>
                            {canEdit && <button className="btn btn-primary" style={{ margin: '16px auto 0', display: 'flex' }} onClick={openCreateModal}>Create First Structure</button>}
                        </div>
                    ) : (
                        <div className="grid grid-3">
                            {structures.map((s) => (
                                <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <div>
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div className="font-bold" style={{ fontSize: 15 }}>{s.name}</div>
                                                <div className="text-sm text-muted">Session: {s.academicYear || '2024-2026'} (2-Year)</div>
                                            </div>
                                            <span className={`badge ${s.isActive ? 'badge-success' : 'badge-neutral'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div style={{ padding: '12px 20px' }}>
                                            {(s.items || []).map((item: any) => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                                    <span>{item.feeCategory?.name || 'Fee Component'}</span>
                                                    <b>{formatRupees(item.amount)}</b>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, color: 'var(--primary)' }}>
                                                <span>Total Course Package</span>
                                                <span style={{ fontSize: 16 }}>{formatRupees(s.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                                        <span className="text-sm text-muted">{s._count?.studentFees || 0} students assigned</span>
                                        {canEdit && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(s)}>
                                                ✏️ Edit Structure
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Footer />
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editingId ? '✏️ Edit Fee Structure' : '➕ Create Fee Structure'}</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <AutoRecoverBanner
                                    show={hasDraft}
                                    savedAt={draftTime}
                                    onRestore={handleRestoreDraft}
                                    onDiscard={handleDiscardDraft}
                                />

                                <div className="grid grid-2">
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Structure Package Name <span className="required">*</span></label>
                                        <input className="form-control" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electrician 2024-2026 Master Fee" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Academic Session (2 Years) <span className="required">*</span></label>
                                        <input className="form-control" required value={form.academicYear} onChange={(e) => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2024-2026" />
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginTop: 8 }}>
                                    <div className="form-label font-bold mb-3" style={{ fontSize: 13, color: 'var(--primary)' }}>
                                        💰 Standard Fee Heads
                                    </div>
                                    <div className="grid grid-2" style={{ gap: 10 }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>🎓 Tuition Fees (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 15000"
                                                value={form.tuitionFee}
                                                onChange={(e) => setForm(f => ({ ...f, tuitionFee: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>📝 Exam Fees (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 2000"
                                                value={form.examFee}
                                                onChange={(e) => setForm(f => ({ ...f, examFee: e.target.value }))}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label" style={{ fontSize: 12 }}>🥼 Dress & Material Fees (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 3000"
                                                value={form.dressMaterialFee}
                                                onChange={(e) => setForm(f => ({ ...f, dressMaterialFee: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Custom / Other Write-In Fee Heads */}
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <label className="form-label mb-0" style={{ fontWeight: 700 }}>
                                            ➕ Custom / Other Fee Heads
                                        </label>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomItem}>
                                            ➕ Add New Custom Head
                                        </button>
                                    </div>

                                    {form.customItems.length === 0 ? (
                                        <div className="text-sm text-muted" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
                                            No custom fee heads added yet. Click &quot;Add New Custom Head&quot; to write any entirely custom fee component (e.g. Workshop Tool Kit, Lab Caution Deposit).
                                        </div>
                                    ) : (
                                        form.customItems.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                <input
                                                    className="form-control"
                                                    placeholder="Custom fee name (e.g. Workshop Tool Kit)..."
                                                    value={item.name}
                                                    onChange={(e) => updateCustomItem(idx, 'name', e.target.value)}
                                                    required
                                                />
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    step="1"
                                                    placeholder="Amount ₹"
                                                    value={item.amount}
                                                    onChange={(e) => updateCustomItem(idx, 'amount', e.target.value)}
                                                    style={{ width: 130 }}
                                                    required
                                                />
                                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeCustomItem(idx)}>✕</button>
                                            </div>
                                        ))
                                    )}

                                    <div style={{ textAlign: 'right', fontWeight: 800, marginTop: 14, fontSize: 16, color: 'var(--primary)' }}>
                                        Total Package: {formatRupees(calculatedTotalPaise)}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingId ? '💾 Save Changes' : 'Create Structure')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast-wrap"><div className="toast toast-success">{toast}</div></div>}
        </div>
    );
}

function SearchParamsLoader() {
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    return <FeeStructuresContent simulateParam={simulateParam} />;
}

export default function FeeStructuresPage() {
    return (
        <Suspense fallback={<div className="layout"><Sidebar /><div className="main-content"><div className="page-content text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading fee structures...</div></div></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}
