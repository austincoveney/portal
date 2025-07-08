-- =============================================================================
-- DIGIGROW CLIENT PORTAL - DATABASE RESET
-- =============================================================================
-- This script completely resets the database to a clean state
-- WARNING: This will delete ALL data!
-- 
-- Run this BEFORE running main.sql for a fresh setup
-- =============================================================================

-- Disable RLS temporarily to avoid permission issues during cleanup
SET row_security = off;

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view connected businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view own connections" ON public.user_business_connections;
DROP POLICY IF EXISTS "Admins can view all connections" ON public.user_business_connections;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.invitations;
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
DROP TRIGGER IF EXISTS update_user_business_connections_updated_at ON public.user_business_connections;
DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.user_business_connections CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS audit_event_type CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Clean up auth.users (WARNING: This removes all user accounts!)
-- Uncomment the next line if you want to delete all user accounts too
-- DELETE FROM auth.users;

-- Re-enable RLS
SET row_security = on;

-- Verify cleanup
SELECT 'Database reset completed!' as status;

-- Show remaining tables (should be empty or only system tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;