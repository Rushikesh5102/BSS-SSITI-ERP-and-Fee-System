import { Router } from 'express';
import { inquiriesController } from '../controllers/inquiries.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';

const router = Router();

// Public route to submit an inquiry from outer portal / website
router.post('/', inquiriesController.create);

// Protected routes to manage inquiries (Admin and Developer only)
router.get('/', authenticate, authorize(Role.ADMIN, Role.DEVELOPER), inquiriesController.list);
router.put('/:id/status', authenticate, authorize(Role.ADMIN, Role.DEVELOPER), inquiriesController.updateStatus);
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.DEVELOPER), inquiriesController.delete);

export default router;
