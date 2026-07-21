import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { generateExcel, generateCSV, formatPaymentRows } from '../services/export.service';
import { generateReportPdf } from '../services/pdf.service';
import { paiseToRupees } from '../utils/currency';
import { createAuditLog } from '../middleware/auditLogger';
import { AuditAction } from '../types/enums';

const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

export const reportsController = {
    /**
     * GET /reports/daily?date=2024-03-11&format=json|excel|csv|pdf
     */
    daily: asyncHandler(async (req: Request, res: Response) => {
        const date = req.query.date ? new Date(String(req.query.date)) : new Date();
        const format = String(req.query.format || 'json');

        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

        const payments = await prisma.payment.findMany({
            where: { createdAt: { gte: dayStart, lte: dayEnd }, status: 'VERIFIED' },
            include: {
                studentFee: { include: { student: { select: { name: true, studentId: true, class: true } } } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const rows = formatPaymentRows(payments as any);

        if (format === 'excel') {
            const buffer = await generateExcel(`Daily Collection - ${date.toLocaleDateString('en-IN')}`, rows, [
                { header: 'Sr.', key: 'Sr.', width: 6 },
                { header: 'Date', key: 'Date', width: 14 },
                { header: 'Student Name', key: 'Student Name', width: 25 },
                { header: 'Student ID', key: 'Student ID', width: 16 },
                { header: 'Class', key: 'Class', width: 14 },
                { header: 'Amount (₹)', key: 'Amount (₹)', width: 14 },
                { header: 'Payment Mode', key: 'Payment Mode', width: 16 },
                { header: 'Transaction Ref', key: 'Transaction Ref', width: 20 },
            ]);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="daily-report.xlsx"');
            return res.send(buffer);
        }

        if (format === 'csv') {
            const csv = generateCSV(rows, [
                { label: 'Sr.', value: 'Sr.' }, { label: 'Date', value: 'Date' },
                { label: 'Student Name', value: 'Student Name' }, { label: 'Amount (₹)', value: 'Amount (₹)' },
                { label: 'Payment Mode', value: 'Payment Mode' },
            ]);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="daily-report.csv"');
            return res.send(csv);
        }

        if (format === 'pdf') {
            const buffer = await generateReportPdf(
                `Daily Fee Collection Report - ${date.toLocaleDateString('en-IN')}`,
                rows,
                [
                    { header: 'Sr.', key: 'Sr.' },
                    { header: 'Student Name', key: 'Student Name' },
                    { header: 'Student ID', key: 'Student ID' },
                    { header: 'Class', key: 'Class' },
                    { header: 'Amount (₹)', key: 'Amount (₹)' },
                    { header: 'Mode', key: 'Payment Mode' },
                ]
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="daily-report.pdf"');
            return res.send(buffer);
        }

        res.json({ success: true, data: { payments, summary: { total: payments.length, totalCollected, totalCollectedRupees: paiseToRupees(totalCollected) } } });
    }),

    /**
     * GET /reports/monthly?year=2024&month=3&format=json|excel|csv|pdf
     */
    monthly: asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(String(req.query.year || new Date().getFullYear()));
        const month = parseInt(String(req.query.month || new Date().getMonth() + 1));
        const format = String(req.query.format || 'json');

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const payments = await prisma.payment.findMany({
            where: {
                createdAt: { gte: start, lte: end }, status: 'VERIFIED',
                ...(req.user?.branchId ? { studentFee: { student: { branchId: req.user.branchId } } } : {}),
            },
            include: {
                studentFee: { include: { student: { select: { name: true, studentId: true, class: true } } } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const rows = formatPaymentRows(payments as any);

        if (format === 'excel') {
            const buffer = await generateExcel(`Monthly Report - ${start.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`, rows, [
                { header: 'Sr.', key: 'Sr.', width: 6 }, { header: 'Date', key: 'Date', width: 14 },
                { header: 'Student Name', key: 'Student Name', width: 25 }, { header: 'Student ID', key: 'Student ID', width: 16 },
                { header: 'Class', key: 'Class', width: 14 }, { header: 'Amount (₹)', key: 'Amount (₹)', width: 14 },
                { header: 'Payment Mode', key: 'Payment Mode', width: 16 }, { header: 'Recorded By', key: 'Recorded By', width: 20 },
            ]);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="monthly-report.xlsx"');
            return res.send(buffer);
        }

        if (format === 'csv') {
            const csv = generateCSV(rows, [
                { label: 'Sr.', value: 'Sr.' }, { label: 'Date', value: 'Date' },
                { label: 'Student Name', value: 'Student Name' }, { label: 'Amount (₹)', value: 'Amount (₹)' },
                { label: 'Payment Mode', value: 'Payment Mode' },
            ]);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="monthly-report.csv"');
            return res.send(csv);
        }

        if (format === 'pdf') {
            const buffer = await generateReportPdf(
                `Monthly Fee Collection Report - ${start.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
                rows,
                [
                    { header: 'Sr.', key: 'Sr.' },
                    { header: 'Date', key: 'Date' },
                    { header: 'Student Name', key: 'Student Name' },
                    { header: 'Class', key: 'Class' },
                    { header: 'Amount (₹)', key: 'Amount (₹)' },
                    { header: 'Mode', key: 'Payment Mode' },
                ]
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="monthly-report.pdf"');
            return res.send(buffer);
        }

        res.json({ success: true, data: { payments, summary: { total: payments.length, totalCollected, totalCollectedRupees: paiseToRupees(totalCollected) } } });
    }),

    /**
     * GET /reports/yearly?year=2024&format=json|excel|csv|pdf
     */
    yearly: asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(String(req.query.year || new Date().getFullYear()));
        const format = String(req.query.format || 'json');

        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);

        const payments = await prisma.payment.findMany({
            where: {
                createdAt: { gte: start, lte: end }, status: 'VERIFIED',
                ...(req.user?.branchId ? { studentFee: { student: { branchId: req.user.branchId } } } : {}),
            },
            include: {
                studentFee: { include: { student: { select: { name: true, studentId: true, class: true } } } },
                recordedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const rows = formatPaymentRows(payments as any);

        if (format === 'excel') {
            const buffer = await generateExcel(`Annual Fee Report - Academic Year ${year}`, rows, [
                { header: 'Sr.', key: 'Sr.', width: 6 }, { header: 'Date', key: 'Date', width: 14 },
                { header: 'Student Name', key: 'Student Name', width: 25 }, { header: 'Student ID', key: 'Student ID', width: 16 },
                { header: 'Class', key: 'Class', width: 14 }, { header: 'Amount (₹)', key: 'Amount (₹)', width: 14 },
                { header: 'Payment Mode', key: 'Payment Mode', width: 16 }, { header: 'Recorded By', key: 'Recorded By', width: 20 },
            ]);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="yearly-report-${year}.xlsx"`);
            return res.send(buffer);
        }

        if (format === 'csv') {
            const csv = generateCSV(rows, [
                { label: 'Sr.', value: 'Sr.' }, { label: 'Date', value: 'Date' },
                { label: 'Student Name', value: 'Student Name' }, { label: 'Amount (₹)', value: 'Amount (₹)' },
                { label: 'Payment Mode', value: 'Payment Mode' },
            ]);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="yearly-report-${year}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const buffer = await generateReportPdf(
                `Annual Fee Collection Report - ${year}`,
                rows,
                [
                    { header: 'Sr.', key: 'Sr.' },
                    { header: 'Date', key: 'Date' },
                    { header: 'Student Name', key: 'Student Name' },
                    { header: 'Class', key: 'Class' },
                    { header: 'Amount (₹)', key: 'Amount (₹)' },
                    { header: 'Mode', key: 'Payment Mode' },
                ]
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="yearly-report-${year}.pdf"`);
            return res.send(buffer);
        }

        res.json({ success: true, data: { payments, summary: { total: payments.length, totalCollected, totalCollectedRupees: paiseToRupees(totalCollected) } } });
    }),

    /**
     * GET /reports/pending - Outstanding fee report
     */
    pending: asyncHandler(async (req: Request, res: Response) => {
        const format = String(req.query.format || 'json');

        // Fetch all student fees and filter pending in JS (Prisma doesn't support column cross-comparison directly)
        const studentFees = await prisma.studentFee.findMany({
            where: {
                ...(req.user?.branchId ? { student: { branchId: req.user.branchId } } : {}),
            },
            include: {
                student: { include: { parent: { select: { name: true, phone: true, email: true } } } },
                feeStructure: { select: { name: true, academicYear: true } },
            },
            orderBy: { dueDate: 'asc' },
        });

        // Filter only those with actual pending balance
        const pending = studentFees.filter((sf) => sf.paidAmount < sf.totalAmount);

        const rows = pending.map((sf, idx) => ({
            'Sr.': idx + 1,
            'Student ID': sf.student.studentId,
            'Student Name': sf.student.name,
            Class: sf.student.class,
            'Fee Structure': sf.feeStructure.name,
            'Academic Year': sf.feeStructure.academicYear,
            'Total (₹)': paiseToRupees(sf.totalAmount),
            'Paid (₹)': paiseToRupees(sf.paidAmount),
            'Pending (₹)': paiseToRupees(sf.totalAmount - sf.paidAmount),
            'Due Date': sf.dueDate ? new Date(sf.dueDate).toLocaleDateString('en-IN') : '—',
            "Parent's Phone": sf.student.parent?.phone || '—',
        }));

        if (format === 'excel') {
            const buffer = await generateExcel('Outstanding Fee Report', rows, [
                { header: 'Sr.', key: 'Sr.', width: 6 }, { header: 'Student ID', key: 'Student ID', width: 16 },
                { header: 'Student Name', key: 'Student Name', width: 25 }, { header: 'Class', key: 'Class', width: 14 },
                { header: 'Total (₹)', key: 'Total (₹)', width: 14 }, { header: 'Paid (₹)', key: 'Paid (₹)', width: 14 },
                { header: 'Pending (₹)', key: 'Pending (₹)', width: 16 }, { header: 'Due Date', key: 'Due Date', width: 14 },
            ]);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="pending-fees.xlsx"');
            return res.send(buffer);
        }

        if (format === 'csv') {
            const csv = generateCSV(rows, Object.keys(rows[0] || {}).map(k => ({ label: k, value: k })));
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="pending-fees.csv"');
            return res.send(csv);
        }

        const totalPending = pending.reduce((sum, sf) => sum + (sf.totalAmount - sf.paidAmount), 0);
        res.json({ success: true, data: { studentFees: pending, summary: { count: pending.length, totalPending, totalPendingRupees: paiseToRupees(totalPending) } } });
    }),

    /**
     * GET /reports/dashboard - Summary stats for dashboard cards
     */
    dashboard: asyncHandler(async (req: Request, res: Response) => {
        const branchFilter = req.user?.branchId ? { branchId: req.user.branchId } : {};
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const [totalStudents, todayPayments, monthPayments, pendingFees] = await Promise.all([
            prisma.student.count({ where: { isActive: true, ...branchFilter } }),
            prisma.payment.aggregate({
                where: { createdAt: { gte: today }, status: 'VERIFIED' },
                _sum: { amount: true }, _count: true,
            }),
            prisma.payment.aggregate({
                where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }, status: 'VERIFIED' },
                _sum: { amount: true }, _count: true,
            }),
            prisma.studentFee.findMany({
                where: { student: branchFilter },
                select: { totalAmount: true, paidAmount: true },
            }),
        ]);

        const totalPending = pendingFees.reduce((sum, sf) => sum + Math.max(0, sf.totalAmount - sf.paidAmount), 0);

        // Generate live chart data for the last 6 months concurrently
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartPromises = Array.from({ length: 6 }).map((_, i) => {
            const dStrStart = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
            const dStrEnd = new Date(today.getFullYear(), today.getMonth() - (5 - i) + 1, 1);
            
            return prisma.payment.aggregate({
                where: { createdAt: { gte: dStrStart, lt: dStrEnd }, status: 'VERIFIED' },
                _sum: { amount: true }
            }).then(monthAgg => ({
                month: monthNames[dStrStart.getMonth()],
                amount: Math.round((monthAgg._sum.amount || 0) / 100000)
            }));
        });

        const chartData = await Promise.all(chartPromises);

        res.json({
            success: true,
            data: {
                totalStudents,
                todayCollection: { amount: todayPayments._sum.amount || 0, count: todayPayments._count },
                monthCollection: { amount: monthPayments._sum.amount || 0, count: monthPayments._count },
                totalPendingBalance: totalPending,
                chartData,
            },
        });
    }),

    /**
     * GET /reports/storage-stats - Database & Disk Storage Monitoring
     */
    storageStats: asyncHandler(async (_req: Request, res: Response) => {
        const [studentCount, paymentCount, receiptCount, auditLogCount, userCount, dbSizeResult] = await Promise.all([
            prisma.student.count(),
            prisma.payment.count(),
            prisma.receipt.count(),
            prisma.auditLog.count(),
            prisma.user.count(),
            prisma.$queryRaw<{ size_bytes: bigint }[]>`SELECT pg_database_size(current_database()) as size_bytes;`.catch(() => [{ size_bytes: BigInt(0) }]),
        ]);

        let fileUsedBytes = 0;
        let receiptFilesCount = 0;
        if (fs.existsSync(RECEIPTS_DIR)) {
            const files = fs.readdirSync(RECEIPTS_DIR);
            receiptFilesCount = files.length;
            files.forEach(file => {
                try {
                    const stats = fs.statSync(path.join(RECEIPTS_DIR, file));
                    fileUsedBytes += stats.size;
                } catch { }
            });
        }

        // Real live database storage from Supabase PostgreSQL
        const rawDbBytes = Number(dbSizeResult[0]?.size_bytes || 0);
        const dbUsedMb = parseFloat((rawDbBytes / (1024 * 1024)).toFixed(2));
        const fileUsedMb = parseFloat((fileUsedBytes / (1024 * 1024)).toFixed(2));
        const dbLimitMb = 500; // Free tier Postgres limit (Supabase 500MB)
        const fileLimitMb = 1024; // Free tier disk storage (1GB)

        const totalUsedPercent = Math.min(100, parseFloat((((dbUsedMb + fileUsedMb) / (dbLimitMb + fileLimitMb)) * 100).toFixed(1)));

        res.json({
            success: true,
            data: {
                totalUsedPercent,
                dbUsedMb,
                dbLimitMb,
                fileUsedMb,
                fileLimitMb,
                rawDbBytes,
                counts: {
                    students: studentCount,
                    payments: paymentCount,
                    receipts: receiptCount,
                    auditLogs: auditLogCount,
                    users: userCount,
                    pdfFiles: receiptFilesCount,
                },
            },
        });
    }),

    /**
     * POST /reports/purge-old-data - Free up database and disk storage
     */
    purgeOldData: asyncHandler(async (req: Request, res: Response) => {
        const { year, purgeAuditLogs = true, purgeOldPayments = false } = req.body;
        const purgeBeforeDate = year ? new Date(Number(year) + 1, 0, 1) : new Date(new Date().getFullYear() - 1, 0, 1);

        let deletedLogsCount = 0;
        let deletedPaymentsCount = 0;
        let deletedPdfFilesCount = 0;

        if (purgeAuditLogs) {
            const deletedLogs = await prisma.auditLog.deleteMany({
                where: { createdAt: { lt: purgeBeforeDate } },
            });
            deletedLogsCount = deletedLogs.count;
        }

        if (purgeOldPayments) {
            const oldPayments = await prisma.payment.findMany({
                where: { createdAt: { lt: purgeBeforeDate } },
                select: { id: true, receipt: { select: { id: true, receiptNumber: true } } },
            });

            for (const p of oldPayments) {
                if (p.receipt) {
                    const pdfPath = path.join(RECEIPTS_DIR, `${p.receipt.receiptNumber}.pdf`);
                    if (fs.existsSync(pdfPath)) {
                        try { fs.unlinkSync(pdfPath); deletedPdfFilesCount++; } catch { }
                    }
                    await prisma.receipt.delete({ where: { id: p.receipt.id } }).catch(() => { });
                }
                await prisma.payment.delete({ where: { id: p.id } }).catch(() => { });
            }
            deletedPaymentsCount = oldPayments.length;
        }

        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'System', 'StoragePurge', {
            year, purgeBeforeDate, deletedLogsCount, deletedPaymentsCount, deletedPdfFilesCount
        }, req.ip);

        res.json({
            success: true,
            message: `Storage cleared successfully! Removed ${deletedLogsCount} audit logs, ${deletedPaymentsCount} old payments, and ${deletedPdfFilesCount} PDF files.`,
            data: { deletedLogsCount, deletedPaymentsCount, deletedPdfFilesCount }
        });
    }),

    /**
     * POST /reports/clear-all-mock-data - Wipe all testing/mock student data, payments, receipts, and logs
     */
    clearAllMockData: asyncHandler(async (req: Request, res: Response) => {
        // 1. Delete all generated receipt PDFs from disk
        let deletedPdfs = 0;
        if (fs.existsSync(RECEIPTS_DIR)) {
            const files = fs.readdirSync(RECEIPTS_DIR);
            for (const file of files) {
                if (file.endsWith('.pdf')) {
                    try {
                        fs.unlinkSync(path.join(RECEIPTS_DIR, file));
                        deletedPdfs++;
                    } catch { }
                }
            }
        }

        // 2. Clear database tables in strict foreign key cascade order
        const auditLogsDeleted = await prisma.auditLog.deleteMany({});
        const notificationsDeleted = await prisma.notification.deleteMany({}).catch(() => ({ count: 0 }));
        const receiptsDeleted = await prisma.receipt.deleteMany({});
        const paymentsDeleted = await prisma.payment.deleteMany({});
        const studentFeesDeleted = await prisma.studentFee.deleteMany({});
        const studentUsersDeleted = await prisma.user.deleteMany({ where: { role: 'STUDENT' } });
        const studentsDeleted = await prisma.student.deleteMany({});
        const parentsDeleted = await prisma.parent.deleteMany({});

        await createAuditLog(req.user!.id, AuditAction.USER_UPDATED, 'System', 'MockDataWipe', {
            studentsDeleted: studentsDeleted.count,
            paymentsDeleted: paymentsDeleted.count,
            receiptsDeleted: receiptsDeleted.count,
            deletedPdfs
        }, req.ip);

        res.json({
            success: true,
            message: `✅ All testing and mock data successfully wiped! Database is clean for production deployment.`,
            data: {
                studentsCleared: studentsDeleted.count,
                parentsCleared: parentsDeleted.count,
                studentFeesCleared: studentFeesDeleted.count,
                paymentsCleared: paymentsDeleted.count,
                receiptsCleared: receiptsDeleted.count,
                studentAccountsCleared: studentUsersDeleted.count,
                auditLogsCleared: auditLogsDeleted.count,
                pdfsDeletedFromDisk: deletedPdfs
            }
        });
    }),
};
