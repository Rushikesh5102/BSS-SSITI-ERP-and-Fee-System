import { Router } from 'express';
import { webhooksController } from '../controllers/webhooks.controller';

const router = Router();

// POST /api/webhooks/razorpay
router.post('/razorpay', webhooksController.razorpayWebhook);

// POST /api/webhooks/stripe
router.post('/stripe', webhooksController.stripeWebhook);

export default router;
