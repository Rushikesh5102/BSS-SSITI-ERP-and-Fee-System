import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /users - List staff
router.get('/', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.list);

// GET /users/stats - Get role counts
router.get('/stats', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.stats);

// GET /users/:id - Get staff member
router.get('/:id', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.getById);

// POST /users - Create staff member
router.post('/', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.create);

// PUT /users/:id - Update staff member
router.put('/:id', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.update);

// PUT /users/:id/reset-password - Reset password
router.put('/:id/reset-password', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.resetPassword);

// DELETE /users/:id - Deactivate user
router.delete('/:id', authorize(Role.SUPERADMIN, Role.ADMIN), usersController.deactivate);

export default router;
