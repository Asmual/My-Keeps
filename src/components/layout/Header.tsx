/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  LayoutList,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { ProfileModal } from '@/components/profile/ProfileModal';
import toast from 'react-hot-toast';

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    toggleViewMode,
    toggleSidebar,
  } = useNotes();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Synchronize profile avatar from localStorage and MongoDB Atlas on mount / session change
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id || session.user.email;
    const cacheKey = `mykeeps_user_avatar_${userId}`;

    let ignore = false;
    async function loadLatestProfile() {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      if (cached !== null && !ignore) {
        setProfileImage(cached || null);
      }

      try {
        const params = new URLSearchParams();
        if (session?.user?.id) params.set('userId', session.user.id);
        if (session?.user?.email) params.set('email', session.user.email);

        const res = await fetch(`/api/user/profile?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success && json.user) {
            // If MongoDB has custom image, use it. Otherwise fallback to Google session image
            const latestImage = json.user.image || session?.user?.image || null;
            setProfileImage(latestImage);
            if (latestImage) {
              localStorage.setItem(cacheKey, latestImage);
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile avatar in Header:', err);
      }
    }

    loadLatestProfile();
    return () => {
      ignore = true;
    };
  }, [session?.user]);

  const activeAvatar = profileImage || session?.user?.image || null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 bg-white/95 dark:bg-[#011C40]/95 backdrop-blur-md border-b border-[#A7EBF2]/50 dark:border-[#26658C] transition-colors">
      {/* Left branding and hamburger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="icon"
          onClick={toggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="text-[#011C40] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2 select-none group">
          <Image
            src="/images/MK-logo.png"
            alt="My Keeps Logo"
            width={34}
            height={34}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-contain shadow-sm group-hover:scale-105 transition-transform"
            priority
          />
          <span className="font-bold text-base sm:text-lg tracking-tight text-[#011C40] dark:text-white">
            My Keeps
          </span>
        </Link>
      </div>

      {/* Center Omnibox Search Bar: Desktop/Tablet only (hidden on mobile) */}
      <div className="hidden sm:flex flex-1 max-w-2xl mx-3 md:mx-6">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 w-4 h-4 text-[#54ACBF] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, labels, ideas in Luna..."
            className="w-full h-11 pl-10 pr-10 rounded-full bg-slate-100/90 dark:bg-[#023859]/90 border border-[#A7EBF2] dark:border-[#26658C] focus:border-[#54ACBF] text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#54ACBF]/40 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-[#011C40] dark:text-[#A7EBF2]/70 dark:hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay when toggled */}
      {isMobileSearchOpen && (
        <div className="sm:hidden absolute inset-x-0 top-0 h-16 bg-white dark:bg-[#011C40] z-40 flex items-center px-3 gap-2 border-b border-[#A7EBF2] dark:border-[#26658C] animate-in fade-in slide-in-from-top-2 duration-200">
          <Search className="w-4 h-4 text-[#54ACBF] shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes & tags..."
            className="flex-1 h-10 px-2 bg-transparent text-[#011C40] dark:text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="px-2.5 py-1 text-xs font-semibold text-[#54ACBF] hover:text-[#023859] dark:hover:text-white"
          >
            Done
          </button>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile Search Icon Toggle */}
        <Button
          variant="icon"
          onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          className="sm:hidden text-[#011C40] dark:text-[#A7EBF2]"
          title="Search notes"
          aria-label="Search notes"
        >
          <Search className="w-5 h-5 text-[#54ACBF]" />
        </Button>

        {/* Toggle Grid/List with distinct LayoutList icon */}
        <Button
          variant="icon"
          onClick={toggleViewMode}
          title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          aria-label="Toggle view mode"
        >
          {viewMode === 'grid' ? (
            <LayoutList className="w-5 h-5 text-[#023859] dark:text-[#A7EBF2]" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-[#023859] dark:text-[#A7EBF2]" />
          )}
        </Button>

        {/* Dark/Light mode toggle */}
        <Button
          variant="icon"
          onClick={toggleTheme}
          title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-[#54ACBF]" />
          ) : (
            <Moon className="w-5 h-5 text-[#023859]" />
          )}
        </Button>

        {/* Auth Section */}
        {session?.user ? (
          // Logged In User Avatar & Dropdown
          <div className="relative ml-0.5 sm:ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              title={session.user.name || session.user.email}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#023859] via-[#26658C] to-[#54ACBF] text-white font-bold text-xs sm:text-sm ring-2 ring-[#54ACBF] dark:ring-[#A7EBF2]/70 shadow-sm cursor-pointer hover:scale-105 transition-transform"
            >
              {activeAvatar ? (
                <img
                  src={activeAvatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#26658C]/60 mb-1">
                  <p className="text-xs font-semibold text-[#011C40] dark:text-white truncate">
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7EBF2]/70 truncate">
                    {session.user.email}
                  </p>
                </div>

                {/* Mobile Search option inside Profile dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsMobileSearchOpen(true);
                  }}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#011C40] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer mb-1"
                >
                  <Search className="w-4 h-4 text-[#54ACBF]" />
                  <span>Search Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#011C40] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer mb-1"
                >
                  <UserIcon className="w-4 h-4 text-[#54ACBF]" />
                  <span>View Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Unauthenticated Guest Controls
          <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold px-2 sm:px-3 h-8"
              >
                <UserIcon className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/register" className="hidden xs:inline-block">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-semibold px-3 h-8 bg-[#023859] hover:bg-[#26658C] text-white"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(updated) => {
          const newImg = updated.image || null;
          setProfileImage(newImg);
          const userId = session?.user?.id || session?.user?.email;
          if (userId) {
            if (newImg) {
              localStorage.setItem(`mykeeps_user_avatar_${userId}`, newImg);
            } else {
              localStorage.removeItem(`mykeeps_user_avatar_${userId}`);
            }
          }
          router.refresh();
        }}
      />
    </header>
  );
}
