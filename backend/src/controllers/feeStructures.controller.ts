import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';

import { AuditAction } from '../types/enums';


export const feeStructuresController = {
    /**
     * GET /fee-structures - List all fee structures for the branch
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const structures = await prisma.feeStructure.findMany({
            where: {
                isActive: true,
                ...(req.user?.branchId ? { branchId: req.user.branchId } : {}),
            },
            include: {
                items: { include: { feeCategory: true } },
                _count: { select: { studentFees: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: structures });
    }),

    /**
     * GET /fee-categories - List fee categories
     */
    listCategories: asyncHandler(async (_req: Request, res: Response) => {
        const categories = await prisma.feeCategory.findMany({ orderBy: { name: 'asc' } });
        res.json({ success: true, data: categories });
    }),

    /**
     * POST /fee-structures - Create fee structure with items
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, academicYear, class: cls, section, items } = req.body;

        // Calculate total from items
        const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

        const structure = await prisma.feeStructure.create({
            data: {
                name,
                academicYear,
                class: cls,
                section,
                totalAmount,
                branchId: req.user!.branchId!,
                items: {
                    create: items.map((item: { feeCategoryId: string; amount: number; dueDate?: string }) => ({
                        feeCategoryId: item.feeCategoryId,
                        amount: item.amount,
                        dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    })),
                },
            },
            include: { items: { include: { feeCategory: true } } },
        });

        await createAuditLog(req.user!.id, AuditAction.FEE_STRUCTURE_CREATED, 'FeeStructure', structure.id, { name, totalAmount }, req.ip);
        res.status(201).json({ success: true, data: structure });
    }),

    /**
     * PUT /fee-structures/:id - Update fee structure
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { items, ...updateData } = req.body;
        if (items) {
            updateData.totalAmount = items.reduce((sum: number, i: { amount: number }) => sum + i.amount, 0);
        }

        const structure = await prisma.feeStructure.update({
            where: { id: req.params.id },
            data: {
                ...updateData,
                ...(items
                    ? {
                        items: {
                            deleteMany: {},
                            create: items.map((i: { feeCategoryId: string; amount: number }) => ({
                                feeCategoryId: i.feeCategoryId,
                                amount: i.amount,
                            })),
                        },
                    }
                    : {}),
            },
            include: { items: { include: { feeCategory: true } } },
        });

        await createAuditLog(req.user!.id, AuditAction.FEE_STRUCTURE_MODIFIED, 'FeeStructure', structure.id, updateData, req.ip);
        res.json({ success: true, data: structure });
    }),

    /**
     * POST /fees/assign - Assign fee structure to a student
     */
    assignToStudent: asyncHandler(async (req: Request, res: Response) => {
        const { studentId, feeStructureId, dueDate, academicYear } = req.body;

        const feeStructure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
        if (!feeStructure) throw new AppError(404, 'Fee structure not found');

        const studentFee = await prisma.studentFee.create({
            data: {
                studentId,
                feeStructureId,
                totalAmount: feeStructure.totalAmount,
                paidAmount: 0,
                academicYear: academicYear || feeStructure.academicYear,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
            include: {
                student: { select: { name: true, studentId: true } },
                feeStructure: { select: { name: true, totalAmount: true } },
            },
        });

        await createAuditLog(req.user!.id, AuditAction.FEE_ASSIGNED, 'StudentFee', studentFee.id, { studentId, feeStructureId }, req.ip);
        res.status(201).json({ success: true, data: studentFee });
    }),
};
