import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction } from '../types/enums';

export const inquiriesController = {
    /**
     * GET /inquiries
     * List all student inquiries
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const inquiries = await prisma.studentInquiry.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: inquiries });
    }),

    /**
     * POST /inquiries
     * Submit a new student inquiry
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, class: cls, email, phone, parentName } = req.body;
        if (!name || !cls || !phone) {
            throw new AppError(400, 'Name, class/trade, and phone are required fields');
        }

        const inquiry = await prisma.studentInquiry.create({
            data: {
                name,
                class: cls,
                email: email || null,
                phone,
                parentName: parentName || null,
                status: 'PENDING'
            }
        });

        // Audit log (using system automated user if req.user is undefined, or normal user)
        const actorId = req.user?.id || 'system-automated-action';
        await createAuditLog(actorId, AuditAction.INQUIRY_CREATED, 'StudentInquiry', inquiry.id, { name, class: cls, phone }, req.ip);

        res.status(201).json({ success: true, data: inquiry });
    }),

    /**
     * PUT /inquiries/:id/status
     * Accept or update inquiry status
     */
    updateStatus: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['PENDING', 'ACCEPTED'].includes(status)) {
            throw new AppError(400, 'Invalid status update value');
        }

        const inquiry = await prisma.studentInquiry.findUnique({ where: { id } });
        if (!inquiry) throw new AppError(404, 'Inquiry record not found');

        const updated = await prisma.studentInquiry.update({
            where: { id },
            data: { status }
        });

        await createAuditLog(req.user!.id, AuditAction.INQUIRY_UPDATED, 'StudentInquiry', id, { status }, req.ip);
        res.json({ success: true, data: updated });
    }),

    /**
     * DELETE /inquiries/:id
     * Reject and completely delete inquiry record
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const inquiry = await prisma.studentInquiry.findUnique({ where: { id } });
        if (!inquiry) throw new AppError(404, 'Inquiry record not found');

        await prisma.studentInquiry.delete({ where: { id } });

        await createAuditLog(req.user!.id, AuditAction.INQUIRY_DELETED, 'StudentInquiry', id, { name: inquiry.name }, req.ip);
        res.json({ success: true, message: 'Inquiry record rejected and removed successfully' });
    })
};
