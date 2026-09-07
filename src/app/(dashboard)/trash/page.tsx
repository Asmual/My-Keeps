'use client';

import React, { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteGrid } from '@/components/notes/NoteGrid';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function TrashPage() {
  const { notes, emptyTrash } = useNotes();
  const [isConfirmEmptyOpen, setIsConfirmEmptyOpen] = useState(false);

  const trashedNotes = notes.filter((n) => n.isTrashed);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Trash
          </h1>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            ({trashedNotes.length} notes)
          </span>
        </div>

        {trashedNotes.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsConfirmEmptyOpen(true)}
            className="self-start sm:self-auto"
          >
            Empty Trash Now
          </Button>
        )}
      </div>

      <NoteGrid notes={trashedNotes} isTrashView={true} emptyType="trash" />

      <ConfirmModal
        isOpen={isConfirmEmptyOpen}
        onClose={() => setIsConfirmEmptyOpen(false)}
        onConfirm={emptyTrash}
        title="Empty trash?"
        description="All items in Trash will be permanently deleted. This action cannot be undone."
        confirmText="Empty Trash"
        variant="danger"
      />
    </div>
  );
}
