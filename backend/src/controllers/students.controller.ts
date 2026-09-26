import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createAuditLog } from '../middleware/auditLogger';

import { AuditAction, Role } from '../types/enums';
import { generateStudentId } from '../utils/uuid';
import bcrypt from 'bcryptjs';

// Receipt storage directory for unlinking cached student receipt PDFs upon deletion
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

export function getStudentSession(student: { educationDetails?: any; createdAt?: Date | string } | null | undefined): string {
    const raw = (student?.educationDetails as any)?.academicSession;
    if (raw && typeof raw === 'string' && raw.trim()) {
        const cleaned = raw.replace(/\s+/g, '');
        if (cleaned.includes('-')) return cleaned;
        const yr = parseInt(cleaned);
        if (!isNaN(yr)) return `${yr}-${yr + 2}`;
    }
    const year = student?.createdAt ? new Date(student.createdAt).getFullYear() : new Date().getFullYear();
    return `${year}-${year + 2}`;
}

export const studentsController = {
    // GET /students - Returns paginated list of students filtered by branch, trade, or search string
    list: asyncHandler(async (req: Request, res: Response) => {
        const { page = 1, limit = 25, search = '', class: cls = '' } = req.query;
        let parsedPage = Number(page);
        let parsedLimit = Number(limit);
        
        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) parsedLimit = 25;

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
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ],
                include: {
                    parent: { select: { name: true, phone: true, email: true } },
                    branch: { select: { name: true } },
                    studentFees: {
                        select: {
                            id: true,
                            totalAmount: true,
                            paidAmount: true,
                            academicYear: true,
                            feeStructure: { select: { id: true, name: true, academicYear: true, class: true } },
                        },
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
            const candidate = generateStudentId(tradeClass, autoRollNumber);
            const existing = await prisma.student.findUnique({ where: { studentId: candidate }, select: { id: true } });
            if (existing) {
                // Batch query all existing IDs for this trade prefix in 1 query instead of sequential loop queries
                const prefix = candidate.substring(0, candidate.lastIndexOf('-') + 1);
                const sameTradeStudents = await prisma.student.findMany({
                    where: { studentId: { startsWith: prefix } },
                    select: { studentId: true }
                });
                const takenIds = new Set(sameTradeStudents.map(s => s.studentId));
                let rollNum = countInTrade + 1;
                while (takenIds.has(generateStudentId(tradeClass, rollNum))) {
                    rollNum++;
                }
                studentId = generateStudentId(tradeClass, rollNum);
            } else {
                studentId = candidate;
            }
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

        // ─── Auto Assign Fee Structure (Strictly Synced with Student's Trade & Session) ──
        const studentSession = getStudentSession({ educationDetails: studentData.educationDetails, createdAt: student.createdAt });
        let targetFeeStructId = feeStructureId;

        if (!targetFeeStructId) {
            const matchingStruct = await prisma.feeStructure.findFirst({
                where: {
                    class: { equals: tradeClass, mode: 'insensitive' },
                    academicYear: studentSession,
                }
            }) || await prisma.feeStructure.findFirst({
                where: {
                    class: { equals: tradeClass, mode: 'insensitive' },
                }
            });
            if (matchingStruct) {
                targetFeeStructId = matchingStruct.id;
            }
        }

        if (targetFeeStructId) {
            try {
                const feeStruct = await prisma.feeStructure.findUnique({ where: { id: targetFeeStructId } });
                if (feeStruct) {
                    const finalAmount = customTotalAmount ? Number(customTotalAmount) : feeStruct.totalAmount;
                    await prisma.studentFee.upsert({
                        where: {
                            studentId_feeStructureId_academicYear: {
                                studentId: student.id,
                                feeStructureId: feeStruct.id,
                                academicYear: studentSession,
                            }
                        },
                        update: { totalAmount: finalAmount },
                        create: {
                            studentId: student.id,
                            feeStructureId: feeStruct.id,
                            totalAmount: finalAmount,
                            paidAmount: 0,
                            academicYear: studentSession,
                        }
                    });
                }
            } catch (feeErr) {
                console.warn('Auto assign fee structure notice:', feeErr);
            }
        }

        // ─── Generate Student Login Account ────────────────────────────────────
        const passwordHash = await bcrypt.hash(studentId, 10);
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
                branch: true,
                issuedItems: {
                    include: { item: true },
                    orderBy: { createdAt: 'desc' }
                },
                bookIssues: {
                    include: { book: true },
                    orderBy: { issueDate: 'desc' }
                },
                studentFees: {
                    include: {
                        feeStructure: { 
                            select: { 
                                name: true, 
                                academicYear: true,
                                items: { include: { feeCategory: true } } 
                            } 
                        },
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

        // ── Capture before-state for audit diff ────────────────────────────────
        const beforeStudent = await prisma.student.findUnique({
            where: { id: req.params.id },
            select: {
                name: true, class: true, section: true, rollNumber: true,
                email: true, gender: true, address: true, category: true,
                bloodGroup: true, landline: true, isActive: true,
                dateOfBirth: true, educationDetails: true,
            }
        });

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

        if (updateData.educationDetails && updateData.educationDetails.academicSession) {
            const newSession = getStudentSession({ educationDetails: updateData.educationDetails });
            await prisma.studentFee.updateMany({
                where: { studentId: student.id },
                data: { academicYear: newSession }
            });
        }

        // Build after-state for diff (only fields that were actually changed)
        const afterState: Record<string, unknown> = {};
        for (const field of validFields) {
            if (field in sanitizedUpdate) afterState[field] = sanitizedUpdate[field];
        }

        try {
            await createAuditLog(
                req.user!.id,
                AuditAction.STUDENT_UPDATED,
                'Student',
                student.id,
                {
                    studentName: student.name,
                    studentCode: (student as any).studentId,
                    before: beforeStudent || {},
                    after: afterState,
                },
                req.ip
            );
        } catch {}
        res.json({ success: true, data: student });
    }),

    /**
     * DELETE /students/:id
     * Complete Administrative Cascade Deletion:
     * When fee accountant/admin deletes a profile, all records related to that profile:
     * receipts, receipt PDF files, payment records, payment history, student fees,
     * tool issue transactions, library records, and the student login account are completely purged.
     */
    delete: asyncHandler(async (req: Request, res: Response) => {
        const student = await prisma.student.findUnique({
            where: { id: req.params.id },
            include: {
                studentFees: {
                    include: {
                        payments: {
                            include: { receipt: true }
                        }
                    }
                }
            }
        });

        if (!student) {
            throw new AppError(404, 'Student record not found');
        }

        const studentFeeIds = student.studentFees.map(f => f.id);
        const payments = student.studentFees.flatMap(f => f.payments);
        const paymentIds = payments.map(p => p.id);
        const receipts = payments.map(p => p.receipt).filter(Boolean);
        const receiptIds = receipts.map(r => r!.id);
        const receiptNumbers = receipts.map(r => r!.receiptNumber);

        // 1. Delete physical cached PDF files from disk
        for (const rNum of receiptNumbers) {
            const p = path.join(RECEIPTS_DIR, `${rNum}.pdf`);
            if (fs.existsSync(p)) {
                try {
                    fs.unlinkSync(p);
                } catch (fsErr) {
                    console.warn(`Could not delete PDF file ${p}:`, fsErr);
                }
            }
        }

        // 2. Perform complete cascade deletion in a database transaction
        await prisma.$transaction(async (tx) => {
            // Delete all receipts linked to student's payments
            if (receiptIds.length > 0) {
                await tx.receipt.deleteMany({
                    where: { id: { in: receiptIds } }
                });
            }

            // Delete all payment records / history linked to student's fees
            if (paymentIds.length > 0) {
                await tx.payment.deleteMany({
                    where: { id: { in: paymentIds } }
                });
            }

            // Delete all assigned student fee structures
            if (studentFeeIds.length > 0) {
                await tx.studentFee.deleteMany({
                    where: { id: { in: studentFeeIds } }
                });
            }

            // Delete workshop tool stock transactions linked to student
            await tx.stockTransaction.deleteMany({
                where: { studentId: student.id }
            });

            // Delete library issues & reservations
            await tx.bookReservation.deleteMany({
                where: { studentId: student.id }
            });
            await tx.bookIssue.deleteMany({
                where: { studentId: student.id }
            });

            // Delete student portal login user account (if exists)
            const cleanStudentId = student.studentId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const generatedEmail = `${cleanStudentId}@student.saiiti.edu.in`;
            const emailsToDelete = [student.email, generatedEmail].filter(Boolean) as string[];
            if (emailsToDelete.length > 0) {
                await tx.user.deleteMany({
                    where: {
                        email: { in: emailsToDelete },
                        role: 'STUDENT'
                    }
                });
            }

            // Delete the student profile itself
            await tx.student.delete({
                where: { id: student.id }
            });

            // Clean up parent record if no other students are linked
            if (student.parentId) {
                const otherChildren = await tx.student.count({
                    where: {
                        parentId: student.parentId,
                        id: { not: student.id }
                    }
                });
                if (otherChildren === 0) {
                    await tx.parent.delete({
                        where: { id: student.parentId }
                    }).catch(() => {});
                }
            }
        });

        // 3. Record official audit log for administrative compliance
        try {
            await createAuditLog(
                req.user!.id,
                AuditAction.STUDENT_DELETED,
                'Student',
                student.id,
                {
                    studentId: student.studentId,
                    name: student.name,
                    class: student.class,
                    deletedReceiptsCount: receiptIds.length,
                    deletedPaymentsCount: paymentIds.length,
                    deletedFeesCount: studentFeeIds.length,
                    deletedBy: req.user?.email,
                    role: req.user?.role,
                    reason: req.body?.reason || 'Complete Profile Cascade Deletion'
                },
                req.ip
            );
        } catch (auditErr) {
            console.warn('Student deletion audit log notice:', auditErr);
        }

        res.json({
            success: true,
            message: `Student profile ${student.name} (${student.studentId}) and all associated records (fees, payment history, and receipts) were completely deleted successfully.`
        });
    }),
};
