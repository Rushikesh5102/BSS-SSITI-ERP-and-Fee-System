import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /payments - List payments (Accountant, Admin)
router.get('/', authorize(Role.ADMIN, Role.ACCOUNTANT), paymentsController.list);

// POST /payments - Record a manual fee payment
router.post('/', authorize(Role.ADMIN, Role.ACCOUNTANT), paymentsController.recordPayment);

// Razorpay & Stripe integration
router.post('/razorpay/order', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createRazorpayOrder);
router.post('/razorpay/verify', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.verifyRazorpayPayment);
router.post('/stripe/intent', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createStripeIntent);

// Refund
router.post('/:id/refund', authorize(Role.ADMIN, Role.DEVELOPER), paymentsController.refund);

export default router;
