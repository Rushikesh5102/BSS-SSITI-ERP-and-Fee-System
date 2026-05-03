'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function StudentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const actionParam = searchParams.get('action');

    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [fetching, setFetching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', class: '', section: '', rollNumber: '', parentName: '', parentPhone: '', parentEmail: '' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    useEffect(() => {
        if (actionParam === 'new') {
            setShowModal(true);
        }
    }, [actionParam]);

    const fetchStudents = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/students?page=${page}&limit=15&search=${search}`);
            setStudents(data.data);
            setTotal(data.pagination?.total || 0);
        } catch { /* handled by interceptor */ }
        finally { setFetching(false); }
    };

    useEffect(() => { if (user) fetchStudents(); }, [user, page, search]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const { data } = await api.post('/students', {
                name: form.name, class: form.class, section: form.section, rollNumber: form.rollNumber,
                parent: form.parentPhone ? { name: form.parentName, phone: form.parentPhone, email: form.parentEmail } : undefined,
            });
            const loginDetails = data.data?.loginDetails;
            setShowModal(false);
            if (loginDetails) {
                alert(`✅ Admission Successful!\n\nStudent Login Auto-Generated:\nEmail: ${loginDetails.email}\nPassword: ${loginDetails.defaultPassword}\n\nPlease share these credentials with the student to access the portal.`);
            } else {
                showToast('✅ Student admitted successfully!');
            }
            setForm({ name: '', class: '', section: '', rollNumber: '', parentName: '', parentPhone: '', parentEmail: '' });
            fetchStudents();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to add student'}`);
        } finally { setSaving(false); }
    };

    const canEdit = user && ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT'].includes(user.role);

    if (loading || !user) return null;

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div>
                        <div className="header-title">👨‍🎓 Student Management</div>
                        <div className="header-subtitle">{total} total students</div>
                    </div>
                    {canEdit && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            ➕ New Admission
                        </button>
                    )}
                </header>

                <div className="page-content">
                    {/* Search */}
                    <div className="card mb-4">
                        <div className="card-body" style={{ padding: '12px 16px' }}>
                            <input
                                type="text" className="form-control" placeholder="🔍 Search by student name..."
                                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card">
                        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Class / Section</th>
                                        <th>Parent</th>
                                        <th>Phone</th>
                                        <th>Fee Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fetching ? (
                                        <tr><td colSpan={7} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                    ) : students.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No students found</td></tr>
                                    ) : students.map((s) => {
                                        const totalFee = s.studentFees?.reduce((a: number, f: any) => a + f.totalAmount, 0) || 0;
                                        const paidFee = s.studentFees?.reduce((a: number, f: any) => a + f.paidAmount, 0) || 0;
                                        const pending = totalFee - paidFee;
                                        return (
                                            <tr key={s.id}>
                                                <td><span className="badge badge-primary">{s.studentId}</span></td>
                                                <td>
                                                    <b>{s.name}</b>
                                                    {s.rollNumber && <><br /><span className="text-sm text-muted">Roll: {s.rollNumber}</span></>}
                                                </td>
                                                <td>{s.class}{s.section ? ` - ${s.section}` : ''}</td>
                                                <td>{s.parent?.name || <span className="text-muted">—</span>}</td>
                                                <td>{s.parent?.phone || <span className="text-muted">—</span>}</td>
                                                <td>
                                                    {totalFee > 0 ? (
                                                        <>
                                                            <span className={`badge ${pending > 0 ? 'badge-warning' : 'badge-success'}`}>
                                                                {pending > 0 ? `₹${(pending / 100).toLocaleString('en-IN')} due` : 'Paid'}
                                                            </span>
                                                        </>
                                                    ) : <span className="badge badge-neutral">Not Assigned</span>}
                                                </td>
                                                <td>
                                                    <a href={`/students/${s.id}`} className="btn btn-secondary btn-sm">View →</a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                                <div className="pagination">
                                    <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                                        <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>&copy; 2026 Shri Sai I.T.I All rights reserved.</span>
                        <Link href="/terms" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 500, fontSize: '13px' }}>
                            Terms and Conditions
                        </Link>
                    </div>
                    <div>Developed by Rushikesh Pattiwar</div>
                </footer>
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">➕ New Admission Form</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Full Name <span className="required">*</span></label>
                                        <input className="form-control" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Class/Trade <span className="required">*</span></label>
                                        <input className="form-control" required value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. Electrician" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section</label>
                                        <input className="form-control" value={form.section} onChange={(e) => setForm(f => ({ ...f, section: e.target.value }))} placeholder="A, B, C" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Roll Number</label>
                                        <input className="form-control" value={form.rollNumber} onChange={(e) => setForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="01" />
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                                    <div className="form-label font-bold mb-4" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>PARENT / GUARDIAN</div>
                                    <div className="grid grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Parent Name</label>
                                            <input className="form-control" value={form.parentName} onChange={(e) => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Parent full name" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input className="form-control" type="tel" value={form.parentPhone} onChange={(e) => setForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="+919876543210" />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Email</label>
                                            <input className="form-control" type="email" value={form.parentEmail} onChange={(e) => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Processing...' : '✅ Complete Admission'}
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


