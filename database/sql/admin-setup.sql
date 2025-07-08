-- =============================================================================
-- DIGIGROW CLIENT PORTAL - ADMIN SETUP
-- =============================================================================
-- This script promotes a user to admin role after they've been created
-- 
-- USAGE:
-- 1. Create user in Supabase Dashboard (Auth > Users)
-- 2. Update the email below to match the user you created
-- 3. Run this script
-- 4. Test login at your portal
-- =============================================================================

-- UPDATE THIS EMAIL to match the user you created in Supabase dashboard
-- Change 'admin@digigrow.uk' to your actual admin email below

-- Create or update the user profile with admin role
INSERT INTO public.users (
  id,
  full_name,
  role,
  gdpr_consent_at,
  data_processing_consent,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'DigiGrow Admin',  -- Update this name as needed
  'admin'::user_role,
  NOW(),
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin@digigrow.uk'  -- UPDATE THIS EMAIL
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role,
  full_name = 'DigiGrow Admin',
  updated_at = NOW();

-- Verify the admin account was created/updated
SELECT 
  u.id,
  au.email,
  u.full_name,
  u.role,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@digigrow.uk';  -- UPDATE THIS EMAIL

-- Show success message
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Admin account setup completed successfully!'
    ELSE 'ERROR: No user found with that email. Check the email address.'
  END as status
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@digigrow.uk' AND u.role = 'admin';  -- UPDATE THIS EMAIL