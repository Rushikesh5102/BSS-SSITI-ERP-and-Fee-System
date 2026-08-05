'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../services/api';
import ImageUploadWidget from './ImageUploadWidget';
import WelcomeOverlay from './WelcomeOverlay';
import Footer from './Footer';

export interface BookItem {
    id: string;
    title: string;
    author: string;
    publisher: string | null;
    isbn: string | null;
    category: string;
    edition: string | null;
    language: string;
    shelfLocation: string | null;
    quantity: number;
    availableCopies: number;
    issuedCopies: number;
    lostCopies: number;
    damagedCopies: number;
    price: number;
    coverImage: string | null;
    status: string;
    isActive: boolean;
    notes: string | null;
    createdAt?: string;
}

export interface BookIssueItem {
    id: string;
    bookId: string;
    borrowerType: 'STUDENT' | 'STAFF';
    studentId?: string | null;
    staffId?: string | null;
    borrowerName: string;
    borrowerContact?: string | null;
    issueDate: string;
    dueDate: string;
    returnDate?: string | null;
    status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST' | 'DAMAGED';
    returnCondition?: 'GOOD' | 'DAMAGED' | 'LOST' | null;
    fineAmount: number;
    fineStatus: 'NONE' | 'PENDING' | 'PAID' | 'WAIVED';
    fineOverrideBy?: string | null;
    fineOverrideReason?: string | null;
    remarks?: string | null;
    book?: Partial<BookItem>;
}

export interface BookReservationItem {
    id: string;
    bookId: string;
    borrowerType: 'STUDENT' | 'STAFF';
    borrowerName: string;
    borrowerContact?: string | null;
    reservationDate: string;
    status: 'PENDING' | 'FULFILLED' | 'CANCELLED';
    notes?: string | null;
    book?: Partial<BookItem>;
}

export interface BookMovementLogItem {
    id: string;
    bookId: string;
    action: string;
    borrowerName?: string | null;
    quantity: number;
    remarks?: string | null;
    performedByName: string;
    createdAt: string;
    book?: Partial<BookItem>;
}

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

const INITIAL_BOOKS_SEED: BookItem[] = [];

const INITIAL_ISSUES_SEED: BookIssueItem[] = [];
const INITIAL_RESERVATIONS_SEED: BookReservationItem[] = [];
const INITIAL_MOVEMENT_LOGS_SEED: BookMovementLogItem[] = [];

interface Props {
    activeTab?: 'dashboard' | 'books' | 'issue' | 'history' | 'reports';
}

export default function LibraryModuleContent({ activeTab = 'books' }: Props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    const subParam = searchParams.get('sub');

    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : (user?.role || 'ADMIN');
    const isAdminOrLibrarian = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER' || effectiveRole === 'LIBRARIAN';

    // Internal sub-tab for Movement (issue, return, reservations)
    const [movementSubTab, setMovementSubTab] = useState<'issue' | 'return' | 'reservations'>(
        (subParam as any) || 'issue'
    );

    // Welcome Overlay
    const [showWelcome, setShowWelcome] = useState(false);

    // State management
    const [books, setBooks] = useState<BookItem[]>([]);
    const [issues, setIssues] = useState<BookIssueItem[]>([]);
    const [reservations, setReservations] = useState<BookReservationItem[]>([]);
    const [movements, setMovements] = useState<BookMovementLogItem[]>([]);
    const [fetching, setFetching] = useState(true);

    // Filters & UI Controls
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [includeArchived, setIncludeArchived] = useState(false);

    // Modals state
    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBook, setEditingBook] = useState<BookItem | null>(null);

    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedBookForIssue, setSelectedBookForIssue] = useState<BookItem | null>(null);

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedIssueForReturn, setSelectedIssueForReturn] = useState<BookIssueItem | null>(null);

    const [showFineOverrideModal, setShowFineOverrideModal] = useState(false);
    const [selectedIssueForFine, setSelectedIssueForFine] = useState<BookIssueItem | null>(null);
    const [overrideFineVal, setOverrideFineVal] = useState<string>('0');
    const [overrideReasonVal, setOverrideReasonVal] = useState<string>('');

    const [showReserveModal, setShowReserveModal] = useState(false);
    const [selectedBookForReserve, setSelectedBookForReserve] = useState<BookItem | null>(null);

    // Form inputs for Book Add/Edit
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        publisher: '',
        isbn: '',
        category: 'Electrical',
        edition: '',
        language: 'English',
        shelfLocation: '',
        quantity: 1,
        price: 0,
        coverImage: '',
        notes: ''
    });

    // Students list for linked borrower selection
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    // Form inputs for Book Issue
    const [issueForm, setIssueForm] = useState({
        borrowerType: 'STUDENT' as 'STUDENT' | 'STAFF',
        borrowerName: '',
        borrowerContact: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        remarks: ''
    });

    // Form inputs for Book Return
    const [returnForm, setReturnForm] = useState({
        returnCondition: 'GOOD' as 'GOOD' | 'DAMAGED' | 'LOST',
        remarks: '',
        applyFineOverride: false,
        fineOverrideAmount: 0,
        fineOverrideReason: ''
    });

    // Form inputs for Reservation
    const [reserveForm, setReserveForm] = useState({
        borrowerType: 'STUDENT' as 'STUDENT' | 'STAFF',
        borrowerName: '',
        borrowerContact: '',
        notes: ''
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, []);

    // Load initial data from API or localStorage
    useEffect(() => {
        let isMounted = true;
        setFetching(true);

        const localBooks = localStorage.getItem('saiiti_library_books');
        const localIssues = localStorage.getItem('saiiti_library_issues');
        const localRes = localStorage.getItem('saiiti_library_reservations');
        const localMov = localStorage.getItem('saiiti_library_movements');

        if (localBooks) {
            try { setBooks(JSON.parse(localBooks)); } catch { }
        } else {
            setBooks(INITIAL_BOOKS_SEED);
            localStorage.setItem('saiiti_library_books', JSON.stringify(INITIAL_BOOKS_SEED));
        }

        if (localIssues) {
            try { setIssues(JSON.parse(localIssues)); } catch { }
        } else {
            setIssues(INITIAL_ISSUES_SEED);
            localStorage.setItem('saiiti_library_issues', JSON.stringify(INITIAL_ISSUES_SEED));
        }

        if (localRes) {
            try { setReservations(JSON.parse(localRes)); } catch { }
        } else {
            setReservations(INITIAL_RESERVATIONS_SEED);
            localStorage.setItem('saiiti_library_reservations', JSON.stringify(INITIAL_RESERVATIONS_SEED));
        }

        if (localMov) {
            try { setMovements(JSON.parse(localMov)); } catch { }
        } else {
            setMovements(INITIAL_MOVEMENT_LOGS_SEED);
            localStorage.setItem('saiiti_library_movements', JSON.stringify(INITIAL_MOVEMENT_LOGS_SEED));
        }

        api.get('/students').then(({ data }) => {
            if (isMounted) setStudents(data.data || []);
        }).catch(() => {
            if (isMounted) setStudents([]);
        });

        api.get('/library/books').then(({ data }) => {
            if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
                setBooks(data.data);
                localStorage.setItem('saiiti_library_books', JSON.stringify(data.data));
            }
        }).catch(() => {
            // Silently fallback to local state
        }).finally(() => {
            if (isMounted) setFetching(false);
        });

        return () => { isMounted = false; };
    }, []);

    const saveBooksState = (newBooks: BookItem[]) => {
        setBooks(newBooks);
        localStorage.setItem('saiiti_library_books', JSON.stringify(newBooks));
    };

    const saveIssuesState = (newIssues: BookIssueItem[]) => {
        setIssues(newIssues);
        localStorage.setItem('saiiti_library_issues', JSON.stringify(newIssues));
    };

    const saveReservationsState = (newRes: BookReservationItem[]) => {
        setReservations(newRes);
        localStorage.setItem('saiiti_library_reservations', JSON.stringify(newRes));
    };

    const addMovementLog = (bookId: string, action: string, remarks: string, borrowerName?: string) => {
        const targetBook = books.find(b => b.id === bookId);
        const newLog: BookMovementLogItem = {
            id: `mov-${Date.now()}`,
            bookId,
            action,
            borrowerName: borrowerName || null,
            quantity: 1,
            remarks,
            performedByName: user?.name || (effectiveRole === 'LIBRARIAN' ? 'Chief Librarian' : 'Admin'),
            createdAt: new Date().toISOString(),
            book: targetBook ? { title: targetBook.title } : undefined
        };
        const updated = [newLog, ...movements];
        setMovements(updated);
        localStorage.setItem('saiiti_library_movements', JSON.stringify(updated));
    };

    // Metrics calculation
    const stats = useMemo(() => {
        let totalTitles = 0;
        let totalCopies = 0;
        let availableCopies = 0;
        let issuedCopies = 0;
        let lostCopies = 0;
        let damagedCopies = 0;
        let totalCatalogValue = 0;
        let availableValue = 0;
        let issuedValue = 0;
        let financialLossValue = 0;

        books.forEach(b => {
            if (b.isActive || includeArchived) {
                totalTitles++;
                totalCopies += b.quantity;
                availableCopies += b.availableCopies;
                issuedCopies += b.issuedCopies;
                lostCopies += b.lostCopies;
                damagedCopies += b.damagedCopies;
                const bookPrice = b.price || 0;
                totalCatalogValue += b.quantity * bookPrice;
                availableValue += b.availableCopies * bookPrice;
                issuedValue += b.issuedCopies * bookPrice;
                financialLossValue += (b.lostCopies + b.damagedCopies) * bookPrice;
            }
        });

        const now = new Date();
        const overdueCount = issues.filter(i => i.status === 'ISSUED' && new Date(i.dueDate) < now).length;
        const totalPendingFines = issues.reduce((acc, i) => acc + (i.fineStatus === 'PENDING' ? i.fineAmount : 0), 0);

        return {
            totalTitles,
            totalCopies,
            availableCopies,
            issuedCopies,
            overdueCount,
            lostCopies,
            damagedCopies,
            totalPendingFines,
            totalCatalogValue,
            availableValue,
            issuedValue,
            financialLossValue
        };
    }, [books, issues, includeArchived]);

    // Filtered books
    const filteredBooks = useMemo(() => {
        return books.filter(b => {
            if (!includeArchived && !b.isActive) return false;
            if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    b.title.toLowerCase().includes(q) ||
                    b.author.toLowerCase().includes(q) ||
                    (b.publisher || '').toLowerCase().includes(q) ||
                    (b.isbn || '').toLowerCase().includes(q) ||
                    (b.shelfLocation || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [books, selectedCategory, searchQuery, includeArchived]);

    // Filtered issues
    const filteredIssues = useMemo(() => {
        return issues.filter(i => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    i.borrowerName.toLowerCase().includes(q) ||
                    (i.book?.title || '').toLowerCase().includes(q) ||
                    (i.book?.isbn || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [issues, searchQuery]);

    // Modal Handlers
    const handleOpenBookModal = (bookToEdit?: BookItem) => {
        if (bookToEdit) {
            setEditingBook(bookToEdit);
            setFormData({
                title: bookToEdit.title,
                author: bookToEdit.author,
                publisher: bookToEdit.publisher || '',
                isbn: bookToEdit.isbn || '',
                category: bookToEdit.category,
                edition: bookToEdit.edition || '',
                language: bookToEdit.language || 'English',
                shelfLocation: bookToEdit.shelfLocation || '',
                quantity: bookToEdit.quantity,
                price: bookToEdit.price || 0,
                coverImage: bookToEdit.coverImage || '',
                notes: bookToEdit.notes || ''
            });
        } else {
            setEditingBook(null);
            setFormData({
                title: '',
                author: '',
                publisher: '',
                isbn: '',
                category: 'Electrical',
                edition: '',
                language: 'English',
                shelfLocation: '',
                quantity: 1,
                price: 0,
                coverImage: '',
                notes: ''
            });
        }
        setShowBookModal(true);
    };

    const handleSaveBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.author.trim()) return;

        const qty = Number(formData.quantity) || 1;

        if (editingBook) {
            const qtyDiff = qty - editingBook.quantity;
            const updatedBook: BookItem = {
                ...editingBook,
                title: formData.title,
                author: formData.author,
                publisher: formData.publisher || null,
                isbn: formData.isbn || null,
                category: formData.category,
                edition: formData.edition || null,
                language: formData.language,
                shelfLocation: formData.shelfLocation || null,
                quantity: qty,
                availableCopies: Math.max(0, editingBook.availableCopies + qtyDiff),
                price: Number(formData.price) || 0,
                coverImage: formData.coverImage || null,
                notes: formData.notes || null,
            };

            const updatedList = books.map(b => b.id === editingBook.id ? updatedBook : b);
            saveBooksState(updatedList);
            if (qtyDiff !== 0) {
                addMovementLog(editingBook.id, 'UPDATED', `Adjusted total copy count by ${qtyDiff > 0 ? '+' : ''}${qtyDiff}`);
            }
        } else {
            const newBook: BookItem = {
                id: `book-${Date.now()}`,
                title: formData.title,
                author: formData.author,
                publisher: formData.publisher || null,
                isbn: formData.isbn || null,
                category: formData.category,
                edition: formData.edition || null,
                language: formData.language,
                shelfLocation: formData.shelfLocation || null,
                quantity: qty,
                availableCopies: qty,
                issuedCopies: 0,
                lostCopies: 0,
                damagedCopies: 0,
                price: Number(formData.price) || 0,
                coverImage: formData.coverImage || null,
                status: 'AVAILABLE',
                isActive: true,
                notes: formData.notes || null,
                createdAt: new Date().toISOString()
            };

            const updatedList = [newBook, ...books];
            saveBooksState(updatedList);
            addMovementLog(newBook.id, 'ADDED', `Added new book catalog entry with ${qty} total copies`);
        }

        setShowBookModal(false);
    };

    const handleArchiveBook = (bookId: string) => {
        if (!confirm('Soft-archive this book? Historical issue/return records will be preserved.')) return;
        const updatedList = books.map(b => b.id === bookId ? { ...b, isActive: false, status: 'ARCHIVED' } : b);
        saveBooksState(updatedList);
        addMovementLog(bookId, 'ARCHIVED', 'Book soft-archived to preserve audit records');
    };

    const handleRestoreBook = (bookId: string) => {
        const updatedList = books.map(b => b.id === bookId ? { ...b, isActive: true, status: b.availableCopies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK' } : b);
        saveBooksState(updatedList);
        addMovementLog(bookId, 'RESTORED', 'Book un-archived and restored to catalog');
    };

    const handleOpenIssueModal = (bookToIssue?: BookItem) => {
        const book = bookToIssue || filteredBooks.find(b => b.availableCopies > 0);
        if (!book) {
            alert('No available books found to issue!');
            return;
        }
        setSelectedBookForIssue(book);
        setIssueForm({
            borrowerType: 'STUDENT',
            borrowerName: '',
            borrowerContact: '',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            remarks: ''
        });
        setShowIssueModal(true);
    };

    const handleSaveIssue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookForIssue || !issueForm.borrowerName.trim()) return;

        if (selectedBookForIssue.availableCopies <= 0) {
            alert('This book has no available copies left!');
            return;
        }

        const newIssue: BookIssueItem = {
            id: `issue-${Date.now()}`,
            bookId: selectedBookForIssue.id,
            borrowerType: issueForm.borrowerType,
            borrowerName: issueForm.borrowerName,
            borrowerContact: issueForm.borrowerContact || null,
            issueDate: new Date().toISOString(),
            dueDate: new Date(issueForm.dueDate).toISOString(),
            status: 'ISSUED',
            fineAmount: 0,
            fineStatus: 'NONE',
            remarks: issueForm.remarks || null,
            book: {
                title: selectedBookForIssue.title,
                isbn: selectedBookForIssue.isbn
            }
        };

        const updatedBooks = books.map(b => {
            if (b.id === selectedBookForIssue.id) {
                const newAvailable = Math.max(0, b.availableCopies - 1);
                return {
                    ...b,
                    availableCopies: newAvailable,
                    issuedCopies: b.issuedCopies + 1,
                    status: newAvailable === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE'
                };
            }
            return b;
        });

        saveBooksState(updatedBooks);
        saveIssuesState([newIssue, ...issues]);
        addMovementLog(selectedBookForIssue.id, 'ISSUE', `Issued copy to ${issueForm.borrowerName} (${issueForm.borrowerType})`, issueForm.borrowerName);

        setShowIssueModal(false);
    };

    const handleOpenReturnModal = (issueItem: BookIssueItem) => {
        setSelectedIssueForReturn(issueItem);
        const now = new Date();
        const due = new Date(issueItem.dueDate);
        let calcFine = 0;
        if (now > due) {
            const diffDays = Math.ceil(Math.abs(now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            calcFine = diffDays * 5;
        }

        setReturnForm({
            returnCondition: 'GOOD',
            remarks: '',
            applyFineOverride: false,
            fineOverrideAmount: calcFine,
            fineOverrideReason: ''
        });
        setShowReturnModal(true);
    };

    const handleSaveReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIssueForReturn) return;

        const isLost = returnForm.returnCondition === 'LOST';
        const isDamaged = returnForm.returnCondition === 'DAMAGED';

        const now = new Date();
        const due = new Date(selectedIssueForReturn.dueDate);
        let autoFine = 0;
        if (now > due) {
            const diffDays = Math.ceil(Math.abs(now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            autoFine = diffDays * 5;
        }

        let finalFine = autoFine;
        let fineStatus: 'NONE' | 'PENDING' | 'PAID' | 'WAIVED' = autoFine > 0 ? 'PENDING' : 'NONE';
        let overrideBy = null;
        let overrideReason = null;

        if (returnForm.applyFineOverride) {
            finalFine = Number(returnForm.fineOverrideAmount) || 0;
            fineStatus = finalFine === 0 ? 'WAIVED' : 'PENDING';
            overrideBy = user?.name || 'Admin';
            overrideReason = returnForm.fineOverrideReason || 'Manual fine override during return';
        }

        const updatedIssue: BookIssueItem = {
            ...selectedIssueForReturn,
            returnDate: new Date().toISOString(),
            status: isLost ? 'LOST' : (isDamaged ? 'DAMAGED' : 'RETURNED'),
            returnCondition: returnForm.returnCondition,
            fineAmount: finalFine,
            fineStatus,
            fineOverrideBy: overrideBy,
            fineOverrideReason: overrideReason,
            remarks: returnForm.remarks || selectedIssueForReturn.remarks
        };

        const updatedIssues = issues.map(i => i.id === selectedIssueForReturn.id ? updatedIssue : i);
        saveIssuesState(updatedIssues);

        const updatedBooks = books.map(b => {
            if (b.id === selectedIssueForReturn.bookId) {
                const newIssued = Math.max(0, b.issuedCopies - 1);
                const newAvailable = (!isLost && !isDamaged) ? b.availableCopies + 1 : b.availableCopies;
                const newLost = isLost ? b.lostCopies + 1 : b.lostCopies;
                const newDamaged = isDamaged ? b.damagedCopies + 1 : b.damagedCopies;
                return {
                    ...b,
                    issuedCopies: newIssued,
                    availableCopies: newAvailable,
                    lostCopies: newLost,
                    damagedCopies: newDamaged,
                    status: newAvailable > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
                };
            }
            return b;
        });
        saveBooksState(updatedBooks);

        const actionTag = isLost ? 'LOST' : (isDamaged ? 'DAMAGED' : 'RETURN');
        addMovementLog(
            selectedIssueForReturn.bookId,
            actionTag,
            `Returned by ${selectedIssueForReturn.borrowerName}. Condition: ${returnForm.returnCondition}. Fine: ₹${finalFine}`,
            selectedIssueForReturn.borrowerName
        );

        setShowReturnModal(false);
    };

    const handleOpenFineOverrideModal = (issueItem: BookIssueItem) => {
        setSelectedIssueForFine(issueItem);
        setOverrideFineVal(String(issueItem.fineAmount));
        setOverrideReasonVal(issueItem.fineOverrideReason || '');
        setShowFineOverrideModal(true);
    };

    const handleSaveFineOverride = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIssueForFine) return;

        const val = Number(overrideFineVal) || 0;
        const updated = issues.map(i => {
            if (i.id === selectedIssueForFine.id) {
                return {
                    ...i,
                    fineAmount: val,
                    fineStatus: (val === 0 ? 'WAIVED' : 'PAID') as 'WAIVED' | 'PAID',
                    fineOverrideBy: user?.name || 'Admin',
                    fineOverrideReason: overrideReasonVal || 'Manual fine waiver by Admin/Librarian'
                };
            }
            return i;
        });

        saveIssuesState(updated);
        setShowFineOverrideModal(false);
    };

    const handleOpenReserveModal = (bookToReserve?: BookItem) => {
        const book = bookToReserve || filteredBooks[0];
        if (!book) return;
        setSelectedBookForReserve(book);
        setReserveForm({
            borrowerType: 'STUDENT',
            borrowerName: '',
            borrowerContact: '',
            notes: ''
        });
        setShowReserveModal(true);
    };

    const handleSaveReservation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookForReserve || !reserveForm.borrowerName.trim()) return;

        const newRes: BookReservationItem = {
            id: `res-${Date.now()}`,
            bookId: selectedBookForReserve.id,
            borrowerType: reserveForm.borrowerType,
            borrowerName: reserveForm.borrowerName,
            borrowerContact: reserveForm.borrowerContact || null,
            reservationDate: new Date().toISOString(),
            status: 'PENDING',
            notes: reserveForm.notes || null,
            book: {
                title: selectedBookForReserve.title,
                availableCopies: selectedBookForReserve.availableCopies
            }
        };

        const updated = [newRes, ...reservations];
        saveReservationsState(updated);
        addMovementLog(selectedBookForReserve.id, 'RESERVATION', `Reserved by ${reserveForm.borrowerName} (${reserveForm.borrowerType})`, reserveForm.borrowerName);

        setShowReserveModal(false);
    };

    const handleFulfillReservation = (resId: string) => {
        const updated = reservations.map(r => r.id === resId ? { ...r, status: 'FULFILLED' as const } : r);
        saveReservationsState(updated);
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleExportExcel = () => {
        let csvContent = 'data:text/csv;charset=utf-8,';
        if (activeTab === 'books') {
            csvContent += 'Title,Author,Publisher,ISBN,Category,Edition,Language,Shelf Location,Total Quantity,Available,Issued,Lost,Damaged,Price (INR)\n';
            books.forEach(b => {
                csvContent += `"${b.title.replace(/"/g, '""')}","${b.author}","${b.publisher || ''}","${b.isbn || ''}","${b.category}","${b.edition || ''}","${b.language}","${b.shelfLocation || ''}",${b.quantity},${b.availableCopies},${b.issuedCopies},${b.lostCopies},${b.damagedCopies},${b.price}\n`;
            });
        } else {
            csvContent += 'Borrower Name,Borrower Type,Book Title,Issue Date,Due Date,Return Date,Status,Condition,Fine Amount (INR),Fine Status\n';
            issues.forEach(i => {
                csvContent += `"${i.borrowerName}","${i.borrowerType}","${i.book?.title || ''}","${new Date(i.issueDate).toLocaleDateString()}","${new Date(i.dueDate).toLocaleDateString()}","${i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'N/A'}","${i.status}","${i.returnCondition || 'N/A'}",${i.fineAmount},"${i.fineStatus}"\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Library_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            <div className="main-content" style={{ paddingBottom: '40px', overflowX: 'hidden' }}>
                {/* Standard Page Header */}
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
                            Shri Sai I.T.I Library System
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            {activeTab === 'dashboard' && '📊 Library System Dashboard'}
                            {activeTab === 'books' && '📚 Book Catalog & Inventory'}
                            {activeTab === 'issue' && '🛠️ Book Issue & Movement Management'}
                            {activeTab === 'history' && '📜 Movement History Log'}
                            {activeTab === 'reports' && '📄 Library Reports & Data Export'}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {isAdminOrLibrarian && (
                            <button onClick={() => handleOpenBookModal()} className="btn btn-primary" style={{ fontSize: 13 }}>
                                ➕ Add New Book
                            </button>
                        )}
                        <button onClick={() => handleOpenIssueModal()} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            📖 Issue Book
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Overdue Alert Banner */}
                    {stats.overdueCount > 0 && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                                        {stats.overdueCount} Overdue Book Return Alert(s)
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        Books issued to students/staff have passed their expected return date. Total pending fine: <b>₹{stats.totalPendingFines}</b>.
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => {
                                setMovementSubTab('return');
                                router.push(simulateParam ? `/library/issue?sub=return&simulate=${simulateParam}` : '/library/issue?sub=return');
                            }} className="btn" style={{ background: 'var(--danger)', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                                View Overdue & Fines →
                            </button>
                        </div>
                    )}

                    {/* Summary Stat Cards Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 12
                    }}>
                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                📚
                            </div>
                            <div>
                                <div className="stat-label">Total Books</div>
                                <div className="stat-value">{stats.totalCopies}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stats.totalTitles} titles</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                💰
                            </div>
                            <div>
                                <div className="stat-label">Stock Valuation</div>
                                <div className="stat-value" style={{ color: '#8b5cf6', fontSize: 18 }}>₹{stats.totalCatalogValue.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{stats.issuedValue.toLocaleString('en-IN')} issued value</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                ✅
                            </div>
                            <div>
                                <div className="stat-label">Available Copies</div>
                                <div className="stat-value" style={{ color: '#10b981' }}>{stats.availableCopies}</div>
                                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>₹{stats.availableValue.toLocaleString('en-IN')} value</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                📖
                            </div>
                            <div>
                                <div className="stat-label">Issued Books</div>
                                <div className="stat-value" style={{ color: '#0284c7' }}>{stats.issuedCopies}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>with borrowers</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                🚨
                            </div>
                            <div>
                                <div className="stat-label">Overdue Books</div>
                                <div className="stat-value" style={{ color: '#ef4444' }}>{stats.overdueCount}</div>
                                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>₹{stats.totalPendingFines} fines</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                ⚠️
                            </div>
                            <div>
                                <div className="stat-label">Lost / Damaged</div>
                                <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.lostCopies + stats.damagedCopies}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stats.lostCopies} lost, {stats.damagedCopies} damaged</div>
                            </div>
                        </div>
                    </div>

                    {/* TAB CONTENT: DASHBOARD OVERVIEW */}
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Dashboard Action Shortcuts Row */}
                            <div className="card" style={{ padding: 18 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
                                    ⚡ Quick Library Shortcuts
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                    <button
                                        onClick={() => handleOpenIssueModal()}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                                    >
                                        <span style={{ fontSize: 22 }}>📖</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>Issue Book Copy</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>To Student / Instructor</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            router.push(simulateParam ? `/library/issue?sub=return&simulate=${simulateParam}` : '/library/issue?sub=return');
                                        }}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                                    >
                                        <span style={{ fontSize: 22 }}>🔄</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>Return & Fines</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Condition & Fine Waiver</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleOpenReserveModal()}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                                    >
                                        <span style={{ fontSize: 22 }}>🔖</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>Book Reservations</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reserve out-of-stock</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => router.push(simulateParam ? `/library/books?simulate=${simulateParam}` : '/library/books')}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                                    >
                                        <span style={{ fontSize: 22 }}>📚</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>Browse Catalog</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manage Titles & Copies</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => router.push(simulateParam ? `/library/reports?simulate=${simulateParam}` : '/library/reports')}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, gap: 12 }}
                                    >
                                        <span style={{ fontSize: 22 }}>📄</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>Reports & Export</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Print PDF / Excel CSV</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                                {/* Category Breakdown */}
                                <div className="card" style={{ padding: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        📂 Category Stock Distribution
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {BOOK_CATEGORIES.map(cat => {
                                            const catBooks = books.filter(b => b.category === cat && b.isActive);
                                            const count = catBooks.reduce((acc, b) => acc + b.quantity, 0);
                                            const avail = catBooks.reduce((acc, b) => acc + b.availableCopies, 0);
                                            const pct = stats.totalCopies > 0 ? Math.round((count / stats.totalCopies) * 100) : 0;

                                            return (
                                                <div key={cat} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                        <span>{cat}</span>
                                                        <span>{count} copies ({avail} available)</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recent Movement Activity Feed */}
                                <div className="card" style={{ padding: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        ⚡ Recent Movement Activity
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {movements.slice(0, 8).map(m => (
                                            <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                                                <span style={{
                                                    fontSize: 12,
                                                    padding: '4px 8px',
                                                    borderRadius: 6,
                                                    fontWeight: 800,
                                                    background: m.action === 'ISSUE' ? '#dbeafe' : (m.action === 'RETURN' ? '#d1fae5' : '#fee2e2'),
                                                    color: m.action === 'ISSUE' ? '#1e40af' : (m.action === 'RETURN' ? '#065f46' : '#991b1b')
                                                }}>
                                                    {m.action}
                                                </span>
                                                <div style={{ flex: 1, fontSize: 13 }}>
                                                    <div style={{ fontWeight: 700 }}>{m.book?.title || 'Library Book'}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.remarks}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                        By {m.performedByName} • {new Date(m.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: BOOK CATALOG */}
                    {activeTab === 'books' && (
                        <div>
                            {/* Search & Filter Bar */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 12,
                                marginBottom: 16,
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--surface-2)',
                                padding: 14,
                                borderRadius: 12
                            }}>
                                <div style={{ display: 'flex', flex: 1, minWidth: 260, gap: 10 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="🔍 Search Title, Author, ISBN, Publisher, Shelf..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <select
                                        className="form-control"
                                        style={{ width: 180 }}
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="ALL">All Categories</option>
                                        {BOOK_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
                                        <input
                                            type="checkbox"
                                            checked={includeArchived}
                                            onChange={e => setIncludeArchived(e.target.checked)}
                                        />
                                        Show Archived Records
                                    </label>

                                    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            style={{
                                                border: 'none',
                                                padding: '6px 12px',
                                                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                                color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 700
                                            }}
                                        >
                                            📋 Table
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            style={{
                                                border: 'none',
                                                padding: '6px 12px',
                                                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                                color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 700
                                            }}
                                        >
                                            🎴 Cards
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Books Table View */}
                            {viewMode === 'table' ? (
                                <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Book Info</th>
                                                <th>Category</th>
                                                <th>ISBN / Publisher</th>
                                                <th>Shelf Location</th>
                                                <th>Total Copies</th>
                                                <th>Available</th>
                                                <th>Issued</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBooks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                                        No books found matching criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredBooks.map(b => (
                                                    <tr key={b.id} style={{ opacity: b.isActive ? 1 : 0.6 }}>
                                                        <td>
                                                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{b.title}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>By {b.author}</div>
                                                            {b.edition && <span style={{ fontSize: 11, color: 'var(--primary)' }}>{b.edition}</span>}
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-info">{b.category}</span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: 12 }}>{b.isbn || 'No ISBN'}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.publisher || 'N/A'}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
                                                                📍 {b.shelfLocation || 'Unassigned'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 800 }}>{b.quantity}</span>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontWeight: 900,
                                                                color: b.availableCopies > 0 ? '#10b981' : '#ef4444'
                                                            }}>
                                                                {b.availableCopies}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 700, color: '#0284c7' }}>{b.issuedCopies}</span>
                                                        </td>
                                                        <td>
                                                            {!b.isActive ? (
                                                                <span className="badge badge-danger">Archived</span>
                                                            ) : b.availableCopies > 0 ? (
                                                                <span className="badge badge-success">Available</span>
                                                            ) : (
                                                                <span className="badge badge-warning">Out of Stock</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                                {b.availableCopies > 0 && b.isActive && (
                                                                    <button
                                                                        onClick={() => handleOpenIssueModal(b)}
                                                                        className="btn btn-sm btn-secondary"
                                                                        title="Issue Book"
                                                                    >
                                                                        📖 Issue
                                                                    </button>
                                                                )}

                                                                {b.availableCopies === 0 && b.isActive && (
                                                                    <button
                                                                        onClick={() => handleOpenReserveModal(b)}
                                                                        className="btn btn-sm btn-warning"
                                                                        title="Reserve Book"
                                                                    >
                                                                        🔖 Reserve
                                                                    </button>
                                                                )}

                                                                {isAdminOrLibrarian && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleOpenBookModal(b)}
                                                                            className="btn btn-sm btn-ghost"
                                                                            title="Edit Book"
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        {b.isActive ? (
                                                                            <button
                                                                                onClick={() => handleArchiveBook(b.id)}
                                                                                className="btn btn-sm btn-ghost text-danger"
                                                                                title="Archive Book"
                                                                            >
                                                                                📦
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleRestoreBook(b.id)}
                                                                                className="btn btn-sm btn-ghost text-success"
                                                                                title="Restore Book"
                                                                            >
                                                                                🔄
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Grid Cards View */
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: 16
                                }}>
                                    {filteredBooks.map(b => (
                                        <div key={b.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span className="badge badge-info" style={{ marginBottom: 8 }}>{b.category}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: b.availableCopies > 0 ? '#10b981' : '#ef4444' }}>
                                                        {b.availableCopies} / {b.quantity} Available
                                                    </span>
                                                </div>

                                                <h4 style={{ fontSize: 16, fontWeight: 900, margin: '4px 0 6px' }}>{b.title}</h4>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>By {b.author}</div>
                                                
                                                <div style={{ fontSize: 12, background: 'var(--surface-2)', padding: 8, borderRadius: 8, marginBottom: 12 }}>
                                                    <div>📍 <b>Location:</b> {b.shelfLocation || 'Unassigned'}</div>
                                                    <div>🏷️ <b>ISBN:</b> {b.isbn || 'N/A'}</div>
                                                    <div>🏢 <b>Publisher:</b> {b.publisher || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                {b.availableCopies > 0 ? (
                                                    <button
                                                        onClick={() => handleOpenIssueModal(b)}
                                                        className="btn btn-sm btn-primary w-full"
                                                        style={{ justifyContent: 'center' }}
                                                    >
                                                        📖 Issue Copy
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenReserveModal(b)}
                                                        className="btn btn-sm btn-warning w-full"
                                                        style={{ justifyContent: 'center' }}
                                                    >
                                                        🔖 Reserve Copy
                                                    </button>
                                                )}
                                                {isAdminOrLibrarian && (
                                                    <button
                                                        onClick={() => handleOpenBookModal(b)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: COMBINED BOOK ISSUE & MOVEMENT (3 Sub-Tabs) */}
                    {activeTab === 'issue' && (
                        <div>
                            {/* Internal Sub-Tabs Bar (similar to Store Management) */}
                            <div style={{
                                display: 'flex',
                                gap: 8,
                                borderBottom: '2px solid var(--border)',
                                marginBottom: 20
                            }}>
                                <button
                                    onClick={() => setMovementSubTab('issue')}
                                    style={{
                                        padding: '10px 16px',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: movementSubTab === 'issue' ? '3px solid var(--primary)' : '3px solid transparent',
                                        color: movementSubTab === 'issue' ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📖 Book Issue Register ({issues.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').length})
                                </button>

                                <button
                                    onClick={() => setMovementSubTab('return')}
                                    style={{
                                        padding: '10px 16px',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: movementSubTab === 'return' ? '3px solid var(--primary)' : '3px solid transparent',
                                        color: movementSubTab === 'return' ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔄 Return & Fine Management
                                </button>

                                <button
                                    onClick={() => setMovementSubTab('reservations')}
                                    style={{
                                        padding: '10px 16px',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        border: 'none',
                                        background: 'transparent',
                                        borderBottom: movementSubTab === 'reservations' ? '3px solid var(--primary)' : '3px solid transparent',
                                        color: movementSubTab === 'reservations' ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔖 Book Reservations ({reservations.filter(r => r.status === 'PENDING').length})
                                </button>
                            </div>

                            {/* Sub-Tab 1: Issue Register */}
                            {movementSubTab === 'issue' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Active Book Issues Register</h3>
                                        <button onClick={() => handleOpenIssueModal()} className="btn btn-primary">
                                            📖 Issue New Book
                                        </button>
                                    </div>

                                    <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Borrower</th>
                                                    <th>Book Title</th>
                                                    <th>Issue Date</th>
                                                    <th>Due Date</th>
                                                    <th>Status</th>
                                                    <th>Fine Amount</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredIssues.map(i => {
                                                    const isOverdue = new Date(i.dueDate) < new Date() && i.status === 'ISSUED';
                                                    return (
                                                        <tr key={i.id}>
                                                            <td>
                                                                <div style={{ fontWeight: 800 }}>{i.borrowerName}</div>
                                                                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{i.borrowerType}</div>
                                                                {i.borrowerContact && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.borrowerContact}</div>}
                                                            </td>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{i.book?.title || 'Book Title'}</div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ISBN: {i.book?.isbn || 'N/A'}</div>
                                                            </td>
                                                            <td>{new Date(i.issueDate).toLocaleDateString()}</td>
                                                            <td>
                                                                <span style={{ fontWeight: 700, color: isOverdue ? '#ef4444' : 'var(--text-primary)' }}>
                                                                    {new Date(i.dueDate).toLocaleDateString()}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {i.status === 'RETURNED' ? (
                                                                    <span className="badge badge-success">Returned</span>
                                                                ) : isOverdue ? (
                                                                    <span className="badge badge-danger">Overdue</span>
                                                                ) : (
                                                                    <span className="badge badge-info">Issued</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {i.fineAmount > 0 ? (
                                                                    <span style={{ fontWeight: 800, color: '#ef4444' }}>
                                                                        ₹{i.fineAmount} ({i.fineStatus})
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹0</span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {i.status !== 'RETURNED' && (
                                                                    <button
                                                                        onClick={() => handleOpenReturnModal(i)}
                                                                        className="btn btn-sm btn-success"
                                                                    >
                                                                        🔄 Process Return
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Sub-Tab 2: Return & Fines */}
                            {movementSubTab === 'return' && (
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Return Register & Overdue Fine Management</h3>
                                    <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Borrower</th>
                                                    <th>Book Title</th>
                                                    <th>Due Date</th>
                                                    <th>Return Date</th>
                                                    <th>Condition</th>
                                                    <th>Fine Calculated</th>
                                                    <th>Fine Status</th>
                                                    <th style={{ textAlign: 'right' }}>Fine Override (Admin)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {issues.map(i => (
                                                    <tr key={i.id}>
                                                        <td>
                                                            <div style={{ fontWeight: 800 }}>{i.borrowerName}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.borrowerType}</div>
                                                        </td>
                                                        <td>{i.book?.title || 'Book Title'}</td>
                                                        <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                                                        <td>{i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'Not Returned'}</td>
                                                        <td>
                                                            {i.returnCondition ? (
                                                                <span className={`badge ${i.returnCondition === 'GOOD' ? 'badge-success' : 'badge-danger'}`}>
                                                                    {i.returnCondition}
                                                                </span>
                                                            ) : 'N/A'}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 800, color: i.fineAmount > 0 ? '#ef4444' : 'inherit' }}>
                                                                ₹{i.fineAmount}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${i.fineStatus === 'WAIVED' ? 'badge-warning' : (i.fineStatus === 'PAID' ? 'badge-success' : 'badge-info')}`}>
                                                                {i.fineStatus}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {isAdminOrLibrarian && (
                                                                <button
                                                                    onClick={() => handleOpenFineOverrideModal(i)}
                                                                    className="btn btn-sm btn-secondary"
                                                                >
                                                                    ⚙️ Override Fine
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Sub-Tab 3: Reservations */}
                            {movementSubTab === 'reservations' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Out of Stock Book Reservations</h3>
                                        <button onClick={() => handleOpenReserveModal()} className="btn btn-primary">
                                            🔖 Reserve a Book
                                        </button>
                                    </div>

                                    <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Reserved Book</th>
                                                    <th>Borrower</th>
                                                    <th>Reservation Date</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reservations.map(r => (
                                                    <tr key={r.id}>
                                                        <td>
                                                            <div style={{ fontWeight: 800 }}>{r.book?.title || 'Book Title'}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.notes || 'No notes'}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 700 }}>{r.borrowerName}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--primary)' }}>{r.borrowerType}</div>
                                                        </td>
                                                        <td>{new Date(r.reservationDate).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`badge ${r.status === 'FULFILLED' ? 'badge-success' : 'badge-warning'}`}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            {r.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => handleFulfillReservation(r.id)}
                                                                    className="btn btn-sm btn-success"
                                                                >
                                                                    ✅ Mark Fulfilled
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: MOVEMENT HISTORY */}
                    {activeTab === 'history' && (
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Book Movement & Audit History Log</h3>
                            <div className="table-responsive" style={{ borderRadius: 12, border: '1px solid var(--border)' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Action</th>
                                            <th>Book</th>
                                            <th>Borrower / Target</th>
                                            <th>Remarks</th>
                                            <th>Performed By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map(m => (
                                            <tr key={m.id}>
                                                <td style={{ fontSize: 12 }}>{new Date(m.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <span className="badge badge-info">{m.action}</span>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{m.book?.title || 'Library Book'}</td>
                                                <td>{m.borrowerName || 'N/A'}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.remarks}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.performedByName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: REPORTS & EXPORT */}
                    {activeTab === 'reports' && (
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Library Reports Generator & Export</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                                        Generate print-ready PDF reports or download raw Excel (.csv) format datasets.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={handleExportPDF} className="btn btn-secondary">
                                        🖨️ Print / Save PDF
                                    </button>
                                    <button onClick={handleExportExcel} className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
                                        📊 Export Excel (.csv)
                                    </button>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Available Books Summary Report</h4>
                                <table className="table" style={{ fontSize: 12 }}>
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Total Titles</th>
                                            <th>Total Copies</th>
                                            <th>Available Copies</th>
                                            <th>Issued Copies</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {BOOK_CATEGORIES.map(cat => {
                                            const catBooks = books.filter(b => b.category === cat && b.isActive);
                                            const titles = catBooks.length;
                                            const total = catBooks.reduce((acc, b) => acc + b.quantity, 0);
                                            const avail = catBooks.reduce((acc, b) => acc + b.availableCopies, 0);
                                            const issued = catBooks.reduce((acc, b) => acc + b.issuedCopies, 0);

                                            return (
                                                <tr key={cat}>
                                                    <td style={{ fontWeight: 700 }}>{cat}</td>
                                                    <td>{titles}</td>
                                                    <td>{total}</td>
                                                    <td style={{ color: '#10b981', fontWeight: 800 }}>{avail}</td>
                                                    <td style={{ color: '#0284c7', fontWeight: 700 }}>{issued}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <Footer />
            </div>

            {/* MODAL: ADD / EDIT BOOK */}
            {showBookModal && (
                <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
                    <div className="modal" style={{ maxWidth: 640, width: '90vw' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editingBook ? '✏️ Edit Book Catalog Entry' : '📚 Add New Book to Library'}</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowBookModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveBook}>
                            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Book Title <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Author Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.author}
                                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Category <span className="required">*</span></label>
                                    <select
                                        className="form-control"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {BOOK_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Publisher</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.publisher}
                                        onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">ISBN Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.isbn}
                                        onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Edition</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. 12th Edition (2024)"
                                        value={formData.edition}
                                        onChange={e => setFormData({ ...formData, edition: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Language</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.language}
                                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Shelf Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Shelf A-01"
                                        value={formData.shelfLocation}
                                        onChange={e => setFormData({ ...formData, shelfLocation: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Total Copy Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Book Unit Price (₹ / copy)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-control"
                                        placeholder="e.g. 500"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div style={{ gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>💰 Total Catalog Asset Valuation:</span>
                                    <span style={{ fontSize: 14 }}>₹{((formData.quantity || 1) * (formData.price || 0)).toLocaleString('en-IN')}</span>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <ImageUploadWidget
                                        value={formData.coverImage}
                                        onChange={url => setFormData({ ...formData, coverImage: url })}
                                        label="Book Cover Image"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowBookModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Book Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ISSUE BOOK */}
            {showIssueModal && selectedBookForIssue && (
                <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
                    <div className="modal" style={{ maxWidth: 480, width: '90vw' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">📖 Issue Book Copy</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowIssueModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveIssue}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                    <div style={{ fontWeight: 800 }}>{selectedBookForIssue.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {selectedBookForIssue.availableCopies} available copies remaining
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Borrower Category</label>
                                    <select
                                        className="form-control"
                                        value={issueForm.borrowerType}
                                        onChange={e => setIssueForm({ ...issueForm, borrowerType: e.target.value as any })}
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="STAFF">Staff / Instructor</option>
                                    </select>
                                </div>

                                {issueForm.borrowerType === 'STUDENT' && (
                                    <div>
                                        <label className="form-label">Link Enrolled Student (Optional)</label>
                                        <select
                                            className="form-control"
                                            value={selectedStudentId}
                                            onChange={e => {
                                                const stdId = e.target.value;
                                                setSelectedStudentId(stdId);
                                                if (stdId && stdId !== 'CUSTOM') {
                                                    const found = students.find(s => s.id === stdId);
                                                    if (found) {
                                                        setIssueForm({
                                                            ...issueForm,
                                                            borrowerName: `${found.name} (${found.rollNumber || found.trade || 'Student'})`,
                                                            borrowerContact: found.mobile || found.contact || issueForm.borrowerContact
                                                        });
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Enrolled Student or Enter Below --</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    👤 {s.name} ({s.rollNumber || s.trade || 'Student'})
                                                </option>
                                            ))}
                                            <option value="CUSTOM">✍️ Enter Custom Name / Unregistered Borrower</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="form-label">Borrower Full Name & Details <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Rushikesh Pattiwar (SAI-2024-001)"
                                        value={issueForm.borrowerName}
                                        onChange={e => setIssueForm({ ...issueForm, borrowerName: e.target.value })}
                                        required
                                    />
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        Pick from enrolled students above or type any custom borrower name manually.
                                    </span>
                                </div>

                                <div>
                                    <label className="form-label">Phone / Contact Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="+91 9876543210"
                                        value={issueForm.borrowerContact || ''}
                                        onChange={e => setIssueForm({ ...issueForm, borrowerContact: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Return Due Date <span className="required">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={issueForm.dueDate}
                                        onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowIssueModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Confirm & Issue Book</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PROCESS RETURN */}
            {showReturnModal && selectedIssueForReturn && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal" style={{ maxWidth: 480, width: '90vw' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">🔄 Process Book Return</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowReturnModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveReturn}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                    <div style={{ fontWeight: 800 }}>{selectedIssueForReturn.book?.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Issued to: {selectedIssueForReturn.borrowerName}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                                        Due Date: {new Date(selectedIssueForReturn.dueDate).toLocaleDateString()}
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Returned Book Condition</label>
                                    <select
                                        className="form-control"
                                        value={returnForm.returnCondition}
                                        onChange={e => setReturnForm({ ...returnForm, returnCondition: e.target.value as any })}
                                    >
                                        <option value="GOOD">Good Condition (Return to Available Stock)</option>
                                        <option value="DAMAGED">Damaged (Mark Damaged Copy)</option>
                                        <option value="LOST">Lost (Mark Lost Copy)</option>
                                    </select>
                                </div>

                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 8 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={returnForm.applyFineOverride}
                                            onChange={e => setReturnForm({ ...returnForm, applyFineOverride: e.target.checked })}
                                        />
                                        Manual Admin Fine Override / Waiver
                                    </label>

                                    {returnForm.applyFineOverride && (
                                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Override Fine Amount (INR)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={returnForm.fineOverrideAmount}
                                                    onChange={e => setReturnForm({ ...returnForm, fineOverrideAmount: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: 12 }}>Reason for Fine Waiver / Adjustment</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. Granted grace period by Principal"
                                                    value={returnForm.fineOverrideReason}
                                                    onChange={e => setReturnForm({ ...returnForm, fineOverrideReason: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowReturnModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Complete Return</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: FINE OVERRIDE */}
            {showFineOverrideModal && selectedIssueForFine && (
                <div className="modal-overlay" onClick={() => setShowFineOverrideModal(false)}>
                    <div className="modal" style={{ maxWidth: 440, width: '90vw' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">⚙️ Admin Fine Override & Waiver</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowFineOverrideModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveFineOverride}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label className="form-label">New Fine Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={overrideFineVal}
                                        onChange={e => setOverrideFineVal(e.target.value)}
                                        required
                                    />
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Set to 0 to completely waive the fine.</span>
                                </div>

                                <div>
                                    <label className="form-label">Reason for Override</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Authorized by Principal / Medical Exemption"
                                        value={overrideReasonVal}
                                        onChange={e => setOverrideReasonVal(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowFineOverrideModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Override</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: RESERVE BOOK */}
            {showReserveModal && selectedBookForReserve && (
                <div className="modal-overlay" onClick={() => setShowReserveModal(false)}>
                    <div className="modal" style={{ maxWidth: 440, width: '90vw' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">🔖 Reserve Book</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowReserveModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveReservation}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                    <div style={{ fontWeight: 800 }}>{selectedBookForReserve.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Currently all {selectedBookForReserve.quantity} copies are issued.
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Borrower Full Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={reserveForm.borrowerName}
                                        onChange={e => setReserveForm({ ...reserveForm, borrowerName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Contact Details</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={reserveForm.borrowerContact}
                                        onChange={e => setReserveForm({ ...reserveForm, borrowerContact: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowReserveModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Confirm Reservation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
