import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Singleton Prisma client to prevent connection pool exhaustion
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });

// Log slow queries in development
prisma.$on('query', (e) => {
    if (e.duration > 500) {
        logger.warn('Slow query detected', { query: e.query, duration: e.duration });
    }
});

prisma.$on('error', (e) => {
    logger.error('Prisma error', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
