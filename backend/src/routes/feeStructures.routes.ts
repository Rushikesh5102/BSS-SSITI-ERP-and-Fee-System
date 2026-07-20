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

// POST /fee-structures - Admin and Developer
router.post('/', authorize(Role.ADMIN, Role.DEVELOPER), feeStructuresController.create);

// PUT /fee-structures/:id - Admin and Developer
router.put('/:id', authorize(Role.ADMIN, Role.DEVELOPER), feeStructuresController.update);

// POST /fee-structures/assign - Admin, Accountant, Developer (Initial stage only for Accountant)
router.post('/assign', authorize(Role.ADMIN, Role.ACCOUNTANT, Role.DEVELOPER), feeStructuresController.assignToStudent);

// PUT /fee-structures/student-fee/:id - Admin, Developer only
router.put('/student-fee/:id', authorize(Role.ADMIN, Role.DEVELOPER), feeStructuresController.updateStudentFee);

export default router;
