'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';

export default function ChecklistsPage() {
  const { notes } = useNotes();

  const checklistNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      (n.noteType === 'checklist' || (n.checklist && n.checklist.length > 0))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CreateNoteBar defaultNoteType="checklist" />

      <NoteGrid notes={checklistNotes} emptyType="checklists" />
    </div>
  );
}
