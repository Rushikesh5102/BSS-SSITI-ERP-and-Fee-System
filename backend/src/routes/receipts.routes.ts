import { Router } from 'express';
import { receiptsController } from '../controllers/receipts.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';

const router = Router();

// GET /receipts/download/:receiptNumber - Public PDF download (no auth needed for parent link sharing)
router.get('/download/:receiptNumber', receiptsController.downloadPdf);

// GET /receipts/blank-letterhead - Official institutional blank letterhead (header & footer spread to corners)
router.get('/blank-letterhead', receiptsController.downloadBlankLetterhead);

// All other receipt routes require auth
router.use(authenticate);

// GET /receipts - List all receipts
router.get('/', receiptsController.list);

// GET /receipts/:id - Get receipt details
router.get('/:id', receiptsController.getById);

// DELETE /receipts/:id - Delete receipt and reconcile student payment balance
router.delete('/:id', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.DEVELOPER, Role.SUPERADMIN), receiptsController.delete);

export default router;
