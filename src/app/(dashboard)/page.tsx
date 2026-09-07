'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { NoteGrid } from '@/components/notes/NoteGrid';

export default function NotesPage() {
  const { notes } = useNotes();

  // Active notes are neither archived nor trashed
  const activeNotes = notes.filter((n) => !n.isArchived && !n.isTrashed);

  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      {/* Google Keep-inspired Create Note Box */}
      <CreateNoteBar />

      {/* Responsive Notes Grid */}
      <div className="w-full mt-4">
        <NoteGrid notes={activeNotes} emptyType="notes" />
      </div>
    </div>
  );
}
