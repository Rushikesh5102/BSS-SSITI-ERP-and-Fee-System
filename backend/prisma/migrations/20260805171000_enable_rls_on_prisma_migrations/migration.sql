-- Enable Row Level Security (RLS) on Prisma's internal migration tracking table
-- Resolves Supabase Security Advisor Critical Warning (rls_disabled_in_public)
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Revoke Data REST API access from public anon and authenticated roles
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;
