import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import type { Database } from '@/shared/types/database.types';
import type { User } from '@/shared/lib/supabase';
import ProfileAvatar from '@/shared/components/ProfileAvatar';

export default function Settings() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadUserProfile();
  }, [user, router]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load user profile');
        return;
      }

      setUserProfile(profile);
      setFormData({
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        job_title: profile.job_title || '',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          job_title: formData.job_title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      toast.success('Profile updated successfully!');
      loadUserProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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

  return (
    <>
      <Head>
        <title>Account Settings - DigiGrow Client Portal</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/digigrow-logo.svg" 
                  alt="DigiGrow" 
                  className="h-8 w-auto"
                />
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
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="px-4 py-4 sm:px-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>
          </div>

          {/* Settings form */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow-soft rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Account Settings
                </h1>

                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Profile Picture
                    </h2>
                    <div className="flex items-center space-x-4">
                      <ProfileAvatar
                        userId={user!.id}
                        avatarUrl={userProfile?.avatar_url}
                        fullName={userProfile?.full_name}
                        size="xl"
                        editable={true}
                        onAvatarUpdate={(newUrl) => {
                          setUserProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
                        }}
                      />
                      <div>
                        <p className="text-sm text-gray-600">
                          Click on your avatar to upload a new profile picture.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: Square image, at least 200x200 pixels
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Profile Information
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="text"
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your full name"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your email address"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your phone number"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Job Title */}
                      <div>
                        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
                          Job Title
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type="text"
                            id="job_title"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your job title"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Account Information
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Role</span>
                          <p className="text-sm text-gray-900 capitalize">
                            {userProfile?.role?.replace('_', ' ') || 'User'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Account Status</span>
                          <p className="text-sm text-green-600">Active</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Member Since</span>
                          <p className="text-sm text-gray-900">
                            {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Last Updated</span>
                          <p className="text-sm text-gray-900">
                            {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}