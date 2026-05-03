import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Custom application error class
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized error handler middleware
 * Must be registered LAST in Express middleware chain
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Custom application errors (operational errors)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Prisma unique constraint violations
    if ((err as any).code === 'P2002') {
        res.status(409).json({
            success: false,
            message: 'A record with this data already exists',
        });
        return;
    }

    // Prisma record not found
    if ((err as any).code === 'P2025') {
        res.status(404).json({
            success: false,
            message: 'Record not found',
        });
        return;
    }

    // Prisma foreign key constraint violation
    if ((err as any).code === 'P2003') {
        res.status(400).json({
            success: false,
            message: 'Cannot delete or update this record because it is referenced by other records.',
        });
        return;
    }

    // Scrub sensitive data from body before logging
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';

    // Unknown / programming errors — log in full, don't expose internals
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: safeBody,
        query: req.query,
        params: req.params,
    });

    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};

/** Wraps async route handlers to forward errors to errorHandler */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
