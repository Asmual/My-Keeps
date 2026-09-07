'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      {/* Left branding and hamburger */}
      <div className="flex items-center gap-3 min-w-[180px] sm:min-w-[200px]">
        <Button
          variant="icon"
          onClick={toggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2 select-none">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-sm shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 hidden sm:inline-block">
            My Keeps
          </span>
        </Link>
      </div>

      {/* Center Omnibox Search Bar */}
      <div className="flex-1 max-w-2xl mx-2 md:mx-6">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, labels, thoughts..."
            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 border border-transparent focus:border-amber-400/50 dark:focus:border-amber-500/50 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-600" />
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
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-semibold text-xs ring-2 ring-white dark:ring-neutral-900 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {userInitial}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700/60 mb-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {session.user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Unauthenticated Guest Controls
          <div className="flex items-center gap-1.5 ml-1">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold px-2.5 sm:px-3 h-8 text-neutral-700 dark:text-neutral-200"
              >
                <UserIcon className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
            <Link href="/register" className="hidden xs:inline-block">
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-semibold px-3 h-8"
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
