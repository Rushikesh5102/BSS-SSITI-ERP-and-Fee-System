const { PrismaClient } = require('c:/Users/Rushi/Desktop/Projects/Websites/Sai ITI Fee Management Software/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for payment fee breakdowns...");
  const payments = await prisma.payment.findMany({
    include: {
      studentFee: {
        include: {
          student: true
        }
      }
    }
  });

  console.log(`Found ${payments.length} payments.`);
  for (const p of payments) {
    const remarks = (p.remarks || '').trim();
    const remLower = remarks.toLowerCase();
    const student = p.studentFee?.student;
    const edu = student?.educationDetails || {};
    const dressMaterialPaise = edu.dressMaterialFee ? Math.round(parseFloat(edu.dressMaterialFee) * 100) : 250000;

    let feeBreakdown = [];

    if (remLower.includes('dress') || remLower.includes('uniform')) {
      if (remLower.includes('tution') || remLower.includes('tuition')) {
        // Combined payment: e.g. Rs. 5,000 -> Rs. 2,500 Dress + Rs. 2,500 Tuition
        const dressAmt = Math.min(dressMaterialPaise, p.amount);
        const tuitionAmt = Math.max(0, p.amount - dressAmt);
        feeBreakdown.push({ name: 'Dress Material & Uniform Fees', amount: dressAmt });
        if (tuitionAmt > 0) {
          feeBreakdown.push({ name: 'Tuition Fees', amount: tuitionAmt });
        }
      } else {
        // Pure dress material payment: e.g. Rs. 2,500
        feeBreakdown.push({ name: 'Dress Material & Uniform Fees', amount: p.amount });
      }
    } else if (remLower.includes('exam') || remLower.includes('supplementary')) {
      feeBreakdown.push({ name: 'Regular Examination Fees', amount: p.amount });
    } else if (remLower.includes('tool') || remLower.includes('other') || remLower.includes('dues')) {
      feeBreakdown.push({ name: 'Tools & Workshop Dues', amount: p.amount });
    } else {
      // Default / Tuition
      feeBreakdown.push({ name: 'Tuition Fees', amount: p.amount });
    }

    await prisma.payment.update({
      where: { id: p.id },
      data: {
        feeBreakdown: feeBreakdown
      }
    });

    console.log(`Updated payment ${p.id} (${student?.studentId} - ${student?.name}): Rs.${p.amount/100} -> ${JSON.stringify(feeBreakdown.map(fb => `${fb.name}: Rs.${fb.amount/100}`))}`);
  }

  console.log("Backfill completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
