'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';

export default function ImportantPage() {
  const { notes } = useNotes();

  const importantNotes = notes.filter(
    (n) => !n.isArchived && !n.isTrashed && Boolean(n.isImportant)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CreateNoteBar />

      <NoteGrid notes={importantNotes} emptyType="important" />
    </div>
  );
}
