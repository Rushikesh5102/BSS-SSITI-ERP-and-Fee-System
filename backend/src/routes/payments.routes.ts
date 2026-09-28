import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

// GET /payments - List payments (Accountant, Admin)
router.get('/', authorize(Role.ADMIN, Role.ACCOUNTANT), paymentsController.list);

// POST /payments - Record a manual fee payment (Accountant and Admin can record initial payments)
router.post('/', authorize(Role.ADMIN, Role.ACCOUNTANT), paymentsController.recordPayment);

// PUT /payments/:id - Edit fee payment and reconcile student balance (Restricted to Admin & Developer only)
router.put('/:id', authorize(Role.ADMIN, Role.DEVELOPER, Role.SUPERADMIN), paymentsController.update);

// Razorpay & Stripe integration
router.post('/razorpay/order', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createRazorpayOrder);
router.post('/razorpay/verify', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.verifyRazorpayPayment);
router.post('/stripe/intent', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT), paymentsController.createStripeIntent);

// Refund
router.post('/:id/refund', authorize(Role.ADMIN, Role.DEVELOPER), paymentsController.refund);

export default router;
