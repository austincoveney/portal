import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { Database } from '@/types/database.types';

export default function Home() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    if (user) {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        toast.error('Sign in failed');
      } else if (data.user) {
        toast.success('Welcome to DigiGrow Client Portal!');
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>DigiGrow Client Portal - Sign In</title>
        <meta name="description" content="Access your DigiGrow digital marketing dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#0B154F] via-[#0B154F] to-[#1a2b6b] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* DigiGrow Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-64 h-16 relative">
              <Image 
                src="/digigrow-logo.svg" 
                alt="DigiGrow" 
                width={256}
                height={64}
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Header */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Client Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Secure access for DigiGrow clients and staff
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D692] focus:border-[#00D692] transition-colors duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D692] focus:border-[#00D692] transition-colors duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSigningIn || !email || !password}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#00D692] to-[#00B87A] hover:from-[#00B87A] hover:to-[#009966] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00D692] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSigningIn ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Support Info */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <p className="text-xs text-gray-300">
              Need help accessing your account?
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-xs">
                <a href="mailto:support@digigrow.uk" className="text-[#00D692] hover:text-[#00B87A] transition-colors duration-200">
                  support@digigrow.uk
                </a>
              </p>
              <p className="text-xs">
                <a href="tel:03300432952" className="text-[#00D692] hover:text-[#00B87A] transition-colors duration-200">
                  03300 432 952
                </a>
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Accounts are created by DigiGrow staff only
            </p>
          </div>
        </div>
      </div>
    </>
  );
}