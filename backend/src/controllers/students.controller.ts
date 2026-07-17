import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';

import { AuditAction } from '../types/enums';

import { generateStudentId } from '../utils/uuid';
import bcrypt from 'bcryptjs';

export const studentsController = {
    /**
     * GET /students
     * List all students for the user's branch (with pagination)
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 20, search = '', class: cls = '' } = req.query;
        let parsedPage = Number(page);
        let parsedLimit = Number(limit);
        
        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) parsedLimit = 20;

        const skip = (parsedPage - 1) * parsedLimit;

        const where: any = {
            isActive: true,
            ...(req.user?.role !== 'SUPERADMIN' && req.user?.branchId
                ? { branchId: req.user.branchId }
                : {}),
            ...(search ? {
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { studentId: { contains: String(search), mode: 'insensitive' } },
                ]
            } : {}),
            ...(cls ? { class: String(cls) } : {}),
        };

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip,
                take: parsedLimit,
                orderBy: { name: 'asc' },
                include: {
                    parent: { select: { name: true, phone: true, email: true } },
                    branch: { select: { name: true } },
                    studentFees: {
              select: { id: true, totalAmount: true, paidAmount: true },
            },
                },
            }),
            prisma.student.count({ where }),
        ]);

        res.json({
            success: true,
            data: students,
            pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
        });
    }),

    /**
     * POST /students
     * Create a new student with optional parent linkage
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { parent, ...studentData } = req.body;

        // Auto-generate student ID
        const count = await prisma.student.count();
        const studentId = generateStudentId(count + 1);

        // Create or find parent
        let parentId: string | undefined;
        if (parent?.phone) {
            const existingParent = await prisma.parent.findFirst({ where: { phone: parent.phone } });
            if (existingParent) {
                parentId = existingParent.id;
            } else {
                const newParent = await prisma.parent.create({ data: parent });
                parentId = newParent.id;
            }
        }

        const student = await prisma.student.create({
            data: {
                ...studentData,
                studentId,
                branchId: studentData.branchId || req.user!.branchId,
                parentId,
            },
            include: { parent: true, branch: { select: { name: true } } },
        });

        // ─── Generate Student Login Account ────────────────────────────────────
        const passwordHash = await bcrypt.hash(studentId, 12); // Default password is the generated Student ID
        const studentEmail = `${studentId.toLowerCase()}@student.saiiti.edu.in`;

        // Create the user role for the student so they can log in
        await prisma.user.create({
            data: {
                name: student.name,
                email: studentEmail,
                passwordHash,
                role: 'STUDENT',
                branchId: student.branchId,
            }
        });
        
        // Return login credentials to frontend
        const loginDetails = {
            email: studentEmail,
            defaultPassword: studentId
        };

        await createAuditLog(req.user!.id, AuditAction.STUDENT_CREATED, 'Student', student.id, { studentId }, req.ip);

        res.status(201).json({ success: true, data: { ...student, loginDetails } });
    }),

    /**
     * GET /students/:id
     * Full student profile including fee summary and payment history
     */
    getById: asyncHandler(async (req: Request, res: Response) => {
        const student = await prisma.student.findUnique({
            where: { id: req.params.id },
            include: {
                parent: true,
                branch: { select: { name: true } },
                studentFees: {
                    include: {
                        feeStructure: { select: { name: true, academicYear: true } },
                        payments: {
                            include: { receipt: true },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });

        if (!student) throw new AppError(404, 'Student not found');
        res.json({ success: true, data: student });
    }),

    /**
     * PUT /students/:id
     * Update student details
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { parent, ...updateData } = req.body;

        const student = await prisma.student.update({
            where: { id: req.params.id },
            data: updateData,
        });

        await createAuditLog(req.user!.id, AuditAction.STUDENT_UPDATED, 'Student', student.id, updateData, req.ip);
        res.json({ success: true, data: student });
    }),

    /**
     * DELETE /students/:id
     * Soft delete (set isActive = false)
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        await prisma.student.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ success: true, message: 'Student deactivated' });
    }),
};
