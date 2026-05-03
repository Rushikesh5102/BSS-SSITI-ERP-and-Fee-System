import { Request, Response, NextFunction } from 'express';

import { AuditAction } from '../types/enums';

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * Records a financial/system action in the audit_logs table.
 * Should be called from controllers after successful operations.
 */
export const createAuditLog = async (
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string
): Promise<void> => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata: metadata ?? {},
                ipAddress,
            },
        });
    } catch (error) {
        // Audit logging failures should not break the main transaction
        logger.error('Failed to create audit log', { error, userId, action, entityId });
    }
};

/**
 * Express middleware factory that automatically logs requests
 * for specific routes (used for read audit trails)
 */
export const auditMiddleware = (action: AuditAction, entityType: string) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (req.user) {
            const entityId = req.params.id || req.body?.id || 'unknown';
            await createAuditLog(
                req.user.id,
                action,
                entityType,
                entityId,
                { method: req.method, url: req.url },
                req.ip
            );
        }
        next();
    };
};
