'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function StudentsContent() {
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

    // Fee Assignment / Update Modal State
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [feeForm, setFeeForm] = useState({ feeStructureId: '', customAmountRupees: '', dueDate: '' });
    const [assigningFee, setAssigningFee] = useState(false);

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

    const fetchFeeStructures = async () => {
        try {
            const { data } = await api.get('/fee-structures');
            setFeeStructures(data.data || []);
            if (data.data && data.data.length > 0) {
                setFeeForm(f => ({ ...f, feeStructureId: f.feeStructureId || data.data[0].id }));
            }
        } catch { }
    };

    useEffect(() => {
        if (user) {
            fetchStudents();
            fetchFeeStructures();
        }
    }, [user, page, search]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const openFeeModal = (student: any) => {
        setSelectedStudent(student);
        const currentFee = student.studentFees && student.studentFees.length > 0 ? student.studentFees[0] : null;
        setFeeForm({
            feeStructureId: currentFee?.feeStructureId || (feeStructures[0]?.id || ''),
            customAmountRupees: currentFee ? (currentFee.totalAmount / 100).toString() : '',
            dueDate: currentFee?.dueDate ? currentFee.dueDate.split('T')[0] : '',
        });
        setShowFeeModal(true);
    };

    const handleAssignFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !feeForm.feeStructureId) return;
        setAssigningFee(true);
        try {
            const amountInPaise = feeForm.customAmountRupees ? Math.round(parseFloat(feeForm.customAmountRupees) * 100) : undefined;
            await api.post('/fee-structures/assign', {
                studentId: selectedStudent.id,
                feeStructureId: feeForm.feeStructureId,
                customTotalAmount: amountInPaise,
                dueDate: feeForm.dueDate || undefined,
            });
            showToast('✅ Student fee updated successfully!');
            setShowFeeModal(false);
            fetchStudents();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to update student fee'}`);
        } finally {
            setAssigningFee(false);
        }
    };

    // Student History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyStudentDetail, setHistoryStudentDetail] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const openHistoryModal = async (studentId: string) => {
        setLoadingHistory(true);
        setShowHistoryModal(true);
        try {
            const { data } = await api.get(`/students/${studentId}`);
            setHistoryStudentDetail(data.data);
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to load student history'}`);
            setShowHistoryModal(false);
        } finally {
            setLoadingHistory(false);
        }
    };

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

    const canEdit = user && ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'DEVELOPER'].includes(user.role);

    if (loading || !user) return null;

    const totalPages = Math.ceil(total / 15);

    const getBaseUrl = () => {
        return typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? 'https://bss-ssiti-erp-and-fee-system.onrender.com'
            : 'http://localhost:4000';
    };

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
                                type="text" className="form-control" placeholder="🔍 Search by student name, ID, roll no, trade, or year..."
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
                                                <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openHistoryModal(s.id)}>
                                                        📜 History
                                                    </button>
                                                    {canEdit && (
                                                        <button className="btn btn-primary btn-sm" onClick={() => openFeeModal(s)}>
                                                            💳 {totalFee > 0 ? 'Edit Fee' : 'Assign Fee'}
                                                        </button>
                                                    )}
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

            {/* Assign / Update Fee Modal */}
            {showFeeModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowFeeModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">💳 Assign / Update Student Fee</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowFeeModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAssignFee}>
                            <div className="modal-body">
                                <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
                                    <div><b>Student:</b> {selectedStudent.name} ({selectedStudent.studentId})</div>
                                    <div className="text-sm text-muted">Class/Trade: {selectedStudent.class} {selectedStudent.section && `(${selectedStudent.section})`}</div>
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Select Fee Structure <span className="required">*</span></label>
                                    <select
                                        className="form-control"
                                        value={feeForm.feeStructureId}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            const sel = feeStructures.find(f => f.id === id);
                                            setFeeForm(f => ({
                                                ...f,
                                                feeStructureId: id,
                                                customAmountRupees: sel ? (sel.totalAmount / 100).toString() : f.customAmountRupees
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">-- Choose Fee Structure --</option>
                                        {feeStructures.map((fs) => (
                                            <option key={fs.id} value={fs.id}>
                                                {fs.name} (Academic Year: {fs.academicYear}) — ₹{(fs.totalAmount / 100).toLocaleString('en-IN')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Total Fee Amount (₹ INR)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="e.g. 25000"
                                        value={feeForm.customAmountRupees}
                                        onChange={(e) => setFeeForm(f => ({ ...f, customAmountRupees: e.target.value }))}
                                    />
                                    <small className="text-muted" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                        Specify a custom fee amount or leave default from the selected fee structure.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={feeForm.dueDate}
                                        onChange={(e) => setFeeForm(f => ({ ...f, dueDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowFeeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={assigningFee}>
                                    {assigningFee ? 'Updating...' : '💾 Save Student Fee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student History & Profile Modal */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal" style={{ maxWidth: 900, width: '92vw' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">📜 Student Complete History & Profile</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowHistoryModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            {loadingHistory ? (
                                <div className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                            ) : historyStudentDetail ? (
                                <div>
                                    {/* Overview Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{historyStudentDetail.name}</h3>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                ID: <b>{historyStudentDetail.studentId}</b> | Class: <b>{historyStudentDetail.class} {historyStudentDetail.section && `(${historyStudentDetail.section})`}</b> {historyStudentDetail.rollNumber && `| Roll: ${historyStudentDetail.rollNumber}`}
                                            </div>
                                        </div>
                                        <span className="badge badge-primary">{historyStudentDetail.branch?.name || 'Main Branch'}</span>
                                    </div>

                                    {/* Parent Info */}
                                    <div className="card mb-3" style={{ padding: 12, background: 'var(--surface)' }}>
                                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>Parent / Guardian Contact</div>
                                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                                            <div><b>Name:</b> {historyStudentDetail.parent?.name || '—'}</div>
                                            <div><b>Phone:</b> {historyStudentDetail.parent?.phone || '—'}</div>
                                            <div><b>Email:</b> {historyStudentDetail.parent?.email || '—'}</div>
                                        </div>
                                    </div>

                                    {/* Allocated Fee Summary */}
                                    <div className="card mb-4" style={{ padding: 12 }}>
                                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>Fee Allocations & Outstanding Balance</div>
                                        {historyStudentDetail.studentFees?.length === 0 ? (
                                            <div className="text-muted text-sm">No fee structure assigned to this student yet.</div>
                                        ) : historyStudentDetail.studentFees.map((sf: any) => {
                                            const due = sf.totalAmount - sf.paidAmount;
                                            return (
                                                <div key={sf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                                    <div>
                                                        <b>{sf.feeStructure?.name || 'School Fee'}</b> ({sf.academicYear})
                                                        {sf.dueDate && <div className="text-sm text-muted">Due Date: {new Date(sf.dueDate).toLocaleDateString('en-IN')}</div>}
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div>Total: <b>₹{(sf.totalAmount / 100).toLocaleString('en-IN')}</b> | Paid: <span className="text-success">₹{(sf.paidAmount / 100).toLocaleString('en-IN')}</span></div>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: due > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                                                            {due > 0 ? `Outstanding Balance: ₹${(due / 100).toLocaleString('en-IN')}` : '✅ Fully Paid'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Complete Payment & Receipt History */}
                                    <div className="card" style={{ padding: 12 }}>
                                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>Complete Transaction & Receipt Timeline</div>
                                        {historyStudentDetail.studentFees?.flatMap((sf: any) => sf.payments || []).length === 0 ? (
                                            <div className="text-muted text-sm" style={{ padding: 10 }}>No payments recorded for this student.</div>
                                        ) : (
                                            <div className="table-wrap" style={{ border: 'none', overflowX: 'visible' }}>
                                                <table className="table" style={{ fontSize: 12, width: '100%' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '22%' }}>Receipt No.</th>
                                                            <th style={{ width: '12%' }}>Date</th>
                                                            <th style={{ width: '12%' }}>Mode</th>
                                                            <th style={{ width: '15%' }}>Amount</th>
                                                            <th style={{ width: '24%' }}>Ref No.</th>
                                                            <th style={{ width: '15%', textAlign: 'center' }}>Official PDF</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {historyStudentDetail.studentFees.flatMap((sf: any) => sf.payments || []).map((p: any) => (
                                                            <tr key={p.id}>
                                                                <td><span className="badge badge-primary" style={{ fontSize: 11 }}>{p.receipt?.receiptNumber || 'N/A'}</span></td>
                                                                <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                                <td><span className="badge badge-info">{p.mode}</span></td>
                                                                <td><b className="text-success">₹{(p.amount / 100).toLocaleString('en-IN')}</b></td>
                                                                <td style={{ wordBreak: 'break-all' }}>{p.transactionRef || '—'}</td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    {p.receipt ? (
                                                                        <a
                                                                            href={`${getBaseUrl()}${p.receipt.pdfUrl.startsWith('/api') ? p.receipt.pdfUrl : `/api${p.receipt.pdfUrl}`}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-accent btn-sm"
                                                                            style={{ padding: '4px 10px', fontSize: 11 }}
                                                                        >
                                                                            📄 Download PDF
                                                                        </a>
                                                                    ) : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
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

export default function StudentsPage() {
    return (
        <Suspense fallback={<div className="layout-loading"><div className="spinner" /></div>}>
            <StudentsContent />
        </Suspense>
    );
}


