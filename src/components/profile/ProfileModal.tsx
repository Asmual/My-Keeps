'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Camera,
  User,
  Phone,
  Loader2,
  Check,
  Trash2,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (user: {
    name: string;
    image: string;
    gender: string;
    phoneNumber: string;
  }) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: ProfileModalProps) {
  const { data: session } = useSession();

  const [name, setName] = useState(() => session?.user?.name || '');
  const [image, setImage] = useState(() => session?.user?.image || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile from MongoDB when modal opens
  useEffect(() => {
    if (!isOpen || !session?.user) return;

    let ignore = false;
    async function fetchFullProfile() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (session?.user?.id) params.set('userId', session.user.id);
        if (session?.user?.email) params.set('email', session.user.email);

        const res = await fetch(`/api/user/profile?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success && json.user) {
            if (json.user.name) setName(json.user.name);
            if (json.user.image) setImage(json.user.image);
            if (json.user.gender) setGender(json.user.gender);
            if (json.user.phoneNumber) setPhoneNumber(json.user.phoneNumber);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile from MongoDB:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchFullProfile();
    return () => {
      ignore = true;
    };
  }, [isOpen, session]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          name: name.trim(),
          image,
          gender,
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Profile saved to MongoDB!');
        if (onProfileUpdated) {
          onProfileUpdated({
            name: name.trim(),
            image,
            gender,
            phoneNumber: phoneNumber.trim(),
          });
        }
        onClose();
      } else {
        toast.error(json.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Network error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const userInitial = name
    ? name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#011C40]/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl animate-in zoom-in-95 duration-150 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#26658C]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#54ACBF]/15 dark:bg-[#011C40] text-[#023859] dark:text-[#A7EBF2]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#011C40] dark:text-white">
                View & Edit Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A7EBF2]/70">
                Manage your personal information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Loader2 className="w-8 h-8 text-[#54ACBF] animate-spin" />
            <span className="text-xs text-slate-400 dark:text-[#A7EBF2]/60">
              Loading profile from MongoDB...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar Upload Area */}
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <div className="relative group">
                <div className="w-22 h-22 rounded-full overflow-hidden ring-3 ring-[#54ACBF] ring-offset-2 dark:ring-offset-[#023859] bg-gradient-to-tr from-[#023859] via-[#26658C] to-[#54ACBF] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {image ? (
                    <Image
                      src={image}
                      alt="Profile Avatar"
                      width={88}
                      height={88}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>

                {/* Camera upload button badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload picture"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#023859] text-white hover:bg-[#26658C] border-2 border-white dark:border-[#023859] shadow-md transition-transform hover:scale-105 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#A7EBF2]" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="mt-2 text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remove picture
                </button>
              )}
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1">
                Email Address
              </label>
              <input
                type="text"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#011C40]/50 border border-slate-200 dark:border-[#26658C] text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/50"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1.5">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ].map((g) => {
                  const isSelected = gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value as 'male' | 'female' | 'other')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none',
                        isSelected
                          ? 'bg-[#023859] text-white dark:bg-[#54ACBF] dark:text-[#011C40] border-[#023859] dark:border-[#54ACBF] shadow-xs'
                          : 'bg-slate-50 dark:bg-[#011C40] text-slate-700 dark:text-[#A7EBF2]/80 border-slate-200 dark:border-[#26658C] hover:border-[#54ACBF]'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#A7EBF2]/80 mb-1">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 w-3.5 h-3.5 text-[#54ACBF]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/50"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#26658C]/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
                className="text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="text-xs px-5 font-semibold bg-[#023859] hover:bg-[#26658C] text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
