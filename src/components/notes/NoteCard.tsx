'use client';

import React, { useState } from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { Note } from '@/types/note';
import { NOTE_COLORS } from '@/lib/constants';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  isTrashView?: boolean;
}

export function NoteCard({ note, isTrashView = false }: NoteCardProps) {
  const {
    togglePin,
    archiveNote,
    unarchiveNote,
    trashNote,
    restoreNote,
    deletePermanently,
    changeColor,
    removeLabel,
    addLabel,
    setActiveEditNote,
    updateNote,
    requireAuth,
  } = useNotes();

  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.default;

  const handleCardClick = () => {
    if (isTrashView) return;
    if (!requireAuth('edit notes')) return;
    setActiveEditNote(note);
  };

  const handleToggleCheckItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!requireAuth('update checklist')) return;
    if (!note.checklist) return;
    const updated = note.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateNote(note.id, { checklist: updated });
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    const val = tagInputValue.trim();
    if (!val) return;
    if (e) e.preventDefault();
    addLabel(note.id, val);
    setTagInputValue('');
    setShowTagInput(false);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer select-none',
        colorConfig.bgLight,
        colorConfig.bgDark,
        colorConfig.borderLight,
        colorConfig.borderDark,
        'hover:shadow-lg hover:-translate-y-1 shadow-xs hover:border-[#54ACBF] dark:hover:border-[#54ACBF]'
      )}
    >
      {/* Top Header: Title & Pin Button */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h3 className="font-semibold text-[#011C40] dark:text-white text-base leading-snug break-words flex-1">
              {note.title}
            </h3>
          ) : (
            <div className="flex-1" />
          )}

          {!isTrashView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={cn(
                'p-1.5 rounded-full transition-all cursor-pointer',
                note.isPinned
                  ? 'text-[#011C40] bg-[#A7EBF2] shadow-xs'
                  : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#011C40] dark:hover:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/40'
              )}
            >
              <Pin className={cn('w-4 h-4', note.isPinned && 'fill-current')} />
            </button>
          )}
        </div>

        {/* Content Body */}
        {note.content && (
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed line-clamp-8 mb-3">
            {note.content}
          </p>
        )}

        {/* Checklist preview */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {note.checklist.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleToggleCheckItem(e, item.id)}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 hover:opacity-80"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="rounded accent-[#023859] dark:accent-[#54ACBF] cursor-pointer pointer-events-none w-3.5 h-3.5"
                />
                <span
                  className={cn(
                    'truncate flex-1',
                    item.completed && 'line-through text-slate-400 dark:text-[#A7EBF2]/50'
                  )}
                >
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 5 && (
              <p className="text-xs text-[#54ACBF] italic pt-0.5">
                +{note.checklist.length - 5} more items
              </p>
            )}
          </div>
        )}

        {/* Labels / Tags (Soft Ice Blue with dark text) */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {note.labels.map((lbl) => (
              <Badge
                key={lbl}
                onRemove={
                  !isTrashView ? () => removeLabel(note.id, lbl) : undefined
                }
              >
                {lbl}
              </Badge>
            ))}
          </div>
        )}

        {/* Add Tag inline form */}
        {showTagInput && !isTrashView && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 mb-2.5 animate-in fade-in duration-100"
          >
            <input
              type="text"
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Tag name..."
              autoFocus
              className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#011C40] border border-[#A7EBF2] dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddTag()}
              className="text-xs px-2.5 py-1 bg-[#023859] hover:bg-[#26658C] text-white rounded-lg font-medium cursor-pointer"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Card Footer: Timestamp & Action Toolbar */}
      <div className="pt-2 mt-auto flex items-center justify-between border-t border-black/5 dark:border-white/10 text-xs text-slate-400 dark:text-[#A7EBF2]/60">
        <span className="text-[11px] truncate">
          {formatDate(note.updatedAt || note.createdAt)}
        </span>

        {/* Action Toolbar */}
        {!isTrashView ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <ColorPicker
              currentColor={note.color}
              onSelectColor={(col) => changeColor(note.id, col)}
            />

            <button
              type="button"
              onClick={() => {
                if (!requireAuth('add tags')) return;
                setShowTagInput((prev) => !prev);
              }}
              title="Add tag"
              className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>

            {note.isArchived ? (
              <button
                type="button"
                onClick={() => unarchiveNote(note.id)}
                title="Unarchive note"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => archiveNote(note.id)}
                title="Archive note"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => trashNote(note.id)}
              title="Move to trash"
              className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          // Trash Actions
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
          >
            <button
              type="button"
              onClick={() => restoreNote(note.id)}
              title="Restore note"
              className="p-1.5 rounded-full text-[#54ACBF] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => deletePermanently(note.id)}
              title="Delete permanently"
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
