const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing search query with "kishor"...');
    const search = 'kishor'; // Test search string
    try {
        const students = await prisma.student.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                    { rollNumber: { contains: search, mode: 'insensitive' } },
                    { class: { contains: search, mode: 'insensitive' } },
                    { studentFees: { some: { academicYear: { contains: search, mode: 'insensitive' } } } },
                ]
            },
            take: 10
        });
        console.log(`Success! Found ${students.length} students:`, students.map(s => ({ id: s.id, name: s.name, studentId: s.studentId })));
    } catch (err) {
        console.error('Prisma query failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
