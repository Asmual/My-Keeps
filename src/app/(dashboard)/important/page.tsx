'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { Star } from 'lucide-react';

export default function ImportantPage() {
  const { notes } = useNotes();

  const importantNotes = notes.filter(
    (n) => !n.isArchived && !n.isTrashed && Boolean(n.isImportant)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <CreateNoteBar />

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Important Notes
        </h1>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          ({importantNotes.length} notes)
        </span>
      </div>

      <NoteGrid notes={importantNotes} emptyType="important" />
    </div>
  );
}
