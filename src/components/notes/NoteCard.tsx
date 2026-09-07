'use client';

import React, { useState, useRef } from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  Tag,
  X,
  Check,
  Star,
  Play,
  Pause,
} from 'lucide-react';
import Image from 'next/image';
import { Note } from '@/types/note';
import { NOTE_COLORS } from '@/lib/constants';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NoteCardProps {
  note: Note;
  isTrashView?: boolean;
}

export function NoteCard({ note, isTrashView = false }: NoteCardProps) {
  const {
    togglePin,
    toggleImportant,
    archiveNote,
    unarchiveNote,
    restoreNote,
    deletePermanently,
    changeColor,
    removeLabel,
    addLabel,
    setActiveEditNote,
    requireAuth,
    toggleCheckItem,
    selectedNoteIds,
    toggleSelectNote,
  } = useNotes();

  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSelected = selectedNoteIds.includes(note.id);

  const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.default;

  const handleCardClick = () => {
    if (isTrashView) return;
    if (!requireAuth('edit notes')) return;
    setActiveEditNote(note);
  };

  const handleToggleCheckItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!requireAuth('update checklist')) return;
    toggleCheckItem(note.id, itemId);
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
        'hover:shadow-lg hover:-translate-y-1 shadow-xs',
        note.isImportant
          ? 'border-amber-400 dark:border-amber-400/80 ring-1 ring-amber-400/50 shadow-md'
          : 'hover:border-[#54ACBF] dark:hover:border-[#54ACBF]',
        isSelected &&
          'ring-2 ring-[#54ACBF] border-[#54ACBF] dark:border-[#54ACBF] shadow-xl'
      )}
    >
      {/* Selection tick (Google Keep style) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleSelectNote(note.id);
        }}
        title={isSelected ? 'Deselect note' : 'Select note'}
        className={cn(
          'absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full flex items-center justify-center border shadow-md transition-all cursor-pointer',
          isSelected
            ? 'opacity-100 bg-[#023859] dark:bg-[#54ACBF] text-white dark:text-[#011C40] border-[#54ACBF] scale-105'
            : 'opacity-0 group-hover:opacity-100 bg-white dark:bg-[#023859] text-slate-400 hover:text-[#011C40] dark:hover:text-white border-slate-300 dark:border-[#26658C]'
        )}
      >
        <Check className={cn('w-3.5 h-3.5', isSelected ? 'stroke-[3]' : 'stroke-2')} />
      </button>

      <div>
        {/* Attached images preview */}
        {note.images && note.images.length > 0 && (
          <div className="mb-3 -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 rounded-t-2xl overflow-hidden border-b border-black/5 dark:border-white/10">
            <div
              className={cn(
                'grid gap-0.5',
                note.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              )}
            >
              {note.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video w-full bg-slate-100 dark:bg-black/20"
                >
                  <Image
                    src={img}
                    alt={`Note attachment ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Header: Title & Action Icons (Pin & Important) */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h3 className="font-semibold text-[#011C40] dark:text-white text-base leading-snug break-words flex-1">
              {note.title}
            </h3>
          ) : (
            <div className="flex-1" />
          )}

          {!isTrashView && (
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Important Star button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImportant(note.id);
                }}
                title={
                  note.isImportant
                    ? 'Remove from Important'
                    : 'Mark as Important'
                }
                className={cn(
                  'p-1.5 rounded-full transition-all cursor-pointer',
                  note.isImportant
                    ? 'text-amber-500 hover:bg-amber-400/20'
                    : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-amber-400/15'
                )}
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    note.isImportant && 'fill-amber-400 text-amber-500'
                  )}
                />
              </button>

              {/* Pin button: strictly visible on card hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note.id);
                }}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
                className={cn(
                  'p-1.5 rounded-full transition-all cursor-pointer opacity-0 group-hover:opacity-100',
                  note.isPinned
                    ? 'text-[#011C40] bg-[#A7EBF2] shadow-xs'
                    : 'text-slate-400 hover:text-[#011C40] dark:hover:text-[#A7EBF2] hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/40'
                )}
              >
                <Pin
                  className={cn('w-4 h-4', note.isPinned && 'fill-current')}
                />
              </button>
            </div>
          )}
        </div>

        {/* Voice Note audio player */}
        {note.audioUrl && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-2.5 text-xs"
          >
            <button
              type="button"
              onClick={() => {
                if (!note.audioUrl) return;
                if (!audioRef.current || audioRef.current.src !== note.audioUrl) {
                  const audio = new Audio(note.audioUrl);
                  audio.onended = () => setIsPlayingAudio(false);
                  audio.onerror = () => {
                    toast.error('Could not play audio memo');
                    setIsPlayingAudio(false);
                  };
                  audioRef.current = audio;
                }
                if (isPlayingAudio) {
                  audioRef.current.pause();
                  setIsPlayingAudio(false);
                } else {
                  audioRef.current.play().catch(() => {
                    toast.error('Failed to play audio memo');
                    setIsPlayingAudio(false);
                  });
                  setIsPlayingAudio(true);
                }
              }}
              className="p-1.5 rounded-full bg-[#54ACBF] text-white hover:bg-[#26658C] transition-colors cursor-pointer"
              title={isPlayingAudio ? 'Pause' : 'Play voice memo'}
            >
              {isPlayingAudio ? (
                <Pause className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current ml-0.5" />
              )}
            </button>
            <span className="font-medium text-[#011C40] dark:text-[#A7EBF2] text-[11px]">
              {isPlayingAudio ? 'Playing voice note...' : 'Voice memo'}
            </span>
          </div>
        )}

        {/* Content Body */}
        {note.content && (
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed line-clamp-8 mb-3">
            {note.content}
          </p>
        )}

        {/* Checklist preview */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {note.checklist.slice(0, 8).map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleToggleCheckItem(e, item.id)}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 hover:opacity-80 py-0.5 px-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title={item.completed ? 'Click to uncheck' : 'Click to complete'}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="rounded accent-[#023859] dark:accent-[#54ACBF] cursor-pointer pointer-events-none w-3.5 h-3.5"
                />
                <span
                  className={cn(
                    'truncate flex-1 select-none',
                    item.completed && 'line-through text-slate-400 dark:text-[#A7EBF2]/40'
                  )}
                >
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 8 && (
              <p className="text-xs text-[#54ACBF] italic pt-0.5 px-1">
                +{note.checklist.length - 8} more items
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

        {/* Add Tag inline form - strictly contained inside card boundaries */}
        {showTagInput && !isTrashView && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 w-full max-w-full mb-2.5 animate-in fade-in duration-100"
          >
            <div className="relative flex-1 min-w-0 flex items-center">
              <input
                type="text"
                value={tagInputValue}
                onChange={(e) => setTagInputValue(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Tag name..."
                autoFocus
                className="w-full min-w-0 pl-2.5 pr-2 py-1 text-xs rounded-lg bg-white/90 dark:bg-[#011C40]/90 border border-[#A7EBF2] dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddTag()}
              className="shrink-0 text-xs px-2.5 py-1 bg-[#023859] hover:bg-[#26658C] text-white rounded-lg font-medium cursor-pointer transition-colors shadow-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTagInput(false);
                setTagInputValue('');
              }}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
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
              onClick={() => setIsConfirmDeleteOpen(true)}
              title="Delete note permanently"
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
              onClick={() => setIsConfirmDeleteOpen(true)}
              title="Delete permanently"
              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deletePermanently(note.id)}
        title="Delete note permanently?"
        description="This will permanently delete this note from MongoDB. This action cannot be undone."
        confirmText="Delete Note"
        variant="danger"
      />
    </div>
  );
}
