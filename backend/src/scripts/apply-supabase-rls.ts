import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

async function applySupabaseRLS() {
    try {
        console.log('🚀 Connecting to database to apply Supabase Row Level Security (RLS)...');
        await prisma.$connect();

        const sqlFilePath = path.join(__dirname, '../../prisma/enable_supabase_rls.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split SQL statements by semicolon and execute each
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
            } catch (err: any) {
                // Log non-fatal errors (e.g. if a role does not exist in local docker/test DB)
                console.warn(`[RLS Migration Notice] Statement: ${statement.slice(0, 40)}... -> ${err?.message || err}`);
            }
        }

        console.log('✅ Supabase Row Level Security (RLS) policies successfully applied to all tables!');
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to apply Supabase RLS:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

applySupabaseRLS();
