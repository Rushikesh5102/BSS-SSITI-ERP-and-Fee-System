import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const Role = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'ACCOUNTANT',
    TEACHER: 'TEACHER',
    PARENT: 'PARENT',
    STUDENT: 'STUDENT',
    DEVELOPER: 'DEVELOPER',
    STORE_MANAGER: 'STORE_MANAGER',
    LIBRARIAN: 'LIBRARIAN',
} as const;

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Purging all test & dummy data from Database (Fresh Initialization)...');

    const safeDelete = async (fn: () => Promise<any>, tableName: string) => {
        try {
            await fn();
        } catch (err: any) {
            // Table might not exist yet before initial schema push
        }
    };

    // 1. Clean transactions & receipts
    await safeDelete(() => prisma.receipt.deleteMany({}), 'receipt');
    await safeDelete(() => prisma.payment.deleteMany({}), 'payment');
    await safeDelete(() => prisma.studentFee.deleteMany({}), 'studentFee');

    // 2. Clean students & parents
    await safeDelete(() => prisma.student.deleteMany({}), 'student');
    await safeDelete(() => prisma.parent.deleteMany({}), 'parent');

    // 3. Clean store inventory & transactions
    await safeDelete(() => prisma.stockTransaction.deleteMany({}), 'stockTransaction');
    await safeDelete(() => prisma.storeItem.deleteMany({}), 'storeItem');

    // 4. Clean library movements, issues, reservations & books
    await safeDelete(() => prisma.bookMovementLog.deleteMany({}), 'bookMovementLog');
    await safeDelete(() => prisma.bookIssue.deleteMany({}), 'bookIssue');
    await safeDelete(() => prisma.bookReservation.deleteMany({}), 'bookReservation');
    await safeDelete(() => prisma.book.deleteMany({}), 'book');

    // 5. Clean system logs & notifications
    await safeDelete(() => prisma.auditLog.deleteMany({}), 'auditLog');
    await safeDelete(() => prisma.notification.deleteMany({}), 'notification');

    console.log('✅ Purged all dummy records. Ready for fresh production startup.');
    console.log('🌱 Initializing official institutional accounts & trade fee structures...');

    // Main Institute Branch
    const branch = await prisma.branch.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Shri Sai Private ITI Main Campus',
            address: 'Near Bus Stand, Bhadrawati, Chandrapur, Maharashtra - 442902',
            phone: '+91 9529054868',
            email: 'info@saiiti.edu.in',
        },
    });
    console.log(`✅ Main Branch: ${branch.name}`);

    // System Automated User
    await prisma.user.upsert({
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

    // 1. Super Administrator
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@saiiti.edu.in' },
        update: { role: Role.SUPERADMIN, passwordHash: await bcrypt.hash('Admin@123', 12) },
        create: {
            name: 'Super Administrator',
            email: 'superadmin@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Admin@123', 12),
            role: Role.SUPERADMIN,
            branchId: branch.id,
        },
    });
    console.log(`✅ SuperAdmin: ${superAdmin.email}`);

    // 2. Branch Administrator (Admin)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@saiiti.edu.in' },
        update: { role: Role.ADMIN, passwordHash: await bcrypt.hash('Admin@123', 12) },
        create: {
            name: 'Branch Administrator',
            email: 'admin@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Admin@123', 12),
            role: Role.ADMIN,
            branchId: branch.id,
        },
    });
    console.log(`✅ Admin: ${admin.email}`);

    // 3. Fee Accountant
    const accountant = await prisma.user.upsert({
        where: { email: 'accountant@saiiti.edu.in' },
        update: { role: Role.ACCOUNTANT, passwordHash: await bcrypt.hash('Accountant@123', 12) },
        create: {
            name: 'Fee Accountant',
            email: 'accountant@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Accountant@123', 12),
            role: Role.ACCOUNTANT,
            branchId: branch.id,
        },
    });
    console.log(`✅ Accountant: ${accountant.email}`);

    // 4. Workshop Store Manager
    const storeManager = await prisma.user.upsert({
        where: { email: 'storemanager@saiiti.edu.in' },
        update: { role: Role.STORE_MANAGER, passwordHash: await bcrypt.hash('Store@123', 12) },
        create: {
            name: 'Workshop Store Manager',
            email: 'storemanager@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Store@123', 12),
            role: Role.STORE_MANAGER,
            branchId: branch.id,
        },
    });
    console.log(`✅ Store Manager: ${storeManager.email}`);

    // 5. Chief Librarian
    const librarian = await prisma.user.upsert({
        where: { email: 'librarian@saiiti.edu.in' },
        update: { role: Role.LIBRARIAN, passwordHash: await bcrypt.hash('Library@123', 12) },
        create: {
            name: 'Chief Librarian',
            email: 'librarian@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Library@123', 12),
            role: Role.LIBRARIAN,
            branchId: branch.id,
        },
    });
    console.log(`✅ Librarian: ${librarian.email}`);

    // 6. Faculty / Teacher
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@saiiti.edu.in' },
        update: { role: Role.TEACHER, passwordHash: await bcrypt.hash('Teacher@123', 12) },
        create: {
            name: 'Senior Trade Instructor',
            email: 'teacher@saiiti.edu.in',
            passwordHash: await bcrypt.hash('Teacher@123', 12),
            role: Role.TEACHER,
            branchId: branch.id,
        },
    });
    console.log(`✅ Faculty/Teacher: ${teacher.email}`);

    // 7. Developer / System Architect
    const developer = await prisma.user.upsert({
        where: { email: 'pattiwarrushikesh5102@gmail.com' },
        update: { role: Role.DEVELOPER, passwordHash: await bcrypt.hash('Rushikesh@5102', 12) },
        create: {
            name: 'Rushikesh Pattiwar',
            email: 'pattiwarrushikesh5102@gmail.com',
            passwordHash: await bcrypt.hash('Rushikesh@5102', 12),
            role: Role.DEVELOPER,
            branchId: branch.id,
        },
    });
    console.log(`✅ Developer: ${developer.email}`);

    // Standard Fee Categories
    const categories = [
        { name: 'Tuition Fee', description: 'Academic trade training and instruction charges' },
        { name: 'Exam Fee', description: 'Annual trade examination and assessment charges' },
        { name: 'Dress Material Fee', description: 'Workshop apron, safety uniform and dress material' },
        { name: 'Other Dues', description: 'Practical consumables, library, and other dues' },
    ];

    for (const cat of categories) {
        await prisma.feeCategory.upsert({
            where: { id: `cat-${cat.name.toLowerCase().replace(/\s/g, '-')}` },
            update: { description: cat.description },
            create: {
                id: `cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`,
                name: cat.name,
                description: cat.description,
            },
        });
    }
    console.log('✅ Standard Fee categories created (Tuition, Exam, Dress Material, Other Dues).');

    // Standard Fee Structures for 2-Year ITI Trades
    const tuitionCat = await prisma.feeCategory.findFirst({ where: { name: 'Tuition Fee' } });
    const examCat = await prisma.feeCategory.findFirst({ where: { name: 'Exam Fee' } });
    const dressCat = await prisma.feeCategory.findFirst({ where: { name: 'Dress Material Fee' } });

    const trades = [
        { id: 'fs-electrician-2024-2026', name: 'Electrician (2-Year Program)', class: 'Electrician' },
        { id: 'fs-fitter-2024-2026', name: 'Fitter (2-Year Program)', class: 'Fitter' },
        { id: 'fs-welder-2024-2026', name: 'Welder (1-Year Program)', class: 'Welder' },
        { id: 'fs-copa-2024-2026', name: 'COPA (1-Year Program)', class: 'COPA' },
    ];

    for (const tr of trades) {
        await prisma.feeStructure.upsert({
            where: { id: tr.id },
            update: {
                totalAmount: 2000000, // ₹20,000 in paise
            },
            create: {
                id: tr.id,
                name: `${tr.name} — 2024-2026`,
                academicYear: '2024-2026',
                class: tr.class,
                totalAmount: 2000000, // ₹20,000 in paise
                branchId: branch.id,
                items: {
                    create: [
                        { feeCategoryId: tuitionCat!.id, amount: 1500000 }, // ₹15,000
                        { feeCategoryId: examCat!.id, amount: 200000 },     // ₹2,000
                        { feeCategoryId: dressCat!.id, amount: 300000 },    // ₹3,000
                    ],
                },
            },
        });
    }
    console.log('✅ Standard trade fee structures created (Electrician, Fitter, Welder, COPA).');

    console.log('\n🚀 Software cleanly reset and initialized for fresh production use!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
