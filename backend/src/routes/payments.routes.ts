import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /payments - List payments (Accountant, Admin)
router.get('/', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), paymentsController.list);

// POST /payments - Record payment (Accountant only)
router.post('/', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), paymentsController.recordPayment);

// POST /payments/razorpay/order - Create Razorpay order
router.post('/razorpay/order', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createRazorpayOrder);

// POST /payments/razorpay/verify - Verify Razorpay payment
router.post('/razorpay/verify', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.verifyRazorpayPayment);

// POST /payments/stripe/intent - Create Stripe Payment Intent
router.post('/stripe/intent', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createStripeIntent);

// POST /payments/:id/refund - Process money refund (Admin and Developer only)
router.post('/:id/refund', authorize(Role.SUPERADMIN, Role.ADMIN, Role.DEVELOPER), paymentsController.refund);

export default router;
