import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { generateReceiptPdf } from '../services/pdf.service';
import { getNextReceiptNumber } from '../utils/uuid';

// Storage path where generated PDF receipts are cached on disk
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

export const receiptsController = {
    // GET /receipts - Lists receipts with pagination, multi-field search, and auto-repair
    // for payments that might have been recorded without an immediate receipt row.
    list: asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 100, studentId, search = '' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // 1. Resolve a guaranteed valid fallback user ID for receipt generation
        let fallbackUserId = req.user?.id;
        if (!fallbackUserId) {
            const anyUser = await prisma.user.findFirst({ select: { id: true } });
            fallbackUserId = anyUser?.id;
        }

        // 2. Auto-heal: Ensure all payments have a corresponding Receipt row
        try {
            const paymentsWithoutReceipt = await prisma.payment.findMany({
                where: { receipt: null },
                select: { id: true, createdAt: true, recordedById: true },
            });

            for (const p of paymentsWithoutReceipt) {
                let validGeneratorId = fallbackUserId;
                if (p.recordedById) {
                    const u = await prisma.user.findUnique({ where: { id: p.recordedById }, select: { id: true } });
                    if (u) validGeneratorId = u.id;
                }
                if (!validGeneratorId) continue;

                const receiptNumber = await getNextReceiptNumber();
                await prisma.receipt.create({
                    data: {
                        receiptNumber,
                        paymentId: p.id,
                        pdfUrl: `/api/receipts/download/${receiptNumber}`,
                        generatedById: validGeneratorId,
                        createdAt: p.createdAt,
                    },
                }).catch(() => {});
            }
        } catch { }

        // 3. Search & Filter
        const where: any = {};
        if (studentId) {
            where.payment = { studentFee: { studentId: String(studentId) } };
        }
        if (search && String(search).trim() !== '') {
            const term = String(search).trim();
            where.OR = [
                { receiptNumber: { contains: term, mode: 'insensitive' } },
                { payment: { studentFee: { student: { name: { contains: term, mode: 'insensitive' } } } } },
                { payment: { studentFee: { student: { studentId: { contains: term, mode: 'insensitive' } } } } },
                { payment: { remarks: { contains: term, mode: 'insensitive' } } },
                { payment: { mode: { contains: term, mode: 'insensitive' } } },
                { payment: { transactionRef: { contains: term, mode: 'insensitive' } } },
            ];
        }

        let receipts = await prisma.receipt.findMany({
            where,
            include: {
                payment: {
                    include: {
                        studentFee: {
                            include: { 
                                student: { select: { name: true, studentId: true, class: true } },
                                feeStructure: { select: { name: true } }
                            },
                        },
                    },
                },
                generatedBy: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
        });

        // 4. Fallback if receipts table returned empty but payments exist
        if (receipts.length === 0 && !search && !studentId) {
            const fallbackPayments = await prisma.payment.findMany({
                include: {
                    studentFee: {
                        include: { 
                            student: { select: { name: true, studentId: true, class: true } },
                            feeStructure: { select: { name: true } }
                        },
                    },
                    receipt: true,
                    recordedBy: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
            });

            if (fallbackPayments.length > 0) {
                const mapped = fallbackPayments.map((p, idx) => ({
                    id: p.receipt?.id || p.id,
                    receiptNumber: p.receipt?.receiptNumber || `RCP-${String(idx + 1).padStart(4, '0')}`,
                    paymentId: p.id,
                    pdfUrl: p.receipt?.pdfUrl || `/api/receipts/download/${p.receipt?.receiptNumber || p.id}`,
                    createdAt: p.createdAt,
                    payment: p,
                    generatedBy: p.recordedBy || { name: 'Accounts Clerk' },
                }));
                return res.json({ success: true, data: mapped });
            }
        }

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
     * GET /receipts/download/:receiptNumber - Stream PDF receipt (always renders latest design and totals)
     */
    downloadPdf: asyncHandler(async (req: Request, res: Response) => {
        const { receiptNumber } = req.params;
        const pdfPath = path.join(RECEIPTS_DIR, `${receiptNumber}.pdf`);

        const receipt = await prisma.receipt.findUnique({
            where: { receiptNumber },
            include: {
                payment: {
                    include: {
                        studentFee: {
                            include: {
                                student: { include: { parent: true } },
                                feeStructure: true,
                            },
                        },
                    },
                },
                generatedBy: { select: { name: true } },
            },
        });

        if (!receipt) {
            throw new AppError(404, 'Receipt not found');
        }

        const studentFee = receipt.payment.studentFee;
        const totalFee = studentFee ? studentFee.totalAmount : receipt.payment.amount;
        const totalPaid = studentFee ? studentFee.paidAmount : receipt.payment.amount;
        const balanceDue = Math.max(0, totalFee - totalPaid);
        const isSupp = receipt.payment.remarks?.toLowerCase().includes('supplementary') || studentFee?.feeStructure?.name?.toLowerCase().includes('supplementary');

        const pdfBuffer = await generateReceiptPdf({
            receiptNumber: receipt.receiptNumber,
            studentName: studentFee?.student?.name || 'Student',
            studentId: studentFee?.student?.studentId || 'N/A',
            className: studentFee?.student?.class || 'ITI Trade',
            academicSession: studentFee?.academicYear || '2026-2028',
            parentName: studentFee?.student?.parent?.name,
            parentPhone: studentFee?.student?.parent?.phone,
            paymentDate: receipt.createdAt,
            amount: receipt.payment.amount,
            totalFee: totalFee,
            totalPaid: totalPaid,
            balanceDue: isSupp ? 0 : balanceDue,
            paymentMode: receipt.payment.mode,
            transactionRef: receipt.payment.transactionRef || undefined,
            feesFor: isSupp ? 'Supplementary / Back Paper Exam Fee' : (studentFee?.feeStructure?.name || 'Academic Fee'),
            bankName: receipt.payment.bankName || undefined,
            remarks: receipt.payment.remarks || undefined,
            clerkName: receipt.generatedBy?.name || 'Fee Counter Cashier',
            isSupplementary: Boolean(isSupp),
        });

        try {
            fs.writeFileSync(pdfPath, pdfBuffer);
        } catch { /* Ignore file write error on read-only environments */ }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${receiptNumber}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(pdfBuffer);
    }),

    /**
     * DELETE /receipts/:id - Delete a receipt, its linked payment, and reconcile student fee balance
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // Support lookup by either receipt ID or receiptNumber
        const receipt = await prisma.receipt.findFirst({
            where: {
                OR: [
                    { id },
                    { receiptNumber: id }
                ]
            },
            include: {
                payment: {
                    include: {
                        studentFee: {
                            include: { student: true }
                        }
                    }
                }
            }
        });

        if (!receipt) {
            throw new AppError(404, 'Receipt not found');
        }

        const receiptNumber = receipt.receiptNumber;
        const paymentId = receipt.paymentId;
        const studentFeeId = receipt.payment?.studentFeeId;
        const studentName = receipt.payment?.studentFee?.student?.name;

        // 1. Delete physical PDF file if it exists
        const pdfPath = path.join(RECEIPTS_DIR, `${receiptNumber}.pdf`);
        if (fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath);
            } catch (fsErr) {
                console.warn(`Could not delete PDF file for receipt ${receiptNumber}:`, fsErr);
            }
        }

        // 2. Delete receipt from database
        await prisma.receipt.delete({
            where: { id: receipt.id }
        });

        // 3. Delete associated payment
        if (paymentId) {
            await prisma.payment.delete({
                where: { id: paymentId }
            });
        }

        // 4. Reconcile studentFee paidAmount with remaining verified payments
        let newPaidAmount = 0;
        if (studentFeeId) {
            const agg = await prisma.payment.aggregate({
                where: {
                    studentFeeId,
                    status: 'VERIFIED'
                },
                _sum: { amount: true }
            });
            newPaidAmount = agg._sum.amount || 0;

            await prisma.studentFee.update({
                where: { id: studentFeeId },
                data: { paidAmount: newPaidAmount }
            });
        }

        res.json({
            success: true,
            message: `Receipt #${receiptNumber} deleted successfully. Student balance reconciled.`,
            data: {
                receiptNumber,
                studentName,
                reconciledPaidAmount: newPaidAmount
            }
        });
    }),
};

