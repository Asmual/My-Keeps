'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  CheckSquare,
  Plus,
  X,
  Tag,
  Bell,
  Image as ImageIcon,
  Mic,
  Star,
  Trash2,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { ReminderPicker } from './ReminderPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { NOTE_COLORS } from '@/lib/constants';
import { NoteColorId, CheckItem } from '@/types/note';
import { cn, generateId, formatReminderDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import toast from 'react-hot-toast';

export function CreateNoteBar() {
  const { createNote, requireAuth } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState<NoteColorId>('default');
  const [reminder, setReminder] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 360)}px`;
    }
  }, [content]);

  const handleSaveAndClose = React.useCallback(() => {
    const hasContent =
      title.trim() ||
      content.trim() ||
      checklist.length > 0 ||
      reminder ||
      images.length > 0 ||
      audioUrl;

    if (hasContent) {
      let noteType: 'text' | 'image' | 'voice' = 'text';
      if (audioUrl) noteType = 'voice';
      else if (images.length > 0) noteType = 'image';

      createNote({
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        isImportant,
        labels,
        reminder: reminder || undefined,
        checklist: isChecklistMode && checklist.length > 0 ? checklist : undefined,
        noteType,
        images: images.length > 0 ? images : undefined,
        audioUrl: audioUrl || undefined,
      });
    }
    // Reset state
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsImportant(false);
    setColor('default');
    setReminder(null);
    setLabels([]);
    setChecklist([]);
    setIsChecklistMode(false);
    setShowLabelInput(false);
    setImages([]);
    setAudioUrl(null);
    setShowVoiceRecorder(false);
    setIsExpanded(false);
  }, [
    title,
    content,
    checklist,
    reminder,
    images,
    audioUrl,
    createNote,
    color,
    isPinned,
    isImportant,
    labels,
    isChecklistMode,
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 4MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setIsExpanded(true);
  };

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

  const activeColorConfig = NOTE_COLORS[color] || NOTE_COLORS.default;

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
          isExpanded
            ? 'shadow-lg ring-1 ring-[#54ACBF]/30'
            : 'hover:shadow-md hover:border-[#54ACBF]/60 dark:hover:border-[#54ACBF]'
        )}
      >
        {!isExpanded ? (
          // Collapsed State
          <div
            onClick={() => {
              if (!requireAuth('create notes')) return;
              setIsExpanded(true);
            }}
            className="flex items-center justify-between px-5 py-3.5 cursor-text select-none text-slate-500 dark:text-[#A7EBF2]/70"
          >
            <span className="text-sm font-medium">Take a note...</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('create a list')) return;
                  setIsChecklistMode(true);
                  setIsExpanded(true);
                }}
                className="p-2 rounded-full hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors text-slate-500 dark:text-[#54ACBF] cursor-pointer"
                title="New list"
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('add images')) return;
                  imageInputRef.current?.click();
                }}
                className="p-2 rounded-full hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors text-slate-500 dark:text-[#54ACBF] cursor-pointer"
                title="New note with image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('record voice note')) return;
                  setShowVoiceRecorder(true);
                  setIsExpanded(true);
                }}
                className="p-2 rounded-full hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors text-slate-500 dark:text-[#54ACBF] cursor-pointer"
                title="New voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Expanded State
          <div className="p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150">
            {/* Title & Pin / Star row */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                className="w-full bg-transparent font-semibold text-base text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportant((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isImportant
                      ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/60'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10'
                  )}
                  title={isImportant ? 'Remove from Important' : 'Mark as Important'}
                >
                  <Star className={cn('w-4 h-4', isImportant && 'fill-current')} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPinned((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isPinned
                      ? 'text-[#011C40] dark:text-[#011C40] bg-[#A7EBF2]'
                      : 'text-slate-400 hover:text-[#011C40] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  )}
                  title={isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className={cn('w-4 h-4', isPinned && 'fill-current')} />
                </button>
              </div>
            </div>

            {/* Images preview gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-black/10 dark:border-white/10">
                    <Image
                      src={img}
                      alt={`Attached image ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Voice Memo recording or playback */}
            {showVoiceRecorder ? (
              <VoiceRecorder
                initialAudioUrl={audioUrl}
                onSaveAudio={(url) => {
                  setAudioUrl(url);
                  setShowVoiceRecorder(false);
                }}
                onClose={() => setShowVoiceRecorder(false)}
              />
            ) : audioUrl ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#54ACBF]/15 dark:bg-[#011C40] border border-[#54ACBF]/30 text-xs">
                <span className="flex items-center gap-2 font-medium text-[#011C40] dark:text-[#A7EBF2]">
                  <Mic className="w-3.5 h-3.5 text-[#54ACBF]" /> Voice memo attached
                </span>
                <button
                  type="button"
                  onClick={() => setAudioUrl(null)}
                  className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                  title="Remove voice note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            {/* Content or Checklist */}
            {!isChecklistMode ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take a note..."
                rows={3}
                className="w-full bg-transparent text-sm text-[#011C40] dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 resize-none focus:outline-none leading-relaxed"
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
                      className="rounded accent-[#023859] dark:accent-[#54ACBF] cursor-pointer"
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm text-[#011C40] dark:text-white',
                        item.completed && 'line-through text-slate-400 dark:text-[#A7EBF2]/50'
                      )}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChecklist((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-opacity cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Plus className="w-4 h-4 text-[#54ACBF]" />
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={handleAddCheckItem}
                    placeholder="Add list item and press Enter..."
                    className="w-full bg-transparent text-sm text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Reminder preview */}
            {reminder && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#54ACBF]/15 dark:bg-[#54ACBF]/25 text-[#011C40] dark:text-[#A7EBF2] border border-[#54ACBF]/40 shadow-xs">
                  <Bell className="w-3 h-3 text-[#54ACBF] shrink-0" />
                  <span className="truncate max-w-[200px]">{formatReminderDate(reminder)}</span>
                  <button
                    type="button"
                    onClick={() => setReminder(null)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-rose-500 cursor-pointer transition-colors"
                    title="Remove reminder"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
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

            {/* Label input field - strictly contained within note bar */}
            {showLabelInput && (
              <div className="flex items-center gap-2 w-full max-w-full pt-1">
                <input
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={handleAddLabel}
                  placeholder="Enter tag name & press Enter..."
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#011C40] border border-slate-200 dark:border-[#26658C] text-[#011C40] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                />
                <Button size="sm" variant="primary" onClick={() => handleAddLabel()} className="shrink-0">
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLabelInput(false);
                    setNewLabelInput('');
                  }}
                  className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons & Close (Luna Primary Dark Blue) */}
            <div className="flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-1">
                <ReminderPicker
                  currentReminder={reminder}
                  onSelectReminder={setReminder}
                />

                <ColorPicker currentColor={color} onSelectColor={setColor} />

                <button
                  type="button"
                  onClick={() => setIsChecklistMode((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    isChecklistMode
                      ? 'text-[#011C40] dark:text-[#011C40] bg-[#A7EBF2]'
                      : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50'
                  )}
                  title="Checklist toggle"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLabelInput((prev) => !prev)}
                  className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
                  title="Add tag"
                >
                  <Tag className="w-4 h-4" />
                </button>

                {/* Add image button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
                  title="Add image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Voice note recorder button */}
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-full transition-colors cursor-pointer',
                    showVoiceRecorder || audioUrl
                      ? 'text-[#011C40] bg-[#A7EBF2]'
                      : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50'
                  )}
                  title="Record voice note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndClose}
                className="px-5 font-semibold text-xs"
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
