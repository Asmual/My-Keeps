'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';

export default function VoiceNotesPage() {
  const { notes } = useNotes();

  const voiceNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      (n.noteType === 'voice' || Boolean(n.audioUrl))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CreateNoteBar defaultNoteType="voice" />

      <NoteGrid notes={voiceNotes} emptyType="voiceNotes" />
    </div>
  );
}
