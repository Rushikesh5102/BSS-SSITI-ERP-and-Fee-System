import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeStudents() {
    console.log('🧹 Purging student data from database...');

    try {
        // 1. Delete receipts and payments
        const deletedReceipts = await prisma.receipt.deleteMany({});
        console.log(`- Deleted receipts: ${deletedReceipts.count}`);

        const deletedPayments = await prisma.payment.deleteMany({});
        console.log(`- Deleted payments: ${deletedPayments.count}`);

        // 2. Delete student fees
        const deletedFees = await prisma.studentFee.deleteMany({});
        console.log(`- Deleted student fees: ${deletedFees.count}`);

        // 3. Delete student book issues & reservations if any
        try {
            const deletedBookIssues = await prisma.bookIssue.deleteMany({ where: { studentId: { not: null } } });
            console.log(`- Deleted student book issues: ${deletedBookIssues.count}`);
        } catch (e) {}

        try {
            const deletedBookReservations = await prisma.bookReservation.deleteMany({ where: { studentId: { not: null } } });
            console.log(`- Deleted student book reservations: ${deletedBookReservations.count}`);
        } catch (e) {}

        // 4. Delete student stock transactions if any
        try {
            const deletedStock = await prisma.stockTransaction.deleteMany({ where: { studentId: { not: null } } });
            console.log(`- Deleted student stock transactions: ${deletedStock.count}`);
        } catch (e) {}

        // 5. Delete students
        const deletedStudents = await prisma.student.deleteMany({});
        console.log(`- Deleted students: ${deletedStudents.count}`);

        // 6. Delete parents
        const deletedParents = await prisma.parent.deleteMany({});
        console.log(`- Deleted parents: ${deletedParents.count}`);

        // 7. Delete student inquiries if model exists
        try {
            const anyPrisma = prisma as any;
            if (anyPrisma.studentInquiry) {
                const deletedInquiries = await anyPrisma.studentInquiry.deleteMany({});
                console.log(`- Deleted student inquiries: ${deletedInquiries.count}`);
            }
        } catch (e) {}

        console.log('✅ Student data successfully cleared!');
    } catch (err: any) {
        console.error('❌ Error purging student data:', err);
    } finally {
        await prisma.$disconnect();
    }
}

purgeStudents();
