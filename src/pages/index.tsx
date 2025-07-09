import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { Database } from '@/shared/types/database.types';

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

      <div className="min-h-screen bg-gradient-to-br from-digigrow-navy-900 via-digigrow-navy-800 to-digigrow-navy-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-digigrow-teal-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-digigrow-teal-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-digigrow-teal-300/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          {/* DigiGrow Logo */}
          <div className="flex justify-center mb-8 animate-fade-in-down">
            <div className="w-72 h-20 relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
              <Image 
                src="/digigrow-logo.svg" 
                alt="DigiGrow" 
                width={288}
                height={80}
                className="object-contain filter brightness-0 invert"
                priority
              />
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-3">
              🚀 Client Portal
            </h2>
            <p className="text-lg text-digigrow-teal-200 font-medium">
              Secure access for DigiGrow clients and staff
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-digigrow-teal-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-digigrow-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-digigrow-teal-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-digigrow-teal-500 focus:border-digigrow-teal-500 transition-all duration-300 text-gray-900 placeholder-gray-500 hover:border-digigrow-teal-300 shadow-sm focus:shadow-lg"
                  placeholder="✉️ Enter your email"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-digigrow-teal-500 focus:border-digigrow-teal-500 transition-all duration-300 text-gray-900 placeholder-gray-500 hover:border-digigrow-teal-300 shadow-sm focus:shadow-lg"
                  placeholder="🔒 Enter your password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSigningIn || !email || !password}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-digigrow-teal-500 to-digigrow-teal-600 hover:from-digigrow-teal-600 hover:to-digigrow-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-digigrow-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
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
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="text-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <p className="text-sm text-digigrow-teal-200 font-medium mb-4">
                💬 Need help accessing your account?
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs text-white">📧</span>
                  <a href="mailto:support@digigrow.uk" className="text-digigrow-teal-300 hover:text-digigrow-teal-200 transition-colors duration-300 text-sm font-medium hover:underline">
                    support@digigrow.uk
                  </a>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs text-white">📞</span>
                  <a href="tel:03300432952" className="text-digigrow-teal-300 hover:text-digigrow-teal-200 transition-colors duration-300 text-sm font-medium hover:underline">
                    03300 432 952
                  </a>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-gray-300">
                  🔐 Accounts are created by DigiGrow staff only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}