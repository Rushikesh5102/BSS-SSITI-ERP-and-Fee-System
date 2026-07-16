import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { razorpayService } from '../services/razorpay.service';
import { stripeService } from '../services/stripe.service';
import { PaymentStatus, AuditAction } from '../types/enums';
import { generateReceiptPdf } from '../services/pdf.service';
import { generateReceiptNumber } from '../utils/uuid';
import { notificationService } from '../services/notification.service';
import { config } from '../config';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Reusable helper function to process verification and database updates on webhook success.
 * Ensures consistent auditing, receipt creation, and notification side effects.
 */
const processWebhookPayment = async (
    studentFeeId: string,
    amount: number,
    mode: 'RAZORPAY' | 'STRIPE',
    transactionRef: string,
    ipAddress?: string
) => {
    // 1. Validate student fee exists
    const studentFee = await prisma.studentFee.findUnique({
        where: { id: studentFeeId },
        include: {
            student: { include: { parent: true } },
            feeStructure: { select: { name: true } },
        },
    });
    if (!studentFee) {
        throw new Error(`Student fee record ${studentFeeId} not found`);
    }

    // 2. Check for duplicate processing
    const existingPayment = await prisma.payment.findFirst({
        where: { transactionRef },
    });
    if (existingPayment) {
        logger.info(`Duplicate webhook payment ignored: ${transactionRef}`);
        return { success: true, payment: existingPayment, isDuplicate: true };
    }

    // 3. Create payment record (System automated user)
    const payment = await prisma.payment.create({
        data: {
            studentFeeId,
            amount,
            mode,
            status: PaymentStatus.VERIFIED,
            transactionRef,
            recordedById: SYSTEM_USER_ID,
            approvedById: SYSTEM_USER_ID,
            approvedAt: new Date(),
            remarks: `Processed via ${mode} Webhook Secure Capture`,
        },
    });

    // 4. Update paid amount
    await prisma.studentFee.update({
        where: { id: studentFeeId },
        data: { paidAmount: { increment: amount } },
    });

    // 5. Generate receipt number and PDF
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
    });

    // 6. Save PDF to disk
    const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(RECEIPTS_DIR)) {
        fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    }
    const pdfFileName = `${receiptNumber}.pdf`;
    const pdfPath = path.join(RECEIPTS_DIR, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // 7. Create database receipt record
    const receipt = await prisma.receipt.create({
        data: {
            receiptNumber,
            paymentId: payment.id,
            pdfUrl: `/receipts/download/${receiptNumber}`,
            generatedById: SYSTEM_USER_ID,
        },
    });

    // 8. Create Audit Logs
    await prisma.auditLog.create({
        data: {
            userId: SYSTEM_USER_ID,
            action: AuditAction.PAYMENT_RECORDED,
            entityType: 'Payment',
            entityId: payment.id,
            metadata: JSON.stringify({ amount, mode, studentFeeId, receiptNumber }),
            ipAddress,
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: SYSTEM_USER_ID,
            action: AuditAction.RECEIPT_GENERATED,
            entityType: 'Receipt',
            entityId: receipt.id,
            metadata: JSON.stringify({ receiptNumber }),
            ipAddress,
        },
    });

    // 9. Send notifications (fire-and-forget)
    notificationService.sendPaymentConfirmation(
        studentFee.student.parent?.phone || null,
        studentFee.student.parent?.email || null,
        studentFee.student.name,
        amount,
        receiptNumber,
        mode,
        SYSTEM_USER_ID
    ).catch((err) => {
        logger.error(`Webhook notification trigger failed for ${mode} receipt ${receiptNumber}`, { err });
    });

    return { success: true, payment, receipt, isDuplicate: false };
};

export const webhooksController = {
    razorpayWebhook: async (req: Request, res: Response) => {
        try {
            const signature = req.headers['x-razorpay-signature'] as string;
            const body = req.body; 

            // Secure webhook verification
            const isDummySecret = !config.razorpay.webhookSecret || config.razorpay.webhookSecret === 'your_razorpay_webhook_secret';
            if (config.isDev && isDummySecret) {
                logger.warn('Bypassing Razorpay webhook signature verification in development mode (using dummy secret)');
            } else {
                const rawBody = Buffer.isBuffer(body) ? body.toString() : JSON.stringify(body);
                const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
                if (!isValid) {
                    logger.error('Razorpay webhook signature verification failed');
                    res.status(400).send('Invalid signature');
                    return;
                }
            }

            logger.info('Razorpay webhook received and verified');
            const event = Buffer.isBuffer(body) ? JSON.parse(body.toString()) : body;

            // Handle Payment Captured
            if (event.event === 'payment.captured') {
                const paymentInfo = event.payload.payment.entity;
                const studentFeeId = paymentInfo.notes?.studentFeeId;
                const paymentGatewayId = paymentInfo.id;
                const amount = paymentInfo.amount;

                if (studentFeeId) {
                    await processWebhookPayment(studentFeeId, amount, 'RAZORPAY', paymentGatewayId, req.ip);
                }
            } 
            
            // Handle Payment Failed
            else if (event.event === 'payment.failed') {
                const paymentInfo = event.payload.payment.entity;
                const studentFeeId = paymentInfo.notes?.studentFeeId;
                const paymentGatewayId = paymentInfo.id;
                const errorDesc = paymentInfo.error_description || 'Payment failed';

                logger.warn(`Razorpay payment failed webhook: ${paymentGatewayId} - ${errorDesc}`);

                if (studentFeeId) {
                    const payment = await prisma.payment.create({
                        data: {
                            studentFeeId,
                            amount: paymentInfo.amount,
                            mode: 'RAZORPAY',
                            status: PaymentStatus.FAILED,
                            transactionRef: paymentGatewayId,
                            recordedById: SYSTEM_USER_ID,
                            remarks: `Razorpay payment failed: ${errorDesc}`,
                        }
                    });

                    await prisma.auditLog.create({
                        data: {
                            userId: SYSTEM_USER_ID,
                            action: AuditAction.PAYMENT_FAILED,
                            entityType: 'Payment',
                            entityId: payment.id,
                            metadata: JSON.stringify({ studentFeeId, amount: paymentInfo.amount, errorDesc }),
                            ipAddress: req.ip,
                        }
                    });
                }
            }

            res.status(200).json({ status: 'ok' });
        } catch (error) {
            logger.error('Razorpay webhook processing error', { error });
            res.status(400).send('Webhook Error');
        }
    },

    stripeWebhook: async (req: Request, res: Response) => {
        try {
            const signature = req.headers['stripe-signature'] as string;
            const event = stripeService.constructWebhookEvent(req.body, signature);

            logger.info(`Stripe webhook received and verified: ${event.type}`);

            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object as any;
                const studentFeeId = paymentIntent.metadata?.studentFeeId;
                const paymentGatewayId = paymentIntent.id;
                const amount = paymentIntent.amount;

                if (studentFeeId) {
                    await processWebhookPayment(studentFeeId, amount, 'STRIPE', paymentGatewayId, req.ip);
                }
            }

            res.status(200).json({ received: true });
        } catch (error) {
            logger.error('Stripe webhook processing error', { error });
            res.status(400).send(`Webhook Error: ${(error as Error).message}`);
        }
    }
};
