'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Plus,
  Tag,
  Bell,
  Star,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';
import Image from 'next/image';
import { useNotes } from '@/hooks/useNotes';
import { NOTE_COLORS } from '@/lib/constants';
import { ColorPicker } from './ColorPicker';
import { ReminderPicker } from './ReminderPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cn, generateId, formatReminderDate } from '@/lib/utils';
import { CheckItem, Note, NoteColorId } from '@/types/note';
import toast from 'react-hot-toast';

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
  const [isImportant, setIsImportant] = useState(note.isImportant || false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [audioUrl, setAudioUrl] = useState<string | null>(note.audioUrl || null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [reminder, setReminder] = useState<string | null>(note.reminder || null);
  const [labels, setLabels] = useState<string[]>(note.labels || []);
  const [checklist, setChecklist] = useState<CheckItem[]>(note.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = useState(false);

  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveAndClose = useCallback(() => {
    let noteType: 'text' | 'image' | 'voice' = 'text';
    if (audioUrl) noteType = 'voice';
    else if (images.length > 0) noteType = 'image';

    updateNote(note.id, {
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
      isImportant,
      labels,
      reminder,
      checklist: checklist.length > 0 ? checklist : undefined,
      noteType,
      images,
      audioUrl,
    });
    onClose();
  }, [
    note.id,
    title,
    content,
    color,
    isPinned,
    isImportant,
    labels,
    reminder,
    checklist,
    images,
    audioUrl,
    updateNote,
    onClose,
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
  };

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
    <>
      <div
        onClick={handleSaveAndClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#011C40]/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border transition-all duration-200 animate-in zoom-in-95 overflow-hidden',
            colorConfig.bgLight,
            colorConfig.bgDark,
            colorConfig.borderLight,
            colorConfig.borderDark
          )}
        >
          {/* Header: Title & Pin / Star (Fixed at top) */}
          <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full min-w-0 bg-transparent font-semibold text-lg text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsImportant((prev) => !prev)}
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer shrink-0',
                  isImportant
                    ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/60'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10'
                )}
                title={isImportant ? 'Remove from Important' : 'Mark as Important'}
              >
                <Star className={cn('w-5 h-5', isImportant && 'fill-current')} />
              </button>

              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer shrink-0',
                  isPinned
                    ? 'text-[#011C40] bg-[#A7EBF2]'
                    : 'text-slate-400 hover:text-[#011C40] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                )}
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={cn('w-5 h-5', isPinned && 'fill-current')} />
              </button>
            </div>
          </div>

          {/* Scrollable Middle Content (Images, Voice, Text, Checklist, Reminder, Labels) */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-3 min-h-0">
            {/* Attached images gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden aspect-video border border-black/10 dark:border-white/10"
                  >
                    <Image
                      src={img}
                      alt={`Note attachment ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Voice memo recorder or player */}
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
            {/* Content text */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note details..."
              rows={4}
              className="w-full min-w-0 bg-transparent text-sm text-[#011C40] dark:text-slate-100 placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 resize-none focus:outline-none leading-relaxed"
            />

            {/* Checklist */}
            {checklist.length > 0 && (
              <div className="space-y-2 border-t border-black/5 dark:border-white/10 pt-3">
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
                      className="rounded accent-[#023859] dark:accent-[#54ACBF] cursor-pointer"
                    />
                    <span
                      className={cn(
                        'flex-1 min-w-0 text-[#011C40] dark:text-white break-words',
                        item.completed && 'line-through text-slate-400 dark:text-[#A7EBF2]/50'
                      )}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Plus className="w-4 h-4 text-[#54ACBF] shrink-0" />
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={handleAddCheckItem}
                    placeholder="Add checklist item..."
                    className="w-full min-w-0 bg-transparent text-sm text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Reminder preview */}
            {reminder && (
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#54ACBF]/15 dark:bg-[#54ACBF]/25 text-[#011C40] dark:text-[#A7EBF2] border border-[#54ACBF]/40 shadow-xs">
                  <Bell className="w-3.5 h-3.5 text-[#54ACBF] shrink-0" />
                  <span>{formatReminderDate(reminder)}</span>
                  <button
                    type="button"
                    onClick={() => setReminder(null)}
                    className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-rose-500 cursor-pointer transition-colors"
                    title="Remove reminder"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            )}

            {/* Labels list */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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

            {/* Add Label inline - strictly contained inside modal container */}
            {showLabelInput && (
              <div className="flex items-center gap-2 w-full max-w-full">
                <input
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={handleAddLabel}
                  placeholder="Tag name..."
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
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer toolbar (Fixed at bottom) */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/5 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              <ReminderPicker
                currentReminder={reminder}
                onSelectReminder={setReminder}
              />

              <ColorPicker currentColor={color} onSelectColor={setColor} />

              <button
                type="button"
                onClick={() => setShowLabelInput((prev) => !prev)}
                title="Add tag"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
              >
                <Tag className="w-4 h-4" />
              </button>

              {/* Add Image button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                title="Attach image"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Voice memo button */}
              <button
                type="button"
                onClick={() => setShowVoiceRecorder((prev) => !prev)}
                title="Record voice note"
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  showVoiceRecorder || audioUrl
                    ? 'text-[#011C40] bg-[#A7EBF2]'
                    : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50'
                )}
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

              {note.isArchived ? (
                <button
                  type="button"
                  onClick={() => {
                    unarchiveNote(note.id);
                    onClose();
                  }}
                  title="Unarchive"
                  className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsConfirmTrashOpen(true)}
                title="Move to trash"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAndClose}
              className="px-6 font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmTrashOpen}
        onClose={() => setIsConfirmTrashOpen(false)}
        onConfirm={() => {
          trashNote(note.id);
          onClose();
        }}
        title="Move note to trash?"
        description="This note will be moved to Trash. You can restore it anytime from the Trash view."
        confirmText="Move to Trash"
        variant="danger"
      />
    </>
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
