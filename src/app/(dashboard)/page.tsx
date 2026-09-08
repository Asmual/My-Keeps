'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { NoteGrid } from '@/components/notes/NoteGrid';

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Google Keep-inspired Create Note Box */}
      <CreateNoteBar defaultNoteType="text" />

      <NoteGrid notes={textNotes} emptyType="notes" />
    </div>
  );
}
