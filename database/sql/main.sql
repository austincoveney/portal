-- =============================================================================
-- DIGIGROW CLIENT PORTAL - COMPREHENSIVE DATABASE SETUP
-- =============================================================================
-- This is the complete SQL setup for the DigiGrow Client Portal database
-- Includes: Core tables, Enhanced authentication, Email tracking, Performance optimization
-- 
-- USAGE:
-- 1. First run: reset.sql (to clean everything)
-- 2. Then run: main.sql (this file)
-- 3. Create admin user manually in Supabase dashboard
-- 4. Run: admin-setup.sql (to promote user to admin)
-- =============================================================================

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'primary_client', 'employee');

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TYPE audit_event_type AS ENUM (
  'login', 'logout', 'password_change', 'profile_update',
  'data_access', 'data_export', 'user_created', 'user_updated',
  'business_created', 'business_updated', 'invitation_sent',
  'user_creation_error', 'business_connection_error', 'email_logs_cleanup'
);

CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked');

CREATE TYPE email_provider AS ENUM ('supabase_default', 'resend', 'sendgrid', 'aws_ses', 'postmark');

CREATE TYPE email_type AS ENUM ('invitation', 'reset', 'confirmation', 'magic_link');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'New User',
  job_title TEXT,
  role user_role NOT NULL DEFAULT 'primary_client',
  phone TEXT,
  avatar_url TEXT,
  gdpr_consent_at TIMESTAMPTZ,
  data_processing_consent BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  logo_url TEXT,
  created_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Business connections
CREATE TABLE public.user_business_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'primary_client', 'employee')),
  can_view_financials BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role user_role NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT, -- Denormalized for easier queries
  invited_by UUID NOT NULL REFERENCES public.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  pre_filled_name TEXT,
  pre_filled_job_title TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email delivery tracking table
CREATE TABLE public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
  email_type email_type NOT NULL,
  email_address TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'sent',
  provider email_provider DEFAULT 'supabase_default',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  event_type audit_event_type NOT NULL,
  event_category TEXT,
  description TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',
  is_remember_me BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_users_updated_at ON public.users(updated_at DESC);

-- Businesses table indexes
CREATE INDEX idx_businesses_active ON public.businesses(is_active);
CREATE INDEX idx_businesses_created_by ON public.businesses(created_by);
CREATE INDEX idx_businesses_name_gin ON public.businesses USING gin(name gin_trgm_ops);

-- User-Business connections indexes
CREATE INDEX idx_user_business_connections_user ON public.user_business_connections(user_id);
CREATE INDEX idx_user_business_connections_business ON public.user_business_connections(business_id);
CREATE INDEX idx_user_business_connections_user_status ON public.user_business_connections(user_id, status);
CREATE INDEX idx_user_business_connections_business_status ON public.user_business_connections(business_id, status);

-- Invitations table indexes
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_status_created ON public.invitations(status, created_at DESC);
CREATE INDEX idx_invitations_business_id ON public.invitations(business_id);
CREATE INDEX idx_invitations_invited_by ON public.invitations(invited_by);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- Email delivery logs indexes
CREATE INDEX idx_email_logs_user_id ON public.email_delivery_logs(user_id);
CREATE INDEX idx_email_logs_status ON public.email_delivery_logs(status);
CREATE INDEX idx_email_logs_email_type ON public.email_delivery_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON public.email_delivery_logs(created_at DESC);
CREATE INDEX idx_email_logs_email_address ON public.email_delivery_logs(email_address);
CREATE INDEX idx_email_logs_provider ON public.email_delivery_logs(provider);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_user_event ON public.audit_logs(user_id, event_type);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity_at DESC);

-- =============================================================================
-- ENHANCED FUNCTIONS
-- =============================================================================

-- Enhanced user creation function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  business_uuid UUID;
  user_full_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract user information with fallbacks
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'New User'
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'primary_client'
  );
  
  -- Create user profile with enhanced error handling
  BEGIN
    INSERT INTO public.users (
      id, 
      email,
      full_name, 
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role::user_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      updated_at = NOW();
    
    -- Log successful user creation
    INSERT INTO public.audit_logs (
      user_id,
      event_type,
      details,
      created_at
    ) VALUES (
      NEW.id,
      'user_created',
      jsonb_build_object(
        'email', NEW.email,
        'full_name', user_full_name,
        'role', user_role,
        'trigger', 'handle_new_user_enhanced'
      ),
      NOW()
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    INSERT INTO public.audit_logs (
      user_id,
      event_type,
      details,
      created_at
    ) VALUES (
      NEW.id,
      'user_creation_error',
      jsonb_build_object(
        'error', SQLERRM,
        'email', NEW.email,
        'trigger', 'handle_new_user_enhanced'
      ),
      NOW()
    );
    
    -- Continue with auth user creation even if profile creation fails
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
  END;
  
  -- Ensure business connection (only if user profile was created successfully)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    BEGIN
      PERFORM public.ensure_user_business_connection_enhanced(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Log business connection error
      INSERT INTO public.audit_logs (
        user_id,
        event_type,
        details,
        created_at
      ) VALUES (
        NEW.id,
        'business_connection_error',
        jsonb_build_object(
          'error', SQLERRM,
          'trigger', 'handle_new_user_enhanced'
        ),
        NOW()
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced business connection function
CREATE OR REPLACE FUNCTION public.ensure_user_business_connection_enhanced(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  business_uuid UUID;
  connection_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Get user email for business name
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  
  -- Check if user already has a business connection
  SELECT EXISTS(
    SELECT 1 FROM public.user_business_connections 
    WHERE user_id = user_uuid AND status = 'active'
  ) INTO connection_exists;
  
  -- If no connection exists, create a default business
  IF NOT connection_exists THEN
    -- Create a default business for the user
    INSERT INTO public.businesses (
      name,
      description,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      COALESCE(split_part(user_email, '@', 1) || '''s Business', 'Default Business'),
      'Default business created for new user',
      user_uuid,
      NOW(),
      NOW()
    )
    RETURNING id INTO business_uuid;
    
    -- Create the business connection
    INSERT INTO public.user_business_connections (
      user_id,
      business_id,
      role,
      status,
      can_manage_users,
      created_at,
      updated_at
    )
    VALUES (
      user_uuid,
      business_uuid,
      'owner',
      'active',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, business_id) DO UPDATE SET
      status = 'active',
      updated_at = NOW();
    
    -- Log business creation
    INSERT INTO public.audit_logs (
      user_id,
      event_type,
      details,
      created_at
    ) VALUES (
      user_uuid,
      'business_created',
      jsonb_build_object(
        'business_id', business_uuid,
        'business_name', COALESCE(split_part(user_email, '@', 1) || '''s Business', 'Default Business'),
        'connection_role', 'owner'
      ),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log email sending
CREATE OR REPLACE FUNCTION public.log_email_sent(
  p_user_id UUID,
  p_invitation_id UUID DEFAULT NULL,
  p_email_type email_type DEFAULT 'invitation',
  p_email_address TEXT DEFAULT NULL,
  p_provider email_provider DEFAULT 'supabase_default',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  actual_email TEXT;
BEGIN
  -- Get email address if not provided
  IF p_email_address IS NULL AND p_user_id IS NOT NULL THEN
    SELECT email INTO actual_email FROM auth.users WHERE id = p_user_id;
  ELSE
    actual_email := p_email_address;
  END IF;
  
  -- Insert email log
  INSERT INTO public.email_delivery_logs (
    user_id,
    invitation_id,
    email_type,
    email_address,
    status,
    provider,
    metadata,
    sent_at,
    created_at
  )
  VALUES (
    p_user_id,
    p_invitation_id,
    p_email_type,
    actual_email,
    'sent',
    p_provider,
    p_metadata,
    NOW(),
    NOW()
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email delivery status
CREATE OR REPLACE FUNCTION public.update_email_status(
  p_log_id UUID,
  p_status email_status,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_delivery_logs
  SET 
    status = p_status,
    error_message = p_error_message,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    opened_at = CASE WHEN p_status = 'opened' THEN NOW() ELSE opened_at END,
    clicked_at = CASE WHEN p_status = 'clicked' THEN NOW() ELSE clicked_at END,
    updated_at = NOW()
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email delivery rate
CREATE OR REPLACE FUNCTION public.get_email_delivery_rate(
  p_email_type email_type DEFAULT NULL,
  p_provider email_provider DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  total_sent BIGINT,
  total_delivered BIGINT,
  delivery_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) as total_delivered,
    ROUND(
      COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) * 100.0 / 
      NULLIF(COUNT(*), 0), 
      2
    ) as delivery_rate
  FROM public.email_delivery_logs
  WHERE 
    created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_email_type IS NULL OR email_type = p_email_type)
    AND (p_provider IS NULL OR provider = p_provider);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old email logs
CREATE OR REPLACE FUNCTION public.cleanup_old_email_logs(p_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_delivery_logs
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.audit_logs (
    event_type,
    details,
    created_at
  ) VALUES (
    'email_logs_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', p_days
    ),
    NOW()
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- View for email delivery statistics
CREATE OR REPLACE VIEW public.email_delivery_stats AS
SELECT 
  email_type,
  provider,
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY email_type, provider) as percentage,
  MIN(created_at) as first_sent,
  MAX(created_at) as last_sent,
  AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time_seconds
FROM public.email_delivery_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY email_type, provider, status
ORDER BY email_type, provider, count DESC;

-- View for recent email activity
CREATE OR REPLACE VIEW public.recent_email_activity AS
SELECT 
  edl.id,
  edl.email_address,
  edl.email_type,
  edl.status,
  edl.provider,
  edl.error_message,
  edl.sent_at,
  edl.delivered_at,
  u.full_name as user_name,
  i.business_name
FROM public.email_delivery_logs edl
LEFT JOIN public.users u ON edl.user_id = u.id
LEFT JOIN public.invitations i ON edl.invitation_id = i.id
WHERE edl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY edl.created_at DESC
LIMIT 100;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_business_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Businesses table policies
CREATE POLICY "Users can view connected businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_business_connections ubc
      WHERE ubc.business_id = id AND ubc.user_id = auth.uid() AND ubc.status = 'active'
    )
  );

CREATE POLICY "Business owners can update their businesses" ON public.businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_business_connections ubc
      WHERE ubc.business_id = id AND ubc.user_id = auth.uid() 
      AND ubc.role = 'owner' AND ubc.status = 'active'
    )
  );

CREATE POLICY "Admins can view all businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins can manage all businesses" ON public.businesses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User-Business connections policies
CREATE POLICY "Users can view own connections" ON public.user_business_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Business managers can view business connections" ON public.user_business_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_business_connections ubc
      WHERE ubc.business_id = business_id AND ubc.user_id = auth.uid() 
      AND ubc.can_manage_users = true AND ubc.status = 'active'
    )
  );

CREATE POLICY "Admins can view all connections" ON public.user_business_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins can manage all connections" ON public.user_business_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Invitations table policies
CREATE POLICY "Users can view invitations they sent" ON public.invitations
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Business managers can send invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_business_connections ubc
      WHERE ubc.business_id = business_id AND ubc.user_id = auth.uid() 
      AND ubc.can_manage_users = true AND ubc.status = 'active'
    )
  );

CREATE POLICY "Admins can view all invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins can manage all invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Email delivery logs policies
CREATE POLICY "Users can view their own email logs" ON public.email_delivery_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all email logs" ON public.email_delivery_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Drop any existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_enhanced ON auth.users;

-- Create enhanced user creation trigger
CREATE TRIGGER on_auth_user_created_enhanced
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_enhanced();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_business_connections_updated_at
  BEFORE UPDATE ON public.user_business_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_delivery_logs_updated_at
  BEFORE UPDATE ON public.email_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_business_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_delivery_logs TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;

-- Grant view permissions
GRANT SELECT ON public.email_delivery_stats TO authenticated;
GRANT SELECT ON public.recent_email_activity TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.log_email_sent TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_email_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_delivery_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_business_connection_enhanced TO authenticated;

-- Admin-only permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Verify setup
SELECT 'DigiGrow Client Portal database setup completed successfully!' as status;

-- Show created tables
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'users' THEN 'Core user profiles and authentication'
    WHEN table_name = 'businesses' THEN 'Client business information'
    WHEN table_name = 'user_business_connections' THEN 'User-business relationships and permissions'
    WHEN table_name = 'invitations' THEN 'User invitation system'
    WHEN table_name = 'email_delivery_logs' THEN 'Email tracking and delivery monitoring'
    WHEN table_name = 'audit_logs' THEN 'System activity and security logging'
    WHEN table_name = 'user_sessions' THEN 'User session management'
    ELSE 'System table'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show created functions
SELECT 
  routine_name as function_name,
  CASE 
    WHEN routine_name LIKE '%email%' THEN 'Email delivery tracking'
    WHEN routine_name LIKE '%user%' THEN 'User management'
    WHEN routine_name LIKE '%business%' THEN 'Business management'
    WHEN routine_name LIKE '%cleanup%' THEN 'Maintenance and cleanup'
    ELSE 'Utility function'
  END as category
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name NOT LIKE 'update_updated_at%'
ORDER BY routine_name;

-- =============================================================================
-- NEXT STEPS
-- =============================================================================
-- 1. Create your first admin user in Supabase Auth dashboard
-- 2. Run admin-setup.sql to promote the user to admin
-- 3. Configure custom SMTP provider (Resend recommended)
-- 4. Update application code to use email logging functions
-- 5. Set up monitoring dashboards for email delivery
-- 6. Schedule regular cleanup jobs for old logs
-- =============================================================================