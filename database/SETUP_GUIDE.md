# DigiGrow Client Portal - Database Setup Guide

## Overview

This guide will walk you through setting up the Supabase database foundation for the DigiGrow Client Portal. The setup follows Supabase best practices and ensures a secure, scalable foundation.

## 🔑 Key Supabase Authentication Concepts

### How Supabase Auth Works

<mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> **Supabase manages authentication through the `auth.users` table** - this is their built-in system that you should NOT try to replace or modify directly.

<mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> **For custom user data, create a `public.users` table** that references `auth.users` with a foreign key relationship.

<mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> **Use triggers to automatically create profile records** when new users sign up through the auth system.

### Why This Approach?

1. **Security**: <mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> The Auth schema is not exposed in the auto-generated API for security reasons
2. **Flexibility**: You can add custom fields without affecting the core auth system
3. **Reliability**: <mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> Only use primary keys as foreign key references for schemas managed by Supabase
4. **Best Practice**: <mcreference link="https://supabase.com/docs/guides/auth" index="5">5</mcreference> Auth uses your project's Postgres database under the hood, storing user data in a special schema that you connect to via triggers and foreign keys

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Project Created**: You should have a Supabase project ready
3. **Database Access**: Access to the SQL Editor in your Supabase dashboard

## 🚀 Step-by-Step Setup

### Step 1: Access Your Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL script

### Step 2: Run the Database Schema

1. Copy the entire contents of `schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

**What this script does:**
- ✅ Safely drops existing tables/policies to prevent conflicts
- ✅ Creates all necessary tables with proper relationships
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates indexes for optimal performance
- ✅ Establishes triggers for automatic profile creation
- ✅ Adds comprehensive documentation

### Step 3: Verify the Setup

After running the script, you should see:

1. **Success Messages** in the SQL Editor output
2. **6 New Tables** in the Table Editor:
   - `users` - Extended user profiles
   - `businesses` - Client business data
   - `user_business_connections` - User-business relationships
   - `invitations` - Secure invitation system
   - `audit_logs` - Security audit trail
   - `user_sessions` - Session management

### Step 4: Test the Authentication Flow

1. Go to **Authentication > Users** in your Supabase dashboard
2. Click **Add User** to create a test user
3. Fill in:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - User Metadata (optional):
     ```json
     {
       "full_name": "Test User",
       "role": "agent"
     }
     ```
4. Check the **Table Editor > users** table - you should see a corresponding profile was automatically created

## 🔒 Security Features Implemented

### Row Level Security (RLS)

<mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference> All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Agents can only access their assigned businesses
- Proper isolation between different user roles

### Data Protection

- **GDPR Compliance**: Built-in consent tracking and data export capabilities
- **Audit Trail**: All significant actions are logged for security monitoring
- **Session Management**: Track and manage user sessions across devices

### Authentication Security

- **Password Policies**: Will be enforced at the application level
- **Two-Factor Auth**: Database ready for 2FA implementation
- **Account Locking**: Failed login attempt tracking

## 📊 Database Schema Overview

### Core Tables

```
auth.users (Supabase managed)
    ↓ (1:1 via trigger)
public.users (Custom profiles)
    ↓ (1:many)
public.businesses (Client businesses)
    ↓ (many:many via)
public.user_business_connections
```

### Key Relationships

1. **auth.users → public.users**: One-to-one via foreign key and trigger
2. **users → businesses**: One agent to many businesses
3. **users ↔ businesses**: Many-to-many via connections table
4. **businesses → invitations**: One business to many invitations

## 🛠️ Next Steps

Now that your database foundation is ready, here's what to do next:

### Immediate Next Steps

1. **Test User Creation**: Create a few test users with different roles
2. **Create Sample Business**: Test the business creation flow
3. **Test Invitations**: Create and test invitation tokens

### Development Setup

1. **Environment Variables**: Set up your Supabase connection details
2. **TypeScript Types**: Generate types from your schema
3. **Authentication Flow**: Implement the frontend auth system

### Recommended Order

1. ✅ **Database Schema** (You are here)
2. 🔄 **Next.js Project Setup** with Supabase client
3. 🔄 **Authentication Components** (login, signup, profile)
4. 🔄 **Agent Dashboard** (business creation, user management)
5. 🔄 **Client Dashboard** (service views, analytics)
6. 🔄 **Invitation System** (email templates, token handling)

## 🔧 Configuration Notes

### Supabase Settings to Configure

1. **Auth Settings**:
   - Enable email confirmations (optional for development)
   - Configure password requirements
   - Set up custom SMTP (for branded emails)

2. **API Settings**:
   - Note your project URL and anon key
   - Configure CORS for your domain

3. **Database Settings**:
   - Consider upgrading to paid tier for production
   - Set up automated backups

### Free Tier Considerations

- **500MB Database Limit**: Monitor usage as you add data
- **Project Pausing**: Projects pause after 1 week of inactivity
- **2 Project Limit**: Plan accordingly for development/production

## 🚨 Important Notes

### DO NOT:
- ❌ Modify the `auth.users` table directly
- ❌ Create custom authentication tables
- ❌ Bypass Supabase's auth system
- ❌ Store sensitive data without encryption

### DO:
- ✅ Use the `public.users` table for custom profile data
- ✅ Leverage RLS policies for security
- ✅ Use triggers for automatic data management
- ✅ Follow the established foreign key patterns

## 🆘 Troubleshooting

### Common Issues

1. **"Relation does not exist" errors**: 
   - Ensure you're running the script in the correct project
   - Check that extensions are enabled

2. **RLS policy errors**:
   - Verify that auth.uid() is available in your context
   - Check that users have proper roles assigned

3. **Trigger not firing**:
   - Ensure the trigger function exists
   - Check that the auth.users table is accessible

### Getting Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: For project-specific problems

## 📝 Schema Validation

The setup script includes automatic validation. Look for these success messages:

```
SUCCESS: All 6 tables created successfully
DigiGrow Client Portal Database Schema Setup Complete!
```

If you see any errors, review the troubleshooting section above.

---

**Ready for the next step?** Let me know when you've successfully run the schema setup, and we can move on to setting up the Next.js project structure and Supabase client configuration!