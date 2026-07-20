'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function SettingsContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const [staff, setStaff] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            else if (!['ADMIN', 'DEVELOPER'].includes(effectiveRole || '')) router.push('/dashboard');
        }
    }, [user, effectiveRole, loading, router]);

    const fetchStaff = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/users');
            setStaff(data.data || []);
        } catch (err) {
            console.error('Failed to load staff list', err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user && ['ADMIN', 'DEVELOPER'].includes(effectiveRole || '')) fetchStaff();
    }, [user, effectiveRole]);

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/users', form);
            alert('✅ Staff member successfully provisioned!');
            setShowModal(false);
            setForm({ name: '', email: '', password: '', role: 'TEACHER' });
            fetchStaff();
        } catch (err: any) {
            alert(`❌ ${err.response?.data?.message || 'Failed to create staff member'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (staffMember: any) => {
        if (staffMember.id === user?.id) {
            return alert('❌ You cannot deactivate your own account!');
        }
        const newStatus = !staffMember.isActive;
        const confirmMsg = newStatus ? `Re-activate ${staffMember.name}?` : `Deactivate ${staffMember.name}?`;
        if (window.confirm(confirmMsg)) {
            try {
                await api.put(`/users/${staffMember.id}`, { isActive: newStatus });
                fetchStaff();
            } catch (err: any) {
                alert(`❌ ${err.response?.data?.message || 'Action failed'}`);
            }
        }
    };

    if (loading || !user || !['ADMIN', 'DEVELOPER'].includes(effectiveRole || '')) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">⚙️ Staff & System Settings</div>
                        <div className="header-subtitle">Manage staff accounts and operational parameters</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Add New Staff Account
                    </button>
                </header>

                <div className="page-content">
                    {/* Staff List Card */}
                    <div className="card mb-6">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="card-title">👨‍💼 Staff Directory & Permissions</div>
                            <span className="badge badge-neutral">{staff.length} Active Logins</span>
                        </div>
                        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role Policy</th>
                                        <th>Status</th>
                                        <th>Registered Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fetching ? (
                                        <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Synchronizing staff list...</td></tr>
                                    ) : staff.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 40 }}>No staff members provisioned yet</td></tr>
                                    ) : (
                                        staff.map((s) => (
                                            <tr key={s.id}>
                                                <td><b>{s.name}</b></td>
                                                <td>{s.email}</td>
                                                <td>
                                                    <span className={s.role === 'DEVELOPER' ? 'badge badge-primary' : s.role === 'ADMIN' ? 'badge badge-info' : 'badge badge-secondary'} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                                                        {s.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                        {s.isActive ? '● Active' : '○ Disabled'}
                                                    </span>
                                                </td>
                                                <td className="text-muted text-sm">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(s)}
                                                        className={`btn btn-sm ${s.isActive ? 'btn-ghost' : 'btn-secondary'}`}
                                                        style={{ color: s.isActive ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}
                                                        disabled={s.id === user.id}
                                                    >
                                                        {s.isActive ? 'Deactivate' : 'Re-activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Staff Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <div className="modal-title">➕ Add New Staff Account</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateStaff}>
                            <div className="modal-body">
                                <div className="form-group mb-4">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-control" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">Login Email Address *</label>
                                    <input className="form-control" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="accountant@gmail.com" />
                                </div>
                                <div className="grid grid-2" style={{ gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Temporal Password *</label>
                                        <input className="form-control" type="text" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="SecureKey123!" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Authority Policy *</label>
                                        <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                            <option value="TEACHER">Teacher</option>
                                            <option value="ACCOUNTANT">Accountant</option>
                                            {(effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER') && <option value="ADMIN">Administrator</option>}
                                        </select>
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>This will immediately write to the primary internal database and unlock dashboard authentication limits for this remote operator.</p>
                            </div>
                            <div className="modal-footer" style={{ padding: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel Sequence</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Provision Account 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="layout"><Sidebar /><div className="main-content"><div className="page-content text-center text-muted" style={{ padding: 40 }}><span className="spinner" /> Loading settings...</div></div></div>}>
            <SettingsContent />
        </Suspense>
    );
}
