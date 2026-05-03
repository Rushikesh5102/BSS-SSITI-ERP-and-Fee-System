import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

export const receiptsController = {
    /**
     * GET /receipts - List receipts (paginated)
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20, studentId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const receipts = await prisma.receipt.findMany({
            where: studentId
                ? { payment: { studentFee: { studentId: String(studentId) } } }
                : {},
            include: {
                payment: {
                    include: {
                        studentFee: {
                            include: { student: { select: { name: true, studentId: true, class: true } } },
                        },
                    },
                },
                generatedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
        });

        res.json({ success: true, data: receipts });
    }),

    /**
     * GET /receipts/:id - Get receipt by ID
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const receipt = await prisma.receipt.findUnique({
            where: { id: req.params.id },
            include: {
                payment: {
                    include: {
                        studentFee: {
                            include: { student: { include: { parent: true } }, feeStructure: true },
                        },
                    },
                },
                generatedBy: { select: { name: true } },
            },
        });

        if (!receipt) throw new AppError(404, 'Receipt not found');
        res.json({ success: true, data: receipt });
    }),

    /**
     * GET /receipts/download/:receiptNumber - Stream PDF receipt
     */
    downloadPdf: asyncHandler(async (req: Request, res: Response) => {
        const { receiptNumber } = req.params;
        const pdfPath = path.join(RECEIPTS_DIR, `${receiptNumber}.pdf`);

        if (!fs.existsSync(pdfPath)) {
            throw new AppError(404, 'Receipt PDF not found');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${receiptNumber}.pdf"`);
        fs.createReadStream(pdfPath).pipe(res);
    }),
};
