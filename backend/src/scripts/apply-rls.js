const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Connecting to Supabase database to apply Row Level Security (RLS)...');
    try {
        await prisma.$connect();
        console.log('✅ Connected to database successfully!');

        const sqlFilePath = path.join(__dirname, '../../prisma/enable_supabase_rls.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`Executing ${statements.length} SQL RLS statements...`);

        let successCount = 0;
        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
            } catch (err) {
                console.log(`Notice on: ${statement.slice(0, 45)}... -> ${err.message}`);
            }
        }

        console.log(`🎉 Completed: Successfully executed ${successCount}/${statements.length} RLS statements.`);
        await prisma.$disconnect();
    } catch (e) {
        console.error('Execution error:', e);
        await prisma.$disconnect();
    }
}

main();
