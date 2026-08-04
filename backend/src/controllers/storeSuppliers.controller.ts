import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction } from '../types/enums';

export const storeSuppliersController = {
    /**
     * GET /api/store/suppliers
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const suppliers = await prisma.storeSupplier.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: suppliers });
    }),

    /**
     * GET /api/store/suppliers/:id
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const supplier = await prisma.storeSupplier.findUnique({
            where: { id: req.params.id },
            include: {
                transactions: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        item: { select: { name: true } }
                    }
                }
            }
        });
        if (!supplier) throw new AppError(404, 'Supplier not found');
        res.json({ success: true, data: supplier });
    }),

    /**
     * POST /api/store/suppliers
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, contactPerson, phone, email, address, gstin } = req.body;

        if (!name || !phone) {
            throw new AppError(400, 'Name and phone number are required');
        }

        const supplier = await prisma.storeSupplier.create({
            data: { name, contactPerson, phone, email, address, gstin }
        });

        await createAuditLog(
            req.user!.id,
            AuditAction.SUPPLIER_ADDED,
            'StoreSupplier',
            supplier.id,
            { name },
            req.ip
        );

        res.status(201).json({ success: true, data: supplier });
    }),

    /**
     * PUT /api/store/suppliers/:id
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { name, contactPerson, phone, email, address, gstin } = req.body;

        const supplier = await prisma.storeSupplier.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(contactPerson !== undefined && { contactPerson }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(address !== undefined && { address }),
                ...(gstin !== undefined && { gstin }),
            }
        });

        res.json({ success: true, data: supplier });
    }),

    /**
     * DELETE /api/store/suppliers/:id
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        const supplier = await prisma.storeSupplier.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { transactions: true } } }
        });

        if (!supplier) throw new AppError(404, 'Supplier not found');

        if (supplier._count.transactions > 0) {
            throw new AppError(400, 'Cannot delete supplier with transaction history.');
        }

        await prisma.storeSupplier.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Supplier deleted successfully' });
    })
};
