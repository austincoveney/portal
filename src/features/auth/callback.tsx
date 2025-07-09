import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/shared/types/database.types';

/**
 * Auth Callback Handler for Magic Links
 * 
 * This page handles the authentication callback when users click magic links.
 * It's essential for Supabase magic link authentication to work properly.
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to this page with auth tokens
 * 3. This page exchanges tokens for a session
 * 4. User is redirected to dashboard
 */
export default function AuthCallback() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for token hash (PKCE flow)
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (tokenHash && type) {
          // PKCE flow - verify the token hash
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          });
          
          if (error) {
            console.error('Error verifying token hash:', error);
            router.push('/?error=auth_callback_error');
            return;
          }
          
          // PKCE auth successful
        } else {
          // Implicit flow - get session from URL fragments
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            router.push('/?error=auth_callback_error');
            return;
          }
          
          if (!data.session) {
            // No session found, redirecting to login
            router.push('/?error=no_session');
            return;
          }
          
          // Implicit auth successful
        }
        
        // Check for invitation parameter
        const invitationId = searchParams.get('invitation');
        
        if (invitationId) {
          // Redirect to dashboard with invitation context
          router.push(`/dashboard?invitation=${invitationId}`);
        } else {
          // Regular redirect to dashboard
          router.push('/dashboard');
        }
        
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              Completing sign in...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}