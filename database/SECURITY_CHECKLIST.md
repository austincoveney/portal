# 🔒 Security Checklist for DigiGrow Client Portal

## Pre-Deployment Security Verification

### ⚠️ CRITICAL - Service Role Keys & Admin Scripts

- [ ] **Verify monitoring folder is in .gitignore**
  - Check that `database/monitoring/` is excluded from version control
  - Confirm `*.ps1` files are ignored

- [ ] **Remove or secure all PowerShell monitoring scripts**
  - Ensure no `.ps1` files with service role keys are in public repositories
  - Verify `database/monitoring/` folder is not deployed to production

- [ ] **Audit all configuration files**
  - Check `supabase-config.js` for exposed keys
  - Verify `.env` files are properly ignored
  - Confirm no hardcoded credentials in source code

### 🔑 Environment Variables & Configuration

- [ ] **Use environment variables for all sensitive data**
  - Database URLs
  - API keys (anon key only for client-side)
  - Service role keys (server-side only)

- [ ] **Verify .env files are properly configured**
  - `.env.local` for development
  - `.env.production` for production (server-side only)
  - All `.env*` files in .gitignore

### 🛡️ Database Security

- [ ] **Row Level Security (RLS) enabled on all tables**
  - Users table
  - Clients table
  - Projects table
  - Any other data tables

- [ ] **Proper authentication policies configured**
  - User registration policies
  - Data access policies
  - Admin access restrictions

### 🌐 Client-Side Security

- [ ] **Only anon key used in client-side code**
  - Never expose service role key to browsers
  - Verify API calls use proper authentication

- [ ] **Implement proper error handling**
  - Don't expose sensitive error messages
  - Log security events appropriately

### 📦 Deployment Security

- [ ] **Production environment variables set**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Server-side keys in secure environment

- [ ] **Remove development tools from production**
  - No monitoring scripts
  - No debug endpoints
  - No test data or accounts

### 🔍 Final Security Audit

- [ ] **Code review completed**
  - No hardcoded credentials
  - Proper authentication flows
  - Secure API endpoints

- [ ] **Test security policies**
  - Verify RLS policies work correctly
  - Test unauthorized access attempts
  - Confirm data isolation between users

---

## 🚨 Emergency Procedures

### If Service Role Key is Exposed:
1. **Immediately rotate the key** in Supabase dashboard
2. **Review database access logs** for unauthorized activity
3. **Update all applications** using the old key
4. **Audit all database changes** made during exposure period

### If Database is Compromised:
1. **Change all authentication credentials**
2. **Review and restore from clean backup** if necessary
3. **Implement additional security measures**
4. **Notify affected users** if personal data was accessed

---

**Remember: Security is not a one-time setup - it requires ongoing vigilance and regular audits.**