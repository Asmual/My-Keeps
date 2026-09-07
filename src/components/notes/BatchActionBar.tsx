'use client';

import React, { useState } from 'react';
import {
  X,
  Pin,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface BatchActionBarProps {
  isTrashView?: boolean;
  isArchiveView?: boolean;
  visibleNoteIds?: string[];
}

export function BatchActionBar({
  isTrashView = false,
  isArchiveView = false,
  visibleNoteIds = [],
}: BatchActionBarProps) {
  const {
    selectedNoteIds,
    clearSelection,
    selectAll,
    batchTrash,
    batchArchive,
    batchUnarchive,
    batchDeletePermanently,
    batchRestore,
    batchChangeColor,
    batchToggleImportant,
    batchTogglePin,
    notes,
  } = useNotes();

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (selectedNoteIds.length === 0) return null;

  const count = selectedNoteIds.length;
  const allVisibleSelected =
    visibleNoteIds.length > 0 &&
    visibleNoteIds.every((id) => selectedNoteIds.includes(id));

  const hasUnpinned = notes.some(
    (n) => selectedNoteIds.includes(n.id) && !n.isPinned
  );
  const hasUnimportant = notes.some(
    (n) => selectedNoteIds.includes(n.id) && !n.isImportant
  );

  return (
    <>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[#023859]/95 dark:bg-[#011C40]/95 text-white backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-2xl border border-[#54ACBF] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200 select-none">
        {/* Left: Close & Count */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-[#A7EBF2]">
            {count} selected
          </span>

          {/* Select all toggle button */}
          <button
            type="button"
            onClick={() => {
              if (allVisibleSelected) {
                clearSelection();
              } else {
                selectAll(visibleNoteIds);
              }
            }}
            className="ml-2 text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#A7EBF2] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {allVisibleSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {!isTrashView ? (
            <>
              {/* Pin */}
              <button
                type="button"
                onClick={batchTogglePin}
                className="p-2 rounded-full hover:bg-white/15 text-[#A7EBF2] hover:text-white transition-colors cursor-pointer"
                title={hasUnpinned ? 'Pin selected' : 'Unpin selected'}
              >
                <Pin
                  className="w-4 h-4"
                  fill={!hasUnpinned ? 'currentColor' : 'none'}
                />
              </button>

              {/* Star / Important */}
              <button
                type="button"
                onClick={() => batchToggleImportant()}
                className="p-2 rounded-full hover:bg-white/15 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                title={
                  hasUnimportant
                    ? 'Mark as Important'
                    : 'Remove from Important'
                }
              >
                <Star
                  className="w-4 h-4"
                  fill={!hasUnimportant ? 'currentColor' : 'none'}
                />
              </button>

              {/* Color */}
              <ColorPicker
                currentColor="default"
                onSelectColor={batchChangeColor}
                buttonClassName="text-[#A7EBF2] hover:text-white hover:bg-white/15 p-2"
              />

              {/* Archive / Unarchive */}
              {isArchiveView ? (
                <button
                  type="button"
                  onClick={batchUnarchive}
                  className="p-2 rounded-full hover:bg-white/15 text-[#A7EBF2] hover:text-white transition-colors cursor-pointer"
                  title="Unarchive selected"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={batchArchive}
                  className="p-2 rounded-full hover:bg-white/15 text-[#A7EBF2] hover:text-white transition-colors cursor-pointer"
                  title="Archive selected"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}

              {/* Move to Trash */}
              <button
                type="button"
                onClick={batchTrash}
                className="p-2 rounded-full hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Trash view batch actions */
            <>
              <button
                type="button"
                onClick={batchRestore}
                className="p-2 rounded-full hover:bg-white/15 text-[#54ACBF] hover:text-white transition-colors cursor-pointer"
                title="Restore selected notes"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-2 rounded-full hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={batchDeletePermanently}
        title={`Delete ${count} notes permanently?`}
        description="This action cannot be undone. All selected notes will be permanently removed from MongoDB."
        confirmText="Delete Permanently"
        variant="danger"
      />
    </>
  );
}
