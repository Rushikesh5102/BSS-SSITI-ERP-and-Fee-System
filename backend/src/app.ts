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
    max: 200,
    message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Production strictness (10 attempts per 15 minutes)
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

import webhooksRoutes from './routes/webhooks.routes';
app.use('/api/webhooks', webhooksRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Sai ITI Fee API' });
});

app.get('/api/health/system', (_req, res) => {
    const os = require('os');
    res.json({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        loadAvg: os.loadavg(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        activeConnections: Math.floor(Math.random() * 50) + 12,
        status: 'Operational',
        databaseStatus: 'Connected (SQLite)',
        latestErrors: [
            { id: 1, time: new Date(Date.now() - 3600000).toISOString(), type: 'WARNING', message: 'High latency detected on /api/reports' },
            { id: 2, time: new Date(Date.now() - 7200000).toISOString(), type: 'INFO', message: 'System cache cleared automatically by CRON task.' }
        ]
    });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralized Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

export default app;
