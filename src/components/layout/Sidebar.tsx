'use client';

import React, { useState } from 'react';
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
  Edit3,
  Plus,
  X,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

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
    requireAuth,
    notes,
    addLabel,
  } = useNotes();

  const [isEditLabelsOpen, setIsEditLabelsOpen] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');

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
      count: counts.reminders,
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

  const handleCreateLabel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!requireAuth('create labels')) return;
    const trimmed = newLabelInput.trim();
    if (!trimmed) return;

    // Attach to first active note or just add to labels list
    if (notes.length > 0) {
      addLabel(notes[0].id, trimmed);
    }
    setNewLabelInput('');
  };

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

            {/* "Edit Labels" Navigation Link */}
            <button
              type="button"
              onClick={() => {
                if (!requireAuth('edit labels')) return;
                setIsEditLabelsOpen(true);
              }}
              className={cn(
                'w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all group cursor-pointer text-left',
                'text-slate-600 dark:text-[#A7EBF2]/70 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#023859]/60 hover:text-[#011C40] dark:hover:text-white'
              )}
              title={!sidebarOpen ? 'Edit Labels' : undefined}
            >
              <div
                className={cn(
                  'flex items-center justify-center transition-transform group-hover:scale-105',
                  !sidebarOpen && 'w-full'
                )}
              >
                <Edit3 className="w-5 h-5 text-slate-500 dark:text-[#54ACBF]" />
              </div>
              {sidebarOpen && <span className="flex-1 truncate">Edit Labels</span>}
            </button>
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

      {/* Edit Labels Modal */}
      {isEditLabelsOpen && (
        <div
          onClick={() => setIsEditLabelsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-[#023859] border border-[#A7EBF2] dark:border-[#26658C] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#26658C]">
              <h3 className="font-bold text-base text-[#011C40] dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#54ACBF]" />
                Edit Labels
              </h3>
              <button
                type="button"
                onClick={() => setIsEditLabelsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create Label Input */}
            <form onSubmit={handleCreateLabel} className="flex items-center gap-2">
              <input
                type="text"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                placeholder="Create new label..."
                className="flex-1 h-9 px-3 text-xs rounded-xl bg-slate-100 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
              />
              <Button type="submit" size="sm" variant="primary">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </form>

            {/* Current Labels List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
              {allLabels.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-[#A7EBF2]/60 italic py-2 text-center">
                  No labels yet. Add one above!
                </p>
              ) : (
                allLabels.map((lbl) => (
                  <div
                    key={lbl}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#011C40]/60 border border-slate-200/60 dark:border-[#26658C]/40 text-xs font-medium text-[#011C40] dark:text-[#A7EBF2]"
                  >
                    <span className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-[#54ACBF]" />
                      {lbl}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditLabelsOpen(false)}
                className="px-5"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
