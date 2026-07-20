'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    branch?: { name: string } | null;
    createdAt: string;
}

interface RoleStats {
    ADMIN: number;
    ACCOUNTANT: number;
    TEACHER: number;
    STUDENT: number;
    DEVELOPER: number;
}

function AccessContent({ simulateParam }: { simulateParam: string | null }) {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const effectiveRole = (currentUser?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : currentUser?.role;

    const [users, setUsers] = useState<UserRecord[]>([]);
    const [stats, setStats] = useState<RoleStats>({
        ADMIN: 0,
        ACCOUNTANT: 0,
        TEACHER: 0,
        STUDENT: 0,
        DEVELOPER: 0,
    });
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    // Form states
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
    const [resetPasswordVal, setResetPasswordVal] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser) router.push('/login');
            else if (!['ADMIN', 'DEVELOPER'].includes(effectiveRole || '')) router.push('/dashboard');
        }
    }, [currentUser, effectiveRole, authLoading, router]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchData = async () => {
        setFetching(true);
        try {
            // Fetch users (including deactivated ones)
            const usersRes = await api.get('/users?includeInactive=true');
            setUsers(usersRes.data.data || []);

            // Fetch role stats
            const statsRes = await api.get('/users/stats');
            setStats(statsRes.data.data || {
                ADMIN: 0,
                ACCOUNTANT: 0,
                TEACHER: 0,
                STUDENT: 0,
                DEVELOPER: 0
            });
        } catch (err: any) {
            showToast(`❌ Sync Failed: ${err.response?.data?.message || 'Unauthorized API Access'}`);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (currentUser && ['ADMIN', 'DEVELOPER'].includes(currentUser.role)) {
            fetchData();
        }
    }, [currentUser]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/users', addForm);
            showToast('✅ Access credentials successfully provisioned!');
            setShowAddModal(false);
            setAddForm({ name: '', email: '', password: '', role: 'TEACHER' });
            fetchData();
        } catch (err: any) {
            showToast(`❌ Error: ${err.response?.data?.message || 'Failed to create user'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (targetUser: UserRecord) => {
        if (targetUser.id === currentUser?.id) {
            return showToast('❌ You cannot deactivate your own administrative session!');
        }

        const newStatus = !targetUser.isActive;
        const confirmMsg = newStatus 
            ? `Re-activate node and restore full system permissions for ${targetUser.name}?`
            : `Suspend network authentication and lockout ${targetUser.name}?`;

        if (window.confirm(confirmMsg)) {
            try {
                await api.put(`/users/${targetUser.id}`, { isActive: newStatus });
                showToast(`✅ User access status updated successfully.`);
                fetchData();
            } catch (err: any) {
                showToast(`❌ Action failed: ${err.response?.data?.message || 'Forbidden.'}`);
            }
        }
    };

    const handleRoleChange = async (targetUser: UserRecord, newRole: string) => {
        if (targetUser.id === currentUser?.id) {
            return showToast('❌ Self-demotion is locked to prevent locking yourself out.');
        }
        try {
            await api.put(`/users/${targetUser.id}`, { role: newRole });
            showToast(`✅ Role upgraded to ${newRole} for ${targetUser.name}`);
            fetchData();
        } catch (err: any) {
            showToast(`❌ Failed to update role: ${err.response?.data?.message || 'Forbidden'}`);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword: resetPasswordVal });
            showToast(`✅ Password successfully changed for ${selectedUser.name}!`);
            setShowResetModal(false);
            setResetPasswordVal('');
            setSelectedUser(null);
        } catch (err: any) {
            showToast(`❌ Reset Failed: ${err.response?.data?.message || 'Password requires min 8 characters'}`);
        } finally {
            setSaving(false);
        }
    };

    // Filters logic
    const filteredUsers = users.filter((u) => {
        const matchesSearch = 
            u.name.toLowerCase().includes(search.toLowerCase()) || 
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'ALL' || u.role === filterRole;
        const matchesStatus = 
            statusFilter === 'ALL' || 
            (statusFilter === 'ACTIVE' && u.isActive) || 
            (statusFilter === 'INACTIVE' && !u.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (authLoading || !currentUser || !['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(currentUser.role)) return null;

    const totalUsers = Object.values(stats).reduce((a, b) => a + b, 0);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-subtitle" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}>Central Authority Console</div>
                        <div className="header-title" style={{ marginTop: 4 }}>🔑 Access & Identity Control</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        ➕ Provision New Node
                    </button>
                </header>

                <div className="page-content">
                    {/* Role statistics cards */}
                    <div className="grid grid-4 mb-6" style={{ gap: 20 }}>
                        <div className="card text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', border: 'none', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>Total Directory size</div>
                            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{totalUsers}</div>
                            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Staff + enrolled student logins</div>
                        </div>
                        <div className="card text-white" style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)', border: 'none', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>🎓 Enrolled Student Nodes</div>
                            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{stats.STUDENT}</div>
                            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Self-service student portal logins</div>
                        </div>
                        <div className="card text-white" style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', border: 'none', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>👩‍💼 Staff Access</div>
                            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{stats.ADMIN + stats.ACCOUNTANT + stats.TEACHER}</div>
                            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Admins ({stats.ADMIN}) | Accountants ({stats.ACCOUNTANT}) | Teachers ({stats.TEACHER})</div>
                        </div>
                        <div className="card text-white" style={{ background: 'linear-gradient(135deg, #4c1d95, #8b5cf6)', border: 'none', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>🔒 System Developers</div>
                            <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{stats.DEVELOPER}</div>
                            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>Technical Controllers</div>
                        </div>
                    </div>

                    {/* Filter and search operations bar */}
                    <div className="card mb-6" style={{ padding: 16 }}>
                        <div className="grid grid-3" style={{ gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">🔍 Live Search</label>
                                <input
                                    className="form-control"
                                    placeholder="Search by operator name or email address..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">🎭 Authority Filter</label>
                                <select className="form-control" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="ALL">All Authorization Types</option>
                                    <option value="ADMIN">Administrator</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="STUDENT">Student</option>
                                    <option value="DEVELOPER">Developer/System Health</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">⚡ Status Filter</label>
                                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="ALL">All Node Statuses</option>
                                    <option value="ACTIVE">● Active Sessions</option>
                                    <option value="INACTIVE">○ Suspended Sessions</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Users list table */}
                    <div className="card">
                        <div className="card-header" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="card-title">🛡️ Global User & Access Registry</div>
                            <span className="badge badge-primary">{filteredUsers.length} node(s) match filters</span>
                        </div>
                        <div className="table-wrap" style={{ borderTop: 'none', borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Registered Name</th>
                                        <th>Email Address</th>
                                        <th>Security Role / Authority</th>
                                        <th>Access Status</th>
                                        <th>Branch Link</th>
                                        <th style={{ textAlign: 'right' }}>Identity Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fetching ? (
                                        <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /><div style={{ marginTop: 12, color: 'var(--text-muted)' }}>Synchronizing secure user directory...</div></td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No matching credentials found.</td></tr>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    <b style={{ color: 'var(--text-primary)' }}>{u.name}</b>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                                                <td>
                                                    {u.id === currentUser.id ? (
                                                        <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                                                            {u.role} (YOU)
                                                        </span>
                                                    ) : u.role === 'STUDENT' ? (
                                                        <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                                                            {u.role}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u, e.target.value)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: 6,
                                                                border: '1px solid var(--border)',
                                                                background: 'var(--surface-2)',
                                                                color: 'var(--text-primary)',
                                                                fontWeight: 600,
                                                                fontSize: 12
                                                            }}
                                                         >
                                                            <option value="STUDENT">STUDENT</option>
                                                            <option value="TEACHER">TEACHER</option>
                                                            <option value="ACCOUNTANT">ACCOUNTANT</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                            <option value="DEVELOPER">DEVELOPER</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        className={`btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-secondary'}`}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 12,
                                                            color: u.isActive ? 'var(--success)' : 'var(--danger)',
                                                            fontWeight: 600,
                                                            border: '1px solid currentColor',
                                                            borderRadius: 4
                                                        }}
                                                        disabled={u.id === currentUser.id}
                                                    >
                                                        {u.isActive ? '● Active' : '○ Suspended'}
                                                    </button>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                    {u.branch?.name || <span className="text-muted">Global / All Branches</span>}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button 
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setShowResetModal(true);
                                                            }}
                                                            style={{ fontSize: 12 }}
                                                        >
                                                            🔑 Reset Pass
                                                        </button>
                                                    </div>
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

            {/* Modal: Provision User */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 500, padding: 0 }}>
                        <div className="modal-header" style={{ padding: 24 }}>
                            <div className="modal-title">➕ Provision Access Protocol</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="modal-body" style={{ padding: 24 }}>
                                <div className="form-group mb-4">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-control" autoFocus required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label">Network Email Address</label>
                                    <input className="form-control" type="email" required value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@gmail.com" />
                                </div>
                                <div className="grid grid-2" style={{ gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input className="form-control" type="text" required minLength={8} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="SecureKey123!" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Authority Policy</label>
                                        <select className="form-control" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                                            <option value="STUDENT">Student</option>
                                            <option value="TEACHER">Teacher</option>
                                            <option value="ACCOUNTANT">Accountant</option>
                                            <option value="ADMIN">Administrator</option>
                                            {(currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <option value="DEVELOPER">Developer/Architect</option>}
                                        </select>
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>Creating a user will immediately add them to the security directory, enabling instantaneous network access.</p>
                            </div>
                            <div className="modal-footer" style={{ padding: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Processing...' : 'Deploy Credentials 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Reset Password */}
            {showResetModal && selectedUser && (
                <div className="modal-overlay" onClick={() => { setShowResetModal(false); setSelectedUser(null); }} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 450, padding: 0 }}>
                        <div className="modal-header" style={{ padding: 24 }}>
                            <div className="modal-title">🔑 Reset Password</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowResetModal(false); setSelectedUser(null); }}>✕</button>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-body" style={{ padding: 24 }}>
                                <div style={{ marginBottom: 16, fontSize: 14 }}>
                                    Resetting login password for <b>{selectedUser.name}</b> (<i>{selectedUser.email}</i>).
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        autoFocus
                                        minLength={8}
                                        value={resetPasswordVal}
                                        onChange={(e) => setResetPasswordVal(e.target.value)}
                                        placeholder="Min 8 characters (e.g. NewPassword123!)"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ padding: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowResetModal(false); setSelectedUser(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Confirm Reset 🔐'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
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
    return <AccessContent simulateParam={simulateParam} />;
}

export default function AccessPage() {
    return (
        <Suspense fallback={<div className="layout-loading"><div className="spinner" /></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}
