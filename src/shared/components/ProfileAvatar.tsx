import { useState } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import type { Database } from '@/shared/types/database.types';

interface ProfileAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  fullName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

export default function ProfileAvatar({ 
  userId, 
  avatarUrl, 
  fullName, 
  size = 'md', 
  editable = false,
  onAvatarUpdate 
}: ProfileAvatarProps) {
  const supabase = useSupabaseClient<Database>();
  const [uploading, setUploading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      if (!file) {
        throw new Error('No file selected');
      }
      
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size must be less than 20MB');
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // First, try to create the bucket if it doesn't exist
      try {
        await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 20971520 // 20MB
        });
      } catch (bucketError) {
        // Bucket might already exist, continue
        // Bucket already exists or creation failed - this is expected
      }

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('bucket')) {
          throw new Error('Storage bucket not found. Please contact support.');
        }
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          throw new Error('Storage permissions not configured. Please contact your administrator to set up the storage policies.');
        }
        if (uploadError.message.includes('violates')) {
          throw new Error('Upload permission denied. Please contact support to configure storage access.');
        }
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setCurrentAvatarUrl(publicUrl);
      onAvatarUpdate?.(publicUrl);
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-digigrow-teal-400 to-digigrow-teal-600 flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white/20 transition-all duration-300 group-hover:ring-digigrow-teal-400/50 group-hover:shadow-xl`}>
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={fullName || 'Profile'}
            className="w-full h-full object-cover"
            onError={() => setCurrentAvatarUrl(null)}
          />
        ) : (
          <span className="select-none">
            {getInitials(fullName)}
          </span>
        )}
      </div>
      
      {editable && (
        <>
          <label 
            htmlFor={`avatar-upload-${userId}`}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <CameraIcon className={`${iconSizeClasses[size]} text-white`} />
            )}
          </label>
          <input
            id={`avatar-upload-${userId}`}
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}