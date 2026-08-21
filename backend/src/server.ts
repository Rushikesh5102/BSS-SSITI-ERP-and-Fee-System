import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

const connectWithRetry = async (maxRetries = 5, delayMs = 2000): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await prisma.$connect();
            logger.info('✅ Database connection established securely');
            return;
        } catch (error: any) {
            logger.warn(`⚠️ Database connection attempt ${attempt}/${maxRetries} failed (${error?.message || error}). Retrying in ${delayMs}ms...`);
            if (attempt === maxRetries) {
                logger.error('❌ Failed to establish database connection after multiple attempts', { error });
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
};

const startServer = async () => {
    // Verify DB connection with auto-retry self-healing before starting
    await connectWithRetry();

    const server = app.listen(config.port, () => {
        logger.info(`🚀 Sai ITI Fee API running on port ${config.port}`);
        logger.info(`   Environment: ${config.nodeEnv}`);
        logger.info(`   Health: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(async () => {
            await prisma.$disconnect();
            logger.info('✅ Server and database disconnected cleanly');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions gracefully without dropping healthy traffic
    process.on('uncaughtException', (err) => {
        logger.error('[CRITICAL] Uncaught exception caught safely', { message: err.message, stack: err.stack });
    });

    process.on('unhandledRejection', (reason: any) => {
        logger.error('[WARNING] Unhandled rejection intercepted', { reason: reason?.message || reason });
    });
};

startServer();
