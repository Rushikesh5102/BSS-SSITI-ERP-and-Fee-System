import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const authService = {
    /**
     * Validate login credentials and return tokens
     */
    async login(email: string, password: string) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: { branch: { select: { id: true, name: true } } },
        });

        if (!user || !user.isActive) {
            throw new AppError(401, 'Invalid email or password');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new AppError(401, 'Invalid email or password');
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, branchId: user.branchId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as any }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn as any }
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch,
            },
        };
    },

    /**
     * Generate new access token from valid refresh token
     */
    async refreshToken(token: string) {
        try {
            const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, branchId: true, isActive: true },
            });

            if (!user || !user.isActive) {
                throw new AppError(401, 'Invalid refresh token');
            }

            const accessToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, branchId: user.branchId },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn as any }
            );

            return { accessToken };
        } catch {
            throw new AppError(401, 'Invalid or expired refresh token');
        }
    },

    /**
     * Hash a password
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    },
};
