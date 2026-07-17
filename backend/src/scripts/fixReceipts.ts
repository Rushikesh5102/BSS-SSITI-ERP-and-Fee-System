import { prisma } from '../utils/prisma';
import { generateReceiptNumber } from '../utils/uuid';
import { generateReceiptPdf } from '../services/pdf.service';
import path from 'path';
import fs from 'fs';

async function main() {
    console.log('🔍 Checking for verified payments without receipts...');
    const payments = await prisma.payment.findMany({
        where: { status: 'VERIFIED', receipt: null },
        include: {
            studentFee: {
                include: {
                    student: { include: { parent: true } },
                    feeStructure: true,
                },
            },
        },
    });

    console.log(`Found ${payments.length} unreceipted payment(s).`);

    const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(RECEIPTS_DIR)) fs.mkdirSync(RECEIPTS_DIR, { recursive: true });

    for (const p of payments) {
        const receiptNumber = generateReceiptNumber();
        const pdfBuffer = await generateReceiptPdf({
            receiptNumber,
            studentName: p.studentFee.student.name,
            studentId: p.studentFee.student.studentId,
            className: p.studentFee.student.class,
            parentName: p.studentFee.student.parent?.name,
            parentPhone: p.studentFee.student.parent?.phone,
            paymentDate: p.createdAt,
            amount: p.amount,
            paymentMode: p.mode,
            transactionRef: p.transactionRef || undefined,
            feesFor: p.studentFee.feeStructure?.name || 'School Fee',
        });

        const pdfPath = path.join(RECEIPTS_DIR, `${receiptNumber}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);

        const receipt = await prisma.receipt.create({
            data: {
                receiptNumber,
                paymentId: p.id,
                pdfUrl: `/api/receipts/download/${receiptNumber}`,
                generatedById: p.recordedById,
            },
        });

        console.log(`✅ Generated receipt ${receipt.receiptNumber} for payment ${p.id}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
