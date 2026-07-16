import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PaymentProvider } from './payment-provider.interface';

// Initialize Stripe client
const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2023-10-16',
});

export const stripeService: PaymentProvider & {
    createPaymentIntent(amountInPaise: number, metadata?: Record<string, string>): Promise<{ clientSecret: string | null; paymentIntentId: string }>;
    retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event;
    refundPayment(paymentIntentId: string, amountInPaise?: number): Promise<Stripe.Refund>;
} = {
    /**
     * Conforms to PaymentProvider interface.
     * For Stripe, we map order creation to creating a PaymentIntent.
     */
    async createOrder(amountInPaise: number, receiptId: string, metadata?: Record<string, string>) {
        const result = await this.createPaymentIntent(amountInPaise, {
            ...metadata,
            receiptId,
        });
        return {
            id: result.paymentIntentId,
            clientSecret: result.clientSecret,
            amount: amountInPaise,
            currency: 'INR',
        };
    },

    /**
     * Conforms to PaymentProvider interface.
     * Signature verification for Stripe is verified at the webhook level.
     */
    verifySignature(_orderId: string, _paymentId: string, _signature: string): boolean {
        logger.warn('Stripe: Client-side signature verification is not used; validation is webhook-driven.');
        return false;
    },

    /**
     * Create a Stripe PaymentIntent for a fee payment
     * Frontend uses the clientSecret to complete payment with Stripe.js
     * @param amountInPaise - e.g. 500000 = ₹5,000 (INR paise)
     */
    async createPaymentIntent(
        amountInPaise: number,
        metadata?: Record<string, string>
    ) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: 'inr',
            automatic_payment_methods: { enabled: true },
            metadata: metadata || {},
        });

        logger.info('Stripe PaymentIntent created', {
            id: paymentIntent.id,
            amount: amountInPaise,
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    },

    /**
     * Retrieve a PaymentIntent to check its status after completion
     */
    async retrievePaymentIntent(paymentIntentId: string) {
        return stripe.paymentIntents.retrieve(paymentIntentId);
    },

    /**
     * Construct and verify a Stripe webhook event
     * Must use raw body (Buffer) for signature verification
     */
    constructWebhookEvent(payload: Buffer, signature: string) {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            config.stripe.webhookSecret
        );
    },

    /**
     * Conforms to PaymentProvider interface.
     */
    async refund(transactionId: string, amountInPaise?: number) {
        return this.refundPayment(transactionId, amountInPaise);
    },

    /**
     * Process a refund for a PaymentIntent
     */
    async refundPayment(paymentId: string, amountInPaise?: number) {
        return stripe.refunds.create({
            payment_intent: paymentId,
            amount: amountInPaise,
        });
    },
};
