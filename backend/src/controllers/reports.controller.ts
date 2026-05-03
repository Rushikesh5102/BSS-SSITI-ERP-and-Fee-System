import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { generateExcel, generateCSV, formatPaymentRows } from '../services/export.service';
import { paiseToRupees } from '../utils/currency';

export const reportsController = {
    /**
     * GET /reports/daily?date=2024-03-11&format=json|excel|csv
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

        res.json({ success: true, data: { payments, summary: { total: payments.length, totalCollected, totalCollectedRupees: paiseToRupees(totalCollected) } } });
    }),

    /**
     * GET /reports/monthly?year=2024&month=3&format=json|excel|csv
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
};
