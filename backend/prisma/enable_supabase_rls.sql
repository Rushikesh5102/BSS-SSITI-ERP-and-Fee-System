-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE POSTGRESQL ROW LEVEL SECURITY (RLS) HARDENING SCRIPT
-- BSS - Shri Sai ITI ERP & Fee System
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
ALTER TABLE IF EXISTS "branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "parents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "fee_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "fee_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "fee_structure_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "student_fees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "store_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "store_suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "stock_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "student_inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "book_issues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "book_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "book_movement_logs" ENABLE ROW LEVEL SECURITY;

-- 2. REVOKE ALL UNRESTRICTED DIRECT PUBLIC ACCESS VIA REST / POSTGREST
REVOKE ALL ON "users" FROM anon, authenticated;
REVOKE ALL ON "payments" FROM anon;
REVOKE ALL ON "student_fees" FROM anon;
REVOKE ALL ON "receipts" FROM anon;
REVOKE ALL ON "audit_logs" FROM anon, authenticated;
REVOKE ALL ON "system_config" FROM anon;

-- 3. DROP EXISTING CONFLICTING POLICIES IF ANY
DROP POLICY IF EXISTS "service_role_full_access_users" ON "users";
DROP POLICY IF EXISTS "service_role_full_access_students" ON "students";
DROP POLICY IF EXISTS "service_role_full_access_payments" ON "payments";
DROP POLICY IF EXISTS "service_role_full_access_receipts" ON "receipts";
DROP POLICY IF EXISTS "service_role_full_access_fees" ON "student_fees";
DROP POLICY IF EXISTS "service_role_full_access_fee_structures" ON "fee_structures";
DROP POLICY IF EXISTS "service_role_full_access_store" ON "store_items";
DROP POLICY IF EXISTS "service_role_full_access_books" ON "books";
DROP POLICY IF EXISTS "allow_public_inquiry_submission" ON "student_inquiries";
DROP POLICY IF EXISTS "allow_public_branch_read" ON "branches";
DROP POLICY IF EXISTS "allow_authenticated_read_books" ON "books";

-- 4. CREATE EXPLICIT LEAST-PRIVILEGE RLS POLICIES

-- Branches: Public Read-Only for campus info
CREATE POLICY "allow_public_branch_read" ON "branches"
    FOR SELECT
    TO anon, authenticated
    USING ( "isActive" = true );

-- Inquiries: Allow Prospective Students / Public to submit admission inquiries
CREATE POLICY "allow_public_inquiry_submission" ON "student_inquiries"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK ( true );

-- Library Books: Read-Only for authenticated students and staff
CREATE POLICY "allow_authenticated_read_books" ON "books"
    FOR SELECT
    TO authenticated
    USING ( "is_active" = true );

-- 5. ENSURE SERVICE ROLE / BACKEND SUPERUSER HAS FULL ACCESS
-- The Node.js Express server connects via postgres/service_role which bypasses RLS,
-- but adding explicit grant confirms defense-in-depth:
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
