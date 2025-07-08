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
} from '@heroicons/react/24/outline';
import type { Database } from '@/types/database.types';
import type { User, Business, UserBusinessConnection } from '@/lib/supabase';

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
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        toast.error('Failed to load user profile');
        return;
      }

      // Load user's business connections
      const { data: connections, error: connectionsError } = await supabase
        .from('user_business_connections')
        .select(`
          *,
          businesses (*)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (connectionsError) {
        console.error('Error loading connections:', connectionsError);
        toast.error('Failed to load business connections');
        return;
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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">DG</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  DigiGrow
                </span>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Welcome, {userProfile?.full_name || 'User'}
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to your DigiGrow Portal
                </h1>
                <p className="text-gray-600">
                  Access your digital marketing insights, reports, and manage your business profile.
                </p>
              </div>
            </div>
          </div>

          {/* Stats overview */}
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Businesses */}
              <div className="bg-white overflow-hidden shadow-soft rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Connected Businesses
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {businesses.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Role */}
              <div className="bg-white overflow-hidden shadow-soft rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Your Role
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 capitalize">
                          {userProfile?.role?.replace('_', ' ') || 'User'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Services */}
              <div className="bg-white overflow-hidden shadow-soft rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Services
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {businesses.reduce((total, business) => total + (business.active_services?.length || 0), 0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white overflow-hidden shadow-soft rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Account Status
                        </dt>
                        <dd className="text-lg font-medium text-green-600">
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
          {businesses.length > 0 && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow-soft rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Your Businesses
                  </h2>
                  <div className="space-y-4">
                    {businesses.map((business) => (
                      <div
                        key={business.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {business.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {business.industry} • {business.active_services?.length || 0} active services
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              business.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : business.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {business.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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