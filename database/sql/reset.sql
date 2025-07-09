-- =============================================================================
-- DIGIGROW CLIENT PORTAL - DATABASE RESET v2.0
-- =============================================================================
-- This script completely resets the database to a clean state
-- WARNING: This will delete ALL data!
-- 
-- Run this BEFORE running main.sql for a fresh setup
-- =============================================================================

-- Disable RLS temporarily to avoid permission issues during cleanup
SET row_security = off;

-- =============================================================================
-- DROP POLICIES (Only if tables exist)
-- =============================================================================

-- Drop policies only if the tables exist to avoid errors
DO $$
BEGIN
  -- Users table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
  END IF;

  -- Businesses table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
    DROP POLICY IF EXISTS "Users can view connected businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Business owners can update their businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Agents can view assigned businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Agents can create businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;
  END IF;

  -- User-Business connections policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_business_connections') THEN
    DROP POLICY IF EXISTS "Users can view own connections" ON public.user_business_connections;
    DROP POLICY IF EXISTS "Business managers can view business connections" ON public.user_business_connections;
    DROP POLICY IF EXISTS "Business managers can create connections" ON public.user_business_connections;
    DROP POLICY IF EXISTS "Admins can view all connections" ON public.user_business_connections;
    DROP POLICY IF EXISTS "Admins can manage all connections" ON public.user_business_connections;
  END IF;

  -- Invitations table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations') THEN
    DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.invitations;
    DROP POLICY IF EXISTS "Business managers can send invitations" ON public.invitations;
    DROP POLICY IF EXISTS "Invitation recipients can view their invitations" ON public.invitations;
    DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;
    DROP POLICY IF EXISTS "Admins can manage all invitations" ON public.invitations;
  END IF;

  -- Email delivery logs policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_delivery_logs') THEN
    DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_delivery_logs;
    DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_delivery_logs;
  END IF;

  -- Audit logs policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
  END IF;

  -- User sessions policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
    DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
    DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
  END IF;
END $$;

-- =============================================================================
-- DROP TRIGGERS (Only if tables exist)
-- =============================================================================

-- Drop triggers only if the tables exist to avoid errors
DO $$
BEGIN
  -- User creation triggers (auth.users always exists)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_created_enhanced ON auth.users;

  -- Business slug generation trigger
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
    DROP TRIGGER IF EXISTS auto_generate_business_slug_trigger ON public.businesses;
  END IF;

  -- Update timestamp triggers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
    DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_business_connections') THEN
    DROP TRIGGER IF EXISTS update_user_business_connections_updated_at ON public.user_business_connections;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations') THEN
    DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_delivery_logs') THEN
    DROP TRIGGER IF EXISTS update_email_delivery_logs_updated_at ON public.email_delivery_logs;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;
  END IF;
END $$;

-- =============================================================================
-- DROP FUNCTIONS
-- =============================================================================

-- User management functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_enhanced() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_business_connection_enhanced(UUID) CASCADE;

-- Email tracking functions
DROP FUNCTION IF EXISTS public.log_email_sent(UUID, UUID, email_type, TEXT, email_provider, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_email_sent(UUID, UUID, email_type, TEXT, TEXT, email_provider, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_email_status(UUID, email_status, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_email_status(UUID, email_status, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_email_delivery_rate(email_type, email_provider, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_email_delivery_stats(email_type, email_provider, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_email_logs(INTEGER) CASCADE;

-- Utility functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_business_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_business_slug() CASCADE;

-- =============================================================================
-- DROP VIEWS
-- =============================================================================

DROP VIEW IF EXISTS public.email_delivery_stats CASCADE;
DROP VIEW IF EXISTS public.recent_email_activity CASCADE;
DROP VIEW IF EXISTS public.business_analytics CASCADE;

-- =============================================================================
-- DROP INDEXES
-- =============================================================================

-- Users table indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_updated_at;
DROP INDEX IF EXISTS idx_users_last_login;

-- Businesses table indexes
DROP INDEX IF EXISTS idx_businesses_active;
DROP INDEX IF EXISTS idx_businesses_created_by;
DROP INDEX IF EXISTS idx_businesses_slug;
DROP INDEX IF EXISTS idx_businesses_agent_id;
DROP INDEX IF EXISTS idx_businesses_status;
DROP INDEX IF EXISTS idx_businesses_industry;
DROP INDEX IF EXISTS idx_businesses_name_gin;
DROP INDEX IF EXISTS idx_businesses_created_at;

-- User-Business connections indexes
DROP INDEX IF EXISTS idx_user_business_connections_user;
DROP INDEX IF EXISTS idx_user_business_connections_business;
DROP INDEX IF EXISTS idx_user_business_connections_user_status;
DROP INDEX IF EXISTS idx_user_business_connections_business_status;
DROP INDEX IF EXISTS idx_ubc_user_id;
DROP INDEX IF EXISTS idx_ubc_business_id;
DROP INDEX IF EXISTS idx_ubc_user_status;
DROP INDEX IF EXISTS idx_ubc_business_status;
DROP INDEX IF EXISTS idx_ubc_role;

-- Invitations table indexes
DROP INDEX IF EXISTS idx_invitations_email;
DROP INDEX IF EXISTS idx_invitations_token;
DROP INDEX IF EXISTS idx_invitations_status;
DROP INDEX IF EXISTS idx_invitations_status_created;
DROP INDEX IF EXISTS idx_invitations_business_id;
DROP INDEX IF EXISTS idx_invitations_invited_by;
DROP INDEX IF EXISTS idx_invitations_expires_at;

-- Email delivery logs indexes
DROP INDEX IF EXISTS idx_email_logs_user_id;
DROP INDEX IF EXISTS idx_email_logs_status;
DROP INDEX IF EXISTS idx_email_logs_email_type;
DROP INDEX IF EXISTS idx_email_logs_created_at;
DROP INDEX IF EXISTS idx_email_logs_email_address;
DROP INDEX IF EXISTS idx_email_logs_provider;
DROP INDEX IF EXISTS idx_email_logs_sent_at;

-- Audit logs indexes
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_audit_logs_created;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_business_id;
DROP INDEX IF EXISTS idx_audit_logs_event_type;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_user_event;

-- User sessions indexes
DROP INDEX IF EXISTS idx_user_sessions_user;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_active;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_last_activity;
DROP INDEX IF EXISTS idx_user_sessions_token;

-- =============================================================================
-- DROP TABLES (in reverse dependency order)
-- =============================================================================

DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.email_delivery_logs CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.user_business_connections CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================================================
-- DROP CUSTOM TYPES
-- =============================================================================

DROP TYPE IF EXISTS email_type CASCADE;
DROP TYPE IF EXISTS email_provider CASCADE;
DROP TYPE IF EXISTS email_status CASCADE;
DROP TYPE IF EXISTS audit_event_type CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS business_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================================================
-- CLEAN UP AUTH USERS (OPTIONAL)
-- =============================================================================

-- WARNING: Uncomment the next line if you want to delete all user accounts
-- This will completely reset all authentication data
-- DELETE FROM auth.users;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Re-enable RLS
SET row_security = on;

-- Verify cleanup
SELECT 'Database reset completed successfully!' as status;

-- Show remaining public tables (should be empty)
SELECT 
  table_name,
  'Remaining table - may need manual cleanup' as note
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show remaining custom types (should be empty)
SELECT 
  typname as type_name,
  'Remaining type - may need manual cleanup' as note
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e'
ORDER BY typname;

-- Show remaining functions (should be empty or only system functions)
SELECT 
  routine_name as function_name,
  'Remaining function - may need manual cleanup' as note
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- =============================================================================
-- RESET COMPLETE
-- =============================================================================
-- The database has been reset to a clean state.
-- You can now run main.sql to set up the fresh database schema.
-- =============================================================================