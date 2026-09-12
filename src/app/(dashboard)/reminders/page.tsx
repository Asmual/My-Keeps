'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';

export default function RemindersPage() {
  const { notes } = useNotes();

  const reminderNotes = notes
    .filter((n) => !n.isArchived && !n.isTrashed && Boolean(n.reminder))
    .sort((a, b) => {
      const timeA = a.reminder ? new Date(a.reminder).getTime() : Infinity;
      const timeB = b.reminder ? new Date(b.reminder).getTime() : Infinity;
      return timeA - timeB;
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CreateNoteBar />

      <NoteGrid notes={reminderNotes} emptyType="reminders" />
    </div>
  );
}
