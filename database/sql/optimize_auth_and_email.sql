-- =====================================================
-- COMPREHENSIVE DATABASE OPTIMIZATION
-- Authentication Flow & Email Delivery Improvements
-- =====================================================

-- This script optimizes the database for better authentication
-- flow, email delivery tracking, and overall performance

BEGIN;

-- =====================================================
-- 1. EMAIL DELIVERY TRACKING SYSTEM
-- =====================================================

-- Create email delivery tracking table
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('invitation', 'reset', 'confirmation', 'magic_link')),
  email_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  provider TEXT DEFAULT 'supabase_default' CHECK (provider IN ('supabase_default', 'resend', 'sendgrid', 'aws_ses', 'postmark')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email delivery logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_delivery_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_delivery_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_address ON public.email_delivery_logs(email_address);

-- =====================================================
-- 2. ENHANCED USER AUTHENTICATION FLOW
-- =====================================================

-- Improved user creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  business_uuid UUID;
  connection_exists BOOLEAN;
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
      created_at,
      updated_at
    )
    VALUES (
      user_uuid,
      business_uuid,
      'owner',
      'active',
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

-- =====================================================
-- 3. EMAIL LOGGING FUNCTIONS
-- =====================================================

-- Function to log email sending
CREATE OR REPLACE FUNCTION public.log_email_sent(
  p_user_id UUID,
  p_invitation_id UUID DEFAULT NULL,
  p_email_type TEXT DEFAULT 'invitation',
  p_email_address TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT 'supabase_default',
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
  p_status TEXT,
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

-- =====================================================
-- 4. PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Strategic indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_gin ON public.users USING gin(email gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at ON public.users(updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_status_created ON public.invitations(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_business_id ON public.invitations(business_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_invited_by ON public.invitations(invited_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_event ON public.audit_logs(user_id, event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_business_connections_user_status ON public.user_business_connections(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_business_connections_business_status ON public.user_business_connections(business_id, status);

-- =====================================================
-- 5. ENHANCED RLS POLICIES
-- =====================================================

-- Enable RLS on email delivery logs
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Policy for email delivery logs - users can only see their own logs
CREATE POLICY "Users can view their own email logs" ON public.email_delivery_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy for admins to view all email logs
CREATE POLICY "Admins can view all email logs" ON public.email_delivery_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- =====================================================
-- 6. UPDATED TRIGGERS
-- =====================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

-- Create new enhanced trigger
CREATE TRIGGER on_auth_user_created_enhanced
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_enhanced();

-- =====================================================
-- 7. EMAIL DELIVERY ANALYTICS VIEWS
-- =====================================================

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

-- =====================================================
-- 8. UTILITY FUNCTIONS
-- =====================================================

-- Function to get email delivery rate
CREATE OR REPLACE FUNCTION public.get_email_delivery_rate(
  p_email_type TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
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

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.email_delivery_logs TO authenticated;
GRANT SELECT ON public.email_delivery_stats TO authenticated;
GRANT SELECT ON public.recent_email_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_email_sent TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_email_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_delivery_rate TO authenticated;

-- Admin-only permissions
GRANT ALL ON public.email_delivery_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_email_logs TO service_role;

COMMIT;

-- =====================================================
-- OPTIMIZATION COMPLETE
-- =====================================================

-- Summary of improvements:
-- 1. ✅ Email delivery tracking system
-- 2. ✅ Enhanced authentication flow with better error handling
-- 3. ✅ Performance optimization indexes
-- 4. ✅ Enhanced RLS policies
-- 5. ✅ Email analytics and monitoring
-- 6. ✅ Utility functions for maintenance
-- 7. ✅ Proper permissions and security

-- Next steps:
-- 1. Configure custom SMTP (Resend/SendGrid)
-- 2. Update application code to use email logging
-- 3. Set up monitoring dashboards
-- 4. Schedule regular cleanup jobs