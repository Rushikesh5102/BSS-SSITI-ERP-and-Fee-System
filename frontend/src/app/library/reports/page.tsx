'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../services/api';
import WelcomeOverlay from '../../../components/WelcomeOverlay';
import Footer from '../../../components/Footer';

export const BOOK_CATEGORIES = [
    'Engineering',
    'Electrical',
    'Mechanical',
    'Electronics',
    'Computer',
    'General Knowledge',
    'Competitive Exams',
    'Reference',
    'Journals',
    'Magazines'
];

function LibraryReportsPageContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');

    const [showWelcome, setShowWelcome] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [reportType, setReportType] = useState<'BOOKS' | 'ISSUES' | 'MOVEMENT' | 'RESERVATIONS' | 'CATEGORIES'>('BOOKS');

    const [books, setBooks] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, []);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchReportData = async () => {
        setFetching(true);

        const localBooks = typeof window !== 'undefined' ? localStorage.getItem('saiiti_library_books') : null;
        const localIssues = typeof window !== 'undefined' ? localStorage.getItem('saiiti_library_issues') : null;
        const localRes = typeof window !== 'undefined' ? localStorage.getItem('saiiti_library_reservations') : null;
        const localMov = typeof window !== 'undefined' ? localStorage.getItem('saiiti_library_movements') : null;

        if (localBooks) { try { setBooks(JSON.parse(localBooks)); } catch { } }
        if (localIssues) { try { setIssues(JSON.parse(localIssues)); } catch { } }
        if (localRes) { try { setReservations(JSON.parse(localRes)); } catch { } }
        if (localMov) { try { setMovements(JSON.parse(localMov)); } catch { } }

        try {
            const [booksRes, issuesRes, movRes] = await Promise.all([
                api.get('/library/books'),
                api.get('/library/issues'),
                api.get('/library/movements')
            ]);
            if (booksRes.data?.data) setBooks(booksRes.data.data);
            if (issuesRes.data?.data) setIssues(issuesRes.data.data);
            if (movRes.data?.data) setMovements(movRes.data.data);
        } catch (err) {
            // Silently fallback to local state
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchReportData();
    }, [user]);

    const downloadCSV = (filename: string, rows: string[][]) => {
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => {
            const val = (cell || '').toString().split('"').join('""');
            return '"' + val + '"';
        }).join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (reportType === 'BOOKS') {
            const headers = ['Book Title', 'Author', 'Publisher', 'ISBN', 'Category', 'Edition', 'Language', 'Shelf Location', 'Total Copies', 'Available', 'Issued', 'Lost/Damaged', 'Price (INR)'];
            const rows = books.map(b => [
                b.title, b.author, b.publisher || '', b.isbn || '', b.category, b.edition || '', b.language || '', b.shelfLocation || '',
                (b.quantity || 1).toString(), (b.availableCopies || 0).toString(), (b.issuedCopies || 0).toString(),
                ((b.lostCopies || 0) + (b.damagedCopies || 0)).toString(), (b.price || 0).toString()
            ]);
            downloadCSV('Sai_ITI_Library_Book_Catalog_Report', [headers, ...rows]);
        } else if (reportType === 'ISSUES') {
            const headers = ['Borrower Name', 'Type', 'Contact', 'Book Title', 'ISBN', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Condition', 'Fine (INR)', 'Fine Status'];
            const rows = issues.map(i => [
                i.borrowerName, i.borrowerType, i.borrowerContact || '', i.book?.title || '', i.book?.isbn || '',
                new Date(i.issueDate).toLocaleDateString(), new Date(i.dueDate).toLocaleDateString(),
                i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'N/A',
                i.status, i.returnCondition || 'N/A', (i.fineAmount || 0).toString(), i.fineStatus || 'NONE'
            ]);
            downloadCSV('Sai_ITI_Book_Issues_Overdues_Report', [headers, ...rows]);
        } else if (reportType === 'MOVEMENT') {
            const headers = ['Date & Time', 'Action', 'Book Title', 'Borrower / Recipient', 'Remarks', 'Performed By'];
            const rows = movements.map(m => [
                new Date(m.createdAt).toLocaleString(), m.action, m.book?.title || '', m.borrowerName || 'N/A', m.remarks || '', m.performedByName || 'Staff'
            ]);
            downloadCSV('Sai_ITI_Book_Movement_Audit_Report', [headers, ...rows]);
        } else if (reportType === 'RESERVATIONS') {
            const headers = ['Book Title', 'Borrower Name', 'Type', 'Contact', 'Reservation Date', 'Status', 'Notes'];
            const rows = reservations.map(r => [
                r.book?.title || '', r.borrowerName, r.borrowerType, r.borrowerContact || '', new Date(r.reservationDate).toLocaleDateString(), r.status, r.notes || ''
            ]);
            downloadCSV('Sai_ITI_Book_Reservations_Report', [headers, ...rows]);
        } else if (reportType === 'CATEGORIES') {
            const headers = ['Category Name', 'Total Titles', 'Total Copies', 'Available Copies', 'Issued Copies'];
            const rows = BOOK_CATEGORIES.map(cat => {
                const catBooks = books.filter(b => b.category === cat && b.isActive !== false);
                const titles = catBooks.length;
                const total = catBooks.reduce((acc, b) => acc + (b.quantity || 1), 0);
                const avail = catBooks.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
                const issued = catBooks.reduce((acc, b) => acc + (b.issuedCopies || 0), 0);
                return [cat, titles.toString(), total.toString(), avail.toString(), issued.toString()];
            });
            downloadCSV('Sai_ITI_Category_Distribution_Report', [headers, ...rows]);
        }
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    return (
        <div className="layout">
            {showWelcome && <WelcomeOverlay role={user.role} />}
            <Sidebar />

            <div className="main-content" style={{ paddingBottom: '40px' }}>
                {/* Standard Header */}
                <div className="page-header" style={{
                    background: 'var(--surface-card)',
                    borderBottom: '1px solid var(--border)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Official Institute Audits & Exports
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            📄 Library PDF & Excel Reports Center
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            🖨️ Print / Save PDF
                        </button>
                        <button onClick={handleExportExcel} className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', fontSize: 13 }}>
                            📊 Export Excel (CSV)
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Report Type Selector Pills */}
                    <div className="card no-print" style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { id: 'BOOKS', label: '📋 Book Catalog & Inventory' },
                            { id: 'ISSUES', label: '📤 Active Book Issues & Overdues' },
                            { id: 'MOVEMENT', label: '🔄 Movement History & Audit Log' },
                            { id: 'RESERVATIONS', label: '🔖 Book Reservations Log' },
                            { id: 'CATEGORIES', label: '📂 Category Distribution Summary' },
                        ].map(r => (
                            <button
                                key={r.id}
                                onClick={() => setReportType(r.id as any)}
                                className={`btn ${reportType === r.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ fontSize: 12, padding: '7px 14px' }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {/* Printable PDF Report Document */}
                    <div id="printable-report" className="card" style={{ padding: 32, background: '#ffffff', color: '#0f172a', borderRadius: 12 }}>
                        {/* Institute Official Header */}
                        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 24, textAlign: 'center' }}>
                            <img src="/sai_iti_logo.png" alt="Shri Sai ITI Logo" style={{ height: 64, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE (ITI)
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                                Institute Library Management System • {reportType} REPORT
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                                Generated on: {new Date().toLocaleString()}
                            </p>
                        </div>

                        {fetching ? (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                                <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
                                <p style={{ marginTop: 8 }}>Compiling Library Report Data...</p>
                            </div>
                        ) : (
                            <>
                                {/* REPORT 1: BOOK CATALOG */}
                                {reportType === 'BOOKS' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Book Title</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Author</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Shelf Location</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Copies</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Available</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Issued</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {books.map((b, idx) => (
                                                <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{b.title}</td>
                                                    <td style={{ padding: '8px' }}>{b.author}</td>
                                                    <td style={{ padding: '8px' }}>{b.category}</td>
                                                    <td style={{ padding: '8px' }}>{b.shelfLocation || 'Unassigned'}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{b.quantity || 1}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{b.availableCopies || 0}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>{b.issuedCopies || 0}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>
                                                        {b.availableCopies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* REPORT 2: ISSUES & OVERDUES */}
                                {reportType === 'ISSUES' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Borrower Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Type</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Book Title</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Issue Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Due Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Return Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Fine (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {issues.map((i, idx) => (
                                                <tr key={i.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{i.borrowerName}</td>
                                                    <td style={{ padding: '8px' }}>{i.borrowerType}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{i.book?.title || 'Book Title'}</td>
                                                    <td style={{ padding: '8px' }}>{new Date(i.issueDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '8px' }}>{new Date(i.dueDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '8px' }}>{i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'Not Returned'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{i.status}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: i.fineAmount > 0 ? '#dc2626' : 'inherit' }}>
                                                        ₹{i.fineAmount || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* REPORT 3: MOVEMENT AUDIT */}
                                {reportType === 'MOVEMENT' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Date & Time</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Action</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Book Title</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Borrower / Recipient</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Remarks</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Performed By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movements.map((m) => (
                                                <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px', fontSize: 11 }}>{new Date(m.createdAt).toLocaleString()}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{m.action}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{m.book?.title || 'Library Book'}</td>
                                                    <td style={{ padding: '8px' }}>{m.borrowerName || '-'}</td>
                                                    <td style={{ padding: '8px' }}>{m.remarks || '-'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{m.performedByName || 'Staff'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* REPORT 4: RESERVATIONS */}
                                {reportType === 'RESERVATIONS' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Reserved Book Title</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Borrower Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Reservation Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reservations.map((r, idx) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.book?.title || 'Book Title'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.borrowerName}</td>
                                                    <td style={{ padding: '8px' }}>{r.borrowerType}</td>
                                                    <td style={{ padding: '8px' }}>{new Date(r.reservationDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.status}</td>
                                                    <td style={{ padding: '8px' }}>{r.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* REPORT 5: CATEGORIES SUMMARY */}
                                {reportType === 'CATEGORIES' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Titles</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Copies</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Available Copies</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Issued Copies</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {BOOK_CATEGORIES.map((cat) => {
                                                const catBooks = books.filter(b => b.category === cat && b.isActive !== false);
                                                const titles = catBooks.length;
                                                const total = catBooks.reduce((acc, b) => acc + (b.quantity || 1), 0);
                                                const avail = catBooks.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
                                                const issued = catBooks.reduce((acc, b) => acc + (b.issuedCopies || 0), 0);

                                                return (
                                                    <tr key={cat} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '8px', fontWeight: 700 }}>{cat}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center' }}>{titles}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{total}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{avail}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>{issued}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}

export default function LibraryReportsPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <LibraryReportsPageContent />
        </Suspense>
    );
}
