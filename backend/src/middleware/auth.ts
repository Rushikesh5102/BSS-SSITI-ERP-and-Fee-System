import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { Role } from '../types/enums';

import { config } from '../config';
import { prisma } from '../utils/prisma';

// Extend Express Request to include authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: Role;
                branchId: string | null;
            };
        }
    }
}

interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
    branchId: string | null;
}

/**
 * Middleware: Verify JWT access token and attach user to request
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token as string;
        }

        if (!token) {
            res.status(401).json({ success: false, message: 'Access token required' });
            return;
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        // Verify user still exists and is active in DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, branchId: true, isActive: true },
        });

        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'Invalid or inactive user' });
            return;
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: (user.role === 'SUPERADMIN' ? Role.ADMIN : user.role) as Role,
            branchId: user.branchId,
        };

        // Check for Global Lockdown
        if (req.user.role !== Role.DEVELOPER) {
            const lockdown = await prisma.systemConfig.findUnique({ where: { key: 'LOCKDOWN_MODE' } });
            if (lockdown && lockdown.value === 'true') {
                res.status(503).json({ 
                    success: false, 
                    message: 'System is currently under emergency maintenance/lockdown. Please contact the administrator.' 
                });
                return;
            }
        }

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired' });
            return;
        }
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

/**
 * Higher-order middleware: Restrict access to specified roles
 * Usage: authorize(Role.ADMIN, Role.ACCOUNTANT)
 */
export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role) && req.user.role !== Role.DEVELOPER) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`,
            });
            return;
        }
        next();
    };
};
