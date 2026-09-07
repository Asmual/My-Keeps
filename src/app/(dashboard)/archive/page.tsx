'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { Archive } from 'lucide-react';

export default function ArchivePage() {
  const { notes } = useNotes();

  // Archived notes that are not trashed
  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrashed);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Archive
        </h1>
      </div>

      <NoteGrid notes={archivedNotes} emptyType="archive" />
    </div>
  );
}
