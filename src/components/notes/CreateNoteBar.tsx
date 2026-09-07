'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  CheckSquare,
  Plus,
  X,
  Tag,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { NOTE_COLORS } from '@/lib/constants';
import { NoteColorId, CheckItem } from '@/types/note';
import { cn, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function CreateNoteBar() {
  const { createNote } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState<NoteColorId>('default');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 360)}px`;
    }
  }, [content]);

  const handleSaveAndClose = React.useCallback(() => {
    const hasContent = title.trim() || content.trim() || checklist.length > 0;
    if (hasContent) {
      createNote({
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        labels,
        checklist: isChecklistMode && checklist.length > 0 ? checklist : undefined,
      });
    }
    // Reset state
    setTitle('');
    setContent('');
    setIsPinned(false);
    setColor('default');
    setLabels([]);
    setChecklist([]);
    setIsChecklistMode(false);
    setShowLabelInput(false);
    setIsExpanded(false);
  }, [
    title,
    content,
    checklist,
    createNote,
    color,
    isPinned,
    labels,
    isChecklistMode,
  ]);

  // Click outside to submit / close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSaveAndClose();
      }
    }
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, handleSaveAndClose]);

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

  const activeColorConfig = NOTE_COLORS[color];

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-3">
      <div
        ref={containerRef}
        className={cn(
          'w-full rounded-2xl transition-all duration-200 shadow-sm border',
          activeColorConfig.bgLight,
          activeColorConfig.bgDark,
          activeColorConfig.borderLight,
          activeColorConfig.borderDark,
          isExpanded ? 'shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:shadow'
        )}
      >
        {!isExpanded ? (
          // Collapsed State
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between px-4 py-3 cursor-text select-none text-neutral-500 dark:text-neutral-400"
          >
            <span className="text-sm font-medium">Take a note...</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setIsChecklistMode(true);
                  setIsExpanded(true);
                }}
                className="p-2 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors text-neutral-500 dark:text-neutral-400"
                title="New list"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Expanded State
          <div className="p-4 space-y-3 animate-in fade-in duration-150">
            {/* Title & Pin row */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                className="w-full bg-transparent font-medium text-base text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  isPinned
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
                )}
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={cn('w-4 h-4', isPinned && 'fill-current')} />
              </button>
            </div>

            {/* Content or Checklist */}
            {!isChecklistMode ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take a note..."
                rows={3}
                className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 resize-none focus:outline-none"
              />
            ) : (
              <div className="space-y-2 pt-1">
                {checklist.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        setChecklist((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, completed: !c.completed } : c
                          )
                        );
                      }}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm text-neutral-800 dark:text-neutral-200',
                        item.completed && 'line-through text-neutral-400 dark:text-neutral-500'
                      )}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChecklist((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 transition-opacity"
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
                    placeholder="Add list item and press Enter..."
                    className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Labels preview */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
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

            {/* Label input field */}
            {showLabelInput && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={handleAddLabel}
                  placeholder="Enter tag name & press Enter..."
                  autoFocus
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => handleAddLabel()}>
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setShowLabelInput(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons & Close */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1">
                <ColorPicker currentColor={color} onSelectColor={setColor} />

                <button
                  type="button"
                  onClick={() => setIsChecklistMode((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isChecklistMode
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                  )}
                  title="Checklist toggle"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLabelInput((prev) => !prev)}
                  className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                  title="Add label"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveAndClose}
                className="text-neutral-700 dark:text-neutral-200 font-medium px-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
