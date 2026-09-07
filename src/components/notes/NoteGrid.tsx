'use client';

import React from 'react';
import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { useNotes } from '@/hooks/useNotes';
import { EmptyState } from './EmptyState';

interface NoteGridProps {
  notes: Note[];
  isTrashView?: boolean;
  emptyType?: 'notes' | 'archive' | 'trash' | 'reminders';
}

export function NoteGrid({
  notes,
  isTrashView = false,
  emptyType = 'notes',
}: NoteGridProps) {
  const { viewMode, searchQuery, selectedLabel } = useNotes();

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

  // Split into pinned and others if not in Trash view
  const pinnedNotes = !isTrashView ? filteredNotes.filter((n) => n.isPinned) : [];
  const otherNotes = !isTrashView ? filteredNotes.filter((n) => !n.isPinned) : filteredNotes;

  const gridContainerClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
      : 'max-w-2xl mx-auto flex flex-col gap-3.5';

  return (
    <div className="w-full space-y-8 pb-16">
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
