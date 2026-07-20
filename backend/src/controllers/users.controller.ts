import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction, Role } from '../types/enums';
import { authService } from '../services/auth.service';

export const usersController = {
    /**
     * GET /users - List all staff users
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { role, branchId: queryBranch, includeInactive } = req.query;

        const where: any = {
            ...(includeInactive === 'true' ? {} : { isActive: true }),
            ...(req.user?.branchId ? { branchId: req.user.branchId } : {}),
            ...(queryBranch ? { branchId: String(queryBranch) } : {}),
            ...(role ? { role: role as Role } : {}),
        };

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true, role: true, isActive: true,
                branch: { select: { id: true, name: true } },
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: users });
    }),

    /**
     * GET /users/stats - Get user counts grouped by role
     */
    stats: asyncHandler(async (_req: Request, res: Response) => {
        const counts = await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
        });

        const statsMap = counts.reduce((acc: any, c) => {
            acc[c.role] = c._count.id;
            return acc;
        }, {
            ADMIN: 0,
            ACCOUNTANT: 0,
            TEACHER: 0,
            STUDENT: 0,
            DEVELOPER: 0
        });

        res.json({ success: true, data: statsMap });
    }),

    /**
     * GET /users/:id - Get staff member detail
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, email: true, role: true, isActive: true,
                branch: { select: { id: true, name: true } },
                createdAt: true,
            },
        });
        if (!user) throw new AppError(404, 'User not found');
        res.json({ success: true, data: user });
    }),

    /**
     * POST /users - Create a new staff member
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, email, password, role, branchId } = req.body;

        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) throw new AppError(409, 'A user with this email already exists');

        const passwordHash = await authService.hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase().trim(),
                passwordHash,
                role,
                branchId: branchId || req.user?.branchId || null,
            },
            select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true },
        });

        await createAuditLog(req.user!.id, AuditAction.USER_CREATED, 'User', user.id, { name, email, role }, req.ip);
        res.status(201).json({ success: true, data: user });
    }),

    /**
     * PUT /users/:id - Update user details or change role
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { name, email, role, branchId, isActive } = req.body;

        const target = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!target) throw new AppError(404, 'User not found');

        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(email && { email: email.toLowerCase().trim() }),
                ...(role && { role }),
                ...(branchId !== undefined && { branchId }),
                ...(isActive !== undefined && { isActive }),
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, branchId: true },
        });

        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'User', updated.id, req.body, req.ip);
        res.json({ success: true, data: updated });
    }),

    /**
     * PUT /users/:id/reset-password - Reset staff member password
     */
    resetPassword: asyncHandler(async (req: Request, res: Response) => {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            throw new AppError(400, 'Password must be at least 8 characters');
        }

        const passwordHash = await authService.hashPassword(newPassword);
        await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });

        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'User', req.params.id, { action: 'password_reset' }, req.ip);
        res.json({ success: true, message: 'Password reset successfully' });
    }),

    /**
     * DELETE /users/:id - Soft-delete (deactivate) user
     */
    deactivate: asyncHandler(async (req: Request, res: Response) => {
        const target = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!target) throw new AppError(404, 'User not found');
        if (target.id === req.user?.id) throw new AppError(400, 'Cannot deactivate your own account');

        await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ success: true, message: 'User deactivated successfully' });
    }),
};
