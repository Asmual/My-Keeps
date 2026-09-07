'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { Image as ImageIcon } from 'lucide-react';

export default function ImageNotesPage() {
  const { notes } = useNotes();

  const imageNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      (n.noteType === 'image' || (n.images && n.images.length > 0))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <CreateNoteBar defaultNoteType="image" />

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <ImageIcon className="w-5 h-5 text-[#54ACBF]" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Image Notes
        </h1>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          ({imageNotes.length} notes)
        </span>
      </div>

      <NoteGrid notes={imageNotes} emptyType="imageNotes" />
    </div>
  );
}
