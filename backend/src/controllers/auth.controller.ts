import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { createAuditLog } from '../middleware/auditLogger';

import { AuditAction } from '../types/enums';


export const authController = {
    /**
     * POST /auth/login
     * Accepts email + password, returns access/refresh tokens + user profile
     */
    login: asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json({ success: true, data: result });
    }),

    /**
     * POST /auth/refresh
     * Exchange refresh token for a new access token
     */
    refresh: asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.json({ success: true, data: result });
    }),

    /**
     * GET /auth/me
     * Return current authenticated user's profile
     */
    me: asyncHandler(async (req: Request, res: Response) => {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true, name: true, email: true, role: true,
                branch: { select: { id: true, name: true } },
                createdAt: true,
            },
        });
        res.json({ success: true, data: user });
    }),

    /**
     * POST /auth/logout
     * Client should discard tokens; server logs the action
     */
    logout: asyncHandler(async (req: Request, res: Response) => {
        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'User', req.user!.id, { action: 'logout' }, req.ip);
        res.json({ success: true, message: 'Logged out successfully' });
    }),
};
