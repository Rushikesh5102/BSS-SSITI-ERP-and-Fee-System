import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeSession(raw: any, fallbackYear = 2026): string {
    if (raw && typeof raw === 'string' && raw.trim()) {
        const cleaned = raw.replace(/\s+/g, '');
        if (cleaned.includes('-')) return cleaned;
        const yr = parseInt(cleaned);
        if (!isNaN(yr)) return `${yr}-${yr + 2}`;
    }
    return `${fallbackYear}-${fallbackYear + 2}`;
}

async function migrate() {
    console.log('🔄 Starting Student Fee Session & Trade Structure Migration...');

    // 1. Update Master Fee Structures to 2026-2028
    const feeStructuresToUpdate = [
        { id: 'fs-electrician-2024-2026', name: 'Electrician (2-Year Program) — 2026-2028', academicYear: '2026-2028', class: 'Electrician' },
        { id: 'fs-fitter-2024-2026', name: 'Fitter (2-Year Program) — 2026-2028', academicYear: '2026-2028', class: 'Fitter' },
        { id: 'fs-welder-2024-2026', name: 'Welder (1-Year Program) — 2026-2028', academicYear: '2026-2028', class: 'Welder' },
        { id: 'fs-copa-2024-2026', name: 'COPA (1-Year Program) — 2026-2028', academicYear: '2026-2028', class: 'COPA' },
    ];

    for (const fsItem of feeStructuresToUpdate) {
        const existing = await prisma.feeStructure.findUnique({ where: { id: fsItem.id } });
        if (existing) {
            await prisma.feeStructure.update({
                where: { id: fsItem.id },
                data: {
                    name: fsItem.name,
                    academicYear: fsItem.academicYear,
                }
            });
            console.log(`  ✓ Updated fee structure ${fsItem.id} -> ${fsItem.name} (${fsItem.academicYear})`);
        }
    }

    // 2. Fetch all students with their fee allocations
    const students = await prisma.student.findMany({
        include: {
            studentFees: {
                include: {
                    feeStructure: true,
                    payments: true,
                }
            }
        }
    });

    console.log(`\n📋 Found ${students.length} students to check and sync:`);

    for (const s of students) {
        const session = normalizeSession((s.educationDetails as any)?.academicSession, s.createdAt ? new Date(s.createdAt).getFullYear() : 2026);
        const studentTrade = s.class || 'Electrician';

        // Find appropriate trade fee structure
        let targetFeeStructure = await prisma.feeStructure.findFirst({
            where: {
                class: { equals: studentTrade, mode: 'insensitive' },
                academicYear: session,
            }
        });

        if (!targetFeeStructure) {
            // Fallback by class name
            targetFeeStructure = await prisma.feeStructure.findFirst({
                where: {
                    class: { equals: studentTrade, mode: 'insensitive' },
                }
            });
        }

        // Normalize student educationDetails academicSession in DB
        const currentEdu: any = s.educationDetails || {};
        if (currentEdu.academicSession !== session) {
            await prisma.student.update({
                where: { id: s.id },
                data: {
                    educationDetails: {
                        ...currentEdu,
                        academicSession: session,
                    }
                }
            });
            console.log(`  ✓ Normalized academicSession on student ${s.name} (${s.studentId}) -> '${session}'`);
        }

        // Now sync each StudentFee record
        for (const sf of s.studentFees) {
            const needsSessionUpdate = sf.academicYear !== session;
            const needsStructureUpdate = targetFeeStructure && sf.feeStructureId !== targetFeeStructure.id;

            if (needsSessionUpdate || needsStructureUpdate) {
                const newStructureId = (targetFeeStructure && needsStructureUpdate) ? targetFeeStructure.id : sf.feeStructureId;
                await prisma.studentFee.update({
                    where: { id: sf.id },
                    data: {
                        academicYear: session,
                        feeStructureId: newStructureId,
                    }
                });
                console.log(`  ✓ Synced StudentFee ${sf.id} for ${s.name}:`);
                console.log(`      AcademicYear: '${sf.academicYear}' -> '${session}'`);
                console.log(`      FeeStructure: '${sf.feeStructure?.name}' -> '${targetFeeStructure?.name}'`);
                console.log(`      Total: Rs. ${sf.totalAmount / 100}, Paid: Rs. ${sf.paidAmount / 100}, Payments: ${sf.payments.length}`);
            } else {
                console.log(`  - StudentFee ${sf.id} for ${s.name} already in sync (${session})`);
            }
        }
    }

    // 3. Verification of all Payments
    const allPayments = await prisma.payment.findMany({
        include: {
            receipt: true,
            studentFee: {
                include: {
                    student: true,
                    feeStructure: true,
                }
            }
        }
    });

    console.log(`\n💳 Verified ${allPayments.length} payments:`);
    for (const p of allPayments) {
        console.log(`  ✓ Payment ${p.id}: Rs. ${p.amount / 100} for ${p.studentFee.student.name} (${p.studentFee.student.studentId}) | AY: ${p.studentFee.academicYear} | Trade: ${p.studentFee.feeStructure?.name} | Receipt: ${p.receipt?.receiptNumber || 'N/A'}`);
    }

    console.log('\n🎉 Migration completed successfully!');
}

migrate()
    .catch((err) => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
