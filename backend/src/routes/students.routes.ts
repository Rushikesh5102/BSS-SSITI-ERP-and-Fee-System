import { Router } from 'express';
import { studentsController } from '../controllers/students.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// GET /students - All authenticated roles
router.get('/', studentsController.list);

// GET /students/:id - All authenticated roles
router.get('/:id', studentsController.getById);

// POST /students - Admin and Accountant only
router.post('/', authorize(Role.ADMIN, Role.ACCOUNTANT), studentsController.create);

// PUT /students/:id - Admin and Developer only
router.put('/:id', authorize(Role.ADMIN, Role.DEVELOPER), studentsController.update);

// DELETE /students/:id - Admin, SuperAdmin, Developer only
router.delete('/:id', authorize(Role.ADMIN, Role.SUPERADMIN, Role.DEVELOPER), studentsController.delete);

export default router;
