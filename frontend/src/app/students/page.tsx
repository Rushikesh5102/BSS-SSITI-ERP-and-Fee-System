'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { generateAdmissionFormPdf, generateStudentIdCardPdf } from '../../utils/studentPdfGenerator';

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
    const initialFormState = {
        name: '', class: '', section: '', rollNumber: '', photo: '', signature: '', email: '',
        category: 'OPEN', landline: '', parentName: '', parentPhone: '', parentEmail: '',
        feeStructureId: '', customAmountRupees: '',
        educationDetails: { board: 'Maharashtra State Board', school: '', passingYear: '2023', medium: 'English', percentage: '', city: 'Bhadravati', rollNo: '', result: 'PASSED' },
        submittedDocuments: { tc: false, marklist: false, caste: false, nonCreamy: false, photo4: true, income: false, affidavit: false, gap: false, aadhar: true, bankPassbook: false }
    };
    const [form, setForm] = useState(initialFormState);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    // Image Viewer Modal State (Full-res viewing & downloading)
    const [viewImageModal, setViewImageModal] = useState<{ url: string; title: string; filename: string } | null>(null);
    // User Guide Modal State for Admin & Accountant
    const [showUserGuide, setShowUserGuide] = useState(false);
    // Storage Lifespan Breakdown Modal State
    const [showStorageCalc, setShowStorageCalc] = useState(false);

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
        // Load fast cached student list first if available
        if (students.length === 0 && typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('sai_iti_students_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setStudents(parsed.students || []);
                    setTotal(parsed.total || 0);
                }
            } catch {}
        }
        setFetching(students.length === 0);
        try {
            const { data } = await api.get(`/students?page=${page}&limit=15&search=${search}`);
            setStudents(data.data);
            setTotal(data.pagination?.total || 0);
            if (typeof window !== 'undefined' && !search && page === 1) {
                localStorage.setItem('sai_iti_students_cache', JSON.stringify({ students: data.data, total: data.pagination?.total || 0 }));
            }
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
            const amountInPaise = form.customAmountRupees ? Math.round(parseFloat(form.customAmountRupees) * 100) : undefined;
            const { data } = await api.post('/students', {
                name: form.name, class: form.class, section: form.section, rollNumber: form.rollNumber,
                photo: form.photo || undefined, signature: form.signature || undefined, email: form.email,
                category: form.category, landline: form.landline || undefined,
                educationDetails: form.educationDetails, submittedDocuments: form.submittedDocuments,
                feeStructureId: form.feeStructureId || undefined, customTotalAmount: amountInPaise,
                parent: form.parentName ? { name: form.parentName, phone: form.parentPhone, email: form.parentEmail } : undefined,
            });
            const loginDetails = data.data?.loginDetails;
            setShowModal(false);
            if (loginDetails) {
                alert(`✅ Admission Successful!\n\nStudent Login Credentials:\nEmail / ID: ${loginDetails.email}\nPassword: ${loginDetails.defaultPassword}\n\nPlease share these credentials with the student to access the portal.`);
            } else {
                showToast('✅ Student admitted successfully!');
            }
            setForm(initialFormState);
            fetchStudents();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to add student'}`);
        } finally { setSaving(false); }
    };

    const canEdit = user && ['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(user.role);

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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => setShowUserGuide(true)} style={{ fontSize: 13 }}>
                            📖 User Guide
                        </button>
                        {canEdit && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                ➕ New Admission
                            </button>
                        )}
                    </div>
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
                                                <td><span className="badge badge-primary">{s.studentId?.includes('e+') || s.studentId?.includes('E+') ? `SSITI-2026-${s.rollNumber || '01'}` : s.studentId}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {s.photo ? (
                                                            <img
                                                                src={s.photo}
                                                                alt={s.name}
                                                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', cursor: 'pointer' }}
                                                                title="Click to view & download photo"
                                                                onClick={() => setViewImageModal({ url: s.photo, title: `${s.name} - Profile Photo`, filename: `${s.studentId}_photo.png` })}
                                                            />
                                                        ) : (
                                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                                                                {s.name[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <b>{s.name}</b>
                                                            {s.rollNumber && !s.rollNumber.includes('e+') && !s.rollNumber.includes('E+') && (
                                                                <><br /><span className="text-sm text-muted">Roll: {s.rollNumber}</span></>
                                                            )}
                                                        </div>
                                                    </div>
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
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', minWidth: 210 }}>
                                                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'center' }} onClick={() => openHistoryModal(s.id)}>
                                                            📜 History
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'center' }} onClick={async () => await generateStudentIdCardPdf(s)} title="Download Student Identity Card PDF">
                                                            🪪 ID Card
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'center' }} onClick={async () => await generateAdmissionFormPdf(s)} title="Download Official Admission Form PDF">
                                                            📄 Form PDF
                                                        </button>
                                                        {(canEdit || (user.role === 'ACCOUNTANT' && totalFee === 0)) && (
                                                            <button className="btn btn-primary btn-sm" style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'center' }} onClick={() => openFeeModal(s)}>
                                                                💳 {totalFee > 0 ? 'Edit Fee' : 'Assign Fee'}
                                                            </button>
                                                        )}
                                                    </div>
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
                                    {/* Fee Structure Assignment During Admission */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Assign Fee Structure (Optional)</label>
                                        <select
                                            className="form-control"
                                            value={form.feeStructureId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                const sel = feeStructures.find(f => f.id === id);
                                                setForm(f => ({
                                                    ...f,
                                                    feeStructureId: id,
                                                    customAmountRupees: sel ? (sel.totalAmount / 100).toString() : f.customAmountRupees
                                                }));
                                            }}
                                        >
                                            <option value="">-- No Fee Assigned At Admission --</option>
                                            {feeStructures.map((fs) => (
                                                <option key={fs.id} value={fs.id}>
                                                    {fs.name} (Year: {fs.academicYear}) — ₹{(fs.totalAmount / 100).toLocaleString('en-IN')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {form.feeStructureId && (
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Custom Admission Fee Amount (₹ INR)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="e.g. 25000"
                                                value={form.customAmountRupees}
                                                onChange={(e) => setForm(f => ({ ...f, customAmountRupees: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {/* Drag & Drop Photo Upload */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Student Photo (Drag & Drop or Select)</label>
                                        <div 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files?.[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result as string }));
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                                                background: 'var(--surface-2)', border: '2px dashed var(--primary)', borderRadius: 10
                                            }}
                                        >
                                            {form.photo ? (
                                                <img src={form.photo} alt="Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', cursor: 'pointer' }} onClick={() => setViewImageModal({ url: form.photo, title: 'Photo Preview', filename: 'photo_preview.png' })} />
                                            ) : (
                                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="form-control"
                                                    style={{ padding: '6px 10px', fontSize: 13, height: 'auto', background: 'transparent', border: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result as string }));
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag image file here or tap to select</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drag & Drop Signature Upload */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Student Signature (Drag & Drop or Select)</label>
                                        <div 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files?.[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setForm(f => ({ ...f, signature: reader.result as string }));
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                                                background: 'var(--surface-2)', border: '2px dashed #10b981', borderRadius: 10
                                            }}
                                        >
                                            {form.signature ? (
                                                <img src={form.signature} alt="Signature Preview" style={{ width: 64, height: 36, objectFit: 'contain', background: '#ffffff', borderRadius: 6, padding: 2, border: '1px solid #10b981', cursor: 'pointer' }} onClick={() => setViewImageModal({ url: form.signature, title: 'Signature Preview', filename: 'signature_preview.png' })} />
                                            ) : (
                                                <div style={{ width: 48, height: 36, borderRadius: 6, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✍️</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="form-control"
                                                    style={{ padding: '6px 10px', fontSize: 13, height: 'auto', background: 'transparent', border: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setForm(f => ({ ...f, signature: reader.result as string }));
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag signature file here or tap to select</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-control" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                                            <option value="OPEN">OPEN / General</option>
                                            <option value="OBC">OBC</option>
                                            <option value="SC">SC</option>
                                            <option value="ST">ST</option>
                                            <option value="VJNT">VJ / NT</option>
                                            <option value="SBC">SBC</option>
                                            <option value="EWS">EWS</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Landline / Alt Phone</label>
                                        <input className="form-control" value={form.landline} onChange={(e) => setForm(f => ({ ...f, landline: e.target.value }))} placeholder="Optional alternate number" />
                                    </div>

                                    {/* Class X Educational Details Section (Image 3) */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                                        <div className="form-label font-bold mb-3" style={{ fontSize: 13, color: 'var(--primary)' }}>🎓 CLASS X EDUCATION DETAILS</div>
                                        <div className="grid grid-2" style={{ gap: 10 }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Board</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.board} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, board: e.target.value } }))} placeholder="e.g. Maharashtra State Board" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>School Name</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.school} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, school: e.target.value } }))} placeholder="High School Name" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Passing Year</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.passingYear} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, passingYear: e.target.value } }))} placeholder="e.g. 2023" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Medium</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.medium} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, medium: e.target.value } }))} placeholder="e.g. English / Marathi" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Aggregate %</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.percentage} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, percentage: e.target.value } }))} placeholder="e.g. 78.50%" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Class X Roll No</label>
                                                <input className="form-control" style={{ fontSize: 13 }} value={form.educationDetails.rollNo} onChange={(e) => setForm(f => ({ ...f, educationDetails: { ...f.educationDetails, rollNo: e.target.value } }))} placeholder="Class 10 Roll No" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submitted Original Documents Checklist (Image 4) */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                                        <div className="form-label font-bold mb-3" style={{ fontSize: 13, color: 'var(--primary)' }}>📁 ORIGINAL DOCUMENTS SUBMITTED CHECKLIST</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                            {[
                                                { key: 'tc', label: 'TC (Transfer Cert)' },
                                                { key: 'marklist', label: 'Class X Mark list' },
                                                { key: 'caste', label: 'Caste Certificate' },
                                                { key: 'nonCreamy', label: 'Non-Creamy Layer' },
                                                { key: 'photo4', label: 'Photo - 4 Copies' },
                                                { key: 'income', label: 'Income Certificate' },
                                                { key: 'affidavit', label: 'Affidavit' },
                                                { key: 'gap', label: 'Gap Certificate' },
                                                { key: 'aadhar', label: 'Aadhaar Card' },
                                                { key: 'bankPassbook', label: 'Bank Passbook Xerox' },
                                            ].map((docItem) => (
                                                <label key={docItem.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(form.submittedDocuments as any)[docItem.key]}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setForm(f => ({
                                                                ...f,
                                                                submittedDocuments: { ...f.submittedDocuments, [docItem.key]: checked }
                                                            }));
                                                        }}
                                                    />
                                                    {docItem.label}
                                                </label>
                                            ))}
                                        </div>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            {historyStudentDetail.photo ? (
                                                <img src={historyStudentDetail.photo} alt={historyStudentDetail.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                            ) : (
                                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
                                                    {historyStudentDetail.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{historyStudentDetail.name}</h3>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                                    ID: <b>{historyStudentDetail.studentId}</b> | Class: <b>{historyStudentDetail.class} {historyStudentDetail.section && `(${historyStudentDetail.section})`}</b> {historyStudentDetail.rollNumber && `| Roll: ${historyStudentDetail.rollNumber}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => generateStudentIdCardPdf(historyStudentDetail)}>
                                                🪪 ID Card PDF
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => generateAdmissionFormPdf(historyStudentDetail)}>
                                                📄 Admission PDF
                                            </button>
                                        </div>
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
                                                            <th style={{ width: '25%', textAlign: 'center' }}>Actions / PDF</th>
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
                                                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                                        {p.receipt ? (
                                                                            <a
                                                                                href={`${getBaseUrl()}${p.receipt.pdfUrl.startsWith('/api') ? p.receipt.pdfUrl : `/api${p.receipt.pdfUrl}`}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="btn btn-accent btn-sm"
                                                                                style={{ padding: '4px 8px', fontSize: 11 }}
                                                                            >
                                                                                📄 PDF
                                                                            </a>
                                                                        ) : null}
                                                                        {['SUPERADMIN', 'ADMIN', 'DEVELOPER'].includes(user.role) && p.status !== 'REFUNDED' && (
                                                                            <button
                                                                                className="btn btn-danger btn-sm"
                                                                                style={{ padding: '4px 8px', fontSize: 11 }}
                                                                                onClick={async () => {
                                                                                    const reason = prompt('Reason for fee refund:');
                                                                                    if (!reason) return;
                                                                                    try {
                                                                                        await api.post(`/payments/${p.id}/refund`, { reason });
                                                                                        showToast('✅ Fee refunded successfully!');
                                                                                        openHistoryModal(historyStudentDetail.id);
                                                                                        fetchStudents();
                                                                                    } catch (err: any) {
                                                                                        showToast(`❌ ${err.response?.data?.message || 'Refund failed'}`);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                💸 Refund
                                                                            </button>
                                                                        )}
                                                                        {p.status === 'REFUNDED' && (
                                                                            <span className="badge badge-danger">REFUNDED</span>
                                                                        )}
                                                                    </div>
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

            {/* Full-Res Image Viewer & Downloader Modal */}
            {viewImageModal && (
                <div className="modal-overlay" onClick={() => setViewImageModal(null)}>
                    <div className="modal" style={{ maxWidth: 500, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">🖼️ {viewImageModal.title}</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setViewImageModal(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 20 }}>
                            <img src={viewImageModal.url} alt={viewImageModal.title} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 12, border: '1px solid var(--border)', objectFit: 'contain' }} />
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <a
                                href={viewImageModal.url}
                                download={viewImageModal.filename}
                                className="btn btn-primary"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                📥 Download Image File
                            </a>
                            <button className="btn btn-secondary" onClick={() => setViewImageModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Role-Separated User Guide Modal */}
            {showUserGuide && (
                <div className="modal-overlay" onClick={() => setShowUserGuide(false)}>
                    <div className="modal" style={{ maxWidth: 750, width: '92vw' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                {user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? '🏢 Branch Admin User Guide' :
                                 user?.role === 'ACCOUNTANT' ? '🧾 Accountant Operational Guide' :
                                 user?.role === 'STUDENT' ? '🎓 Student Portal User Guide' :
                                 '🛠️ System Architect User Guide'}
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowUserGuide(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', fontSize: 14, lineHeight: 1.6 }}>
                            
                            {/* BRANCH ADMIN GUIDE */}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🏢 Branch Administrator Operational Capabilities</h3>
                                    <p className="text-muted mb-4">Complete management guide for Branch Administrators with full administrative privileges.</p>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>1. Full Student Admissions & Fee Customization</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Click <b>➕ New Admission</b> to register students with trade, photo, signature, Class X education details, and submitted document checklist.</li>
                                            <li>System auto-generates Roll Number and Student ID (e.g. <code>SSITI-2026-E01</code>).</li>
                                            <li><b>Admin Privilege</b>: Assign or customize custom admission fee amounts directly during student registration.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>2. Fee Structure Creation & Unrestricted Fee Modifications</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Navigate to <b>⚙️ Fee Structures</b> to create master trade fee templates.</li>
                                            <li><b>Admin Privilege</b>: As Branch Admin, you can edit and update established fee amounts even after they have been assigned to students.</li>
                                            <li>Accountant accounts are locked from changing assigned fee structures for security.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>3. Payment Collection & PDF Generation</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Collect offline payments (Cash, UPI, Cheque, Bank Transfer) or launch live <b>💳 Razorpay Checkout</b>.</li>
                                            <li>Instantly generate 2-Page Front & Back Student ID Cards and Official Admission Application PDFs with institute logo.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>4. Revenue Analytics & Branch Reports</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Use <b>📈 Reports</b> to track collected vs outstanding dues, monthly revenue trends, and export financial summaries to Excel/PDF.</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* ACCOUNTANT GUIDE */}
                            {user?.role === 'ACCOUNTANT' && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🧾 Accountant Operational Capabilities</h3>
                                    <p className="text-muted mb-4">Daily workflow guide for fee collection, receipt issuing, and student document downloads.</p>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>1. Recording Payments & Razorpay Online Checkout</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Navigate to <b>💳 Record Payment</b>. Select student by ID, Roll No, or Name.</li>
                                            <li>Record offline payments (Cash, UPI, Cheque, Bank Transfer) or click <b>💳 Pay via Razorpay</b> for instant online checkout!</li>
                                            <li>Live receipt preview and official PDF receipt generation with institute logo are auto-created upon payment.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>2. Student Admission & ID Card Downloads</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Click <b>➕ New Admission</b> to enroll new students with photo, signature, and Class X details.</li>
                                            <li>Single-click download for <b>🪪 2-Page Front & Back ID Cards</b> and <b>📄 Admission Application PDFs</b>.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: 14, borderRadius: 10 }}>
                                        <h4 style={{ color: '#b45309' }}>🔒 Fee Structure Security Lock Notice</h4>
                                        <p style={{ marginTop: 6, fontSize: 13, color: '#92400e' }}>
                                            As an Accountant, you can collect fee payments and assign initial fee structures. However, established fee amounts cannot be modified once set. Fee structure adjustments require <b>Branch Admin</b> authorization.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* STUDENT GUIDE */}
                            {user?.role === 'STUDENT' && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🎓 Student Self-Service Portal Guide</h3>
                                    <p className="text-muted mb-4">Instructions for viewing fee status, paying online via Razorpay, and downloading documents.</p>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>1. Online Fee Payment via Razorpay</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>View total assigned trade fees, total paid, and pending balance.</li>
                                            <li>Click <b>💳 Pay via Razorpay</b> to pay online using GPay, PhonePe, Paytm, UPI, Cards, or NetBanking.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>2. Digital Receipts & ID Card Download</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Download official fee payment receipts for your records anytime.</li>
                                            <li>Download your official <b>🪪 2-Page Front & Back Student ID Card PDF</b> with college seal and emergency contacts.</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* DEVELOPER GUIDE */}
                            {user?.role === 'DEVELOPER' && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🛠️ System Architect Diagnostic Guide</h3>
                                    <p className="text-muted mb-4">Developer level controls, system diagnostics, and role simulation tools.</p>
                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10 }}>
                                        <ul style={{ marginLeft: 20 }}>
                                            <li>Access <b>⚙️ System Health</b> for live PostgreSQL telemetry and API latency monitoring.</li>
                                            <li>Use <b>Role Simulation Mode</b> to test Branch Admin, Accountant, or Student perspective in real-time.</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowUserGuide(false)}>Got It!</button>
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


