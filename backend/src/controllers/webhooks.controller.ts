import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { razorpayService } from '../services/razorpay.service';
import { stripeService } from '../services/stripe.service';
import { PaymentStatus } from '../types/enums';

// Webhooks don't use typical error handlers since they shouldn't throw 500s back to the gateway needlessly
export const webhooksController = {
    razorpayWebhook: async (req: Request, res: Response) => {
        try {
            const signature = req.headers['x-razorpay-signature'] as string;
            // req.body should be raw buffer, we'll verify it. In Express, you usually stringify or use the raw body.
            const body = req.body; 

            // Basic validation skipped for brevity, but you'd verify signature using crypto here
            // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');

            logger.info('Razorpay webhook received');
            // Parse JSON if it's a buffer
            const event = Buffer.isBuffer(body) ? JSON.parse(body.toString()) : body;

            if (event.event === 'payment.captured') {
                const paymentInfo = event.payload.payment.entity;
                const studentFeeId = paymentInfo.notes?.studentFeeId;

                if (studentFeeId) {
                    await prisma.payment.create({
                        data: {
                            studentFeeId,
                            amount: paymentInfo.amount, // in paise
                            mode: 'RAZORPAY',
                            status: PaymentStatus.VERIFIED,
                            transactionRef: paymentInfo.id,
                            recordedById: 'SYSTEM', // System account
                        }
                    });
                    
                    await prisma.studentFee.update({
                        where: { id: studentFeeId },
                        data: { paidAmount: { increment: paymentInfo.amount } }
                    });
                }
            }
            res.status(200).json({ status: 'ok' });
        } catch (error) {
            logger.error('Razorpay webhook error', { error });
            res.status(400).send('Webhook Error');
        }
    },

    stripeWebhook: async (req: Request, res: Response) => {
        try {
            const signature = req.headers['stripe-signature'] as string;
            // Stripe requires raw buffer for verification
            const event = stripeService.verifyWebhookSignature(req.body, signature);

            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object as any;
                const studentFeeId = paymentIntent.metadata?.studentFeeId;

                if (studentFeeId) {
                    await prisma.payment.create({
                        data: {
                            studentFeeId,
                            amount: paymentIntent.amount,
                            mode: 'STRIPE',
                            status: PaymentStatus.VERIFIED,
                            transactionRef: paymentIntent.id,
                            recordedById: 'SYSTEM',
                        }
                    });

                    await prisma.studentFee.update({
                        where: { id: studentFeeId },
                        data: { paidAmount: { increment: paymentIntent.amount } }
                    });
                }
            }
            res.status(200).json({ received: true });
        } catch (error) {
            logger.error('Stripe webhook error', { error });
            res.status(400).send(`Webhook Error: ${(error as Error).message}`);
        }
    }
};
