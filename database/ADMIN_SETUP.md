# Admin Account Setup Guide

**UPDATED:** This guide now uses the new simplified SQL scripts in `database/sql/`

## Quick Setup Process

The new database setup eliminates trigger issues. Here's the simple process:

### Step 1: Setup Database
1. Go to Supabase Dashboard > SQL Editor
2. Run `database/sql/reset.sql` (if you have existing data)
3. Run `database/sql/main.sql` (creates all tables)

### Step 2: Create User in Dashboard
1. Go to Supabase Dashboard > Auth > Users
2. Click "Create a new user"
3. Fill in:
   - **Email**: `admin@digigrow.uk`
   - **Password**: Strong password
   - **Auto Confirm User**: ✅ Check this
4. Click "Create user" (should work without errors)

### Step 3: Promote to Admin
1. Edit `database/sql/admin-setup.sql`
2. Update the email address to match your user
3. Run the script in Supabase SQL Editor

### Step 4: Test Login
Go to `http://localhost:3001` and sign in with your admin credentials

## Why This Works Better

✅ **No Triggers** - The new setup doesn't use automatic triggers that can cause errors
✅ **Manual Control** - You explicitly promote users to admin when needed
✅ **Organized** - All scripts are in `database/sql/` folder
✅ **Simple** - Just 3 steps: setup database, create user, promote to admin

## For Additional Admins

## Step-by-Step Process

### Step 1: Create User in Supabase Dashboard

1. Go to your Supabase Dashboard: `https://supabase.com/dashboard/project/ywfvlqvsgyhiugoludhy/auth/users`
2. Click "Create a new user"
3. Fill in the form:
   - **Email**: `admin@digigrow.uk` (or desired admin email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: ✅ Check this box (skips email confirmation)
4. Click "Create user"

### Step 2: Promote User to Admin Role

After the user is created, you need to update their role from `employee` to `admin`:

1. Go to Supabase Dashboard > SQL Editor
2. Run the promotion script from `promote-to-admin.sql`:

```sql
-- Update the email address to match the user you just created
UPDATE public.users 
SET 
  role = 'admin',
  full_name = 'DigiGrow Admin',  -- Update with actual name
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@digigrow.uk'  -- Replace with actual email
);
```

3. Verify the update worked:

```sql
SELECT 
  u.id,
  au.email,
  u.full_name,
  u.role,
  u.created_at,
  u.updated_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@digigrow.uk';
```

### Step 3: Test the Admin Account

1. Go to your login page: `http://localhost:3001`
2. Sign in with the admin credentials
3. Verify access to admin features

## Security Notes

✅ **Secure Process**: This method is completely secure because:
- Users are created through Supabase's secure authentication system
- Role promotion happens server-side via SQL
- No sensitive data is exposed in client-side code
- All operations are logged in audit trails

✅ **Database Triggers**: The `handle_new_user()` trigger automatically:
- Creates user profiles for all new auth users
- Sets safe defaults (employee role)
- Handles GDPR compliance
- Prevents orphaned auth users

## Troubleshooting

**Error: "Database error saving new user"**
- Ensure the database schema has been applied (`schema.sql`)
- Check that all required tables exist
- Verify triggers are properly installed

**User created but no profile in public.users**
- Check if the trigger `on_auth_user_created` exists
- Verify the `handle_new_user()` function is installed
- Look at Supabase logs for trigger errors

**Role update doesn't work**
- Ensure you're using the correct email address in the SQL
- Check that the user exists in both `auth.users` and `public.users`
- Verify the role enum accepts 'admin' value

## Alternative: Bulk Admin Creation

For creating multiple admin accounts, you can use this SQL script:

```sql
-- Create multiple admin accounts at once
WITH admin_users AS (
  SELECT 
    email,
    full_name
  FROM (
    VALUES 
      ('admin@digigrow.uk', 'DigiGrow Admin'),
      ('manager@digigrow.uk', 'DigiGrow Manager')
  ) AS t(email, full_name)
)
UPDATE public.users 
SET 
  role = 'admin',
  full_name = admin_users.full_name,
  updated_at = NOW()
FROM admin_users
WHERE public.users.id = (
  SELECT id FROM auth.users WHERE auth.users.email = admin_users.email
);
```

This approach maintains security while working within Supabase's constraints.