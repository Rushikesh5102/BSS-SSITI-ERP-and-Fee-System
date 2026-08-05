import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ── GET DASHBOARD METRICS ───────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const branchId = (req as any).user?.branchId || req.query.branchId;

        const whereBranch = branchId ? { branchId: String(branchId) } : {};

        // Total active books
        const books = await prisma.book.findMany({
            where: { isActive: true, ...whereBranch }
        });

        let totalBooks = 0;
        let availableCopies = 0;
        let issuedCopies = 0;
        let lostCopies = 0;
        let damagedCopies = 0;

        books.forEach((b) => {
            totalBooks += b.quantity;
            availableCopies += b.availableCopies;
            issuedCopies += b.issuedCopies;
            lostCopies += b.lostCopies;
            damagedCopies += b.damagedCopies;
        });

        // Overdue Issues count
        const now = new Date();
        const overdueCount = await prisma.bookIssue.count({
            where: {
                status: 'ISSUED',
                dueDate: { lt: now },
                ...whereBranch
            }
        });

        // Recent Movements
        const recentMovements = await prisma.bookMovementLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { book: { select: { title: true, isbn: true } } }
        });

        res.json({
            success: true,
            data: {
                totalTitles: books.length,
                totalBooks,
                availableCopies,
                issuedCopies,
                overdueBooks: overdueCount,
                lostCopies,
                damagedCopies,
                recentMovements
            }
        });
    } catch (err: any) {
        logger.error('Error fetching library dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Failed to load library metrics' });
    }
};

// ── BOOK CATALOG ─────────────────────────────────────────────────────────────
export const getBooks = async (req: Request, res: Response) => {
    try {
        const { category, search, includeArchived } = req.query;

        const where: any = {};
        if (includeArchived !== 'true') {
            where.isActive = true;
        }
        if (category && category !== 'ALL') {
            where.category = String(category);
        }
        if (search) {
            const q = String(search);
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
                { publisher: { contains: q, mode: 'insensitive' } },
                { isbn: { contains: q, mode: 'insensitive' } },
                { shelfLocation: { contains: q, mode: 'insensitive' } },
            ];
        }

        const books = await prisma.book.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: books });
    } catch (err: any) {
        logger.error('Error fetching books:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch book catalog' });
    }
};

export const createBook = async (req: Request, res: Response) => {
    try {
        const {
            title, author, publisher, isbn, category, edition, language,
            shelfLocation, quantity, price, coverImage, notes
        } = req.body;

        if (!title || !author || !category) {
            return res.status(400).json({ success: false, message: 'Title, Author, and Category are required' });
        }

        const user = (req as any).user;
        const branchId = user?.branchId || '00000000-0000-0000-0000-000000000001';
        const initialQty = Number(quantity) || 1;

        const book = await prisma.book.create({
            data: {
                title,
                author,
                publisher: publisher || null,
                isbn: isbn || null,
                category,
                edition: edition || null,
                language: language || 'English',
                shelfLocation: shelfLocation || null,
                quantity: initialQty,
                availableCopies: initialQty,
                issuedCopies: 0,
                lostCopies: 0,
                damagedCopies: 0,
                price: Number(price) || 0,
                coverImage: coverImage || null,
                notes: notes || null,
                branchId,
                createdById: user?.id || null,
            }
        });

        // Log Movement
        await prisma.bookMovementLog.create({
            data: {
                bookId: book.id,
                action: 'ADDED',
                quantity: initialQty,
                remarks: `Added new book catalog entry with ${initialQty} copies`,
                performedById: user?.id || '00000000-0000-0000-0000-000000000000',
                performedByName: user?.name || 'Admin',
            }
        });

        res.status(201).json({ success: true, data: book, message: 'Book created successfully' });
    } catch (err: any) {
        logger.error('Error creating book:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to create book' });
    }
};

export const updateBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title, author, publisher, isbn, category, edition, language,
            shelfLocation, quantity, price, coverImage, notes, status
        } = req.body;

        const existing = await prisma.book.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        const user = (req as any).user;
        const newQty = quantity !== undefined ? Number(quantity) : existing.quantity;
        const diffQty = newQty - existing.quantity;
        const newAvailable = Math.max(0, existing.availableCopies + diffQty);

        const updated = await prisma.book.update({
            where: { id },
            data: {
                title: title ?? existing.title,
                author: author ?? existing.author,
                publisher: publisher ?? existing.publisher,
                isbn: isbn ?? existing.isbn,
                category: category ?? existing.category,
                edition: edition ?? existing.edition,
                language: language ?? existing.language,
                shelfLocation: shelfLocation ?? existing.shelfLocation,
                quantity: newQty,
                availableCopies: newAvailable,
                price: price !== undefined ? Number(price) : existing.price,
                coverImage: coverImage ?? existing.coverImage,
                notes: notes ?? existing.notes,
                status: status ?? existing.status,
            }
        });

        // Log update movement if quantity changed
        if (diffQty !== 0) {
            await prisma.bookMovementLog.create({
                data: {
                    bookId: updated.id,
                    action: 'UPDATED',
                    quantity: Math.abs(diffQty),
                    remarks: `Stock adjusted by ${diffQty > 0 ? '+' : ''}${diffQty} copies`,
                    performedById: user?.id || '00000000-0000-0000-0000-000000000000',
                    performedByName: user?.name || 'Admin',
                }
            });
        }

        res.json({ success: true, data: updated, message: 'Book updated successfully' });
    } catch (err: any) {
        logger.error('Error updating book:', err);
        res.status(500).json({ success: false, message: 'Failed to update book' });
    }
};

// Soft delete / archive book (never permanently delete)
export const archiveBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        const book = await prisma.book.update({
            where: { id },
            data: {
                isActive: false,
                status: 'ARCHIVED'
            }
        });

        await prisma.bookMovementLog.create({
            data: {
                bookId: id,
                action: 'ARCHIVED',
                remarks: 'Book record soft-archived for audit safety',
                performedById: user?.id || '00000000-0000-0000-0000-000000000000',
                performedByName: user?.name || 'Admin',
            }
        });

        res.json({ success: true, message: 'Book record safely archived. History preserved.' });
    } catch (err: any) {
        logger.error('Error archiving book:', err);
        res.status(500).json({ success: false, message: 'Failed to archive book' });
    }
};

// ── BOOK ISSUE REGISTER ─────────────────────────────────────────────────────
export const issueBook = async (req: Request, res: Response) => {
    try {
        const { bookId, borrowerType, studentId, staffId, borrowerName, borrowerContact, dueDate, remarks } = req.body;
        const user = (req as any).user;
        const branchId = user?.branchId || '00000000-0000-0000-0000-000000000001';

        if (!bookId || !borrowerName || !dueDate) {
            return res.status(400).json({ success: false, message: 'Book, Borrower Name, and Due Date are required' });
        }

        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book || !book.isActive) {
            return res.status(404).json({ success: false, message: 'Book not found or unavailable' });
        }

        if (book.availableCopies <= 0) {
            return res.status(400).json({ success: false, message: 'No copies available for issue. Please reserve this book.' });
        }

        // Create BookIssue
        const issue = await prisma.bookIssue.create({
            data: {
                bookId,
                borrowerType: borrowerType || 'STUDENT',
                studentId: studentId || null,
                staffId: staffId || null,
                borrowerName,
                borrowerContact: borrowerContact || null,
                dueDate: new Date(dueDate),
                status: 'ISSUED',
                issuedById: user?.id || '00000000-0000-0000-0000-000000000000',
                remarks: remarks || null,
                branchId,
            }
        });

        // Update book copy counters
        await prisma.book.update({
            where: { id: bookId },
            data: {
                availableCopies: Math.max(0, book.availableCopies - 1),
                issuedCopies: book.issuedCopies + 1,
                status: book.availableCopies - 1 === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE'
            }
        });

        // Log Movement
        await prisma.bookMovementLog.create({
            data: {
                bookId,
                issueId: issue.id,
                action: 'ISSUE',
                borrowerName,
                quantity: 1,
                remarks: `Issued to ${borrowerName} (${borrowerType})`,
                performedById: user?.id || '00000000-0000-0000-0000-000000000000',
                performedByName: user?.name || 'Librarian',
            }
        });

        res.status(201).json({ success: true, data: issue, message: 'Book issued successfully' });
    } catch (err: any) {
        logger.error('Error issuing book:', err);
        res.status(500).json({ success: false, message: 'Failed to issue book' });
    }
};

export const getIssues = async (req: Request, res: Response) => {
    try {
        const { status, borrowerType, search } = req.query;

        const where: any = {};
        if (status && status !== 'ALL') {
            where.status = String(status);
        }
        if (borrowerType && borrowerType !== 'ALL') {
            where.borrowerType = String(borrowerType);
        }
        if (search) {
            const q = String(search);
            where.OR = [
                { borrowerName: { contains: q, mode: 'insensitive' } },
                { book: { title: { contains: q, mode: 'insensitive' } } },
                { book: { isbn: { contains: q, mode: 'insensitive' } } }
            ];
        }

        const issues = await prisma.bookIssue.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                book: { select: { id: true, title: true, author: true, isbn: true, category: true, shelfLocation: true } },
                issuedBy: { select: { name: true, email: true } },
                receivedBy: { select: { name: true, email: true } },
            }
        });

        res.json({ success: true, data: issues });
    } catch (err: any) {
        logger.error('Error fetching book issues:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch book issues' });
    }
};

// ── BOOK RETURN REGISTER & FINE CALCULATION ───────────────────────────────
export const returnBook = async (req: Request, res: Response) => {
    try {
        const { issueId, returnCondition, remarks, fineOverrideAmount, fineOverrideReason } = req.body;
        const user = (req as any).user;

        if (!issueId) {
            return res.status(400).json({ success: false, message: 'Issue record ID is required' });
        }

        const issue = await prisma.bookIssue.findUnique({
            where: { id: issueId },
            include: { book: true }
        });

        if (!issue || issue.status === 'RETURNED') {
            return res.status(400).json({ success: false, message: 'Invalid or already returned issue record' });
        }

        const returnDate = new Date();
        const dueDate = new Date(issue.dueDate);
        
        // Calculate Overdue Fine (₹5 per day overdue)
        let calculatedFine = 0;
        if (returnDate > dueDate) {
            const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            calculatedFine = diffDays * 5; // ₹5/day rate
        }

        let finalFine = calculatedFine;
        let fineStatus = calculatedFine > 0 ? 'PENDING' : 'NONE';
        let overrideBy = null;
        let overrideReason = null;

        if (fineOverrideAmount !== undefined && fineOverrideAmount !== null) {
            finalFine = Number(fineOverrideAmount);
            fineStatus = finalFine === 0 ? 'WAIVED' : 'PENDING';
            overrideBy = user?.name || 'Admin';
            overrideReason = fineOverrideReason || 'Manual fine adjustment by Admin/Librarian';
        }

        const condition = returnCondition || 'GOOD';
        let isLost = condition === 'LOST';
        let isDamaged = condition === 'DAMAGED';

        // Update issue status
        const updatedIssue = await prisma.bookIssue.update({
            where: { id: issueId },
            data: {
                returnDate,
                status: isLost ? 'LOST' : (isDamaged ? 'DAMAGED' : 'RETURNED'),
                returnCondition: condition,
                fineAmount: finalFine,
                fineStatus,
                fineOverrideBy: overrideBy,
                fineOverrideReason: overrideReason,
                receivedById: user?.id || null,
                remarks: remarks || issue.remarks
            }
        });

        // Update book copy statistics
        const book = issue.book;
        const newIssuedCopies = Math.max(0, book.issuedCopies - 1);
        const newAvailableCopies = (!isLost && !isDamaged) ? book.availableCopies + 1 : book.availableCopies;
        const newLostCopies = isLost ? book.lostCopies + 1 : book.lostCopies;
        const newDamagedCopies = isDamaged ? book.damagedCopies + 1 : book.damagedCopies;

        await prisma.book.update({
            where: { id: book.id },
            data: {
                issuedCopies: newIssuedCopies,
                availableCopies: newAvailableCopies,
                lostCopies: newLostCopies,
                damagedCopies: newDamagedCopies,
                status: newAvailableCopies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
            }
        });

        // Log Movement
        const actionType = isLost ? 'LOST' : (isDamaged ? 'DAMAGED' : 'RETURN');
        await prisma.bookMovementLog.create({
            data: {
                bookId: book.id,
                issueId: issue.id,
                action: actionType,
                borrowerName: issue.borrowerName,
                quantity: 1,
                remarks: `Returned by ${issue.borrowerName}. Condition: ${condition}. Fine: ₹${finalFine}`,
                performedById: user?.id || '00000000-0000-0000-0000-000000000000',
                performedByName: user?.name || 'Librarian',
            }
        });

        res.json({
            success: true,
            data: updatedIssue,
            calculatedFine,
            finalFine,
            message: `Book returned successfully.${finalFine > 0 ? ` Fine applicable: ₹${finalFine}` : ''}`
        });
    } catch (err: any) {
        logger.error('Error returning book:', err);
        res.status(500).json({ success: false, message: 'Failed to process book return' });
    }
};

// Admin fine override handler
export const overrideFine = async (req: Request, res: Response) => {
    try {
        const { issueId, fineAmount, reason } = req.body;
        const user = (req as any).user;

        const newFine = Number(fineAmount) || 0;
        const issue = await prisma.bookIssue.update({
            where: { id: issueId },
            data: {
                fineAmount: newFine,
                fineStatus: newFine === 0 ? 'WAIVED' : 'PAID',
                fineOverrideBy: user?.name || 'Admin',
                fineOverrideReason: reason || 'Manual Admin Fine Override'
            }
        });

        res.json({ success: true, data: issue, message: 'Fine override recorded successfully' });
    } catch (err: any) {
        logger.error('Error overriding fine:', err);
        res.status(500).json({ success: false, message: 'Failed to override fine' });
    }
};

// ── RESERVATION SYSTEM ──────────────────────────────────────────────────────
export const reserveBook = async (req: Request, res: Response) => {
    try {
        const { bookId, borrowerType, studentId, staffId, borrowerName, borrowerContact, notes } = req.body;
        const user = (req as any).user;
        const branchId = user?.branchId || '00000000-0000-0000-0000-000000000001';

        if (!bookId || !borrowerName) {
            return res.status(400).json({ success: false, message: 'Book and Borrower Name are required' });
        }

        const reservation = await prisma.bookReservation.create({
            data: {
                bookId,
                borrowerType: borrowerType || 'STUDENT',
                studentId: studentId || null,
                staffId: staffId || null,
                borrowerName,
                borrowerContact: borrowerContact || null,
                status: 'PENDING',
                notes: notes || null,
                branchId,
            }
        });

        res.status(201).json({ success: true, data: reservation, message: 'Book reserved successfully' });
    } catch (err: any) {
        logger.error('Error reserving book:', err);
        res.status(500).json({ success: false, message: 'Failed to reserve book' });
    }
};

export const getReservations = async (req: Request, res: Response) => {
    try {
        const reservations = await prisma.bookReservation.findMany({
            orderBy: { createdAt: 'desc' },
            include: { book: { select: { title: true, isbn: true, category: true, availableCopies: true } } }
        });
        res.json({ success: true, data: reservations });
    } catch (err: any) {
        logger.error('Error fetching reservations:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
    }
};

// ── MOVEMENT HISTORY LOG ────────────────────────────────────────────────────
export const getMovementHistory = async (req: Request, res: Response) => {
    try {
        const { action, search } = req.query;

        const where: any = {};
        if (action && action !== 'ALL') {
            where.action = String(action);
        }
        if (search) {
            const q = String(search);
            where.OR = [
                { borrowerName: { contains: q, mode: 'insensitive' } },
                { remarks: { contains: q, mode: 'insensitive' } },
                { performedByName: { contains: q, mode: 'insensitive' } },
                { book: { title: { contains: q, mode: 'insensitive' } } }
            ];
        }

        const history = await prisma.bookMovementLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { book: { select: { title: true, isbn: true, category: true } } }
        });

        res.json({ success: true, data: history });
    } catch (err: any) {
        logger.error('Error fetching movement history:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch movement history' });
    }
};
