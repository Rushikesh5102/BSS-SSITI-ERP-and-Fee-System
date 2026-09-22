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
            role: role ? (role as Role) : { not: 'STUDENT' as Role },
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
            STORE_MANAGER: 0,
            LIBRARIAN: 0,
            TEACHER: 0,
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

        if (role === 'STUDENT') {
            throw new AppError(400, 'Student nodes cannot be provisioned as user access accounts');
        }

        if (!password || password.length < 8) {
            throw new AppError(400, 'Password must be at least 8 characters long');
        }

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

        if (target.role === 'DEVELOPER' && req.user?.role !== 'DEVELOPER') {
            throw new AppError(403, 'Administrators cannot modify Developer accounts.');
        }

        if (target.id === req.user?.id && isActive === false) {
            throw new AppError(400, 'You cannot deactivate your own account.');
        }

        // Capture before state for diff
        const beforeState = { name: target.name, email: target.email, role: target.role, isActive: target.isActive, branchId: target.branchId };

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

        const afterState = { name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive, branchId: updated.branchId };
        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'User', updated.id, { before: beforeState, after: afterState }, req.ip);
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

        const target = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!target) throw new AppError(404, 'User not found');
        if (target.role === 'DEVELOPER' && req.user?.role !== 'DEVELOPER') {
            throw new AppError(403, 'Administrators cannot reset Developer passwords.');
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
        if (target.id === req.user?.id) throw new AppError(400, 'Cannot revoke access for your own account');

        if (target.role === 'DEVELOPER' && req.user?.role !== 'DEVELOPER') {
            throw new AppError(403, 'Administrators cannot revoke Developer accounts.');
        }

        const snapshot = { name: target.name, email: target.email, role: target.role, isActive: target.isActive };

        try {
            // Attempt to hard delete user first
            await prisma.user.delete({ where: { id: req.params.id } });
            await createAuditLog(req.user!.id, AuditAction.USER_DELETED, 'User', req.params.id, { ...snapshot, deletionType: 'HARD_DELETE' }, req.ip);
            res.json({ success: true, message: 'User permanently deleted from system database.' });
        } catch (err) {
            // Fall back to deactivating (lockout) if referenced in relations (foreign keys)
            await prisma.user.update({
                where: { id: req.params.id },
                data: { isActive: false }
            });
            await createAuditLog(req.user!.id, AuditAction.USER_DELETED, 'User', req.params.id, { ...snapshot, deletionType: 'SOFT_DELETE_DEACTIVATED' }, req.ip);
            res.json({ success: true, message: 'User access revoked (account deactivated to preserve historical transaction history).' });
        }
    }),

    /**
     * POST /users/sync-students - Synchronize all students as system login credentials
     */
    syncStudents: asyncHandler(async (_req: Request, res: Response) => {
        // Permanently purge any student login accounts
        const deleted = await prisma.user.deleteMany({
            where: { role: 'STUDENT' }
        });

        res.json({
            success: true,
            data: {
                totalStudents: 0,
                createdCount: 0,
                updatedCount: 0,
                purgedCount: deleted.count
            },
            message: 'Student nodes removed. Software access is configured for administrative and staff roles.'
        });
    }),
};
