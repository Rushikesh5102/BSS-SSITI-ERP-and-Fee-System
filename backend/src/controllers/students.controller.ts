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
            ...(req.user?.branchId ? { branchId: req.user.branchId } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { studentId: { contains: String(search), mode: 'insensitive' } },
                    { rollNumber: { contains: String(search), mode: 'insensitive' } },
                    { class: { contains: String(search), mode: 'insensitive' } },
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
              select: { id: true, totalAmount: true, paidAmount: true, academicYear: true },
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
        const { parent, feeStructureId, customTotalAmount, ...studentData } = req.body;
        const tradeClass = studentData.class || 'Electrician';

        // Auto-generate sequential roll number per trade to prevent human error
        const countInTrade = await prisma.student.count({
            where: { class: tradeClass }
        });
        const autoRollNumber = String(countInTrade + 1).padStart(2, '0');
        
        let studentId = studentData.studentId;
        if (!studentId) {
            let candidate = generateStudentId(tradeClass, autoRollNumber);
            let offset = 0;
            while (await prisma.student.findUnique({ where: { studentId: candidate } })) {
                offset++;
                candidate = generateStudentId(tradeClass, countInTrade + 1 + offset);
            }
            studentId = candidate;
        }

        // Create or find parent
        let parentId: string | undefined;
        if (parent && parent.phone && String(parent.phone).trim()) {
            const cleanPhone = String(parent.phone).trim();
            const cleanEmail = parent.email && String(parent.email).trim() ? String(parent.email).trim().toLowerCase() : undefined;
            const cleanName = parent.name && String(parent.name).trim() ? String(parent.name).trim() : 'Parent / Guardian';

            const existingParent = await prisma.parent.findFirst({ where: { phone: cleanPhone } });
            if (existingParent) {
                parentId = existingParent.id;
            } else {
                const newParent = await prisma.parent.create({
                    data: {
                        name: cleanName,
                        phone: cleanPhone,
                        email: cleanEmail,
                    }
                });
                parentId = newParent.id;
            }
        }

        // Resolve branchId with fallback
        let branchId = studentData.branchId || req.user?.branchId;
        if (!branchId) {
            const firstBranch = await prisma.branch.findFirst();
            if (firstBranch) {
                branchId = firstBranch.id;
            } else {
                const newBranch = await prisma.branch.create({
                    data: { name: 'Main Campus', address: 'Bhadrawati' }
                });
                branchId = newBranch.id;
            }
        }

        // Handle dateOfBirth formatting for Prisma DateTime
        let dateOfBirth: Date | undefined = undefined;
        if (studentData.dateOfBirth) {
            const parsed = new Date(studentData.dateOfBirth);
            if (!isNaN(parsed.getTime())) {
                dateOfBirth = parsed;
            }
        }

        // Explicitly build the Prisma student payload without unknown properties
        const cleanEmail = studentData.email && String(studentData.email).trim() ? String(studentData.email).trim().toLowerCase() : undefined;

        const student = await prisma.student.create({
            data: {
                name: String(studentData.name || '').trim(),
                class: tradeClass,
                section: studentData.section ? String(studentData.section).trim() : undefined,
                rollNumber: studentData.rollNumber ? String(studentData.rollNumber).trim() : autoRollNumber,
                studentId,
                email: cleanEmail,
                gender: studentData.gender ? String(studentData.gender).trim() : undefined,
                dateOfBirth,
                address: studentData.address ? String(studentData.address).trim() : undefined,
                photo: studentData.photo || undefined,
                signature: studentData.signature || undefined,
                category: studentData.category ? String(studentData.category).trim() : undefined,
                bloodGroup: studentData.bloodGroup ? String(studentData.bloodGroup).trim() : undefined,
                landline: studentData.landline ? String(studentData.landline).trim() : undefined,
                educationDetails: studentData.educationDetails ? studentData.educationDetails : undefined,
                submittedDocuments: studentData.submittedDocuments ? studentData.submittedDocuments : undefined,
                branchId,
                parentId,
            },
            include: { parent: true, branch: { select: { name: true } } },
        });

        // ─── Auto Assign Fee Structure if Selected During Admission ──────────────
        if (feeStructureId) {
            try {
                const feeStruct = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
                if (feeStruct) {
                    const finalAmount = customTotalAmount ? Number(customTotalAmount) : feeStruct.totalAmount;
                    await prisma.studentFee.upsert({
                        where: {
                            studentId_feeStructureId_academicYear: {
                                studentId: student.id,
                                feeStructureId,
                                academicYear: feeStruct.academicYear,
                            }
                        },
                        update: { totalAmount: finalAmount },
                        create: {
                            studentId: student.id,
                            feeStructureId,
                            totalAmount: finalAmount,
                            paidAmount: 0,
                            academicYear: feeStruct.academicYear,
                        }
                    });
                }
            } catch (feeErr) {
                console.warn('Auto assign fee structure notice:', feeErr);
            }
        }

        // ─── Generate Student Login Account ────────────────────────────────────
        const passwordHash = await bcrypt.hash(studentId, 12);
        const generatedEmail = `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.saiiti.edu.in`;
        const primaryEmail = cleanEmail || generatedEmail;

        try {
            const existingUser = await prisma.user.findUnique({ where: { email: primaryEmail } });
            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        name: student.name,
                        email: primaryEmail,
                        passwordHash,
                        role: 'STUDENT',
                        branchId: student.branchId,
                    }
                });
            }
        } catch (userErr) {
            console.warn('Student login creation notice:', userErr);
        }
        
        // Return login credentials to frontend
        const loginDetails = {
            email: primaryEmail,
            studentId,
            defaultPassword: studentId
        };

        try {
            await createAuditLog(req.user!.id, AuditAction.STUDENT_CREATED, 'Student', student.id, { studentId }, req.ip);
        } catch {}

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

        let dateOfBirth: Date | null | undefined = undefined;
        if ('dateOfBirth' in updateData) {
            if (updateData.dateOfBirth) {
                const parsed = new Date(updateData.dateOfBirth);
                dateOfBirth = !isNaN(parsed.getTime()) ? parsed : null;
            } else {
                dateOfBirth = null;
            }
        }

        const validFields = [
            'name', 'class', 'section', 'rollNumber', 'email', 'gender',
            'address', 'photo', 'signature', 'category', 'bloodGroup',
            'landline', 'educationDetails', 'submittedDocuments', 'isActive', 'branchId'
        ];

        const sanitizedUpdate: any = {};
        for (const field of validFields) {
            if (field in updateData) {
                sanitizedUpdate[field] = updateData[field] === '' ? null : updateData[field];
            }
        }
        if (dateOfBirth !== undefined) {
            sanitizedUpdate.dateOfBirth = dateOfBirth;
        }

        const student = await prisma.student.update({
            where: { id: req.params.id },
            data: sanitizedUpdate,
        });

        try {
            await createAuditLog(req.user!.id, AuditAction.STUDENT_UPDATED, 'Student', student.id, updateData, req.ip);
        } catch {}
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
