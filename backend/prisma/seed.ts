import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';

import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create main branch
    const branch = await prisma.branch.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Sai ITI Main Campus',
            address: 'Near Bus Stand, Pune, Maharashtra - 411001',
            phone: '+912012345678',
            email: 'info@saiiti.edu.in',
        },
    });
    console.log(`✅ Branch created: ${branch.name}`);

    // Create SuperAdmin user
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@saiiti.edu.in' },
        update: {},
        create: {
            name: 'Super Administrator',
            email: 'superadmin@saiiti.edu.in',
            passwordHash,
            role: Role.SUPERADMIN,
            branchId: branch.id,
        },
    });
    console.log(`✅ SuperAdmin: ${superAdmin.email} / Admin@123`);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@saiiti.edu.in' },
        update: {},
        create: {
            name: 'Branch Administrator',
            email: 'admin@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Admin@123', 12),
            role: Role.ADMIN,
            branchId: branch.id,
        },
    });
    console.log(`✅ Admin: ${admin.email} / Admin@123`);

    // Create Accountant
    const accountant = await prisma.user.upsert({
        where: { email: 'accountant@saiiti.edu.in' },
        update: {},
        create: {
            name: 'Fee Accountant',
            email: 'accountant@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Accountant@123', 12),
            role: Role.ACCOUNTANT,
            branchId: branch.id,
        },
    });
    console.log(`✅ Accountant: ${accountant.email} / Accountant@123`);

    // Create Teacher
    await prisma.user.upsert({
        where: { email: 'teacher@saiiti.edu.in' },
        update: {},
        create: {
            name: 'Class Teacher',
            email: 'teacher@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Teacher@123', 12),
            role: Role.TEACHER,
            branchId: branch.id,
        },
    });
    console.log(`✅ Teacher: teacher@saiiti.edu.in / Teacher@123`);

    // Create Developer / System Health User
    const developer = await prisma.user.upsert({
        where: { email: 'pattiwarrushikesh5102@gmail.com' },
        update: { role: Role.DEVELOPER },
        create: {
            name: 'Rushikesh Pattiwar',
            email: 'pattiwarrushikesh5102@gmail.com',
            passwordHash: await bcrypt.hash('Rushikesh@5102', 12),
            role: Role.DEVELOPER,
            branchId: branch.id,
        },
    });
    console.log(`✅ Developer: ${developer.email} / Rushikesh@5102`);

    // Create System Automated User for webhook executions
    const systemUser = await prisma.user.upsert({
        where: { email: 'system@saiiti.edu.in' },
        update: { role: Role.SUPERADMIN },
        create: {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'System Automated',
            email: 'system@saiiti.edu.in',
            passwordHash: await bcrypt.hash('System@123', 12),
            role: Role.SUPERADMIN,
            branchId: branch.id,
        },
    });
    console.log(`✅ System Automated User seeded: ${systemUser.email}`);

    // Seed fee categories
    const categories = [
        { name: 'Tuition Fee', description: 'Monthly tuition charges' },
        { name: 'Transport Fee', description: 'Bus/vehicle transportation charges' },
        { name: 'Hostel Fee', description: 'Boarding and lodging charges' },
        { name: 'Exam Fee', description: 'Examination and assessment charges' },
        { name: 'Miscellaneous', description: 'Books, uniforms, and other charges' },
    ];

    for (const cat of categories) {
        await prisma.feeCategory.upsert({
            where: { id: `cat-${cat.name.toLowerCase().replace(/\s/g, '-')}` },
            update: {},
            create: {
                id: `cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`,
                name: cat.name,
                description: cat.description,
            },
        });
    }
    console.log(`✅ Fee categories seeded`);

    // Sample fee structure (amounts in paise, so ₹50000 = 5000000)
    const tuitionCat = await prisma.feeCategory.findFirst({ where: { name: 'Tuition Fee' } });
    const transportCat = await prisma.feeCategory.findFirst({ where: { name: 'Transport Fee' } });
    const examCat = await prisma.feeCategory.findFirst({ where: { name: 'Exam Fee' } });

    const feeStructure = await prisma.feeStructure.upsert({
        where: { id: 'fs-iti-electrician-2024-25' },
        update: {},
        create: {
            id: 'fs-iti-electrician-2024-25',
            name: 'Electrician Trade - 2024-25',
            academicYear: '2024-25',
            class: 'Electrician',
            totalAmount: 2500000, // ₹25,000 in paise
            branchId: branch.id,
            items: {
                create: [
                    { feeCategoryId: tuitionCat!.id, amount: 1800000 },  // ₹18,000
                    { feeCategoryId: transportCat!.id, amount: 500000 }, // ₹5,000
                    { feeCategoryId: examCat!.id, amount: 200000 },      // ₹2,000
                ],
            },
        },
    });
    console.log(`✅ Fee structure: ${feeStructure.name}`);

    // Sample parent
    const parent = await prisma.parent.create({
        data: {
            name: 'Ramesh Sharma',
            phone: '+919876543210',
            email: 'ramesh.sharma@gmail.com',
        },
    });

    // Sample student
    const student = await prisma.student.upsert({
        where: { studentId: 'SAI-2024-001' },
        update: {},
        create: {
            studentId: 'SAI-2024-001',
            name: 'Rahul Sharma',
            class: 'Electrician',
            section: 'A',
            rollNumber: '01',
            gender: 'Male',
            branchId: branch.id,
            parentId: parent.id,
        },
    });
    console.log(`✅ Sample student: SAI-2024-001`);

    // Create Sample Student User Account
    await prisma.user.upsert({
        where: { email: 'sai-2024-001@student.saiiti.edu.in' },
        update: {},
        create: {
            name: 'Rahul Sharma',
            email: 'sai-2024-001@student.saiiti.edu.in',
            passwordHash: await bcrypt.hash('SAI-2024-001', 12),
            role: 'STUDENT',
            branchId: branch.id,
        },
    });
    console.log(`✅ Sample Student User: sai-2024-001@student.saiiti.edu.in / SAI-2024-001`);

    console.log('\n🎉 Seeding complete!');
    console.log('─────────────────────────────────────────');
    console.log('Login credentials:');
    console.log('  SuperAdmin → superadmin@saiiti.edu.in / Admin@123');
    console.log('  Admin      → admin@saiiti.edu.in      / Admin@123');
    console.log('  Accountant → accountant@saiiti.edu.in / Accountant@123');
    console.log('  Teacher    → teacher@saiiti.edu.in    / Teacher@123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
