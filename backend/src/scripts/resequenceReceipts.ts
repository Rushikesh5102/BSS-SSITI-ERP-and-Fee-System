import { prisma } from '../utils/prisma';
import { generateReceiptNumber } from '../utils/uuid';

async function resequenceReceipts() {
    console.log('🔄 Starting receipt number re-sequencing...');
    const receipts = await prisma.receipt.findMany({
        orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${receipts.length} existing receipts to resequence.`);

    let count = 0;
    for (const r of receipts) {
        count++;
        const newReceiptNo = generateReceiptNumber(count);
        await prisma.receipt.update({
            where: { id: r.id },
            data: { receiptNumber: newReceiptNo },
        });
        console.log(`Updated Receipt ${r.id} -> ${newReceiptNo}`);
    }

    console.log('✅ All receipts successfully re-sequenced!');
    await prisma.$disconnect();
}

resequenceReceipts().catch((err) => {
    console.error('❌ Resequencing error:', err);
    process.exit(1);
});
