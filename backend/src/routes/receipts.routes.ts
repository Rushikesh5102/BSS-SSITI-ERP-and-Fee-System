import { Router } from 'express';
import { receiptsController } from '../controllers/receipts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /receipts/download/:receiptNumber - Public PDF download (no auth needed for parent link sharing)
router.get('/download/:receiptNumber', receiptsController.downloadPdf);

// All other receipt routes require auth
router.use(authenticate);

// GET /receipts - List all receipts
router.get('/', receiptsController.list);

// GET /receipts/:id - Get receipt details
router.get('/:id', receiptsController.getById);

export default router;
