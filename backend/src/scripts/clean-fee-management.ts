import { prisma } from '../utils/prisma';

async function main() {
    console.log('🧹 Starting Fee Management Database Cleanup...');

    // 1. Delete Receipts
    const deletedReceipts = await prisma.receipt.deleteMany({});
    console.log(`✅ Deleted ${deletedReceipts.count} receipts`);

    // 2. Delete Payments
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    // 3. Reset paidAmount in StudentFee to 0
    const updatedFees = await prisma.studentFee.updateMany({
        data: {
            paidAmount: 0
        }
    });
    console.log(`✅ Reset paidAmount to 0 for ${updatedFees.count} student fee records`);

    console.log('🎉 Fee Management System is now fresh and ready for production!');
}

main()
    .catch((e) => {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
