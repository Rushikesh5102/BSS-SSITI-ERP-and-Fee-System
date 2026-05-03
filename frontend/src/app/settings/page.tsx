'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [staff, setStaff] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TEACHER' });

    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            else if (!['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(user.role)) router.push('/dashboard');
        }
    }, [user, loading, router]);

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
        if (user && ['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(user.role)) fetchStaff();
    }, [user]);

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
            alert(`❌ Error: ${err.response?.data?.message || 'Failed to create staff'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to completely suspend ${name}'s network access?`)) {
            try {
                await api.delete(`/users/${id}`);
                alert('Access successfully revoked.');
                fetchStaff();
            } catch (err: any) {
                alert(`❌ Action failed: ${err.response?.data?.message || 'Unauthorized.'}`);
            }
        }
    };

    if (loading || !user || !['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(user.role)) return null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-subtitle" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}>Administration</div>
                        <div className="header-title" style={{ marginTop: 4 }}>⚙️ College Settings & Permissions</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Provision New Staff
                    </button>
                </header>

                <div className="page-content">
                    
                    {/* Management Table */}
                    <div className="card">
                        <div className="card-header" style={{ padding: 24 }}>
                            <div className="card-title">🛡️ Registered Directory Operations</div>
                            <span className="badge badge-info">{staff.length} Active Node(s)</span>
                        </div>
                        <div className="table-wrap" style={{ borderTop: 'none', borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staff Name</th>
                                        <th>Registered Email</th>
                                        <th>Security Role</th>
                                        <th>Account Status</th>
                                        <th>Assigned Branch</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fetching ? (
                                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Syncing User Grid...</td></tr>
                                    ) : staff.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr>
                                    ) : (
                                        staff.map((s) => (
                                            <tr key={s.id}>
                                                <td><b style={{ color: 'var(--text-primary)' }}>{s.name}</b></td>
                                                <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                                                <td>
                                                    <span className={s.role === 'SUPERADMIN' ? 'badge badge-danger' : s.role === 'DEVELOPER' ? 'badge badge-primary' : s.role === 'ADMIN' ? 'badge badge-info' : 'badge badge-secondary'} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                                                        {s.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    {s.isActive ? (
                                                        <span className="text-success" style={{ fontWeight: 600, fontSize: 13 }}>● Active</span>
                                                    ) : (
                                                        <span className="text-danger" style={{ fontWeight: 600, fontSize: 13 }}>○ Suspended</span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>{s.branch?.name || 'Global Reach'}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-secondary btn-sm" 
                                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                                                        onClick={() => handleDelete(s.id, s.name)}
                                                        disabled={s.id === user.id || s.role === 'SUPERADMIN'}
                                                    >
                                                        Revoke
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

            {/* Creation Modal Overlay */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 500, padding: 0 }}>
                        <div className="modal-header" style={{ padding: 24 }}>
                            <div className="modal-title">➕ Provision Access Protocol</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateStaff}>
                            <div className="modal-body" style={{ padding: 24 }}>
                                <div className="form-group mb-4">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-control" autoFocus required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">Network Email address</label>
                                    <input className="form-control" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@saiiti.edu.in" />
                                </div>
                                <div className="grid grid-2" style={{ gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Temporal Password</label>
                                        <input className="form-control" type="text" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="SecureKey123!" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Authority Policy</label>
                                        <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                            <option value="TEACHER">Teacher</option>
                                            <option value="ACCOUNTANT">Accountant</option>
                                            {(user.role === 'SUPERADMIN' || user.role === 'DEVELOPER') && <option value="ADMIN">Administrator</option>}
                                        </select>
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>This will immediately write to the primary internal database and unlock dashboard authentication limits for this remote operator.</p>
                            </div>
                            <div className="modal-footer" style={{ padding: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel Sequence</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Validating...' : 'Deploy Credentials 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

