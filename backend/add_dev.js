const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('Rushikesh@5102', 12);
    const email = 'pattiwarrushikesh5102@gmail.com';
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
        await prisma.user.create({
            data: {
                name: 'Rushikesh (Developer)',
                email: email,
                passwordHash: passwordHash,
                role: 'DEVELOPER',
                isActive: true
            }
        });
        console.log(`Developer account created: ${email}`);
    } else {
        await prisma.user.update({
            where: { email },
            data: { passwordHash, role: 'DEVELOPER' }
        });
        console.log(`Developer account updated: ${email}`);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
