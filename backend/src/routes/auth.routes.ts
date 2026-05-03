import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

const refreshSchema = z.object({
    body: z.object({ refreshToken: z.string().min(1) }),
});

// POST /auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh);

// GET /auth/me
router.get('/me', authenticate, authController.me);

// POST /auth/logout
router.post('/logout', authenticate, authController.logout);

export default router;
