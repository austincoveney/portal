-- =============================================================================
-- DIGIGROW CLIENT PORTAL - MAIN DATABASE SETUP
-- =============================================================================
-- This is the main SQL file for the DigiGrow Client Portal database
-- Run this file to set up the complete database structure
-- 
-- USAGE:
-- 1. First run: reset.sql (to clean everything)
-- 2. Then run: main.sql (this file)
-- 3. Create admin user manually in Supabase dashboard
-- 4. Run: admin-setup.sql (to promote user to admin)
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'primary_client', 'employee');

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TYPE audit_event_type AS ENUM (
  'login', 'logout', 'password_change', 'profile_update',
  'data_access', 'data_export', 'user_created', 'user_updated',
  'business_created', 'business_updated', 'invitation_sent'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'New User',
  job_title TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  phone TEXT,
  avatar_url TEXT,
  gdpr_consent_at TIMESTAMPTZ,
  data_processing_consent BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'United Kingdom',
  vat_number TEXT,
  company_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Business connections
CREATE TABLE public.user_business_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary_client', 'employee')),
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role user_role NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  pre_filled_name TEXT,
  pre_filled_job_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  event_type audit_event_type NOT NULL,
  event_category TEXT NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_businesses_active ON public.businesses(is_active);
CREATE INDEX idx_user_business_connections_user ON public.user_business_connections(user_id);
CREATE INDEX idx_user_business_connections_business ON public.user_business_connections(business_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_business_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all users
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Basic business access policies
CREATE POLICY "Users can view connected businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_business_connections ubc
      WHERE ubc.business_id = id AND ubc.user_id = auth.uid() AND ubc.is_active = true
    )
  );

-- Admins can view all businesses
CREATE POLICY "Admins can view all businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Basic connection policies
CREATE POLICY "Users can view own connections" ON public.user_business_connections
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all connections
CREATE POLICY "Admins can view all connections" ON public.user_business_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Basic invitation policies
CREATE POLICY "Users can view invitations they sent" ON public.invitations
  FOR SELECT USING (invited_by = auth.uid());

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Basic audit log policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Basic session policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Verify setup
SELECT 'Database setup completed successfully!' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;