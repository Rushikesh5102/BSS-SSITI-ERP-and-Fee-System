'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

function FeeStructuresContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [structures, setStructures] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toast, setToast] = useState('');
    const [form, setForm] = useState({ name: '', academicYear: '2024-25', class: '', items: [{ feeCategoryId: '', amount: '' }] });
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetch = async () => {
        const [s, c] = await Promise.all([
            api.get('/fee-structures').then(r => r.data.data).catch(() => []),
            api.get('/fee-structures/categories').then(r => r.data.data).catch(() => []),
        ]);
        setStructures(s); setCategories(c);
    };

    useEffect(() => { if (user) fetch(); }, [user]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({ name: '', academicYear: '2024-25', class: '', items: [{ feeCategoryId: categories[0]?.id || '', amount: '' }] });
        setShowModal(true);
    };

    const openEditModal = (s: any) => {
        setEditingId(s.id);
        setForm({
            name: s.name || '',
            academicYear: s.academicYear || '2024-25',
            class: s.class || '',
            items: (s.items && s.items.length > 0)
                ? s.items.map((i: any) => ({ feeCategoryId: i.feeCategoryId, amount: (i.amount / 100).toString() }))
                : [{ feeCategoryId: categories[0]?.id || '', amount: '' }]
        });
        setShowModal(true);
    };

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { feeCategoryId: categories[0]?.id || '', amount: '' }] }));
    const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
    const updateItem = (i: number, key: string, val: string) =>
        setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }));

    const totalAmount = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * 100, 0);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = {
                ...form,
                items: form.items.map(i => ({ feeCategoryId: i.feeCategoryId, amount: Math.round(parseFloat(i.amount) * 100) })),
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
            setForm({ name: '', academicYear: '2024-25', class: '', items: [{ feeCategoryId: '', amount: '' }] });
            fetch();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed'}`);
        } finally { setSaving(false); }
    };

    const canEdit = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER';

    if (loading || !user) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">📋 Fee Structures</div>
                        <div className="header-subtitle">Define class-wise fee structures</div>
                    </div>
                    {canEdit && (
                        <button className="btn btn-primary" onClick={openCreateModal}>➕ Create Structure</button>
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
                                <div key={s.id} className="card">
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div className="font-bold" style={{ fontSize: 15 }}>{s.name}</div>
                                            <div className="text-sm text-muted">{s.class}{s.section ? ` - ${s.section}` : ''} | AY: {s.academicYear}</div>
                                        </div>
                                        <span className={`badge ${s.isActive ? 'badge-success' : 'badge-neutral'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <div style={{ padding: '12px 20px' }}>
                                        {(s.items || []).map((item: any) => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                                <span>{item.feeCategory?.name}</span>
                                                <b>{formatRupees(item.amount)}</b>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, color: 'var(--primary)' }}>
                                            <span>Total</span>
                                            <span>{formatRupees(s.totalAmount)}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
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
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editingId ? '✏️ Edit Fee Structure' : '➕ Create Fee Structure'}</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Structure Name *</label>
                                        <input className="form-control" required placeholder="e.g. Electrician 2024-25 Fee"
                                            value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Year *</label>
                                        <input className="form-control" required placeholder="e.g. 2024-25"
                                            value={form.academicYear} onChange={(e) => setForm(f => ({ ...f, academicYear: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Trade / Class *</label>
                                        <input className="form-control" required placeholder="e.g. Electrician"
                                            value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <label className="form-label mb-0">Fee Items *</label>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>➕ Add Item</button>
                                    </div>
                                    {form.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <select className="form-control" required value={item.feeCategoryId}
                                                onChange={(e) => updateItem(idx, 'feeCategoryId', e.target.value)}>
                                                <option value="">Choose category</option>
                                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <input className="form-control" type="number" step="0.01" required placeholder="Amount ₹"
                                                value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} style={{ width: 140 }} />
                                            {form.items.length > 1 && (
                                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(idx)}>✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <div style={{ textAlign: 'right', fontWeight: 700, marginTop: 8, color: 'var(--primary)' }}>
                                        Total: {formatRupees(totalAmount)}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Structure'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast-wrap"><div className="toast toast-success">{toast}</div></div>}
        </div>
    );
}

export default function FeeStructuresPage() {
    return (
        <Suspense fallback={<div className="layout"><Sidebar /><div className="main-content"><div className="page-content text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading fee structures...</div></div></div>}>
            <FeeStructuresContent />
        </Suspense>
    );
}
