'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { NoteGrid } from '@/components/notes/NoteGrid';

import { StickyNote } from 'lucide-react';

export default function NotesPage() {
  const { notes } = useNotes();

  // Strictly Text Notes: neither archived nor trashed, not image, voice, or checklist
  const textNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      n.noteType !== 'image' &&
      n.noteType !== 'voice' &&
      n.noteType !== 'checklist' &&
      (!n.images || n.images.length === 0) &&
      !n.audioUrl &&
      (!n.checklist || n.checklist.length === 0)
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Google Keep-inspired Create Note Box */}
      <CreateNoteBar defaultNoteType="text" />

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <StickyNote className="w-5 h-5 text-[#54ACBF]" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Text Notes
        </h1>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          ({textNotes.length} notes)
        </span>
      </div>

      <NoteGrid notes={textNotes} emptyType="notes" />
    </div>
  );
}
