import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Stripe client
const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2023-10-16',
});

export const stripeService = {
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
     * Process a refund for a PaymentIntent
     */
    async refundPayment(paymentIntentId: string, amountInPaise?: number) {
        return stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amountInPaise,
        });
    },
};
