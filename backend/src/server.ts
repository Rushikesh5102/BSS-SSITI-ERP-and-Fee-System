import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

const startServer = async () => {
    // Verify DB connection before starting
    try {
        await prisma.$connect();
        logger.info('✅ Database connection established');
    } catch (error) {
        logger.error('❌ Failed to connect to database', { error });
        process.exit(1);
    }

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
            logger.info('✅ Server and database disconnected');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', { message: err.message, stack: err.stack });
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled rejection', { reason });
        process.exit(1);
    });
};

startServer();
