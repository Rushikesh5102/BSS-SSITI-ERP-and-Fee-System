import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction } from '../types/enums';

export const storeItemsController = {
    /**
     * GET /api/store/items
     * Query parameters: category, status, branchId, lowStock, search, showArchived
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { category, status, branchId, lowStock, search, showArchived } = req.query;

        const where: any = {};

        if (showArchived !== 'true') {
            where.isActive = true;
        }

        // If not admin/developer, scope to their branch
        if (req.user?.branchId) {
            where.branchId = req.user.branchId;
        } else if (branchId) {
            where.branchId = branchId as string;
        }

        if (category) {
            where.category = category as string;
        }

        if (status) {
            where.status = status as string;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { sku: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { location: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        let items = await prisma.storeItem.findMany({
            where,
            include: {
                branch: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } }
            },
            orderBy: { name: 'asc' },
        });

        if (lowStock === 'true') {
            items = items.filter(item => item.quantity <= item.reorderLevel);
        }

        res.json({ success: true, data: items });
    }),

    /**
     * GET /api/store/items/:id
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const item = await prisma.storeItem.findUnique({
            where: { id: req.params.id },
            include: {
                branch: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                transactions: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        recordedBy: { select: { name: true, email: true } },
                        receivedBy: { select: { name: true, email: true } },
                        student: { select: { name: true, studentId: true, class: true } }
                    }
                }
            },
        });
        if (!item) throw new AppError(404, 'Item not found');
        res.json({ success: true, data: item });
    }),

    /**
     * POST /api/store/items
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, sku, description, category, quantity, unit, reorderLevel, pricePerUnit, location, status, notes, branchId, image } = req.body;

        if (!name || !category) {
            throw new AppError(400, 'Name and Category are required');
        }

        const itemBranchId = req.user?.branchId || branchId;
        if (!itemBranchId) {
            throw new AppError(400, 'Branch ID is required');
        }

        const initialQty = quantity !== undefined ? parseInt(quantity, 10) : 0;
        const parsedPrice = pricePerUnit !== undefined ? parseInt(pricePerUnit, 10) : 0;

        const item = await prisma.storeItem.create({
            data: {
                name,
                sku,
                description,
                category,
                quantity: initialQty,
                unit: unit || 'pcs',
                reorderLevel: reorderLevel ? parseInt(reorderLevel, 10) : 5,
                pricePerUnit: parsedPrice,
                location,
                status: status || 'AVAILABLE',
                notes,
                branchId: itemBranchId,
                image,
                createdById: req.user!.id,
                isActive: true
            }
        });

        // Log initial stock creation in movement history if initialQty > 0
        if (initialQty > 0) {
            await prisma.stockTransaction.create({
                data: {
                    itemId: item.id,
                    type: 'INWARD',
                    quantity: initialQty,
                    remarks: 'Initial inventory asset creation',
                    recordedById: req.user!.id,
                    branchId: itemBranchId,
                    status: 'COMPLETED'
                }
            });
        }

        await createAuditLog(
            req.user!.id,
            AuditAction.ITEM_CREATED,
            'StoreItem',
            item.id,
            { name, sku, category, quantity: initialQty },
            req.ip
        );

        res.status(201).json({ success: true, data: item });
    }),

    /**
     * PUT /api/store/items/:id
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { name, sku, description, category, quantity, unit, reorderLevel, pricePerUnit, location, status, notes, image } = req.body;

        const item = await prisma.storeItem.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(sku !== undefined && { sku }),
                ...(description !== undefined && { description }),
                ...(category !== undefined && { category }),
                ...(quantity !== undefined && { quantity: parseInt(quantity, 10) }),
                ...(unit !== undefined && { unit }),
                ...(reorderLevel !== undefined && { reorderLevel: parseInt(reorderLevel, 10) }),
                ...(pricePerUnit !== undefined && { pricePerUnit: parseInt(pricePerUnit, 10) }),
                ...(location !== undefined && { location }),
                ...(status !== undefined && { status }),
                ...(notes !== undefined && { notes }),
                ...(image !== undefined && { image }),
            }
        });

        res.json({ success: true, data: item });
    }),

    /**
     * DELETE /api/store/items/:id -> Soft delete / Archive item
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        const item = await prisma.storeItem.findUnique({
            where: { id: req.params.id }
        });

        if (!item) throw new AppError(404, 'Item not found');

        // Soft delete for audit integrity: mark isActive=false & status=DECOMMISSIONED
        await prisma.storeItem.update({
            where: { id: req.params.id },
            data: {
                isActive: false,
                status: 'DECOMMISSIONED'
            }
        });

        await createAuditLog(
            req.user!.id,
            AuditAction.ITEM_DELETED,
            'StoreItem',
            item.id,
            { name: item.name, action: 'SOFT_DELETE_DECOMMISSIONED' },
            req.ip
        );

        res.json({ success: true, message: 'Item archived and decommissioned successfully for audit compliance' });
    })
};
