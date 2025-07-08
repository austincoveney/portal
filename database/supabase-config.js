// DigiGrow Client Portal - Supabase Configuration
// Store your Supabase project credentials here

// Supabase Project Configuration
export const supabaseConfig = {
  // Project URL
  url: 'https://ywfvlqvsgyhiugoludhy.supabase.co',
  
  // Anonymous key (safe for client-side use)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZnZscXZzZ3loaXVnb2x1ZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDc3NjEsImV4cCI6MjA2NzU4Mzc2MX0.Z_fTY90IQsXcEw2IYf4ASO4cuGcLz-duvI_yZxXNLvA',
  
  // Service role key (NEVER expose on client-side - server/admin use only)
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZnZscXZzZ3loaXVnb2x1ZGh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwNzc2MSwiZXhwIjoyMDY3NTgzNzYxfQ.mxImWuNqXF45wjpYkZjTxNwZj0h0El4FDaEPobunRco'
};

// Client-side Supabase instance (safe for frontend)
export const supabaseClient = {
  url: supabaseConfig.url,
  key: supabaseConfig.anonKey
};

// Server-side Supabase instance (admin privileges - backend only)
export const supabaseAdmin = {
  url: supabaseConfig.url,
  key: supabaseConfig.serviceRoleKey
};

// Environment-specific configuration
export const getSupabaseConfig = (environment = 'client') => {
  switch (environment) {
    case 'admin':
    case 'server':
      return supabaseAdmin;
    case 'client':
    case 'frontend':
    default:
      return supabaseClient;
  }
};

// Security Notes:
// 1. The anon key is safe to use in client-side applications
// 2. The service role key should ONLY be used in server-side code
// 3. Never commit service role keys to public repositories
// 4. Consider using environment variables for production deployments

// Usage Examples:
// Frontend: const supabase = createClient(supabaseClient.url, supabaseClient.key)
// Backend:  const supabase = createClient(supabaseAdmin.url, supabaseAdmin.key)