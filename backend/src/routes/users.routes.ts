import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

// GET /users - List users
router.get('/', authorize(Role.ADMIN), usersController.list);

// GET /users/stats - Get role counts
router.get('/stats', authorize(Role.ADMIN), usersController.stats);

// POST /users/sync-students - Sync all students as user credentials
router.post('/sync-students', authorize(Role.ADMIN), usersController.syncStudents);

// GET /users/:id - Get user member
router.get('/:id', authorize(Role.ADMIN), usersController.getById);

// POST /users - Create user member
router.post('/', authorize(Role.ADMIN), usersController.create);

// PUT /users/:id - Update user member
router.put('/:id', authorize(Role.ADMIN), usersController.update);

// PUT /users/:id/reset-password - Reset password
router.put('/:id/reset-password', authorize(Role.ADMIN), usersController.resetPassword);

// DELETE /users/:id - Deactivate/revoke user
router.delete('/:id', authorize(Role.ADMIN), usersController.deactivate);

export default router;
