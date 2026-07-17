import { prisma } from '../utils/prisma';
import { generateStudentId } from '../utils/uuid';
import bcrypt from 'bcryptjs';

async function migrate() {
    console.log('🔄 Starting Student ID Migration to SITI-YEAR-E01 format...');

    const students = await prisma.student.findMany({
        orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${students.length} student(s) to check.`);

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const yearCreated = new Date(student.createdAt).getFullYear();
        const rollNum = student.rollNumber || (i + 1);
        const newStudentId = generateStudentId(student.class || 'Electrician', rollNum, yearCreated);

        const oldStudentId = student.studentId;
        const oldEmail = `${oldStudentId.toLowerCase()}@student.saiiti.edu.in`;
        const newEmail = `${newStudentId.toLowerCase()}@student.saiiti.edu.in`;

        console.log(`Migrating student ${student.name}: ${oldStudentId} -> ${newStudentId}`);

        // Update Student Record
        await prisma.student.update({
            where: { id: student.id },
            data: { studentId: newStudentId },
        });

        // Update corresponding User Account if exists
        const userAccount = await prisma.user.findFirst({ where: { email: oldEmail } });
        if (userAccount) {
            const newPasswordHash = await bcrypt.hash(newStudentId, 12);
            await prisma.user.update({
                where: { id: userAccount.id },
                data: {
                    email: newEmail,
                    passwordHash: newPasswordHash,
                },
            });
            console.log(`  Updated login user: ${oldEmail} -> ${newEmail}`);
        }
    }

    console.log('✅ Student ID Migration Completed Successfully!');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
