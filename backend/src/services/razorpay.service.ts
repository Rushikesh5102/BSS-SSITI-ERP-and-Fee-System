import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PaymentProvider } from './payment-provider.interface';

// Initialize Razorpay client (with placeholder fallbacks to prevent startup crash if keys are missing)
const razorpay = new Razorpay({
    key_id: config.razorpay.keyId || 'rzp_test_placeholder',
    key_secret: config.razorpay.keySecret || 'placeholder_secret',
});

export const razorpayService: PaymentProvider & {
    verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
    verifyWebhookSignature(body: string, signature: string): boolean;
    fetchPayment(paymentId: string): Promise<any>;
    refundPayment(paymentId: string, amountInPaise?: number): Promise<any>;
} = {
    /**
     * Create a Razorpay order for a fee payment
     * @param amountInPaise - e.g. 500000 = ₹5,000
     * @param receiptId     - Unique receipt reference (your internal ID)
     */
    async createOrder(amountInPaise: number, receiptId: string, metadata?: Record<string, string>) {
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: metadata || {},
        });
        logger.info('Razorpay order created', { orderId: order.id, amount: amountInPaise });
        return order;
    },

    /**
     * Conforms to PaymentProvider interface
     */
    verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        return this.verifyPaymentSignature(orderId, paymentId, signature);
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
     * Conforms to PaymentProvider interface
     */
    async refund(transactionId: string, amountInPaise?: number) {
        return this.refundPayment(transactionId, amountInPaise);
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
