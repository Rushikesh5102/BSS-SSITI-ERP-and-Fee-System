const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding missing fee categories...');
    const categories = [
        { name: 'Dress Material Fee', description: 'Charges for uniform and dress materials' },
        { name: 'Other Dues', description: 'Other school charges and activities' },
    ];

    for (const cat of categories) {
        const id = `cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`;
        const record = await prisma.feeCategory.upsert({
            where: { id },
            update: { name: cat.name, description: cat.description },
            create: { id, name: cat.name, description: cat.description }
        });
        console.log(`Upserted fee category: ${record.name} (${record.id})`);
    }

    console.log('Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
