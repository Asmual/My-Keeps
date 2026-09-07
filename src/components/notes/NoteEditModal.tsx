'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Plus,
  Tag,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { NOTE_COLORS } from '@/lib/constants';
import { ColorPicker } from './ColorPicker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, generateId } from '@/lib/utils';
import { CheckItem, Note, NoteColorId } from '@/types/note';

interface NoteEditModalContentProps {
  note: Note;
  onClose: () => void;
}

function NoteEditModalContent({ note, onClose }: NoteEditModalContentProps) {
  const { updateNote, archiveNote, unarchiveNote, trashNote } = useNotes();

  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [color, setColor] = useState<NoteColorId>(note.color || 'default');
  const [isPinned, setIsPinned] = useState(note.isPinned || false);
  const [labels, setLabels] = useState<string[]>(note.labels || []);
  const [checklist, setChecklist] = useState<CheckItem[]>(note.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  const handleSaveAndClose = useCallback(() => {
    updateNote(note.id, {
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
      labels,
      checklist: checklist.length > 0 ? checklist : undefined,
    });
    onClose();
  }, [note.id, title, content, color, isPinned, labels, checklist, updateNote, onClose]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleSaveAndClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAndClose]);

  const handleAddCheckItem = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (!newCheckItem.trim()) return;
    if (e) e.preventDefault();

    setChecklist((prev) => [
      ...prev,
      { id: generateId(), text: newCheckItem.trim(), completed: false },
    ]);
    setNewCheckItem('');
  };

  const handleAddLabel = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    const trimmed = newLabelInput.trim();
    if (!trimmed) return;
    if (e) e.preventDefault();

    if (!labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
    }
    setNewLabelInput('');
    setShowLabelInput(false);
  };

  const colorConfig = NOTE_COLORS[color] || NOTE_COLORS.default;

  return (
    <div
      onClick={handleSaveAndClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-xl rounded-3xl p-6 shadow-2xl border transition-all duration-200 animate-in zoom-in-95',
          colorConfig.bgLight,
          colorConfig.bgDark,
          colorConfig.borderLight,
          colorConfig.borderDark
        )}
      >
        {/* Header: Title & Pin */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent font-semibold text-lg text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsPinned((prev) => !prev)}
            className={cn(
              'p-2 rounded-full transition-colors cursor-pointer',
              isPinned
                ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
            )}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={cn('w-5 h-5', isPinned && 'fill-current')} />
          </button>
        </div>

        {/* Content text */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Note details..."
          rows={6}
          className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 resize-none focus:outline-none mb-4 leading-relaxed"
        />

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="space-y-2 mb-4 border-t border-black/5 dark:border-white/5 pt-3">
            {checklist.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 group text-sm">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    setChecklist((prev) =>
                      prev.map((c, i) =>
                        i === idx ? { ...c, completed: !c.completed } : c
                      )
                    )
                  }
                  className="rounded accent-amber-500 cursor-pointer"
                />
                <span
                  className={cn(
                    'flex-1 text-neutral-800 dark:text-neutral-200',
                    item.completed && 'line-through text-neutral-400 dark:text-neutral-500'
                  )}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <Plus className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={handleAddCheckItem}
                placeholder="Add checklist item..."
                className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Labels list */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {labels.map((l) => (
              <Badge
                key={l}
                onRemove={() => setLabels((prev) => prev.filter((item) => item !== l))}
              >
                {l}
              </Badge>
            ))}
          </div>
        )}

        {/* Add Label inline */}
        {showLabelInput && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={newLabelInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
              onKeyDown={handleAddLabel}
              placeholder="Tag name..."
              autoFocus
              className="px-2.5 py-1 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            />
            <Button size="sm" variant="secondary" onClick={() => handleAddLabel()}>
              Add
            </Button>
            <button
              type="button"
              onClick={() => setShowLabelInput(false)}
              className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Footer toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5">
            <ColorPicker currentColor={color} onSelectColor={setColor} />

            <button
              type="button"
              onClick={() => setShowLabelInput((prev) => !prev)}
              title="Add tag"
              className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4" />
            </button>

            {note.isArchived ? (
              <button
                type="button"
                onClick={() => {
                  unarchiveNote(note.id);
                  onClose();
                }}
                title="Unarchive"
                className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
              >
                <ArchiveRestore className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  archiveNote(note.id);
                  onClose();
                }}
                title="Archive"
                className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                trashNote(note.id);
                onClose();
              }}
              title="Move to trash"
              className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAndClose}
            className="px-5 font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NoteEditModal() {
  const { activeEditNote, setActiveEditNote } = useNotes();

  if (!activeEditNote) return null;

  return (
    <NoteEditModalContent
      key={activeEditNote.id}
      note={activeEditNote}
      onClose={() => setActiveEditNote(null)}
    />
  );
}
