import { PrismaClient } from '@prisma/client';

// Singleton Prisma client to prevent connection pool exhaustion across both dev and production
const globalForPrisma = globalThis as unknown as { 
    prisma: PrismaClient;
    dbMetrics?: {
        queryCount: number;
        slowQueries: number;
        lastQueryDurationMs: number;
        avgDurationMs: number;
    }
};

if (!globalForPrisma.dbMetrics) {
    globalForPrisma.dbMetrics = {
        queryCount: 0,
        slowQueries: 0,
        lastQueryDurationMs: 0,
        avgDurationMs: 0
    };
}

export const dbMetrics = globalForPrisma.dbMetrics;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });

// Always store singleton on global to prevent pool exhaustion in production serverless/containers
globalForPrisma.prisma = prisma;

// Log and track query latency telemetry
(prisma as any).$on('query', (e: any) => {
    const duration = e.duration || 0;
    dbMetrics.queryCount++;
    dbMetrics.lastQueryDurationMs = duration;
    dbMetrics.avgDurationMs = Math.round(((dbMetrics.avgDurationMs * (dbMetrics.queryCount - 1)) + duration) / dbMetrics.queryCount);
    if (duration > 200) {
        dbMetrics.slowQueries++;
    }
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\x1b[36mprisma:query\x1b[0m \x1b[33m${e.query}\x1b[0m \x1b[32m(${duration}ms)\x1b[0m`);
    }
});

(prisma as any).$on('error', (e: any) => {
    console.error(`\x1b[31mprisma:error\x1b[0m ${e.message}`);
});
