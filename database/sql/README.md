# DigiGrow Client Portal - SQL Scripts

This folder contains all SQL scripts for the DigiGrow Client Portal database setup and management.

## File Structure

- **`reset.sql`** - Completely resets the database (deletes everything)
- **`main.sql`** - Main database setup (creates all tables, policies, etc.)
- **`admin-setup.sql`** - Promotes a user to admin role

## Setup Process

### 1. Fresh Database Setup

```sql
-- Step 1: Reset everything (optional, only if you have existing data)
-- Run: reset.sql

-- Step 2: Create the database structure
-- Run: main.sql
```

### 2. Create Your First Admin Account

1. **Create User in Supabase Dashboard:**
   - Go to: `https://supabase.com/dashboard/project/ywfvlqvsgyhiugoludhy/auth/users`
   - Click "Create a new user"
   - Email: `admin@digigrow.uk` (or your preferred admin email)
   - Password: Strong password
   - ✅ Check "Auto Confirm User"
   - Click "Create user"

2. **Promote to Admin:**
   - Edit `admin-setup.sql` and update the email address
   - Run: `admin-setup.sql`

3. **Test Login:**
   - Go to: `http://localhost:3001`
   - Sign in with your admin credentials

## Key Features

✅ **Simple & Clean** - No complex triggers or functions that can cause errors
✅ **Manual Control** - You control when users become admins
✅ **Organized** - All scripts in one place
✅ **Safe Reset** - Easy to start fresh if needed
✅ **Row Level Security** - Proper permissions and data isolation

## Database Structure

- **`users`** - User profiles (extends auth.users)
- **`businesses`** - Client businesses
- **`user_business_connections`** - Links users to businesses with permissions
- **`invitations`** - User invitation system
- **`audit_logs`** - Activity tracking
- **`user_sessions`** - Session management

## User Roles

- **`admin`** - Full system access
- **`agent`** - DigiGrow staff member
- **`primary_client`** - Main business contact
- **`employee`** - Business employee

## Troubleshooting

**"Database error saving new user"**
- The main.sql setup doesn't use triggers, so this shouldn't happen
- If it does, run reset.sql then main.sql again

**Admin promotion not working**
- Check the email address in admin-setup.sql matches exactly
- Ensure the user exists in auth.users first
- Run the verification query at the end of admin-setup.sql

**Need to start over**
- Run reset.sql (WARNING: deletes all data)
- Then run main.sql
- Then create admin user and run admin-setup.sql