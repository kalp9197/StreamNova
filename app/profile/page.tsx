'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User, Mail, Camera, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authUser';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const router = useRouter();
  const { user, authCheck } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setUsername(user.username || '');
    setEmail(user.email || '');
    setImage(user.image || '');
  }, [user, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append('image', file);
      }

      await axios.post('/api/v1/profile/update', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
      await authCheck(); // Refresh user data
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setImage(user.image || '');
    }
    setAvatarPreview(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    return null;
  }

  const displayImage = avatarPreview || image;

  return (
    <div className="bg-black min-h-screen text-white pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg p-8"
        >
          <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
            <User className="size-10 text-red-600" />
            Profile Settings
          </h1>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {displayImage ? (
                <motion.img
                  src={displayImage}
                  alt="Avatar"
                  className="size-32 rounded-full object-cover border-4 border-gray-700"
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div className="size-32 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-4 border-gray-700">
                  <User className="size-16 text-white" />
                </div>
              )}
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 rounded-full p-3 border-4 border-gray-900"
                  aria-label="Change avatar"
                >
                  <Camera className="size-5 text-white" />
                </motion.button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {isEditing && (
              <p className="text-sm text-gray-400 mt-2 text-center">
                Click the camera icon to change your avatar
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <User className="size-5" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Mail className="size-5" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <User className="size-5" />
                Edit Profile
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-5" />
                      Save Changes
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="size-5" />
                  Cancel
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
