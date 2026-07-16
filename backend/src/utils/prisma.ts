import { PrismaClient } from '@prisma/client';

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
(prisma as any).$on('query', (e: any) => {
    const duration = e.duration;
    console.log(`\x1b[36mprisma:query\x1b[0m \x1b[33m${e.query}\x1b[0m \x1b[32m(${duration}ms)\x1b[0m`);
});

(prisma as any).$on('error', (e: any) => {
    console.error(`\x1b[31mprisma:error\x1b[0m ${e.message}`);
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
