import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  PlusIcon,
  EnvelopeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ProfileAvatar from '@/shared/components/ProfileAvatar';
import { Database } from '@/shared/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];

interface AdminToolsData {
  userProfile: User | null;
  allBusinesses: Business[];
}

export default function AdminTools() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminToolsData>({
    userProfile: null,
    allBusinesses: [],
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);


  // Form states
  const [businessForm, setBusinessForm] = useState({
    name: '',
    industry: '',
    description: '',
    website_url: '',
    phone: '',
    email: '',
    logo: null as File | null
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    job_title: '',
    role: 'primary_client' as 'primary_client' | 'employee'
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadAdminData();
  }, [user, router]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        toast.error('Failed to load user profile');
        return;
      }

      // Check if user is admin or agent
      if (userProfile.role !== 'admin' && userProfile.role !== 'agent') {
        toast.error('Access denied. Admin or Agent role required.');
        router.push('/dashboard');
        return;
      }

      // Get all businesses
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('is_active', true);

      if (businessError) {
        console.error('Error fetching businesses:', businessError);
        toast.error('Failed to load businesses');
      }

      setAdminData({
        userProfile,
        allBusinesses: businesses || [],
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { userProfile, allBusinesses } = adminData;

  return (
    <>
      <Head>
        <title>Admin Tools - DigiGrow Client Portal</title>
        <meta name="description" content="Admin tools for managing businesses and clients" />
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
                    className="relative bg-transparent rounded-lg px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-white/50 hover:text-digigrow-navy-700 transition-all duration-300"
                  >
                    📊 Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/admin-tools')}
                    className="relative bg-white border border-digigrow-teal-200 rounded-lg px-6 py-2.5 text-sm font-semibold text-digigrow-navy-700 shadow-sm ml-1 transition-all duration-300 hover:shadow-md"
                  >
                    🛠️ Admin Tools
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-digigrow-teal-500 rounded-full"></div>
                  </button>
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
                            setAdminData(prev => ({
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
          {/* Header section */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-gradient-to-br from-digigrow-navy-900 to-digigrow-navy-800 overflow-hidden shadow-large rounded-2xl animate-fade-in-up">
              <div className="px-6 py-8 sm:p-8 relative">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-digigrow-teal-500/10 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold text-white mb-3 animate-fade-in-down">
                    ⚡ Admin Tools
                  </h1>
                  <p className="text-digigrow-navy-200 text-lg animate-fade-in-down" style={{animationDelay: '0.1s'}}>
                    Manage businesses, invite clients, and onboard new accounts with powerful administrative tools.
                  </p>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-digigrow-teal-500/20 rounded-full animate-pulse-teal"></div>
                  <div className="absolute bottom-4 right-8 w-12 h-12 bg-digigrow-teal-500/10 rounded-full animate-float"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center animate-scale-in" style={{animationDelay: '0.3s'}}>
              <button
                onClick={() => setShowOnboarding(true)}
                className="relative block w-full max-w-lg border-2 border-dashed border-digigrow-teal-300 bg-gradient-to-br from-digigrow-teal-50 to-digigrow-teal-100 p-12 text-center hover:border-digigrow-teal-400 hover:from-digigrow-teal-100 hover:to-digigrow-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-digigrow-teal-500 rounded-2xl transition-all duration-300 hover:shadow-large hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-center mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-digigrow-teal-500 to-digigrow-teal-600 mb-6 group-hover:from-digigrow-teal-600 group-hover:to-digigrow-teal-700 transition-all duration-300 animate-bounce-gentle">
                  <PlusIcon className="h-8 w-8 text-white" />
                </div>
                <span className="block text-xl font-bold text-digigrow-navy-900 mb-3 group-hover:text-digigrow-teal-700 transition-colors duration-300">
                  🚀 Onboard New Business
                </span>
                <span className="block text-base text-digigrow-navy-600 group-hover:text-digigrow-navy-700 transition-colors duration-300">
                  Complete business setup and client invitation in one seamless flow
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl animate-shimmer"></div>
              </button>
            </div>
          </div>

          {/* Businesses list */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow-medium rounded-2xl animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="px-6 py-8 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-digigrow-navy-900">
                    {userProfile?.role === 'admin' ? '🏢 All Businesses' : '🏢 Your Businesses'}
                  </h2>
                  {allBusinesses.length > 0 && (
                    <div className="text-sm text-digigrow-navy-600 bg-digigrow-navy-50 px-3 py-1 rounded-full">
                      {allBusinesses.length} {allBusinesses.length === 1 ? 'Business' : 'Businesses'}
                    </div>
                  )}
                </div>
                
                {allBusinesses.length > 0 ? (
                  <div className="space-y-4">
                    {allBusinesses.map((business, index) => (
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
                            <p className="text-digigrow-navy-600 ml-6 mb-1">
                              <span className="font-medium">{business.industry}</span>
                              {business.description && (
                                <span className="text-digigrow-navy-500"> • {business.description}</span>
                              )}
                            </p>
                            <p className="text-sm text-digigrow-navy-400 ml-6">
                              📅 Created: {new Date(business.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
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
                              <div className="text-xs text-digigrow-navy-500 mt-1 bg-digigrow-navy-100 px-2 py-1 rounded-full">
                                ✅ Setup Complete
                              </div>
                            </div>
                            <div className="w-10 h-10 bg-digigrow-navy-100 rounded-xl flex items-center justify-center group-hover:bg-digigrow-teal-100 transition-colors duration-300">
                              <BuildingOfficeIcon className="w-5 h-5 text-digigrow-navy-600 group-hover:text-digigrow-teal-600" />
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
                    <h3 className="text-xl font-semibold text-digigrow-navy-900 mb-2">No businesses yet</h3>
                    <p className="text-digigrow-navy-600 mb-8 max-w-md mx-auto">
                      Create your first business to get started with client onboarding and management.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Onboard New Business</h3>
                <p className="text-sm text-gray-500 mt-1">Step {onboardingStep} of 2</p>
              </div>
              <button
                onClick={() => {
                  setShowOnboarding(false);
                  setOnboardingStep(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  onboardingStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-4 ${
                  onboardingStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  onboardingStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">Business Details</span>
                <span className="text-xs text-gray-500">Add Client</span>
              </div>
            </div>

            {onboardingStep === 1 && (
              <form onSubmit={(e) => {
                e.preventDefault();
                setOnboardingStep(2);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={businessForm.name}
                      onChange={(e) => setBusinessForm({...businessForm, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Acme Co"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Industry *</label>
                    <select
                      required
                      value={businessForm.industry}
                      onChange={(e) => setBusinessForm({...businessForm, industry: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Logo</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                          <span>Upload a logo</span>
                          <input
                            id="logo-upload"
                            name="logo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setBusinessForm({...businessForm, logo: file});
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      {businessForm.logo && (
                        <p className="text-sm text-green-600">✓ {businessForm.logo.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({...businessForm, description: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Brief description of the business"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website URL</label>
                    <input
                      type="url"
                      value={businessForm.website_url}
                      onChange={(e) => setBusinessForm({...businessForm, website_url: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Email</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({...businessForm, email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contact@example.com"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnboarding(false);
                      setOnboardingStep(1);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Next: Add Client
                  </button>
                </div>
              </form>
            )}

            {onboardingStep === 2 && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  // Create business first
                  const slug = businessForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  
                  const { data: business, error: businessError } = await supabase
                    .from('businesses')
                    .insert({
                      name: businessForm.name,
                      slug: slug,
                      industry: businessForm.industry,
                      description: businessForm.description || null,
                      website_url: businessForm.website_url || null,
                      phone: businessForm.phone || null,
                      email: businessForm.email || null,
                      agent_id: user?.id || '',
                      status: 'active'
                    })
                    .select()
                    .single();

                  if (businessError) {
                    console.error('Error creating business:', businessError);
                    console.error('Error details:', {
                      message: businessError.message,
                      details: businessError.details,
                      hint: businessError.hint,
                      code: businessError.code
                    });
                    toast.error(`Failed to create business: ${businessError.message}`);
                    return;
                  }

                  // TODO: Upload logo if provided
                  
                  // Send magic link invitation to client
                  try {
                    const invitationResponse = await fetch('/api/send-invitation', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        email: inviteForm.email,
                        fullName: inviteForm.full_name,
                        jobTitle: inviteForm.job_title,
                        role: inviteForm.role,
                        businessId: business.id,
                        businessName: business.name
                      })
                    });

                    const invitationResult = await invitationResponse.json();

                    if (!invitationResponse.ok) {
                      throw new Error(invitationResult.error || 'Failed to send invitation');
                    }

                    toast.success(`Business created and invitation sent to ${inviteForm.email}!`);
                  } catch (invitationError) {
                    console.error('Error sending invitation:', invitationError);
                    toast.error(`Business created, but failed to send invitation: ${invitationError instanceof Error ? invitationError.message : 'Unknown error'}`);
                  }
                  
                  setShowOnboarding(false);
                  setOnboardingStep(1);
                  setBusinessForm({
                    name: '',
                    industry: '',
                    description: '',
                    website_url: '',
                    phone: '',
                    email: '',
                    logo: null
                  });
                  setInviteForm({
                    email: '',
                    full_name: '',
                    job_title: '',
                    role: 'primary_client'
                  });
                  loadAdminData(); // Refresh data
                } catch (error) {
                  console.error('Error in onboarding:', error);
                  toast.error('Failed to complete onboarding');
                }
              }} className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Business "{businessForm.name}" is ready!
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Now add at least one client to complete the setup.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Email Address *</label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="client@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.full_name}
                      onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input
                      type="text"
                      value={inviteForm.job_title}
                      onChange={(e) => setInviteForm({...inviteForm, job_title: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="CEO, Marketing Manager, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      required
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as 'primary_client' | 'employee'})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="primary_client">Primary Client</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Magic Link Invitation
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {inviteForm.email ? inviteForm.email : 'The client'} will receive a secure magic link to access their account without needing to create a password.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOnboarding(false);
                        setOnboardingStep(1);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Complete Onboarding
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </>
  );
}