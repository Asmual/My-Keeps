'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { NoteGrid } from '@/components/notes/NoteGrid';

export default function AllNotesPage() {
  const { notes } = useNotes();

  // All active notes: neither archived nor trashed (all formats: text, voice, checklist, images)
  const allNotes = notes.filter((n) => !n.isArchived && !n.isTrashed);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Google Keep-inspired Create Note Box */}
      <CreateNoteBar />

      <NoteGrid notes={allNotes} emptyType="notes" />
    </div>
  );
}
