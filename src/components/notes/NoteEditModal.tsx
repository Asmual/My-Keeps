/* eslint-disable @next/next/no-img-element */
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
  Star,
  Image as ImageIcon,
  Mic,
  Loader2,
  Play,
  Pause,
  ChevronRight,
  Check,
  Lock,
} from 'lucide-react';
import { GripVertical } from '@/components/ui/GripIcon';
import { useNotes } from '@/hooks/useNotes';
import { NOTE_COLORS } from '@/lib/constants';
import { ColorPicker } from './ColorPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { LockModal } from './LockModal';
import { UnlockModal } from './UnlockModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cn, generateId } from '@/lib/utils';
import { CheckItem, Note, NoteColorId } from '@/types/note';
import { uploadMedia } from '@/lib/upload';
import toast from 'react-hot-toast';

interface NoteEditModalContentProps {
  note: Note;
  onClose: () => void;
}

function NoteEditModalContent({ note, onClose }: NoteEditModalContentProps) {
  const {
    updateNote,
    archiveNote,
    unarchiveNote,
    trashNote,
    lockNote,
    removeLock,
  } = useNotes();

  const [isLocked, setIsLocked] = useState(Boolean(note.isLocked));
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isRemoveLockModalOpen, setIsRemoveLockModalOpen] = useState(false);

  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [color, setColor] = useState<NoteColorId>(note.color || 'default');
  const [isPinned, setIsPinned] = useState(note.isPinned || false);
  const [isImportant, setIsImportant] = useState(note.isImportant || false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [audioUrl, setAudioUrl] = useState<string | null>(note.audioUrl || null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isConfirmDeleteAudioOpen, setIsConfirmDeleteAudioOpen] = useState(false);
  const [labels, setLabels] = useState<string[]>(note.labels || []);
  const [checklist, setChecklist] = useState<CheckItem[]>(note.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [draggedChecklistIdx, setDraggedChecklistIdx] = useState<number | null>(null);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (!audioPreviewRef.current || audioPreviewRef.current.src !== audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        toast.error('Could not play audio memo');
        setIsPlayingAudio(false);
      };
      audioPreviewRef.current = audio;
    }
    if (isPlayingAudio) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPreviewRef.current.play().catch(() => {
        toast.error('Failed to play audio');
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);
    }
  };

  const noteType: 'text' | 'checklist' | 'image' | 'voice' =
    note.noteType ||
    (note.audioUrl
      ? 'voice'
      : note.images && note.images.length > 0
      ? 'image'
      : note.checklist && note.checklist.length > 0
      ? 'checklist'
      : 'text');

  const handleSaveAndClose = useCallback(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingAudio(false);

    let finalNoteType: 'text' | 'checklist' | 'image' | 'voice' = noteType;
    let finalChecklist = checklist.length > 0 ? checklist : undefined;
    let finalImages = images;
    let finalAudioUrl = audioUrl;

    if (noteType === 'text') {
      finalNoteType = 'text';
      finalChecklist = undefined;
      finalImages = [];
      finalAudioUrl = null;
    } else if (noteType === 'checklist') {
      finalNoteType = 'checklist';
      finalImages = [];
      finalAudioUrl = null;
    } else if (noteType === 'image') {
      finalNoteType = 'image';
      finalChecklist = undefined;
      finalAudioUrl = null;
    } else if (noteType === 'voice') {
      finalNoteType = 'voice';
      finalChecklist = undefined;
      finalImages = [];
    }

    updateNote(note.id, {
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
      isImportant,
      labels,
      checklist: finalChecklist,
      noteType: finalNoteType,
      images: finalImages,
      audioUrl: finalAudioUrl,
      isLocked,
    });
    onClose();
  }, [
    note.id,
    noteType,
    title,
    content,
    color,
    isPinned,
    isImportant,
    labels,
    checklist,
    images,
    audioUrl,
    isLocked,
    updateNote,
    onClose,
  ]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading image(s)...');
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        const uploadedUrl = await uploadMedia(file, 'image');
        setImages((prev) => [...prev, uploadedUrl]);
      }
      toast.success('Image(s) uploaded successfully', { id: toastId });
    } catch {
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
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

  const handleChecklistDragStart = (e: React.DragEvent, index: number) => {
    setDraggedChecklistIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChecklistDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedChecklistIdx === null || draggedChecklistIdx === targetIndex) return;

    const uncompleted = checklist.filter((item) => !item.completed);
    const completed = checklist.filter((item) => item.completed);

    const updated = [...uncompleted];
    const [movedItem] = updated.splice(draggedChecklistIdx, 1);
    updated.splice(targetIndex, 0, movedItem);

    setChecklist([...updated, ...completed]);
    setDraggedChecklistIdx(null);
  };

  const handleToggleCheckItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
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
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </span>
              )}

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

          {/* Scrollable Middle Content (Images, Voice, Text, Checklist, Labels) */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-3 min-h-0">
            {/* Attached images gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden aspect-video border border-black/10 dark:border-white/10"
                  >
                    <img
                      src={img}
                      alt={`Note attachment ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                onSaveAudio={async (recordedData) => {
                  if (!recordedData) {
                    setAudioUrl(null);
                    setShowVoiceRecorder(false);
                    return;
                  }
                  setIsUploading(true);
                  const toastId = toast.loading('Uploading voice memo...');
                  try {
                    const uploadedUrl = await uploadMedia(recordedData, 'voice');
                    setAudioUrl(uploadedUrl);
                    toast.success('Voice memo saved', { id: toastId });
                  } catch {
                    setAudioUrl(recordedData);
                  } finally {
                    setIsUploading(false);
                    setShowVoiceRecorder(false);
                  }
                }}
                onClose={() => setShowVoiceRecorder(false)}
              />
            ) : audioUrl ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#54ACBF]/15 dark:bg-[#011C40] border border-[#54ACBF]/30 text-xs">
                <div className="flex items-center gap-2 font-medium text-[#011C40] dark:text-[#A7EBF2]">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="p-1.5 rounded-full bg-[#54ACBF] text-white hover:bg-[#26658C] transition-colors cursor-pointer"
                    title={isPlayingAudio ? 'Pause' : 'Play voice memo'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#54ACBF]" />
                    {isPlayingAudio ? 'Playing voice note...' : 'Voice memo attached'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteAudioOpen(true)}
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
                {/* Active Uncompleted Checklist Items */}
                <div className="space-y-1">
                  {checklist
                    .filter((item) => !item.completed)
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleChecklistDragStart(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleChecklistDrop(e, idx)}
                        className={cn(
                          'flex items-center gap-2 group rounded-xl p-1 -ml-1 transition-all',
                          draggedChecklistIdx === idx && 'opacity-40 bg-black/5 dark:bg-white/5'
                        )}
                      >
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-[#54ACBF] transition-colors p-0.5"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Google Keep style custom checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleCheckItem(item.id)}
                          className="w-5 h-5 rounded-md border-2 border-slate-400 dark:border-[#54ACBF] hover:border-[#023859] dark:hover:border-white transition-all flex items-center justify-center shrink-0 cursor-pointer"
                          title="Mark completed"
                        />

                        {/* Checklist Item Text (Larger, readable font) */}
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChecklist((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, text: val } : c))
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const nextInput = document.getElementById('modal-new-check-item');
                              if (nextInput) nextInput.focus();
                            } else if (e.key === 'Backspace' && item.text === '') {
                              e.preventDefault();
                              setChecklist((prev) => prev.filter((c) => c.id !== item.id));
                            }
                          }}
                          className="flex-1 min-w-0 text-sm sm:text-base font-normal bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#54ACBF] focus:outline-none transition-colors text-[#011C40] dark:text-white py-0.5"
                        />

                        <button
                          type="button"
                          onClick={() => setChecklist((prev) => prev.filter((c) => c.id !== item.id))}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                          title="Delete item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>

                {/* Add new checklist item input */}
                <div className="flex items-center gap-2 pt-1 pl-6">
                  <Plus className="w-4 h-4 text-[#54ACBF] shrink-0" />
                  <input
                    id="modal-new-check-item"
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={handleAddCheckItem}
                    placeholder="List item (press Enter for next)..."
                    className="w-full min-w-0 bg-transparent text-sm sm:text-base text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
                  />
                </div>

                {/* Google Keep / Sheets style Completed section */}
                {checklist.filter((item) => item.completed).length > 0 && (
                  <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowCompleted((prev) => !prev)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A7EBF2]/70 hover:text-[#011C40] dark:hover:text-white mb-2 transition-colors cursor-pointer select-none"
                    >
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          showCompleted && 'rotate-90'
                        )}
                      />
                      <span>
                        {checklist.filter((item) => item.completed).length} completed{' '}
                        {checklist.filter((item) => item.completed).length === 1 ? 'item' : 'items'}
                      </span>
                    </button>

                    {showCompleted && (
                      <div className="space-y-1.5 pl-6 animate-in fade-in duration-150">
                        {checklist
                          .filter((item) => item.completed)
                          .map((item) => (
                            <div key={item.id} className="flex items-center gap-2 group py-0.5">
                              {/* Checked box with check icon - click to uncheck & move back up */}
                              <button
                                type="button"
                                onClick={() => handleToggleCheckItem(item.id)}
                                className="w-5 h-5 rounded-md bg-[#54ACBF] border-2 border-[#54ACBF] flex items-center justify-center text-white transition-all shrink-0 cursor-pointer shadow-xs"
                                title="Mark uncompleted"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>

                              {/* Completed text with prominent strikethrough */}
                              <span
                                onClick={() => handleToggleCheckItem(item.id)}
                                className="flex-1 text-sm sm:text-base line-through decoration-2 decoration-slate-400 dark:decoration-[#A7EBF2]/50 text-slate-400 dark:text-[#A7EBF2]/50 select-none cursor-pointer py-0.5"
                                title="Click to restore to uncompleted"
                              >
                                {item.text}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setChecklist((prev) => prev.filter((c) => c.id !== item.id))
                                }
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                                title="Delete item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
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
              <ColorPicker currentColor={color} onSelectColor={setColor} />

              <button
                type="button"
                onClick={() => setShowLabelInput((prev) => !prev)}
                title="Add tag"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
              >
                <Tag className="w-4 h-4" />
              </button>

              {/* Add Image button - ONLY for image notes */}
              {noteType === 'image' && (
                <>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Attach image"
                    className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}

              {/* Voice memo button - ONLY for voice notes */}
              {noteType === 'voice' && (
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
              )}

              {/* Lock / Unlock button */}
              <button
                type="button"
                onClick={() => {
                  if (isLocked) {
                    setIsRemoveLockModalOpen(true);
                  } else {
                    setIsLockModalOpen(true);
                  }
                }}
                title={isLocked ? 'Remove password protection' : 'Lock note with password'}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  isLocked
                    ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/60'
                    : 'text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-[#A7EBF2]/20 dark:hover:bg-[#26658C]/50'
                )}
              >
                <Lock className="w-4 h-4" />
              </button>

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
                title="Delete note permanently"
                className="p-1.5 rounded-full text-slate-600 dark:text-[#A7EBF2]/80 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAndClose}
              disabled={isUploading}
              className="px-6 font-semibold flex items-center gap-1.5"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isUploading ? 'Saving...' : 'Done'}
            </Button>
          </div>
        </div>
      </div>

      {/* Move note to trash with undo toast */}
      <ConfirmModal
        isOpen={isConfirmTrashOpen}
        onClose={() => setIsConfirmTrashOpen(false)}
        onConfirm={() => {
          if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current = null;
          }
          trashNote(note.id);
          onClose();
        }}
        description="Are you want to delete this note?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete voice memo confirmation */}
      <ConfirmModal
        isOpen={isConfirmDeleteAudioOpen}
        onClose={() => setIsConfirmDeleteAudioOpen(false)}
        onConfirm={() => {
          if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current = null;
          }
          setIsPlayingAudio(false);
          setAudioUrl(null);
        }}
        title="Delete voice memo?"
        description="Are you sure you want to delete this voice memo from the note?"
        confirmText="Delete Voice Memo"
        variant="danger"
      />

      {/* Set note password modal */}
      <LockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        noteTitle={title || note.title}
        onLock={async (password) => {
          let finalNoteType: 'text' | 'checklist' | 'image' | 'voice' = noteType;
          let finalChecklist = checklist.length > 0 ? checklist : undefined;
          let finalImages = images;
          let finalAudioUrl = audioUrl;

          if (noteType === 'text') {
            finalNoteType = 'text';
            finalChecklist = undefined;
            finalImages = [];
            finalAudioUrl = null;
          } else if (noteType === 'checklist') {
            finalNoteType = 'checklist';
            finalImages = [];
            finalAudioUrl = null;
          } else if (noteType === 'image') {
            finalNoteType = 'image';
            finalChecklist = undefined;
            finalAudioUrl = null;
          } else if (noteType === 'voice') {
            finalNoteType = 'voice';
            finalChecklist = undefined;
            finalImages = [];
          }

          await updateNote(note.id, {
            title: title.trim(),
            content: content.trim(),
            color,
            isPinned,
            isImportant,
            labels,
            checklist: finalChecklist,
            noteType: finalNoteType,
            images: finalImages,
            audioUrl: finalAudioUrl,
          });
          await lockNote(note.id, password);
          onClose();
        }}
      />

      {/* Remove note password lock modal */}
      <UnlockModal
        isOpen={isRemoveLockModalOpen}
        onClose={() => setIsRemoveLockModalOpen(false)}
        noteTitle={title || note.title}
        onUnlock={async (password) => {
          const success = await removeLock(note.id, password);
          if (success) {
            setIsLocked(false);
            return true;
          }
          return false;
        }}
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
