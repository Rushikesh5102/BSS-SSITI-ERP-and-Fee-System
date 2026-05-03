import { Router } from 'express';
import { branchesController } from '../controllers/branches.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /branches - List branches (all authenticated users can see)
router.get('/', branchesController.list);

// GET /branches/:id - Branch detail
router.get('/:id', branchesController.getById);

// POST /branches - Create branch (SuperAdmin only)
router.post('/', authorize(Role.SUPERADMIN), branchesController.create);

// PUT /branches/:id - Update branch (SuperAdmin only)
router.put('/:id', authorize(Role.SUPERADMIN), branchesController.update);

// DELETE /branches/:id - Deactivate branch (SuperAdmin only)
router.delete('/:id', authorize(Role.SUPERADMIN), branchesController.delete);

export default router;
