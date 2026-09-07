'use client';

import React from 'react';
import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { BatchActionBar } from './BatchActionBar';
import { useNotes } from '@/hooks/useNotes';
import { EmptyState } from './EmptyState';

interface NoteGridProps {
  notes: Note[];
  isTrashView?: boolean;
  emptyType?: 'notes' | 'archive' | 'trash' | 'reminders' | 'important' | 'imageNotes' | 'voiceNotes';
}

export function NoteGrid({
  notes,
  isTrashView = false,
  emptyType = 'notes',
}: NoteGridProps) {
  const { viewMode, searchQuery, selectedLabel, isLoading } = useNotes();

  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-16">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border border-[#A7EBF2]/40 dark:border-[#26658C]/60 bg-white/50 dark:bg-[#023859]/50 animate-pulse space-y-3 h-36"
          >
            <div className="h-4 bg-slate-200 dark:bg-[#26658C]/60 rounded-md w-3/5" />
            <div className="h-3 bg-slate-200 dark:bg-[#26658C]/40 rounded-md w-full" />
            <div className="h-3 bg-slate-200 dark:bg-[#26658C]/40 rounded-md w-4/5" />
            <div className="pt-2 flex gap-1.5">
              <div className="h-4 w-12 bg-slate-200 dark:bg-[#26658C]/50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter notes by search query and selected label
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !searchQuery.trim() ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.labels?.some((l) =>
        l.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      note.checklist?.some((c) =>
        c.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesLabel =
      !selectedLabel || note.labels?.includes(selectedLabel);

    return matchesSearch && matchesLabel;
  });

  if (filteredNotes.length === 0) {
    if (searchQuery.trim()) {
      return <EmptyState type="search" customMessage={`No notes match "${searchQuery}"`} />;
    }
    if (selectedLabel) {
      return <EmptyState type="label" />;
    }
    return <EmptyState type={emptyType} />;
  }

  // Split into pinned and others if not in Trash view, prioritizing Important notes
  const sortNotes = (list: Note[]) => {
    return [...list].sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return 0;
    });
  };

  const pinnedNotes = !isTrashView ? sortNotes(filteredNotes.filter((n) => n.isPinned)) : [];
  const otherNotes = !isTrashView ? sortNotes(filteredNotes.filter((n) => !n.isPinned)) : filteredNotes;

  const gridContainerClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
      : 'max-w-2xl mx-auto flex flex-col gap-3.5';

  return (
    <div className="w-full space-y-8 pb-16 relative">
      {/* Floating Batch Action Bar */}
      <BatchActionBar
        isTrashView={isTrashView}
        isArchiveView={emptyType === 'archive'}
        visibleNoteIds={filteredNotes.map((n) => n.id)}
      />

      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#54ACBF] dark:text-[#A7EBF2]">
              PINNED ({pinnedNotes.length})
            </span>
            <div className="flex-1 h-px bg-[#A7EBF2]/40 dark:bg-[#26658C]" />
          </div>
          <div className={gridContainerClass}>
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} isTrashView={isTrashView} />
            ))}
          </div>
        </div>
      )}

      {/* Others Section */}
      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-2 mb-3.5 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#54ACBF]">
                OTHERS
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-[#26658C]/60" />
            </div>
          )}
          <div className={gridContainerClass}>
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} isTrashView={isTrashView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
