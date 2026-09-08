'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';

export default function ImageNotesPage() {
  const { notes } = useNotes();

  const imageNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      (n.noteType === 'image' || (n.images && n.images.length > 0))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CreateNoteBar defaultNoteType="image" />

      <NoteGrid notes={imageNotes} emptyType="imageNotes" />
    </div>
  );
}
