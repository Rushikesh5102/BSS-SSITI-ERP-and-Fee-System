import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  try {
    const logs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent Audit Logs in DB:', logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
