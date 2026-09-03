import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction } from '../types/enums';

export const stockTransactionsController = {
    /**
     * GET /api/store/dashboard-stats
     * Dashboard stats for ITI Asset & Tool Management System
     */
    getDashboardStats: asyncHandler(async (req: Request, res: Response) => {
        const whereBranch: any = req.user?.branchId ? { branchId: req.user.branchId } : {};

        // Fetch active items
        const items = await prisma.storeItem.findMany({
            where: { ...whereBranch, isActive: true }
        });

        // Fetch active stock transactions
        const activeTransactions = await prisma.stockTransaction.findMany({
            where: { ...whereBranch }
        });

        const totalItems = items.length;
        const availableItemsCount = items.filter(i => i.status === 'AVAILABLE' || !i.status).length;
        const damagedCount = items.filter(i => i.status === 'DAMAGED' || i.status === 'LOST').length;
        const maintenanceCount = items.filter(i => i.status === 'UNDER_MAINTENANCE').length;

        // Active issued transactions (status = ISSUED or ACTIVE with type = ISSUE)
        const issuedTransactions = activeTransactions.filter(t => t.type === 'ISSUE' && t.status === 'ISSUED');
        const totalIssuedItems = issuedTransactions.reduce((acc, t) => acc + t.quantity, 0);

        // Overdue count: issued items where expectedReturnDate < now and status === 'ISSUED'
        const now = new Date();
        const overdueTransactions = issuedTransactions.filter(t => t.expectedReturnDate && new Date(t.expectedReturnDate) < now);
        const overdueCount = overdueTransactions.length;

        res.json({
            success: true,
            data: {
                totalItems,
                availableCount: availableItemsCount,
                issuedCount: issuedTransactions.length,
                issuedQuantity: totalIssuedItems,
                overdueCount,
                damagedCount,
                maintenanceCount,
                lowStockCount: items.filter(i => i.quantity <= i.reorderLevel).length
            }
        });
    }),

    /**
     * GET /api/store/transactions
     * Query: itemId, type, branchId, studentId, status, recipientType, limit, page
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, type, branchId, studentId, status, recipientType, limit = '50', page = '1' } = req.query;

        const take = parseInt(limit as string, 10);
        const skip = (parseInt(page as string, 10) - 1) * take;

        const where: any = {};

        if (req.user?.branchId) {
            where.branchId = req.user.branchId;
        } else if (branchId) {
            where.branchId = branchId as string;
        }

        if (itemId) {
            where.itemId = itemId as string;
        }

        if (type) {
            where.type = type as any;
        }

        if (status) {
            where.status = status as string;
        }

        if (recipientType) {
            where.recipientType = recipientType as string;
        }

        if (studentId) {
            where.studentId = studentId as string;
        }

        const [transactions, total] = await Promise.all([
            prisma.stockTransaction.findMany({
                where,
                include: {
                    item: { select: { id: true, name: true, sku: true, unit: true, category: true, location: true, image: true } },
                    student: { select: { id: true, name: true, studentId: true, class: true } },
                    recordedBy: { select: { id: true, name: true, email: true } },
                    receivedBy: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                take,
                skip
            }),
            prisma.stockTransaction.count({ where })
        ]);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page as string, 10),
                limit: take,
                pages: Math.ceil(total / take)
            }
        });
    }),

    /**
     * POST /api/store/transactions/issue
     * Tool Issue Register Endpoint
     */
    recordIssue: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, quantity, recipientType, studentId, staffName, expectedReturnDate, remarks } = req.body;

        if (!itemId || !quantity) {
            throw new AppError(400, 'Item and Quantity are required');
        }

        const qty = parseInt(quantity, 10);
        if (qty <= 0) throw new AppError(400, 'Quantity must be greater than zero');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Asset/Item not found');

        if (item.quantity < qty) {
            throw new AppError(400, `Insufficient available stock. Available: ${item.quantity} ${item.unit}`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // Decrement item quantity & update status if stock exhausted
            const newQty = item.quantity - qty;
            await tx.storeItem.update({
                where: { id: itemId },
                data: {
                    quantity: newQty,
                    status: newQty === 0 ? 'ISSUED' : item.status
                }
            });

            // Create Issue Movement Transaction
            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'ISSUE',
                    quantity: qty,
                    recipientType: recipientType || (studentId ? 'STUDENT' : 'STAFF'),
                    studentId: studentId || null,
                    staffName: staffName || null,
                    issuedDate: new Date(),
                    expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
                    status: 'ISSUED',
                    remarks,
                    recordedById: req.user!.id,
                    branchId: item.branchId
                },
                include: {
                    item: { select: { name: true, sku: true } },
                    student: { select: { name: true, studentId: true } }
                }
            });
        });

        await createAuditLog(
            req.user!.id,
            AuditAction.STOCK_OUTWARD,
            'StockTransaction',
            result.id,
            { action: 'TOOL_ISSUED', itemName: item.name, quantity: qty, recipient: staffName || studentId },
            req.ip
        );

        res.status(201).json({ success: true, data: result });
    }),

    /**
     * POST /api/store/transactions/return
     * Tool Return Register Endpoint
     */
    recordReturn: asyncHandler(async (req: Request, res: Response) => {
        const { transactionId, itemId, quantity, condition, returnDate, remarks } = req.body;

        const qty = parseInt(quantity || '1', 10);
        if (qty <= 0) throw new AppError(400, 'Quantity must be greater than zero');

        let issueRecord: any = null;
        if (transactionId) {
            issueRecord = await prisma.stockTransaction.findUnique({ where: { id: transactionId } });
        }

        const targetItemId = itemId || issueRecord?.itemId;
        if (!targetItemId) throw new AppError(400, 'Item ID or Valid Issue Transaction is required');

        const item = await prisma.storeItem.findUnique({ where: { id: targetItemId } });
        if (!item) throw new AppError(404, 'Asset/Item not found');

        const returnCond = condition || 'GOOD'; // GOOD, MINOR_DAMAGE, DAMAGED, LOST

        const result = await prisma.$transaction(async (tx) => {
            // Update original issue record if provided
            if (issueRecord) {
                await tx.stockTransaction.update({
                    where: { id: issueRecord.id },
                    data: {
                        status: 'RETURNED',
                        returnDate: returnDate ? new Date(returnDate) : new Date(),
                        condition: returnCond
                    }
                });
            }

            // Adjust inventory stock based on return condition
            let newStatus = item.status;
            let stockIncrement = 0;

            if (returnCond === 'GOOD' || returnCond === 'MINOR_DAMAGE') {
                stockIncrement = qty;
                newStatus = 'AVAILABLE';
            } else if (returnCond === 'DAMAGED') {
                newStatus = 'DAMAGED';
            } else if (returnCond === 'LOST') {
                newStatus = 'LOST';
            }

            await tx.storeItem.update({
                where: { id: targetItemId },
                data: {
                    quantity: { increment: stockIncrement },
                    status: newStatus
                }
            });

            // Log Return transaction
            return tx.stockTransaction.create({
                data: {
                    itemId: targetItemId,
                    type: 'RETURN',
                    quantity: qty,
                    recipientType: issueRecord?.recipientType,
                    studentId: issueRecord?.studentId || null,
                    staffName: issueRecord?.staffName || null,
                    returnDate: returnDate ? new Date(returnDate) : new Date(),
                    condition: returnCond,
                    status: 'RETURNED',
                    remarks,
                    recordedById: issueRecord?.recordedById || req.user!.id,
                    receivedById: req.user!.id,
                    branchId: item.branchId
                },
                include: {
                    item: { select: { name: true } }
                }
            });
        });

        res.status(200).json({ success: true, data: result });
    }),

    /**
     * POST /api/store/transactions/maintenance
     * Maintenance Register Endpoint (Send to Maintenance or Return from Maintenance)
     */
    recordMaintenance: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, action, quantity, remarks } = req.body; // action = 'START' | 'COMPLETE' | 'UNREPAIRABLE'

        if (!itemId) throw new AppError(400, 'Item ID is required');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Asset/Item not found');

        const qty = parseInt(quantity || '1', 10);

        const result = await prisma.$transaction(async (tx) => {
            let newStatus = 'UNDER_MAINTENANCE';
            if (action === 'COMPLETE') newStatus = 'AVAILABLE';
            if (action === 'UNREPAIRABLE') newStatus = 'DAMAGED';

            await tx.storeItem.update({
                where: { id: itemId },
                data: { status: newStatus }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'MAINTENANCE',
                    quantity: qty,
                    status: action === 'COMPLETE' ? 'REPAIRED' : (action === 'UNREPAIRABLE' ? 'DAMAGED' : 'IN_MAINTENANCE'),
                    remarks: remarks || `Maintenance action: ${action}`,
                    recordedById: req.user!.id,
                    branchId: item.branchId
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: result });
    }),

    /**
     * POST /api/store/transactions/transfer
     * Asset Transfer (Location Change) Endpoint
     */
    recordTransfer: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, fromLocation, toLocation, remarks } = req.body;

        if (!itemId || !toLocation) {
            throw new AppError(400, 'Item ID and New Location are required');
        }

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Asset/Item not found');

        const currentLoc = fromLocation || item.location || 'Unassigned';

        const result = await prisma.$transaction(async (tx) => {
            await tx.storeItem.update({
                where: { id: itemId },
                data: { location: toLocation }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'TRANSFER',
                    quantity: item.quantity,
                    fromLocation: currentLoc,
                    toLocation,
                    remarks: remarks || `Transferred from ${currentLoc} to ${toLocation}`,
                    recordedById: req.user!.id,
                    branchId: item.branchId,
                    status: 'COMPLETED'
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: result });
    }),

    /**
     * POST /api/store/transactions/damage
     * Mark Asset Damaged or Lost Endpoint
     */
    recordDamage: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, condition, quantity, remarks } = req.body; // condition = 'DAMAGED' | 'LOST'

        if (!itemId) throw new AppError(400, 'Item ID is required');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Asset/Item not found');

        const qty = parseInt(quantity || '1', 10);
        const cond = condition === 'LOST' ? 'LOST' : 'DAMAGED';

        const result = await prisma.$transaction(async (tx) => {
            await tx.storeItem.update({
                where: { id: itemId },
                data: { status: cond }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: cond === 'LOST' ? 'LOSS' : 'DAMAGE',
                    quantity: qty,
                    condition: cond,
                    status: cond,
                    remarks: remarks || `Marked as ${cond}`,
                    recordedById: req.user!.id,
                    branchId: item.branchId
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: result });
    }),

    /**
     * Legacy Inward / Stock Addition
     */
    recordInward: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, quantity, remarks } = req.body;
        if (!itemId || !quantity) throw new AppError(400, 'Item ID and Quantity are required');

        const qty = parseInt(quantity, 10);
        if (qty <= 0) throw new AppError(400, 'Quantity must be greater than zero');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Item not found');

        const transaction = await prisma.$transaction(async (tx) => {
            await tx.storeItem.update({
                where: { id: itemId },
                data: {
                    quantity: { increment: qty },
                    status: 'AVAILABLE'
                }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'INWARD',
                    quantity: qty,
                    remarks,
                    recordedById: req.user!.id,
                    branchId: item.branchId,
                    status: 'COMPLETED'
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: transaction });
    }),

    /**
     * Legacy Outward
     */
    recordOutward: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, quantity, studentId, remarks } = req.body;
        if (!itemId || !quantity) throw new AppError(400, 'Item ID and Quantity are required');

        const qty = parseInt(quantity, 10);
        if (qty <= 0) throw new AppError(400, 'Quantity must be greater than zero');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Item not found');

        if (item.quantity < qty) {
            throw new AppError(400, `Insufficient stock. Available: ${item.quantity} ${item.unit}`);
        }

        const transaction = await prisma.$transaction(async (tx) => {
            const newQty = item.quantity - qty;
            await tx.storeItem.update({
                where: { id: itemId },
                data: {
                    quantity: newQty,
                    status: newQty === 0 ? 'ISSUED' : item.status
                }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'OUTWARD',
                    quantity: qty,
                    remarks,
                    studentId: studentId || null,
                    recordedById: req.user!.id,
                    branchId: item.branchId,
                    status: 'COMPLETED'
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: transaction });
    }),

    /**
     * Stock Adjustment
     */
    recordAdjustment: asyncHandler(async (req: Request, res: Response) => {
        const { itemId, quantity, remarks } = req.body;
        if (!itemId || quantity === undefined) throw new AppError(400, 'Item ID and Quantity are required');

        const qty = parseInt(quantity, 10);
        if (qty === 0) throw new AppError(400, 'Adjustment quantity cannot be zero');

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) throw new AppError(404, 'Item not found');

        const newQty = item.quantity + qty;
        if (newQty < 0) throw new AppError(400, `Invalid adjustment.`);

        const transaction = await prisma.$transaction(async (tx) => {
            await tx.storeItem.update({
                where: { id: itemId },
                data: { quantity: newQty }
            });

            return tx.stockTransaction.create({
                data: {
                    itemId,
                    type: 'ADJUSTMENT',
                    quantity: qty,
                    remarks,
                    recordedById: req.user!.id,
                    branchId: item.branchId,
                    status: 'COMPLETED'
                },
                include: { item: { select: { name: true } } }
            });
        });

        res.status(201).json({ success: true, data: transaction });
    }),

    /**
     * POST /api/store/transactions/kit-issue
     * Standard 24-Item Student Kit & Uniform Package Issuance
     */
    recordKitIssue: asyncHandler(async (req: Request, res: Response) => {
        const { studentId, items, remarks, issuedDate } = req.body;

        if (!studentId) {
            throw new AppError(400, 'Student selection is required for kit issuance');
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                studentFees: true,
                branch: true
            }
        });

        if (!student) {
            throw new AppError(404, 'Student not found');
        }

        // Find or create a master "Standard Student Material Kit & Uniform Package (24 Items)" StoreItem if needed
        let kitStoreItem = await prisma.storeItem.findFirst({
            where: {
                branchId: student.branchId,
                name: { contains: 'Material Kit', mode: 'insensitive' }
            }
        });

        if (!kitStoreItem) {
            kitStoreItem = await prisma.storeItem.create({
                data: {
                    name: 'Standard Student Material Kit & Uniform Package (24 Items)',
                    category: 'Student Stationery & Uniform',
                    sku: 'KIT-STD-24',
                    quantity: 999,
                    unit: 'kit',
                    reorderLevel: 10,
                    pricePerUnit: 0,
                    status: 'AVAILABLE',
                    branchId: student.branchId,
                    createdById: req.user!.id,
                    description: 'Complete 24-item stationery, drawing materials, notebooks, and uniform package.'
                }
            });
        }

        const itemsListStr = Array.isArray(items) ? items.map((i: any) => `${i.name} (x${i.qty || 1} ${i.unit || 'pc'})`).join(', ') : 'All 24 standard items';
        const kitRemarks = `🎒 Student Material Kit & Dress Package Issued: [${itemsListStr}]. ${remarks ? `Remarks: ${remarks}` : ''}`;

        const transaction = await prisma.stockTransaction.create({
            data: {
                itemId: kitStoreItem.id,
                type: 'ISSUE',
                quantity: 1,
                recipientType: 'STUDENT',
                studentId: student.id,
                status: 'COMPLETED',
                branchId: student.branchId,
                recordedById: req.user!.id,
                remarks: kitRemarks,
                createdAt: issuedDate ? new Date(issuedDate) : new Date()
            },
            include: {
                item: true,
                student: true,
                recordedBy: true
            }
        });

        await createAuditLog(
            req.user!.id,
            AuditAction.STOCK_OUTWARD,
            'StockTransaction',
            transaction.id,
            { action: 'STUDENT_KIT_ISSUED', studentName: student.name, studentId: student.studentId, itemsCount: Array.isArray(items) ? items.length : 24 },
            req.ip
        );

        res.status(201).json({
            success: true,
            message: `24-Item Student Kit successfully issued to ${student.name}`,
            data: transaction
        });
    })
};
