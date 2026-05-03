import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
});

export const razorpayService = {
    /**
     * Create a Razorpay order for a fee payment
     * @param amountInPaise - e.g. 500000 = ₹5,000
     * @param receiptId     - Unique receipt reference (your internal ID)
     */
    async createOrder(amountInPaise: number, receiptId: string, notes?: Record<string, string>) {
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: notes || {},
        });
        logger.info('Razorpay order created', { orderId: order.id, amount: amountInPaise });
        return order;
    },

    /**
     * Verify Razorpay payment signature after successful checkout
     * Must be called before marking a payment as VERIFIED
     */
    verifyPaymentSignature(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ): boolean {
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpay.keySecret)
            .update(body)
            .digest('hex');

        return expectedSignature === razorpaySignature;
    },

    /**
     * Verify webhook signature from Razorpay
     */
    verifyWebhookSignature(body: string, signature: string): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpay.webhookSecret)
            .update(body)
            .digest('hex');
        return expectedSignature === signature;
    },

    /**
     * Fetch payment details from Razorpay
     */
    async fetchPayment(paymentId: string) {
        return razorpay.payments.fetch(paymentId);
    },

    /**
     * Process refund for a payment
     */
    async refundPayment(paymentId: string, amountInPaise?: number) {
        return razorpay.payments.refund(paymentId, {
            amount: amountInPaise,
        });
    },
};
