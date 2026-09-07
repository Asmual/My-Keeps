'use client';

import React from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { Bell } from 'lucide-react';

export default function RemindersPage() {
  const { notes } = useNotes();

  const reminderNotes = notes.filter(
    (n) => !n.isTrashed && !n.isArchived && Boolean(n.reminder)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-purple-500" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Reminders
        </h1>
      </div>

      <NoteGrid notes={reminderNotes} emptyType="reminders" />
    </div>
  );
}
