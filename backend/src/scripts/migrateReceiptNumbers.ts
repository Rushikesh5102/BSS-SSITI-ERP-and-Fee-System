import { prisma } from '../utils/prisma';

async function migrateReceipts() {
    console.log('🔄 Migrating existing receipt numbers to SSITI- prefix...');

    const receipts = await prisma.receipt.findMany();
    console.log(`Found ${receipts.length} receipt(s).`);

    for (const r of receipts) {
        if (r.receiptNumber.startsWith('SAI-')) {
            const newNum = r.receiptNumber.replace(/^SAI-/, 'SSITI-');
            const newPdfUrl = r.pdfUrl?.replace(r.receiptNumber, newNum);

            await prisma.receipt.update({
                where: { id: r.id },
                data: {
                    receiptNumber: newNum,
                    pdfUrl: newPdfUrl,
                },
            });
            console.log(`Updated receipt ${r.receiptNumber} -> ${newNum}`);
        }
    }

    console.log('✅ Receipt Number Migration Completed!');
}

migrateReceipts().catch(console.error).finally(() => prisma.$disconnect());
