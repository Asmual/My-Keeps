'use client';

import React from 'react';
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

export function Header() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    toggleViewMode,
    toggleSidebar,
  } = useNotes();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      {/* Left branding and hamburger */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <Button
          variant="icon"
          onClick={toggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 select-none cursor-pointer">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-sm shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 hidden sm:inline-block">
            My Keeps
          </span>
        </div>
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

        {/* Profile indicator */}
        <div className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs ring-2 ring-white dark:ring-neutral-900 select-none cursor-pointer">
          MK
        </div>
      </div>
    </header>
  );
}
