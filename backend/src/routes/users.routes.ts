import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';
import { cacheResponse, autoInvalidateCache } from '../middleware/cacheMiddleware';

const router = Router();

router.use(authenticate);

// GET /users - List users
router.get('/', authorize(Role.ADMIN), usersController.list);

// GET /users/stats - Get role counts (cached 30s)
router.get('/stats', authorize(Role.ADMIN), cacheResponse(30, 'users'), usersController.stats);

// POST /users/sync-students - Sync all students as user credentials
router.post('/sync-students', authorize(Role.ADMIN), autoInvalidateCache('users'), usersController.syncStudents);

// GET /users/:id - Get user member
router.get('/:id', authorize(Role.ADMIN), usersController.getById);

// POST /users - Create user member
router.post('/', authorize(Role.ADMIN), autoInvalidateCache('users'), usersController.create);

// PUT /users/:id - Update user member
router.put('/:id', authorize(Role.ADMIN), autoInvalidateCache('users'), usersController.update);

// PUT /users/:id/reset-password - Reset password
router.put('/:id/reset-password', authorize(Role.ADMIN), autoInvalidateCache('users'), usersController.resetPassword);

// DELETE /users/:id - Deactivate/revoke user
router.delete('/:id', authorize(Role.ADMIN), autoInvalidateCache('users'), usersController.deactivate);

export default router;
