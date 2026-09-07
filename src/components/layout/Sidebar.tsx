'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  StickyNote,
  Bell,
  Archive,
  Trash2,
  Tag,
  Hash,
  Lock,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const {
    sidebarOpen,
    counts,
    allLabels,
    selectedLabel,
    setSelectedLabel,
    isAuthenticated,
    currentUser,
  } = useNotes();

  const navItems = [
    {
      label: 'Notes',
      href: '/',
      icon: StickyNote,
      count: counts.active,
      active: pathname === '/' && !selectedLabel,
    },
    {
      label: 'Reminders',
      href: '/reminders',
      icon: Bell,
      count: 0,
      active: pathname === '/reminders',
    },
    {
      label: 'Archive',
      href: '/archive',
      icon: Archive,
      count: counts.archive,
      active: pathname === '/archive',
    },
    {
      label: 'Trash',
      href: '/trash',
      icon: Trash2,
      count: counts.trash,
      active: pathname === '/trash',
    },
  ];

  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-between py-3 transition-all duration-250 ease-out select-none border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm z-20',
        sidebarOpen ? 'w-64 px-3' : 'w-18 px-2'
      )}
    >
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {/* Main Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSelectedLabel(null)}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors group relative cursor-pointer',
                  item.active
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-neutral-200'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div
                  className={cn(
                    'flex items-center justify-center transition-transform group-hover:scale-105',
                    !sidebarOpen && 'w-full'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      item.active
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    )}
                  />
                </div>

                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.count > 0 && (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs rounded-full font-semibold',
                          item.active
                            ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                            : 'bg-neutral-200/70 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Labels Section */}
        {allLabels.length > 0 && (
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
            {sidebarOpen && (
              <div className="px-3 pb-2 text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase flex items-center justify-between">
                <span>Labels</span>
                <Tag className="w-3.5 h-3.5 opacity-70" />
              </div>
            )}
            <div className="space-y-1">
              {allLabels.map((label) => {
                const isSelected = selectedLabel === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setSelectedLabel(isSelected ? null : label);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3.5 px-3 py-2 rounded-2xl text-sm font-medium transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
                    )}
                    title={!sidebarOpen ? label : undefined}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center',
                        !sidebarOpen && 'w-full'
                      )}
                    >
                      <Hash
                        className={cn(
                          'w-4 h-4',
                          isSelected
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-neutral-400 dark:text-neutral-500'
                        )}
                      />
                    </div>
                    {sidebarOpen && (
                      <span className="truncate flex-1 text-xs">{label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 px-3 text-xs text-neutral-400 dark:text-neutral-500 space-y-2">
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-medium text-[11px] truncate">Guest Mode • Sign in to save</span>
            </Link>
          ) : (
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[140px] text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                {currentUser?.name || currentUser?.email || 'Logged In'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Connected to Atlas" />
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] opacity-70">
            <span>My Keeps v1.0</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      )}
    </aside>
  );
}
