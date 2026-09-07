'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  StickyNote,
  CheckSquare,
  Archive,
  Trash2,
  Tag,
  Hash,
  Lock,
  Star,
  Image as ImageIcon,
  Mic,
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
      label: 'Text Note',
      href: '/',
      icon: StickyNote,
      count: counts.textNotes,
      active: pathname === '/' && !selectedLabel,
    },
    {
      label: 'Checklist Note',
      href: '/checklists',
      icon: CheckSquare,
      count: counts.checklists,
      active: pathname === '/checklists',
    },
    {
      label: 'Image Note',
      href: '/image-notes',
      icon: ImageIcon,
      count: counts.imageNotes,
      active: pathname === '/image-notes',
    },
    {
      label: 'Voice Note',
      href: '/voice-notes',
      icon: Mic,
      count: counts.voiceNotes,
      active: pathname === '/voice-notes',
    },
    {
      label: 'Important',
      href: '/important',
      icon: Star,
      count: counts.important,
      active: pathname === '/important',
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
    <>
      <aside
        className={cn(
          'sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-between py-4 transition-all duration-250 ease-out select-none border-r border-[#A7EBF2]/40 dark:border-[#26658C] bg-white/60 dark:bg-[#011C40] backdrop-blur-sm z-20',
          sidebarOpen ? 'w-64 px-3' : 'w-18 px-2'
        )}
      >
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {/* Main Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSelectedLabel(null)}
                  className={cn(
                    'flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all group relative cursor-pointer',
                    item.active
                      ? 'bg-[#023859] text-white dark:bg-[#023859] dark:text-[#A7EBF2] shadow-sm border border-[#26658C]'
                      : 'text-slate-600 dark:text-[#A7EBF2]/70 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]/60 hover:text-[#011C40] dark:hover:text-white'
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
                          ? 'text-[#54ACBF] dark:text-[#A7EBF2]'
                          : 'text-slate-500 dark:text-[#54ACBF]'
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
                              ? 'bg-[#54ACBF] text-white dark:bg-[#26658C] dark:text-[#A7EBF2]'
                              : 'bg-slate-200/80 text-slate-700 dark:bg-[#023859] dark:text-[#A7EBF2]'
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
            <div className="pt-3 border-t border-[#A7EBF2]/40 dark:border-[#26658C]">
              {sidebarOpen && (
                <div className="px-3 pb-2 text-xs font-semibold tracking-wider text-[#54ACBF] uppercase flex items-center justify-between">
                  <span>Tags</span>
                  <Tag className="w-3.5 h-3.5 opacity-80" />
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
                        'w-full flex items-center gap-3.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left',
                        isSelected
                          ? 'bg-[#023859] text-[#A7EBF2] font-semibold border border-[#26658C]'
                          : 'text-slate-600 dark:text-[#A7EBF2]/70 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]/60'
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
                              ? 'text-[#54ACBF]'
                              : 'text-slate-400 dark:text-[#54ACBF]/70'
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

        {/* Footer Info (Luna aesthetic) */}
        {sidebarOpen && (
          <div className="pt-3 border-t border-[#A7EBF2]/40 dark:border-[#26658C] px-3 text-xs text-slate-400 dark:text-[#A7EBF2]/60 space-y-2">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="flex items-center gap-2 p-2 rounded-xl bg-[#A7EBF2]/20 dark:bg-[#023859] text-[#011C40] dark:text-[#A7EBF2] hover:bg-[#A7EBF2]/30 dark:hover:bg-[#26658C] transition-colors border border-[#A7EBF2]/50 dark:border-[#26658C]"
              >
                <Lock className="w-3.5 h-3.5 text-[#54ACBF] shrink-0" />
                <span className="font-medium text-[11px] truncate">Guest Mode • Sign in to save</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between">
                <span className="truncate max-w-[140px] text-[#011C40] dark:text-[#A7EBF2] font-semibold text-[11px]">
                  {currentUser?.name || currentUser?.email || 'Luna User'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#54ACBF] ring-2 ring-[#54ACBF]/20" title="Connected to MongoDB" />
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span className="font-medium text-[#54ACBF]">Luna Theme</span>
              <span>v1.2</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
