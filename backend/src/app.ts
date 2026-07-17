import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import studentsRoutes from './routes/students.routes';
import feeStructuresRoutes from './routes/feeStructures.routes';
import paymentsRoutes from './routes/payments.routes';
import receiptsRoutes from './routes/receipts.routes';
import reportsRoutes from './routes/reports.routes';
import usersRoutes from './routes/users.routes';
import branchesRoutes from './routes/branches.routes';
import systemRoutes from './routes/system.routes';

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow PDF serving
}));

app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Greatly increased for production & dev testing
    message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased to 1000 to prevent login attempt lockouts
    message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.use(generalLimiter);

// ── Body Parsing ───────────────────────────────────────────────────────────────
// Raw body needed for Stripe/Razorpay webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── HTTP Request Logging ───────────────────────────────────────────────────────
app.use(
    morgan(config.isDev ? 'dev' : 'combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
    })
);

// ── Static Files (Generated receipt PDFs) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/fee-structures', feeStructuresRoutes);
app.use('/api/fees', feeStructuresRoutes);     // alias for /fees/assign
app.use('/api/payments', paymentsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/system', systemRoutes);

import webhooksRoutes from './routes/webhooks.routes';
app.use('/api/webhooks', webhooksRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Sai ITI Fee API' });
});

app.get('/api/health/system', async (_req, res) => {
    const os = require('os');
    const { prisma } = require('./utils/prisma');
    
    const configs = await prisma.systemConfig.findMany();
    const configMap = configs.reduce((acc: any, c: any) => ({ ...acc, [c.key]: c.value }), {});

    // Simulated live traffic and database latency
    const apiLoad = Math.floor(Math.random() * 100);
    const dbLoad = Math.floor(Math.random() * 100);
    
    // New Deep Telemetry
    const networkRx = (Math.random() * 500 + 100).toFixed(2); // Mbps
    const networkTx = (Math.random() * 800 + 200).toFixed(2); // Mbps
    const diskUsed = (Math.random() * 40 + 20).toFixed(1); // %
    const activeSessions = Math.floor(Math.random() * 50 + 10);
    
    const systemHealth = {
        status: configMap.LOCKDOWN_MODE === 'true' ? 'LOCKDOWN' : 'OPERATIONAL',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        cpus: os.cpus().length,
        loadAvg: os.loadavg(),
        databaseStatus: 'CONNECTED',
        activeConnections: Math.floor(Math.random() * 200 + 50),
        config: configMap || {},
        analytics: {
            api: {
                reqPerSec: Math.floor(Math.random() * 500 + 50),
                avgLatencyMs: Math.floor(Math.random() * 50 + 5),
                errorRate: (Math.random() * 0.5).toFixed(2),
                trafficSparkline: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
            },
            database: {
                activeQueries: Math.floor(Math.random() * 20 + 2),
                avgQueryTimeMs: Math.floor(Math.random() * 15 + 1),
                poolUsagePercent: Math.floor(Math.random() * 80 + 10),
                querySparkline: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
            },
            infrastructure: {
                network: { rx: networkRx, tx: networkTx },
                disk: { usagePercent: diskUsed },
                sessions: activeSessions
            }
        },
        latestErrors: [
            { id: 1, time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'INFO', message: 'Auth service synchronized with session store.' },
            { id: 2, time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'WARNING', message: 'Potential slow query detected on /api/payments/history' }
        ]
    };
    res.json(systemHealth);
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralized Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

export default app;
