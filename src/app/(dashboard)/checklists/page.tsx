'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { CreateNoteBar } from '@/components/notes/CreateNoteBar';
import { CheckSquare } from 'lucide-react';

export default function ChecklistsPage() {
  const { notes } = useNotes();

  const checklistNotes = notes.filter(
    (n) =>
      !n.isArchived &&
      !n.isTrashed &&
      (n.noteType === 'checklist' || (n.checklist && n.checklist.length > 0))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <CreateNoteBar defaultNoteType="checklist" />

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <CheckSquare className="w-5 h-5 text-[#54ACBF]" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Checklist Notes
        </h1>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          ({checklistNotes.length} notes)
        </span>
      </div>

      <NoteGrid notes={checklistNotes} emptyType="checklists" />
    </div>
  );
}
