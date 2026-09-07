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
  List,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
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
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-[#011C40]/95 backdrop-blur-md border-b border-[#A7EBF2]/50 dark:border-[#26658C] transition-colors">
      {/* Left branding and hamburger */}
      <div className="flex items-center gap-3 min-w-[180px] sm:min-w-[200px]">
        <Button
          variant="icon"
          onClick={toggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="text-[#011C40] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <Image
            src="/images/logo.png"
            alt="My Keeps Logo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-contain shadow-sm group-hover:scale-105 transition-transform"
            priority
          />
          <span className="font-bold text-lg tracking-tight text-[#011C40] dark:text-white hidden sm:inline-block">
            My Keeps
          </span>
        </Link>
      </div>

      {/* Center Omnibox Search Bar (Luna pill design) */}
      <div className="flex-1 max-w-2xl mx-2 md:mx-6">
        <div className="relative flex items-center">
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

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Grid/List */}
        <Button
          variant="icon"
          onClick={toggleViewMode}
          title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          aria-label="Toggle view mode"
        >
          {viewMode === 'grid' ? (
            <List className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
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
          <div className="relative ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              title={session.user.name || session.user.email}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#023859] via-[#26658C] to-[#54ACBF] text-white font-semibold text-xs ring-2 ring-[#A7EBF2] dark:ring-[#26658C] shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {userInitial}
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
          // Unauthenticated Guest Controls (Signature Dark Blue primary button)
          <div className="flex items-center gap-1.5 ml-1">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold px-2.5 sm:px-3 h-8"
              >
                <UserIcon className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/register" className="hidden xs:inline-block">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-semibold px-3.5 h-8 bg-[#023859] hover:bg-[#26658C] text-white"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
