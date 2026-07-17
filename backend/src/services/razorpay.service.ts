import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PaymentProvider } from './payment-provider.interface';

// Lazy initialize Razorpay client
let razorpayClient: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
    if (!razorpayClient) {
        if (!config.razorpay.keyId || !config.razorpay.keySecret) {
            throw new Error('Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.');
        }
        razorpayClient = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });
    }
    return razorpayClient;
}

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
        const order = await getRazorpayClient().orders.create({
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
        return getRazorpayClient().payments.fetch(paymentId);
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
        return getRazorpayClient().payments.refund(paymentId, {
            amount: amountInPaise,
        });
    },
};
