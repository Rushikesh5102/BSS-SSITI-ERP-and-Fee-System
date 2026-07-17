import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';
import { config } from '../config';

import { AuditAction, PaymentStatus } from '../types/enums';

import { generateReceiptPdf } from '../services/pdf.service';
import { notificationService } from '../services/notification.service';
import { generateReceiptNumber } from '../utils/uuid';
import { razorpayService } from '../services/razorpay.service';
import { stripeService } from '../services/stripe.service';

// Directory to store generated receipts
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) fs.mkdirSync(RECEIPTS_DIR, { recursive: true });

export const paymentsController = {
    /**
     * POST /payments
     * Record an offline or trigger online payment
     */
    recordPayment: asyncHandler(async (req: Request, res: Response) => {
        const { studentFeeId, amount, mode, transactionRef, chequeDate, bankName, remarks } = req.body;

        // Validate student fee exists
        const studentFee = await prisma.studentFee.findUnique({
            where: { id: studentFeeId },
            include: {
                student: { include: { parent: true } },
                feeStructure: { select: { name: true } },
            },
        });
        if (!studentFee) throw new AppError(404, 'Student fee record not found');

        // Ensure payment does not exceed outstanding balance
        const outstanding = studentFee.totalAmount - studentFee.paidAmount;
        if (amount > outstanding) {
            throw new AppError(400, `Payment amount (${amount}) exceeds outstanding balance (${outstanding})`);
        }

        // Record payment
        const payment = await prisma.payment.create({
            data: {
                studentFeeId,
                amount,
                mode,
                status: PaymentStatus.VERIFIED, // Offline payments are auto-verified
                transactionRef,
                chequeDate: chequeDate ? new Date(chequeDate) : null,
                bankName,
                remarks,
                recordedById: req.user!.id,
                approvedById: req.user!.id,
                approvedAt: new Date(),
            },
        });

        // Update paid amount
        await prisma.studentFee.update({
            where: { id: studentFeeId },
            data: { paidAmount: { increment: amount } },
        });

        // Generate receipt
        const receiptNumber = generateReceiptNumber();
        const pdfBuffer = await generateReceiptPdf({
            receiptNumber,
            studentName: studentFee.student.name,
            studentId: studentFee.student.studentId,
            className: studentFee.student.class,
            parentName: studentFee.student.parent?.name,
            parentPhone: studentFee.student.parent?.phone,
            paymentDate: new Date(),
            amount,
            paymentMode: mode,
            transactionRef,
            feesFor: studentFee.feeStructure.name,
            bankName,
            remarks,
        });

        // Save PDF to disk
        const pdfFileName = `${receiptNumber}.pdf`;
        const pdfPath = path.join(RECEIPTS_DIR, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);

        const receipt = await prisma.receipt.create({
            data: {
                receiptNumber,
                paymentId: payment.id,
                pdfUrl: `/api/receipts/download/${receiptNumber}`,
                generatedById: req.user!.id,
            },
        });

        // Audit log
        await createAuditLog(req.user!.id, AuditAction.PAYMENT_RECORDED, 'Payment', payment.id, {
            amount, mode, studentFeeId, receiptNumber,
        }, req.ip);

        await createAuditLog(req.user!.id, AuditAction.RECEIPT_GENERATED, 'Receipt', receipt.id, { receiptNumber }, req.ip);

        // Send notifications (non-blocking)
        notificationService.sendPaymentConfirmation(
            studentFee.student.parent?.phone || null,
            studentFee.student.parent?.email || null,
            studentFee.student.name,
            amount,
            receiptNumber,
            mode,
            req.user!.id
        ).catch(() => { }); // fire-and-forget

        res.status(201).json({
            success: true,
            data: { payment, receipt, pdfUrl: receipt.pdfUrl },
        });
    }),

    /**
     * GET /payments - List payments (with filters)
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20, studentId, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const payments = await prisma.payment.findMany({
            where: {
                ...(studentId ? { studentFee: { studentId: String(studentId) } } : {}),
                ...(status ? { status: status as PaymentStatus } : {}),
            },
            include: {
                studentFee: {
                    include: { student: { select: { name: true, studentId: true, class: true } } },
                },
                receipt: { select: { receiptNumber: true, pdfUrl: true } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
        });

        res.json({ success: true, data: payments });
    }),

    /**
     * POST /payments/razorpay/order
     * Create a Razorpay order for online payment
     */
    createRazorpayOrder: asyncHandler(async (req: Request, res: Response) => {
        const { studentFeeId, amount } = req.body;

        // If keys are dummy, return a mock order object for frontend sandbox testing
        if (!config.razorpay.keyId || config.razorpay.keyId.includes('XXXX') || config.razorpay.keyId === 'your_key_id') {
            const mockOrder = {
                id: 'order_mock_' + Math.random().toString(36).substring(2, 15),
                amount: amount,
                currency: 'INR',
                receipt: studentFeeId,
                notes: { studentFeeId },
                isMock: true
            };
            return res.json({ success: true, data: mockOrder });
        }

        const order = await razorpayService.createOrder(amount, studentFeeId, { studentFeeId });
        res.json({ success: true, data: order });
    }),

    /**
     * POST /payments/razorpay/verify
     * Verify Razorpay payment and record in DB
     */
    verifyRazorpayPayment: asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, studentFeeId, amount } = req.body;

        // If it is a mock order verification
        if (razorpayOrderId && razorpayOrderId.startsWith('order_mock_')) {
            req.body = {
                studentFeeId,
                amount,
                mode: 'ONLINE',
                transactionRef: razorpayPaymentId || 'txn_mock_' + Math.floor(Math.random() * 9999999),
                status: PaymentStatus.VERIFIED,
            };
            return paymentsController.recordPayment(req, res, next);
        }

        const isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) throw new AppError(400, 'Invalid payment signature');

        // Record payment (reuse recordPayment logic)
        req.body = {
            studentFeeId,
            amount,
            mode: 'RAZORPAY',
            transactionRef: razorpayPaymentId,
            status: PaymentStatus.VERIFIED,
        };

        // Delegate to recordPayment
        return paymentsController.recordPayment(req, res, next);
    }),

    /**
     * POST /payments/stripe/intent
     * Create Stripe Payment Intent for client-side payment
     */
    createStripeIntent: asyncHandler(async (req: Request, res: Response) => {
        const { amount, studentFeeId } = req.body;
        const result = await stripeService.createPaymentIntent(amount, { studentFeeId });
        res.json({ success: true, data: result });
    }),
};
