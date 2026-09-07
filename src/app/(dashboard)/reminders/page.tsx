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
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-xl bg-[#54ACBF]/15 dark:bg-[#023859] border border-[#54ACBF]/30">
          <Bell className="w-5 h-5 text-[#54ACBF] dark:text-[#A7EBF2]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#011C40] dark:text-white">
          Reminders
        </h1>
        {reminderNotes.length > 0 && (
          <span className="px-2.5 py-0.5 text-xs rounded-full bg-[#54ACBF]/20 text-[#023859] dark:text-[#A7EBF2] font-semibold border border-[#54ACBF]/30">
            {reminderNotes.length}
          </span>
        )}
      </div>

      <NoteGrid notes={reminderNotes} emptyType="reminders" />
    </div>
  );
}
