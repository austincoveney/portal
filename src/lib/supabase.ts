import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client
 * Use this in client components and pages
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Client component Supabase client (Next.js 13+ App Router)
 * Use this in client components when using the app directory
 */
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

/**
 * Server component Supabase client (Next.js 13+ App Router)
 * Use this in server components when using the app directory
 */
export const createSupabaseServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

/**
 * Admin Supabase client with service role key
 * ONLY use this on the server-side for admin operations
 * NEVER expose this to the client
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Type-safe database types
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Export specific table types for convenience
export type User = Tables<'users'>;
export type Business = Tables<'businesses'>;
export type UserBusinessConnection = Tables<'user_business_connections'>;
export type Invitation = Tables<'invitations'>;
export type AuditLog = Tables<'audit_logs'>;
export type UserSession = Tables<'user_sessions'>;

// Export enum types
export type UserRole = Enums<'user_role'>;
export type BusinessStatus = Enums<'business_status'>;
export type ConnectionStatus = Enums<'connection_status'>;
export type InvitationStatus = Enums<'invitation_status'>;

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return user;
};

/**
 * Helper function to get user profile
 */
export const getUserProfile = async (userId?: string) => {
  const targetUserId = userId || (await getCurrentUser())?.id;
  
  if (!targetUserId) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', targetUserId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data;
};

/**
 * Helper function to sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Helper function to refresh session
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Error refreshing session:', error);
    throw error;
  }
  
  return data;
};

/**
 * Real-time subscription helper
 */
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();
  
  return channel;
};

/**
 * Helper to unsubscribe from real-time
 */
export const unsubscribeFromRealtime = (channel: any) => {
  return supabase.removeChannel(channel);
};

export default supabase;