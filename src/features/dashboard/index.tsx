import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import ProfileAvatar from '@/shared/components/ProfileAvatar';
import type { Database } from '@/shared/types/database.types';
import type { User, Business, UserBusinessConnection } from '@/shared/lib/supabase';

interface DashboardData {
  userProfile: User | null;
  businesses: Business[];
  connections: UserBusinessConnection[];
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    userProfile: null,
    businesses: [],
    connections: [],
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadDashboardData();
  }, [user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user profile
      let { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        if (userError.code === 'PGRST116') {
          // User profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user!.id,
              full_name: user!.user_metadata?.full_name || user!.email?.split('@')[0] || 'New User',
              role: 'primary_client'
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            toast.error('Failed to create user profile');
            return;
          }
          
          // Use the newly created profile
          userProfile = newProfile;
        } else {
          toast.error('Failed to load user profile');
          return;
        }
      }

      // Load user's business connections
      const { data: connections, error: connectionsError } = await supabase
        .from('user_business_connections')
        .select(`
          *,
          businesses (*)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
        // Don't return here - user might not have connections yet
        console.warn('No business connections found for user');
      }

      // Extract businesses from connections
      const businesses = connections?.map(conn => (conn as any).businesses).filter(Boolean) || [];

      setDashboardData({
        userProfile,
        businesses,
        connections: connections || [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { userProfile, businesses } = dashboardData;

  return (
    <>
      <Head>
        <title>Dashboard - DigiGrow Client Portal</title>
        <meta name="description" content="Your DigiGrow client dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200 relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center animate-fade-in-right">
                <img 
                  src="/digigrow-logo-dark.svg" 
                  alt="DigiGrow" 
                  className="h-10 w-auto transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Navigation - Modern Tab Style */}
              <div className="flex items-center animate-fade-in-down" style={{animationDelay: '0.2s'}}>
                <nav className="flex bg-gray-50 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="relative bg-white border border-digigrow-teal-200 rounded-lg px-6 py-2.5 text-sm font-semibold text-digigrow-navy-700 shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    📊 Dashboard
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-digigrow-teal-500 rounded-full"></div>
                  </button>
                  {(userProfile?.role === 'admin' || userProfile?.role === 'agent') && (
                    <button
                      onClick={() => router.push('/dashboard/admin-tools')}
                      className="relative bg-transparent rounded-lg px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-white/50 hover:text-digigrow-navy-700 ml-1 transition-all duration-300"
                    >
                      🛠️ Admin Tools
                    </button>
                  )}
                </nav>
              </div>

              {/* User Profile Menu */}
              <div className="flex items-center space-x-4 animate-fade-in-left" style={{animationDelay: '0.4s'}}>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-digigrow-navy-700">
                    {userProfile?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Member'} • {userProfile?.job_title || 'Team Member'}
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-all duration-300 group-hover:shadow-md border border-gray-200 hover:border-digigrow-teal-300">
                    <ProfileAvatar 
                      userId={user!.id}
                      avatarUrl={userProfile?.avatar_url}
                      fullName={userProfile?.full_name}
                      size="sm"
                    />
                    <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-digigrow-teal-600 transition-colors duration-300" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <ProfileAvatar 
                          userId={user!.id}
                          avatarUrl={userProfile?.avatar_url}
                          fullName={userProfile?.full_name}
                          size="md"
                          editable={true}
                          onAvatarUpdate={(newUrl) => {
                            setDashboardData(prev => ({
                              ...prev,
                              userProfile: prev.userProfile ? { ...prev.userProfile, avatar_url: newUrl } : null
                            }));
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{userProfile?.full_name}</div>
                          <div className="text-sm text-gray-500">{userProfile?.role}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-digigrow-teal-50 hover:text-digigrow-teal-700 transition-colors duration-200"
                      >
                        <CogIcon className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-gradient-to-br from-digigrow-navy-900 to-digigrow-navy-800 overflow-hidden shadow-large rounded-2xl animate-fade-in-up">
              <div className="px-6 py-8 sm:p-8 relative">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-digigrow-teal-500/10 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold text-white mb-3 animate-fade-in-down">
                    {(userProfile?.role === 'admin' || userProfile?.role === 'agent') 
                      ? '🚀 Admin Dashboard' 
                      : '👋 Welcome to your DigiGrow Portal'
                    }
                  </h1>
                  <p className="text-digigrow-navy-200 text-lg animate-fade-in-down" style={{animationDelay: '0.1s'}}>
                    {(userProfile?.role === 'admin' || userProfile?.role === 'agent')
                      ? 'Manage businesses, onboard clients, and oversee your portfolio with powerful tools.'
                      : 'Access your digital marketing insights, reports, and manage your business profile.'
                    }
                  </p>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-digigrow-teal-500/20 rounded-full animate-pulse-teal"></div>
                  <div className="absolute bottom-4 right-8 w-12 h-12 bg-digigrow-teal-500/10 rounded-full animate-float"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats overview */}
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Businesses */}
              <div className="bg-white overflow-hidden shadow-medium rounded-xl hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-scale-in group" style={{animationDelay: '0.1s'}}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-digigrow-teal-100 rounded-xl group-hover:bg-digigrow-teal-200 transition-colors duration-300">
                        <BuildingOfficeIcon className="h-6 w-6 text-digigrow-teal-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-digigrow-navy-600 truncate">
                          Connected Businesses
                        </dt>
                        <dd className="text-2xl font-bold text-digigrow-navy-900 group-hover:text-digigrow-teal-600 transition-colors duration-300">
                          {businesses.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Role */}
              <div className="bg-white overflow-hidden shadow-medium rounded-xl hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-scale-in group" style={{animationDelay: '0.2s'}}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-digigrow-navy-100 rounded-xl group-hover:bg-digigrow-navy-200 transition-colors duration-300">
                        <UsersIcon className="h-6 w-6 text-digigrow-navy-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-digigrow-navy-600 truncate">
                          Your Role
                        </dt>
                        <dd className="text-2xl font-bold text-digigrow-navy-900 capitalize group-hover:text-digigrow-navy-700 transition-colors duration-300">
                          {userProfile?.role?.replace('_', ' ') || 'User'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Services */}
              <div className="bg-white overflow-hidden shadow-medium rounded-xl hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-scale-in group" style={{animationDelay: '0.3s'}}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-accent-100 rounded-xl group-hover:bg-accent-200 transition-colors duration-300">
                        <ChartBarIcon className="h-6 w-6 text-accent-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-digigrow-navy-600 truncate">
                          Active Services
                        </dt>
                        <dd className="text-2xl font-bold text-digigrow-navy-900 group-hover:text-accent-600 transition-colors duration-300">
                          0
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white overflow-hidden shadow-medium rounded-xl hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-scale-in group" style={{animationDelay: '0.4s'}}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-success-100 rounded-xl group-hover:bg-success-200 transition-colors duration-300">
                        <CogIcon className="h-6 w-6 text-success-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-digigrow-navy-600 truncate">
                          Account Status
                        </dt>
                        <dd className="text-2xl font-bold text-success-600 group-hover:text-success-700 transition-colors duration-300">
                          Active
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Businesses list */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow-medium rounded-2xl animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="px-6 py-8 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-digigrow-navy-900">
                    {(userProfile?.role === 'admin' || userProfile?.role === 'agent')
                      ? '🏢 Your Managed Businesses'
                      : '🏢 Your Businesses'
                    }
                  </h2>
                  {businesses.length > 0 && (
                    <div className="text-sm text-digigrow-navy-600 bg-digigrow-navy-50 px-3 py-1 rounded-full">
                      {businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}
                    </div>
                  )}
                </div>
                
                {businesses.length > 0 ? (
                  <div className="space-y-4">
                    {businesses.map((business, index) => (
                      <div
                        key={business.id}
                        className="border border-digigrow-navy-200 rounded-xl p-6 hover:bg-digigrow-navy-50 hover:border-digigrow-teal-300 transition-all duration-300 hover:shadow-medium group animate-slide-in-left"
                        style={{animationDelay: `${0.6 + index * 0.1}s`}}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-3 h-3 bg-digigrow-teal-500 rounded-full animate-pulse-teal"></div>
                              <h3 className="text-lg font-semibold text-digigrow-navy-900 group-hover:text-digigrow-teal-600 transition-colors duration-300">
                                {business.name}
                              </h3>
                            </div>
                            <p className="text-digigrow-navy-600 ml-6">
                              <span className="font-medium">{business.industry}</span>
                              {business.description && (
                                <span className="text-digigrow-navy-500"> • {business.description}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                              business.status === 'active'
                                ? 'bg-success-100 text-success-800 group-hover:bg-success-200'
                                : 'bg-gray-100 text-gray-800 group-hover:bg-gray-200'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                business.status === 'active' ? 'bg-success-500' : 'bg-gray-500'
                              }`}></div>
                              {business.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                            <div className="w-8 h-8 bg-digigrow-navy-100 rounded-lg flex items-center justify-center group-hover:bg-digigrow-teal-100 transition-colors duration-300">
                              <BuildingOfficeIcon className="w-4 h-4 text-digigrow-navy-600 group-hover:text-digigrow-teal-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                    <div className="w-24 h-24 bg-digigrow-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                      <BuildingOfficeIcon className="h-12 w-12 text-digigrow-navy-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-digigrow-navy-900 mb-2">
                      {(userProfile?.role === 'admin' || userProfile?.role === 'agent')
                        ? 'No businesses created yet'
                        : 'No businesses connected'
                      }
                    </h3>
                    <p className="text-digigrow-navy-600 mb-8 max-w-md mx-auto">
                      {(userProfile?.role === 'admin' || userProfile?.role === 'agent')
                        ? 'Create your first business to start onboarding clients and managing their digital marketing journey.'
                        : 'Contact your DigiGrow agent to get started with your business setup and unlock powerful marketing insights.'
                      }
                    </p>
                    <div className="space-y-4">
                      {(userProfile?.role === 'admin' || userProfile?.role === 'agent') ? (
                        <button
                          type="button"
                          onClick={() => router.push('/dashboard/admin-tools')}
                          className="inline-flex items-center px-6 py-3 border border-transparent shadow-medium text-base font-medium rounded-xl text-white bg-gradient-to-r from-digigrow-teal-500 to-digigrow-teal-600 hover:from-digigrow-teal-600 hover:to-digigrow-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-digigrow-teal-500 transition-all duration-300 hover:shadow-large hover:-translate-y-0.5 animate-glow"
                        >
                          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                          Go to Admin Tools
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast('Please contact your DigiGrow agent for business setup')}
                          className="inline-flex items-center px-6 py-3 border border-transparent shadow-medium text-base font-medium rounded-xl text-white bg-gradient-to-r from-digigrow-navy-600 to-digigrow-navy-700 hover:from-digigrow-navy-700 hover:to-digigrow-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-digigrow-navy-500 transition-all duration-300 hover:shadow-large hover:-translate-y-0.5"
                        >
                          💬 Contact Support
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {businesses.length === 0 && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow-soft rounded-lg">
                <div className="px-4 py-12 sm:px-6 lg:px-8 text-center">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No businesses connected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact your DigiGrow agent to get started with your business setup.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}