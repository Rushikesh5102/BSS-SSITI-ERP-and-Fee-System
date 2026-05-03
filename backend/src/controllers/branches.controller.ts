import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';

import { AuditAction } from '../types/enums';


export const branchesController = {
    /**
     * GET /branches - List all branches
     */
    list: asyncHandler(async (_req: Request, res: Response) => {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { users: true, students: true, feeStructures: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: branches });
    }),

    /**
     * GET /branches/:id - Get branch detail
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const branch = await prisma.branch.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { users: true, students: true } },
            },
        });
        if (!branch) throw new AppError(404, 'Branch not found');
        res.json({ success: true, data: branch });
    }),

    /**
     * POST /branches - Create a new branch (SuperAdmin only)
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, address, phone, email } = req.body;
        if (!name) throw new AppError(400, 'Branch name is required');

        const branch = await prisma.branch.create({
            data: { name, address, phone, email },
        });

        await createAuditLog(req.user!.id, AuditAction.BRANCH_CREATED, 'Branch', branch.id, { name }, req.ip);
        res.status(201).json({ success: true, data: branch });
    }),

    /**
     * PUT /branches/:id - Update branch details
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { name, address, phone, email, isActive } = req.body;

        const branch = await prisma.branch.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({ success: true, data: branch });
    }),

    /**
     * DELETE /branches/:id - Soft-delete branch (set isActive = false)
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        // Check no active students/users depend on this branch
        const branch = await prisma.branch.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { students: true, users: true } } },
        });
        if (!branch) throw new AppError(404, 'Branch not found');

        await prisma.branch.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ success: true, message: 'Branch deactivated' });
    }),
};
