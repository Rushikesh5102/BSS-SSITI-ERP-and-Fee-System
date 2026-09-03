'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Footer from '../../components/Footer';
import AutoRecoverBanner from '../../components/AutoRecoverBanner';
import { safeStorage } from '../../utils/safeStorage';

const generateAdmissionFormPdf = async (student: any) => {
    const mod = await import('../../utils/studentPdfGenerator');
    return mod.generateAdmissionFormPdf(student);
};

const generateStudentIdCardPdf = async (student: any) => {
    const mod = await import('../../utils/studentPdfGenerator');
    return mod.generateStudentIdCardPdf(student);
};

const INDIAN_SUBCASTES: Record<string, string[]> = {
    OBC: ['Mali', 'Kunbi', 'Teli', 'Dhangar', 'Nhavi', 'Kumbhar', 'Sutar', 'Koshti', 'Shimpi', 'Lohar', 'Vani', 'Sonar', 'Gurav', 'Bhavsar', 'Koli', 'Tambat', 'Gawali', 'Yadav', 'Other (Write-in)'],
    SC: ['Mahar', 'Matang (Mang)', 'Chambhar', 'Valmiki', 'Bhangi', 'Holiya', 'Dhor', 'Khatik', 'Meghwal', 'Pasi', 'Other (Write-in)'],
    ST: ['Gond', 'Bhil', 'Kolam', 'Korku', 'Andh', 'Pardhan', 'Halba', 'Pawara', 'Warli', 'Thakur', 'Gowari', 'Other (Write-in)'],
    VJNT: ['Banjara (Laman)', 'Vanjari', 'Dhangar', 'Gosavi', 'Nath', 'Beldar', 'Ramoshi', 'Kaikadi', 'Wadar', 'Bhamta', 'Golla', 'Other (Write-in)'],
    SBC: ['Koli', 'Koshti', 'Agri', 'Gabit', 'Sonkoli', 'Machhimar', 'Other (Write-in)'],
    EWS: ['Maratha', 'Brahmin', 'Rajput', 'Jain', 'Lingayat', 'Komti', 'Vaishya', 'Kshatriya', 'Other (Write-in)'],
    OPEN: ['General / Open', 'Maratha', 'Brahmin', 'Rajput', 'Jain', 'Lingayat', 'Komti', 'Vaishya', 'Kshatriya', 'Sindhi', 'Punjabi', 'Muslim General', 'Christian', 'Other (Write-in)']
};

function StudentsContent({ actionParam, simulateParam, tabParam }: { actionParam: string | null; simulateParam: string | null; tabParam: string | null }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [fetching, setFetching] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const currentYear = new Date().getFullYear();
    const defaultSession = `${currentYear} - ${currentYear + 2}`;

    const initialFormState = {
        name: '', class: 'Electrician', section: 'A', rollNumber: '', photo: '', signature: '', email: '',
        dateOfBirth: '',
        category: 'OPEN', subcaste: '', isOtherSubcaste: false, otherSubcaste: '',
        address: '', bloodGroup: 'O+', landline: '', parentName: '', parentPhone: '', parentEmail: '',
        academicSession: defaultSession,
        feeStructureId: '', customAmountRupees: '',
        tuitionFee: '', examFee: '', dressMaterialFee: '', otherFee: '', otherFeeLabel: 'Other Dues / Charges',
        educationDetails: { 
            board: 'Maharashtra State Board', school: '', passingYear: '2023', medium: 'English', 
            percentage: '', city: 'Bhadravati', rollNo: '', result: 'PASSED', higherEducation: '' 
        },
        submittedDocuments: { 
            domicile: false, marksheet12th: false, baDegree: false, bcomDegree: false, btechDegree: false,
            tc: false, marklist: false, caste: false, nonCreamy: false, photo4: true, income: false, 
            affidavit: false, gap: false, aadhar: true, bankPassbook: false, otherDocs: false, otherDocsText: ''
        }
    };
    const [form, setForm] = useState(initialFormState);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    // Auto-Recover Draft State for Admission Form
    const [hasStudentDraft, setHasStudentDraft] = useState(false);
    const [studentDraftTime, setStudentDraftTime] = useState<string | null>(null);

    useEffect(() => {
        if (showModal) {
            const saved = safeStorage.get<any>('draft_student_admission', null);
            if (saved && (saved.name || saved.class)) {
                setHasStudentDraft(true);
                setStudentDraftTime(saved.savedAt);
            }
        }
    }, [showModal]);

    useEffect(() => {
        if (showModal && (form.name || form.class)) {
            const timer = setTimeout(() => {
                safeStorage.set('draft_student_admission', {
                    ...form,
                    savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [form, showModal]);

    const handleRestoreStudentDraft = () => {
        const saved = safeStorage.get<any>('draft_student_admission', null);
        if (saved) {
            setForm(saved);
            setHasStudentDraft(false);
        }
    };

    const handleDiscardStudentDraft = () => {
        safeStorage.remove('draft_student_admission');
        setHasStudentDraft(false);
    };

    // Image Viewer Modal State (Full-res viewing & downloading)
    const [viewImageModal, setViewImageModal] = useState<{ url: string; title: string; filename: string } | null>(null);
    // User Guide Modal State for Admin & Accountant
    const [showUserGuide, setShowUserGuide] = useState(false);
    // Admission Success Celebratory Modal State
    const [admissionSuccessData, setAdmissionSuccessData] = useState<any | null>(null);

    // Fee Assignment / Update Modal State
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [feeForm, setFeeForm] = useState({
        feeStructureId: '', customAmountRupees: '', dueDate: '',
        tuitionFee: '', examFee: '', dressMaterialFee: '', otherFee: '', otherFeeLabel: 'Other Charges'
    });
    const [assigningFee, setAssigningFee] = useState(false);

    // Edit Student Admission Profile Modal State
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [editProfileForm, setEditProfileForm] = useState({
        name: '', class: 'Electrician', section: '', rollNumber: '',
        academicSession: '', dateOfBirth: '', gender: 'Male', bloodGroup: '',
        category: 'OPEN', subcaste: '', isOtherSubcaste: false, otherSubcaste: '',
        parentName: '', parentPhone: '', parentEmail: '', address: '', landline: '',
        photo: '', signature: '',
        educationDetails: { qualification: '10th (SSC)', board: 'MSBSHSE', schoolName: '', passingYear: '2024', percentage: '', rollNo: '' },
        submittedDocuments: {
            sscMarksheet: false, leavingCertificate: false, casteCertificate: false,
            nonCreamyLayer: false, incomeCertificate: false, aadharCard: false,
            domicileCertificate: false, passportPhotos: false
        }
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const openEditProfileModal = (student: any) => {
        setEditingStudent(student);
        const edu = student.educationDetails || {};
        const docs = student.submittedDocuments || {};
        const cat = student.category || 'OPEN';
        const sub = student.subcaste || edu.subcaste || '';
        const listSubs = INDIAN_SUBCASTES[cat] || INDIAN_SUBCASTES['OPEN'];
        const isOther = sub && !listSubs.includes(sub);

        setEditProfileForm({
            name: student.name || '',
            class: student.class || 'Electrician',
            section: student.section || '',
            rollNumber: student.rollNumber || '',
            academicSession: `${new Date(student.createdAt).getFullYear()} - ${new Date(student.createdAt).getFullYear() + 2}`,
            dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
            gender: student.gender || 'Male',
            bloodGroup: student.bloodGroup || '',
            category: cat,
            subcaste: sub,
            isOtherSubcaste: !!isOther,
            otherSubcaste: isOther ? sub : '',
            parentName: student.parent?.name || '',
            parentPhone: student.parent?.phone || '',
            parentEmail: student.parent?.email || '',
            address: student.address || '',
            landline: student.landline || '',
            photo: student.photo || '',
            signature: student.signature || '',
            educationDetails: {
                qualification: edu.qualification || '10th (SSC)',
                board: edu.board || 'MSBSHSE',
                schoolName: edu.schoolName || '',
                passingYear: edu.passingYear || '2024',
                percentage: edu.percentage || '',
                rollNo: edu.rollNo || ''
            },
            submittedDocuments: {
                sscMarksheet: docs.sscMarksheet || false,
                leavingCertificate: docs.leavingCertificate || false,
                casteCertificate: docs.casteCertificate || false,
                nonCreamyLayer: docs.nonCreamyLayer || false,
                incomeCertificate: docs.incomeCertificate || false,
                aadharCard: docs.aadharCard || false,
                domicileCertificate: docs.domicileCertificate || false,
                passportPhotos: docs.passportPhotos || false
            }
        });
        setShowEditProfileModal(true);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        if (!editProfileForm.name || !editProfileForm.class) {
            showToast('❌ Full Name and Enrolled Trade are required!');
            return;
        }

        setUpdatingProfile(true);
        try {
            await api.put(`/students/${editingStudent.id}`, {
                name: editProfileForm.name,
                class: editProfileForm.class,
                section: editProfileForm.section || null,
                rollNumber: editProfileForm.rollNumber || null,
                category: editProfileForm.category || 'OPEN',
                bloodGroup: editProfileForm.bloodGroup || null,
                gender: editProfileForm.gender || 'Male',
                dateOfBirth: editProfileForm.dateOfBirth ? editProfileForm.dateOfBirth : null,
                address: editProfileForm.address || null,
                landline: editProfileForm.landline || null,
                photo: editProfileForm.photo || null,
                signature: editProfileForm.signature || null,
                educationDetails: {
                    ...editProfileForm.educationDetails,
                    subcaste: editProfileForm.subcaste || null
                },
                submittedDocuments: editProfileForm.submittedDocuments,
                parent: {
                    name: editProfileForm.parentName,
                    phone: editProfileForm.parentPhone,
                    email: editProfileForm.parentEmail
                }
            });

            showToast('✅ Student admission profile updated successfully!');
            setShowEditProfileModal(false);
            fetchStudents();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to update student profile'}`);
        } finally {
            setUpdatingProfile(false);
        }
    };

    const [deletingStudent, setDeletingStudent] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    const handleDeleteStudent = async () => {
        if (!editingStudent) return;
        try {
            setDeletingStudent(true);
            await api.delete(`/students/${editingStudent.id}`, {
                data: { reason: `Administrative Deletion by ${effectiveRole}` }
            });
            showToast(`🗑️ Student ${editingStudent.name} (${editingStudent.studentId}) successfully deleted and archived.`);
            setShowDeleteConfirmModal(false);
            setShowEditProfileModal(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to delete student'}`);
        } finally {
            setDeletingStudent(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'students' | 'inquiries'>('students');

    useEffect(() => {
        if (tabParam === 'inquiries') {
            setActiveTab('inquiries');
        }
    }, [tabParam]);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [fetchingInquiries, setFetchingInquiries] = useState(false);
    const [acceptingInquiryId, setAcceptingInquiryId] = useState<string | null>(null);

    const fetchInquiries = async () => {
        setFetchingInquiries(true);
        try {
            const { data } = await api.get('/inquiries');
            setInquiries(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingInquiries(false);
        }
    };

    const handleRejectInquiry = async (id: string) => {
        if (!confirm('⚠️ Are you sure you want to reject and delete this student inquiry?')) return;
        try {
            await api.delete(`/inquiries/${id}`);
            showToast('✅ Inquiry rejected and deleted.');
            fetchInquiries();
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to reject inquiry'}`);
        }
    };

    const handleAcceptInquiry = (inquiry: any) => {
        setAcceptingInquiryId(inquiry.id);
        setForm(f => ({
            ...f,
            name: inquiry.name || '',
            class: inquiry.trade || 'Electrician',
            parentName: inquiry.parentName || '',
            parentPhone: inquiry.phone || '',
            parentEmail: inquiry.email || '',
            address: inquiry.address || '',
            category: inquiry.category || 'OPEN',
            dateOfBirth: inquiry.dateOfBirth ? (inquiry.dateOfBirth.includes('T') ? inquiry.dateOfBirth.split('T')[0] : inquiry.dateOfBirth) : '',
            educationDetails: {
                ...f.educationDetails,
                percentage: inquiry.tenthPercentage ? `${inquiry.tenthPercentage}%` : '',
                passingYear: inquiry.tenthPassingYear || '2023',
            }
        }));
        setShowModal(true);
    };

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchStudents = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/students?page=${page}&limit=15&search=${encodeURIComponent(search)}`);
            setStudents(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch { } finally { setFetching(false); }
    };

    const fetchFeeStructures = async () => {
        try {
            const { data } = await api.get('/fee-structures');
            setFeeStructures(data.data || []);
        } catch { }
    };

    useEffect(() => {
        if (!user) return;
        fetchStudents();
        fetchFeeStructures();
        if (actionParam === 'new') setShowModal(true);
    }, [user, page, search, actionParam]);

    useEffect(() => {
        if (user && activeTab === 'inquiries') {
            fetchInquiries();
        }
    }, [user, activeTab]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    };

    const openAssignFeeModal = (student: any) => {
        setSelectedStudent(student);
        const currentFee = student.studentFees?.[0];
        setFeeForm({
            feeStructureId: currentFee?.feeStructureId || (feeStructures[0]?.id || ''),
            customAmountRupees: currentFee?.totalAmount ? (currentFee.totalAmount / 100).toString() : '',
            dueDate: currentFee?.dueDate ? currentFee.dueDate.split('T')[0] : '',
            tuitionFee: '', examFee: '', dressMaterialFee: '', otherFee: '', otherFeeLabel: 'Other Charges'
        });
        setShowFeeModal(true);
    };

    const handleAssignFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !feeForm.feeStructureId) return;
        setAssigningFee(true);
        try {
            const calcTotal = (
                (parseFloat(feeForm.tuitionFee) || 0) +
                (parseFloat(feeForm.examFee) || 0) +
                (parseFloat(feeForm.dressMaterialFee) || 0) +
                (parseFloat(feeForm.otherFee) || 0)
            );
            const rawAmount = calcTotal > 0 ? calcTotal.toString() : feeForm.customAmountRupees;
            const amountInPaise = rawAmount ? Math.round(parseFloat(rawAmount) * 100) : undefined;

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
            const calcTotal = (
                (parseFloat(form.tuitionFee) || 0) +
                (parseFloat(form.examFee) || 0) +
                (parseFloat(form.dressMaterialFee) || 0) +
                (parseFloat(form.otherFee) || 0)
            );
            const rawAmount = calcTotal > 0 ? calcTotal.toString() : form.customAmountRupees;
            const amountInPaise = rawAmount ? Math.round(parseFloat(rawAmount) * 100) : undefined;

            const effectiveSubcaste = form.isOtherSubcaste ? form.otherSubcaste : form.subcaste;

            const { data } = await api.post('/students', {
                name: form.name.trim(),
                class: form.class,
                section: form.section ? form.section.trim() : undefined,
                rollNumber: form.rollNumber ? form.rollNumber.trim() : undefined,
                photo: form.photo || undefined,
                signature: form.signature || undefined,
                email: form.email && form.email.trim() ? form.email.trim() : undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                category: form.category || 'OPEN',
                address: form.address ? form.address.trim() : undefined,
                bloodGroup: form.bloodGroup || undefined,
                landline: form.landline ? form.landline.trim() : undefined,
                educationDetails: {
                    ...form.educationDetails,
                    dateOfBirth: form.dateOfBirth || undefined,
                    subcaste: effectiveSubcaste,
                    address: form.address,
                    academicSession: form.academicSession,
                    tuitionFee: form.tuitionFee,
                    examFee: form.examFee,
                    dressMaterialFee: form.dressMaterialFee,
                    otherFee: form.otherFee,
                },
                submittedDocuments: form.submittedDocuments,
                feeStructureId: form.feeStructureId || (feeStructures[0]?.id || undefined),
                customTotalAmount: amountInPaise,
                parent: (form.parentName && form.parentName.trim()) || (form.parentPhone && form.parentPhone.trim()) ? {
                    name: form.parentName.trim() || 'Parent / Guardian',
                    phone: form.parentPhone ? form.parentPhone.trim() : undefined,
                    email: form.parentEmail && form.parentEmail.trim() ? form.parentEmail.trim() : undefined
                } : undefined,
            });
            const createdStudent = (data && data.data) ? data.data : (data || { ...form });
            setShowModal(false);
            safeStorage.remove('draft_student_admission');
            setHasStudentDraft(false);
            setForm(initialFormState);
            setAdmissionSuccessData(createdStudent);
            showToast('🎉 Student admitted successfully!');

            if (acceptingInquiryId) {
                try {
                    await api.put(`/inquiries/${acceptingInquiryId}/status`, { status: 'ACCEPTED' });
                    fetchInquiries();
                } catch (e) {
                    console.error("Failed to update inquiry status:", e);
                }
                setAcceptingInquiryId(null);
            }
            fetchStudents().catch(() => {});
        } catch (err: any) {
            showToast(`❌ ${err.response?.data?.message || 'Failed to add student'}`);
        } finally { setSaving(false); }
    };

    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    const isAdminOrDev = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER';
    const isAccountant = effectiveRole === 'ACCOUNTANT';
    const canAdmitStudent = ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'].includes(effectiveRole || '');

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
                        <div className="header-subtitle">{total} total students enrolled</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => setShowUserGuide(true)} style={{ fontSize: 13 }}>
                            📖 User Guide
                        </button>
                        {canAdmitStudent && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                ➕ New Admission
                            </button>
                        )}
                    </div>
                </header>

                <div className="page-content">
                    {/* Navigation Tabs */}
                    <div className="tabs-nav" style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                        <button 
                            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                            onClick={() => setActiveTab('students')}
                            style={{ padding: '8px 16px', fontWeight: 700, border: 'none', background: 'transparent', borderBottom: activeTab === 'students' ? '2px solid var(--primary)' : 'none', color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            👨‍🎓 Enrolled Students ({total})
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inquiries')}
                            style={{ padding: '8px 16px', fontWeight: 700, border: 'none', background: 'transparent', borderBottom: activeTab === 'inquiries' ? '2px solid var(--primary)' : 'none', color: activeTab === 'inquiries' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            📋 Admissions Inquiries
                            {inquiries.filter(i => i.status === 'PENDING').length > 0 && (
                                <span className="badge badge-warning" style={{ fontSize: 11, padding: '2px 6px' }}>
                                    {inquiries.filter(i => i.status === 'PENDING').length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'inquiries' ? (
                        /* Inquiries Table */
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="card-title">Prospective Student Admissions Inquiries</div>
                                <button className="btn btn-secondary btn-sm" onClick={fetchInquiries}>🔄 Refresh</button>
                            </div>
                            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                <table className="table responsive-table">
                                    <thead>
                                        <tr>
                                            <th>Applicant Name</th>
                                            <th>Interested Trade</th>
                                            <th>Contact / Phone</th>
                                            <th>Email</th>
                                            <th>Class X Marks</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fetchingInquiries ? (
                                            <tr><td colSpan={7} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                        ) : inquiries.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No prospective student inquiries logged yet.</td></tr>
                                        ) : inquiries.map((inq) => (
                                            <tr key={inq.id}>
                                                <td data-label="Applicant Name"><b>{inq.name}</b><br /><span className="text-sm text-muted">Parent: {inq.parentName || '—'}</span></td>
                                                <td data-label="Interested Trade"><span className="badge badge-primary">{inq.trade}</span></td>
                                                <td data-label="Contact / Phone">{inq.phone}</td>
                                                <td data-label="Email">{inq.email || <span className="text-muted">—</span>}</td>
                                                <td data-label="Class X Marks">{inq.tenthPercentage ? `${inq.tenthPercentage}%` : '—'}</td>
                                                <td data-label="Status">
                                                    <span className={`badge ${inq.status === 'ACCEPTED' ? 'badge-success' : inq.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                                                        {inq.status}
                                                    </span>
                                                </td>
                                                <td data-label="Actions">
                                                    {inq.status === 'PENDING' ? (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleAcceptInquiry(inq)}>
                                                                ✅ Admit
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleRejectInquiry(inq.id)}>
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted text-sm">{inq.status === 'ACCEPTED' ? 'Admitted' : 'Closed'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Enrolled Students Table */
                        <>
                        <div className="card mb-4">
                            <div className="card-body" style={{ padding: '12px 16px' }}>
                                <input
                                    type="text" className="form-control" placeholder="🔍 Search by student name, ID, roll no, trade, or subcaste..."
                                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        <div className="card">
                            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                <table className="table responsive-table">
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Student</th>
                                            <th>Trade & Session</th>
                                            <th>Category / Subcaste</th>
                                            <th>Parent & Contact</th>
                                            <th>Fee Status</th>
                                            <th style={{ minWidth: 210 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fetching ? (
                                            <tr><td colSpan={7} className="text-center" style={{ padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                        ) : students.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>No students found</td></tr>
                                        ) : students.map((s) => {
                                            const pending = s.feeAssignment?.pendingAmount ?? 0;
                                            const totalFee = s.feeAssignment?.totalAmount ?? 0;
                                            const feeAlreadyAssigned = Boolean(s.feeAssignment);
                                            const canShowFeeBtn = feeAlreadyAssigned ? isAdminOrDev : (isAdminOrDev || isAccountant);
                                            const startYr = s.createdAt ? new Date(s.createdAt).getFullYear() : currentYear;

                                            return (
                                                <tr key={s.id}>
                                                    <td data-label="Student ID"><span className="badge badge-primary">{s.studentId?.includes('e+') || s.studentId?.includes('E+') ? `SSITI-2024-${s.rollNumber || '01'}` : s.studentId}</span></td>
                                                    <td data-label="Student">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            {s.photo ? (
                                                                <img
                                                                    src={s.photo}
                                                                    alt={s.name}
                                                                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', cursor: 'pointer' }}
                                                                    title="Click to view photo"
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
                                                    <td data-label="Trade & Session">
                                                        <b>{s.class}{s.section ? ` - ${s.section}` : ''}</b>
                                                        <br />
                                                        <span className="text-sm text-muted">{startYr} - {startYr + 2} (2-Yr)</span>
                                                    </td>
                                                    <td data-label="Category / Subcaste">
                                                        <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                                                            {s.category || 'OPEN'}
                                                            {s.subcaste ? ` (${s.subcaste})` : (s.educationDetails?.subcaste ? ` (${s.educationDetails.subcaste})` : '')}
                                                        </span>
                                                    </td>
                                                    <td data-label="Parent & Contact">
                                                        <div><b>{s.parent?.name || '—'}</b></div>
                                                        <div className="text-sm text-muted">{s.parent?.phone || '—'}</div>
                                                    </td>
                                                    <td data-label="Fee Status">
                                                        {totalFee > 0 ? (
                                                            <span className={`badge ${pending > 0 ? 'badge-warning' : 'badge-success'}`}>
                                                                {pending > 0 ? `₹${(pending / 100).toLocaleString('en-IN')} due` : 'Paid'}
                                                            </span>
                                                        ) : <span className="badge badge-neutral">Not Assigned</span>}
                                                    </td>
                                                    <td data-label="Actions" className="cell-actions" style={{ minWidth: 160 }}>
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                            {canShowFeeBtn && (
                                                                <button className="btn btn-primary btn-xs" style={{ padding: '4px 8px', fontSize: 11.5, fontWeight: 700 }} onClick={() => openAssignFeeModal(s)} title={feeAlreadyAssigned ? 'Edit Fee' : 'Assign Fee'}>
                                                                    💳 {feeAlreadyAssigned ? 'Edit Fee' : 'Assign Fee'}
                                                                </button>
                                                            )}
                                                            <button className="btn btn-secondary btn-xs" style={{ padding: '4px 7px', fontSize: 11.5 }} onClick={() => openHistoryModal(s.id)} title="View Fee History">
                                                                📜 History
                                                            </button>
                                                            <button className="btn btn-secondary btn-xs" style={{ padding: '4px 7px', fontSize: 11.5 }} onClick={() => openEditProfileModal(s)} title="Edit Student Admission Profile">
                                                                ✏️ Edit
                                                            </button>
                                                            <button className="btn btn-ghost btn-xs" style={{ padding: '4px 6px', fontSize: 11.5 }} onClick={async () => await generateStudentIdCardPdf(s)} title="Download Student Identity Card PDF">
                                                                🪪 ID
                                                            </button>
                                                            <button className="btn btn-ghost btn-xs" style={{ padding: '4px 6px', fontSize: 11.5 }} onClick={async () => await generateAdmissionFormPdf(s)} title="Download Official Admission Form PDF">
                                                                📄 PDF
                                                            </button>
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
                        </>
                    )}
                </div>

                <Footer />
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">➕ New Student Admission Form</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <AutoRecoverBanner
                                    show={hasStudentDraft}
                                    savedAt={studentDraftTime}
                                    onRestore={handleRestoreStudentDraft}
                                    onDiscard={handleDiscardStudentDraft}
                                />

                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Full Name <span className="required">*</span></label>
                                        <input className="form-control" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Enrolled Trade <span className="required">*</span></label>
                                        <select className="form-control" required value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))}>
                                            <option value="Electrician">Electrician (2-Year)</option>
                                            <option value="Fitter">Fitter (2-Year)</option>
                                            <option value="Welder">Welder</option>
                                            <option value="Mechanic">Mechanic (Motor Vehicle)</option>
                                            <option value="COPA">COPA (Computer Operator)</option>
                                            <option value="Wireman">Wireman</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Session (2 Years)</label>
                                        <input 
                                            className="form-control" 
                                            value={form.academicSession} 
                                            onChange={(e) => setForm(f => ({ ...f, academicSession: e.target.value }))} 
                                            placeholder="e.g. 2024 - 2026" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth 📅</label>
                                        <input 
                                            className="form-control date-picker-custom" 
                                            type="date" 
                                            value={form.dateOfBirth || ''} 
                                            onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* ─── Category & Subcaste (Indian Caste System) ───────────────────── */}
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select 
                                            className="form-control" 
                                            value={form.category} 
                                            onChange={(e) => {
                                                const cat = e.target.value;
                                                setForm(f => ({ ...f, category: cat, subcaste: '', isOtherSubcaste: false, otherSubcaste: '' }));
                                            }}
                                        >
                                            <option value="OPEN">OPEN / General</option>
                                            <option value="OBC">OBC (Other Backward Class)</option>
                                            <option value="SC">SC (Scheduled Caste)</option>
                                            <option value="ST">ST (Scheduled Tribe)</option>
                                            <option value="VJNT">VJ / NT (Vimukta Jati / Nomadic Tribe)</option>
                                            <option value="SBC">SBC (Special Backward Class)</option>
                                            <option value="EWS">EWS (Economically Weaker Section)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Subcaste (Indian Caste System)</label>
                                        {!form.isOtherSubcaste ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <select 
                                                    className="form-control"
                                                    value={form.subcaste}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other (Write-in)') {
                                                            setForm(f => ({ ...f, isOtherSubcaste: true, subcaste: '' }));
                                                        } else {
                                                            setForm(f => ({ ...f, subcaste: val }));
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Select Subcaste or Choose Other --</option>
                                                    {(INDIAN_SUBCASTES[form.category] || INDIAN_SUBCASTES['OPEN']).map((sub) => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary btn-sm"
                                                    title="Directly write custom subcaste"
                                                    onClick={() => setForm(f => ({ ...f, isOtherSubcaste: true }))}
                                                >
                                                    ✏️ Type
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input
                                                    className="form-control"
                                                    placeholder="Type subcaste name directly..."
                                                    value={form.otherSubcaste}
                                                    onChange={(e) => setForm(f => ({ ...f, otherSubcaste: e.target.value, subcaste: e.target.value }))}
                                                    autoFocus
                                                />
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-sm"
                                                    title="Switch back to dropdown list"
                                                    onClick={() => setForm(f => ({ ...f, isOtherSubcaste: false, otherSubcaste: '' }))}
                                                >
                                                    📋 List
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* ─── Address in Admission Form ──────────────────────────────────── */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Permanent / Residential Address</label>
                                        <input 
                                            className="form-control" 
                                            value={form.address} 
                                            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} 
                                            placeholder="House No, Street, Village/City, Taluka, District, Pincode" 
                                        />
                                    </div>

                                    {/* ─── Admission Fee Breakdown (Tuition, Exam, Material, Other) ───── */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--surface-2)', padding: 16, borderRadius: 12, border: '1.5px solid var(--border)' }}>
                                        <div className="form-label font-bold mb-2" style={{ fontSize: 13, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>💰 ADMISSION FEE BREAKDOWN</span>
                                            <span className="badge badge-success" style={{ fontSize: 12, padding: '4px 10px' }}>
                                                Total Fee: ₹{(
                                                     (parseFloat(form.tuitionFee) || 0) +
                                                     (parseFloat(form.examFee) || 0) +
                                                     (parseFloat(form.dressMaterialFee) || 0) +
                                                     (parseFloat(form.otherFee) || 0)
                                                 ).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted mb-3">
                                            Specify individual fee components (Tuition, Exam, Dress & Material, Other Dues).
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label" style={{ fontSize: 12 }}>Master Fee Structure Template (Optional)</label>
                                            <select
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                value={form.feeStructureId}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    const sel = feeStructures.find(f => f.id === id);
                                                    if (sel && sel.items) {
                                                        let t = 0, ex = 0, dr = 0, ot = 0;
                                                        sel.items.forEach((item: any) => {
                                                            const catName = (item.feeCategory?.name || '').toLowerCase();
                                                            const val = item.amount / 100;
                                                            if (catName.includes('tuition')) t += val;
                                                            else if (catName.includes('exam')) ex += val;
                                                            else if (catName.includes('dress') || catName.includes('uniform') || catName.includes('material')) dr += val;
                                                            else ot += val;
                                                        });
                                                        setForm(f => ({
                                                            ...f,
                                                            feeStructureId: id,
                                                            tuitionFee: t ? t.toString() : '',
                                                            examFee: ex ? ex.toString() : '',
                                                            dressMaterialFee: dr ? dr.toString() : '',
                                                            otherFee: ot ? ot.toString() : '',
                                                            customAmountRupees: (sel.totalAmount / 100).toString()
                                                        }));
                                                    } else {
                                                        setForm(f => ({ ...f, feeStructureId: id }));
                                                    }
                                                }}
                                            >
                                                <option value="">-- Custom Fee Breakdown (Or Select Master Template) --</option>
                                                {feeStructures.map((fs) => (
                                                    <option key={fs.id} value={fs.id}>
                                                        {fs.name} (AY: {fs.academicYear}) — Standard: ₹{(fs.totalAmount / 100).toLocaleString('en-IN')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-2" style={{ gap: 12 }}>
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
                                            <div>
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
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>📦 Other Dues / Charges (₹)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    style={{ fontSize: 13 }}
                                                    placeholder="e.g. 1000"
                                                    value={form.otherFee}
                                                    onChange={(e) => setForm(f => ({ ...f, otherFee: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                        <label className="form-label">Blood Group 🩸</label>
                                        <select className="form-control" value={form.bloodGroup} onChange={(e) => setForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Landline / Alt Phone</label>
                                        <input className="form-control" value={form.landline} onChange={(e) => setForm(f => ({ ...f, landline: e.target.value }))} placeholder="Optional alternate number" />
                                    </div>

                                    {/* ─── Submitted Original Documents Checklist (Updated) ───────── */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                                        <div className="form-label font-bold mb-3" style={{ fontSize: 13, color: 'var(--primary)' }}>📁 ORIGINAL DOCUMENTS SUBMITTED CHECKLIST</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                            {[
                                                { key: 'domicile', label: 'Domicile Certificate' },
                                                { key: 'marksheet12th', label: 'Class XII (12th / HSC)' },
                                                { key: 'marklist', label: 'Class X (10th) Marklist' },
                                                { key: 'tc', label: 'TC (Transfer Cert / Leaving)' },
                                                { key: 'baDegree', label: 'B.A. Marksheet / Degree' },
                                                { key: 'bcomDegree', label: 'B.Com Marksheet / Degree' },
                                                { key: 'btechDegree', label: 'B.Tech / B.E. Marksheet' },
                                                { key: 'caste', label: 'Caste Certificate' },
                                                { key: 'nonCreamy', label: 'Non-Creamy Layer' },
                                                { key: 'income', label: 'Income Certificate' },
                                                { key: 'affidavit', label: 'Affidavit / Gap Cert.' },
                                                { key: 'aadhar', label: 'Aadhaar Card' },
                                                { key: 'bankPassbook', label: 'Bank Passbook Xerox' },
                                                { key: 'photo4', label: 'Photo - 4 Passport Copies' },
                                                { key: 'otherDocs', label: 'Other Document' },
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
                                        {form.submittedDocuments.otherDocs && (
                                            <div style={{ marginTop: 8 }}>
                                                <input 
                                                    className="form-control"
                                                    style={{ fontSize: 12 }}
                                                    placeholder="Specify other document name (e.g. Diploma, Migration Certificate, etc.)..."
                                                    value={form.submittedDocuments.otherDocsText || ''}
                                                    onChange={(e) => setForm(f => ({ ...f, submittedDocuments: { ...f.submittedDocuments, otherDocsText: e.target.value } }))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                                    <div className="form-label font-bold mb-4" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>PARENT / GUARDIAN CONTACT</div>
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

            {/* Edit Student Admission Profile Modal */}
            {showEditProfileModal && editingStudent && (
                <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
                    <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">✏️ Edit Admission Profile: {editingStudent.name} ({editingStudent.studentId})</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowEditProfileModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="modal-body">
                                {/* Role Access Notice */}
                                <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>🛡️</span>
                                    <span>
                                        Editing admission profile as <b>{effectiveRole}</b>. Profile updates are logged in the audit trail.
                                    </span>
                                </div>

                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Full Name <span className="required">*</span></label>
                                        <input className="form-control" required value={editProfileForm.name} onChange={(e) => setEditProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Student full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Enrolled Trade <span className="required">*</span></label>
                                        <select className="form-control" required value={editProfileForm.class} onChange={(e) => setEditProfileForm(f => ({ ...f, class: e.target.value }))}>
                                            <option value="Electrician">Electrician (2-Year)</option>
                                            <option value="Fitter">Fitter (2-Year)</option>
                                            <option value="Welder">Welder</option>
                                            <option value="Mechanic">Mechanic (Motor Vehicle)</option>
                                            <option value="COPA">COPA (Computer Operator)</option>
                                            <option value="Wireman">Wireman</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Roll Number</label>
                                        <input 
                                            className="form-control" 
                                            value={editProfileForm.rollNumber} 
                                            onChange={(e) => setEditProfileForm(f => ({ ...f, rollNumber: e.target.value }))} 
                                            placeholder="e.g. 01" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth 📅</label>
                                        <input 
                                            className="form-control date-picker-custom" 
                                            type="date" 
                                            value={editProfileForm.dateOfBirth} 
                                            onChange={(e) => setEditProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Category & Subcaste */}
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select 
                                            className="form-control" 
                                            value={editProfileForm.category} 
                                            onChange={(e) => {
                                                const cat = e.target.value;
                                                setEditProfileForm(f => ({ ...f, category: cat, subcaste: '', isOtherSubcaste: false, otherSubcaste: '' }));
                                            }}
                                        >
                                            <option value="OPEN">OPEN / General</option>
                                            <option value="OBC">OBC (Other Backward Class)</option>
                                            <option value="SC">SC (Scheduled Caste)</option>
                                            <option value="ST">ST (Scheduled Tribe)</option>
                                            <option value="VJNT">VJ / NT (Vimukta Jati / Nomadic Tribe)</option>
                                            <option value="SBC">SBC (Special Backward Class)</option>
                                            <option value="EWS">EWS (Economically Weaker Section)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Subcaste</label>
                                        {!editProfileForm.isOtherSubcaste ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <select 
                                                    className="form-control"
                                                    value={editProfileForm.subcaste}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other (Write-in)') {
                                                            setEditProfileForm(f => ({ ...f, isOtherSubcaste: true, subcaste: '' }));
                                                        } else {
                                                            setEditProfileForm(f => ({ ...f, subcaste: val }));
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Select Subcaste --</option>
                                                    {(INDIAN_SUBCASTES[editProfileForm.category] || INDIAN_SUBCASTES['OPEN']).map((sub) => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setEditProfileForm(f => ({ ...f, isOtherSubcaste: true }))}
                                                >
                                                    ✏️ Type
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input
                                                    className="form-control"
                                                    placeholder="Type subcaste name..."
                                                    value={editProfileForm.otherSubcaste}
                                                    onChange={(e) => setEditProfileForm(f => ({ ...f, otherSubcaste: e.target.value, subcaste: e.target.value }))}
                                                    autoFocus
                                                />
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setEditProfileForm(f => ({ ...f, isOtherSubcaste: false, otherSubcaste: '' }))}
                                                >
                                                    📋 List
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Permanent / Residential Address</label>
                                        <input 
                                            className="form-control" 
                                            value={editProfileForm.address} 
                                            onChange={(e) => setEditProfileForm(f => ({ ...f, address: e.target.value }))} 
                                            placeholder="House No, Street, Village/City, Taluka, District, Pincode" 
                                        />
                                    </div>

                                    {/* Gender, Blood Group, Landline */}
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select className="form-control" value={editProfileForm.gender} onChange={(e) => setEditProfileForm(f => ({ ...f, gender: e.target.value }))}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group 🩸</label>
                                        <select className="form-control" value={editProfileForm.bloodGroup} onChange={(e) => setEditProfileForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                                            <option value="">-- Select --</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>

                                    {/* Parent / Guardian Contact Details */}
                                    <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6 }}>
                                        <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)' }}>👨‍👩‍👦 Parent / Guardian Details</label>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Parent / Guardian Name</label>
                                        <input className="form-control" value={editProfileForm.parentName} onChange={(e) => setEditProfileForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Father / Mother / Guardian full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Phone Number</label>
                                        <input className="form-control" type="tel" value={editProfileForm.parentPhone} onChange={(e) => setEditProfileForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="e.g. 9876543210" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Parent Email (Optional)</label>
                                        <input className="form-control" type="email" value={editProfileForm.parentEmail} onChange={(e) => setEditProfileForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Landline / Alternate Phone</label>
                                        <input className="form-control" value={editProfileForm.landline} onChange={(e) => setEditProfileForm(f => ({ ...f, landline: e.target.value }))} placeholder="Optional alternate number" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                {['ADMIN', 'SUPERADMIN', 'DEVELOPER', 'ACCOUNTANT'].includes(effectiveRole || '') && (
                                    <button 
                                        type="button" 
                                        className="btn btn-danger btn-sm" 
                                        style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                                        onClick={() => setShowDeleteConfirmModal(true)}
                                    >
                                        🗑️ Delete Student Record
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                                        {updatingProfile ? 'Saving Changes...' : '💾 Save Profile Updates'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && editingStudent && (
                <div className="modal-overlay" style={{ zIndex: 35000 }} onClick={() => setShowDeleteConfirmModal(false)}>
                    <div className="modal" style={{ maxWidth: 440, textAlign: 'center', padding: '24px 20px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)', marginBottom: 8 }}>
                            Confirm Student Deletion
                        </h3>
                        <p style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                            Are you sure you want to delete <b>{editingStudent.name}</b> (<code>{editingStudent.studentId}</code>)?
                        </p>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left', marginBottom: 20 }}>
                            🛡️ <b>Audit Log Notice:</b> This action will be permanently recorded in the administrative Audit Log with your timestamp and authority credentials.
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => setShowDeleteConfirmModal(false)}
                                disabled={deletingStudent}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                style={{ flex: 1, justifyContent: 'center', background: '#dc2626', color: '#fff', fontWeight: 700 }}
                                onClick={handleDeleteStudent}
                                disabled={deletingStudent}
                            >
                                {deletingStudent ? 'Deleting...' : '🗑️ Yes, Delete'}
                            </button>
                        </div>
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
                                            if (sel && sel.items) {
                                                let t = 0, ex = 0, dr = 0, ot = 0;
                                                sel.items.forEach((item: any) => {
                                                    const catName = (item.feeCategory?.name || '').toLowerCase();
                                                    const val = item.amount / 100;
                                                    if (catName.includes('tuition')) t += val;
                                                    else if (catName.includes('exam')) ex += val;
                                                    else if (catName.includes('dress') || catName.includes('uniform') || catName.includes('material')) dr += val;
                                                    else ot += val;
                                                });
                                                setFeeForm(f => ({
                                                    ...f,
                                                    feeStructureId: id,
                                                    tuitionFee: t ? t.toString() : '',
                                                    examFee: ex ? ex.toString() : '',
                                                    dressMaterialFee: dr ? dr.toString() : '',
                                                    otherFee: ot ? ot.toString() : '',
                                                    customAmountRupees: (sel.totalAmount / 100).toString()
                                                }));
                                            } else {
                                                setFeeForm(f => ({ ...f, feeStructureId: id }));
                                            }
                                        }}
                                    >
                                        {feeStructures.map((fs) => (
                                            <option key={fs.id} value={fs.id}>
                                                {fs.name} (AY: {fs.academicYear}) — Standard: ₹{(fs.totalAmount / 100).toLocaleString('en-IN')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Payment Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={feeForm.dueDate}
                                        onChange={(e) => setFeeForm(f => ({ ...f, dueDate: e.target.value }))}
                                    />
                                </div>

                                <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10 }}>
                                    <div className="form-label font-bold mb-2" style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Custom Fee Components (Optional)</span>
                                        <span>Total: ₹{(
                                            (parseFloat(feeForm.tuitionFee) || 0) +
                                            (parseFloat(feeForm.examFee) || 0) +
                                            (parseFloat(feeForm.dressMaterialFee) || 0) +
                                            (parseFloat(feeForm.otherFee) || 0)
                                        ).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="grid grid-2" style={{ gap: 10 }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>🎓 Tuition Fees (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 15000"
                                                value={feeForm.tuitionFee}
                                                onChange={(e) => setFeeForm(f => ({ ...f, tuitionFee: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>📝 Exam Fees (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 2000"
                                                value={feeForm.examFee}
                                                onChange={(e) => setFeeForm(f => ({ ...f, examFee: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>🥼 Dress & Material (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 3000"
                                                value={feeForm.dressMaterialFee}
                                                onChange={(e) => setFeeForm(f => ({ ...f, dressMaterialFee: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: 12 }}>📦 Other Charges (₹)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ fontSize: 13 }}
                                                placeholder="e.g. 1000"
                                                value={feeForm.otherFee}
                                                onChange={(e) => setFeeForm(f => ({ ...f, otherFee: e.target.value }))}
                                            />
                                        </div>
                                    </div>
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
                        <div className="modal-body">
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
                                                    ID: <b>{historyStudentDetail.studentId}</b> | Trade: <b>{historyStudentDetail.class}</b> | Category: <b>{historyStudentDetail.category || 'OPEN'} {historyStudentDetail.subcaste && `(${historyStudentDetail.subcaste})`}</b>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                                    📅 DOB: <b>{historyStudentDetail.dateOfBirth ? new Date(historyStudentDetail.dateOfBirth).toLocaleDateString('en-IN') : '—'}</b> | 🩸 Blood Group: <b>{historyStudentDetail.bloodGroup || '—'}</b>
                                                </div>
                                                {historyStudentDetail.address && (
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                        📍 {historyStudentDetail.address}
                                                    </div>
                                                )}
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
                                                        <b>{sf.feeStructure?.name || 'Trade Fee'}</b> ({sf.academicYear})
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
                                                                        {['SUPERADMIN', 'ADMIN', 'DEVELOPER', 'BRANCH_ADMIN'].includes(effectiveRole || '') && p.status !== 'REFUNDED' && (
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
                                {effectiveRole === 'ADMIN' ? '🏢 Branch Admin User Guide' :
                                 effectiveRole === 'ACCOUNTANT' ? '🧾 Accountant Operational Guide' :
                                 effectiveRole === 'STUDENT' ? '🎓 Student Portal User Guide' :
                                 '🛠️ System Architect User Guide'}
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowUserGuide(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ fontSize: 14, lineHeight: 1.6 }}>
                            
                            {/* BRANCH ADMIN GUIDE */}
                            {effectiveRole === 'ADMIN' && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🏢 Branch Administrator Operational Capabilities</h3>
                                    <p className="text-muted mb-4">Complete management guide for Branch Administrators with full administrative privileges.</p>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>1. Student Admission & Fee Allocation</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Admit new students with complete caste demographics, residential address, and Class X credentials.</li>
                                            <li>Configure 2-year trade academic session (e.g. 2024-2026).</li>
                                            <li>Set customized fee components: <b>Tuition</b>, <b>Exam</b>, <b>Dress & Material</b>, and <b>Other Dues</b>.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>2. ID Cards & Form PDF Generation</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Instant generation of <b>🪪 2-Page Front & Back Official ID Cards</b>.</li>
                                            <li>Official <b>📄 Admission Application PDFs</b> with college seal and clerk signature lines.</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* ACCOUNTANT GUIDE */}
                            {effectiveRole === 'ACCOUNTANT' && (
                                <>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: 6 }}>🧾 Fee Accountant Operational Guide</h3>
                                    <p className="text-muted mb-4">Step-by-step instructions for cashiers and fee collection staff.</p>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>1. Fee Collection & Instant Receipts</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Search students by Name, ID, or Roll Number to record fee payments.</li>
                                            <li>Receipts automatically show total agreed fee, amount paid, total collected, and remaining balance.</li>
                                        </ul>
                                    </div>

                                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                                        <h4 style={{ color: 'var(--primary)' }}>2. Student Admission & ID Card Downloads</h4>
                                        <ul style={{ marginLeft: 20, marginTop: 6 }}>
                                            <li>Click <b>➕ New Admission</b> to enroll new students with photo, signature, and documents checklist.</li>
                                            <li>Download <b>🪪 2-Page ID Cards</b> and <b>📄 Admission Application PDFs</b>.</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* DEVELOPER GUIDE */}
                            {effectiveRole === 'DEVELOPER' && (
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

            {/* Admission Success Celebratory Modal */}
            {admissionSuccessData && (
                <div className="modal-overlay" style={{ zIndex: 30000 }} onClick={() => setAdmissionSuccessData(null)}>
                    <div className="admission-success-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Decorative floating celebration items */}
                        <div className="confetti-decoration" style={{ top: 16, left: 24 }}>✨</div>
                        <div className="confetti-decoration" style={{ top: 20, right: 30, animationDelay: '1s' }}>🎉</div>
                        <div className="confetti-decoration" style={{ bottom: 30, left: 20, animationDelay: '1.5s' }}>🎓</div>
                        <div className="confetti-decoration" style={{ bottom: 35, right: 25, animationDelay: '0.5s' }}>📜</div>

                        {/* Glowing Animated Success Badge */}
                        <div className="success-badge-circle">
                            ✓
                        </div>

                        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                            Admission Confirmed! 🎉
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                            Student enrollment has been officially registered and saved into the system.
                        </p>

                        {/* Student Details Summary Card */}
                        <div style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '16px 18px',
                            textAlign: 'left',
                            marginBottom: 22,
                            display: 'flex',
                            gap: 14,
                            alignItems: 'center'
                        }}>
                            {admissionSuccessData.photo ? (
                                <img
                                    src={admissionSuccessData.photo}
                                    alt={admissionSuccessData.name}
                                    style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                                />
                            ) : (
                                <div style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 22,
                                    fontWeight: 700,
                                    flexShrink: 0
                                }}>
                                    {admissionSuccessData.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {admissionSuccessData.name}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    <span className="badge badge-primary" style={{ fontWeight: 700, fontSize: 11 }}>
                                        🆔 {admissionSuccessData.studentId}
                                    </span>
                                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                                        ⚡ {admissionSuccessData.class} {admissionSuccessData.section ? `(${admissionSuccessData.section})` : ''}
                                    </span>
                                    {admissionSuccessData.rollNumber && (
                                        <span className="badge badge-ghost" style={{ fontSize: 11 }}>
                                            Roll #{admissionSuccessData.rollNumber}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Document Download Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            <button
                                className="btn btn-secondary"
                                style={{ justifyContent: 'center', padding: '10px 12px', fontSize: 13, fontWeight: 600 }}
                                onClick={async () => await generateStudentIdCardPdf(admissionSuccessData)}
                            >
                                🪪 Download ID Card
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{ justifyContent: 'center', padding: '10px 12px', fontSize: 13, fontWeight: 600 }}
                                onClick={async () => await generateAdmissionFormPdf(admissionSuccessData)}
                            >
                                📄 Admission Form PDF
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="btn btn-outline"
                                style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13 }}
                                onClick={() => {
                                    const s = admissionSuccessData;
                                    setAdmissionSuccessData(null);
                                    if (s?.id) openHistoryModal(s.id);
                                }}
                            >
                                📜 View Profile & History
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13, fontWeight: 700 }}
                                onClick={() => setAdmissionSuccessData(null)}
                            >
                                Done
                            </button>
                        </div>

                        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                            🔒 Login credentials can be shared with the student anytime via the <b>Access Control</b> management page.
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
    const actionParam = searchParams.get('action');
    const simulateParam = searchParams.get('simulate');
    const tabParam = searchParams.get('tab');
    return <StudentsContent actionParam={actionParam} simulateParam={simulateParam} tabParam={tabParam} />;
}

export default function StudentsPage() {
    return (
        <Suspense fallback={<div className="layout-loading"><div className="spinner" /></div>}>
            <SearchParamsLoader />
        </Suspense>
    );
}
