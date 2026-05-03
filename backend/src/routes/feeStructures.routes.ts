import { Router } from 'express';
import { feeStructuresController } from '../controllers/feeStructures.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /fee-structures - All authenticated
router.get('/', feeStructuresController.list);

// GET /fee-categories - All authenticated
router.get('/categories', feeStructuresController.listCategories);

// POST /fee-structures - Admin only
router.post('/', authorize(Role.SUPERADMIN, Role.ADMIN), feeStructuresController.create);

// PUT /fee-structures/:id - Admin only
router.put('/:id', authorize(Role.SUPERADMIN, Role.ADMIN), feeStructuresController.update);

// POST /fees/assign - Admin and Accountant
router.post('/assign', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), feeStructuresController.assignToStudent);

export default router;
