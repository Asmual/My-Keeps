/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  CheckSquare,
  Plus,
  X,
  Tag,
  Image as ImageIcon,
  Mic,
  Star,
  Trash2,
  Loader2,
  Play,
  Pause,
  GripVertical,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { ColorPicker } from './ColorPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { NOTE_COLORS } from '@/lib/constants';
import { NoteColorId, CheckItem } from '@/types/note';
import { cn, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { uploadMedia } from '@/lib/upload';
import toast from 'react-hot-toast';

interface CreateNoteBarProps {
  defaultNoteType?: 'text' | 'checklist' | 'image' | 'voice';
}

export function CreateNoteBar({ defaultNoteType = 'text' }: CreateNoteBarProps) {
  const { createNote, requireAuth } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState<NoteColorId>('default');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(defaultNoteType === 'checklist');
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isConfirmDeleteAudioOpen, setIsConfirmDeleteAudioOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const isSubmittingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 360)}px`;
    }
  }, [content]);

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

  const handleSaveAndClose = React.useCallback(() => {
    if (isSubmittingRef.current) return;

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingAudio(false);

    const hasContent =
      title.trim() ||
      content.trim() ||
      checklist.length > 0 ||
      images.length > 0 ||
      audioUrl;

    if (!hasContent) {
      setIsExpanded(false);
      return;
    }

    isSubmittingRef.current = true;

    let noteType: 'text' | 'checklist' | 'image' | 'voice' = defaultNoteType;
    if (audioUrl) noteType = 'voice';
    else if (images.length > 0) noteType = 'image';
    else if (checklist.length > 0 || isChecklistMode) noteType = 'checklist';

    const payload = {
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned,
      isImportant,
      labels,
      checklist: isChecklistMode || checklist.length > 0 ? checklist : undefined,
      noteType,
      images: images.length > 0 ? images : undefined,
      audioUrl: audioUrl || undefined,
    };

    // Reset state immediately to prevent duplicate creation
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsImportant(false);
    setColor('default');
    setLabels([]);
    setChecklist([]);
    setIsChecklistMode(defaultNoteType === 'checklist');
    setShowLabelInput(false);
    setImages([]);
    setAudioUrl(null);
    setShowVoiceRecorder(false);
    setIsExpanded(false);

    createNote(payload).finally(() => {
      isSubmittingRef.current = false;
    });
  }, [
    title,
    content,
    checklist,
    images,
    audioUrl,
    createNote,
    color,
    isPinned,
    isImportant,
    labels,
    isChecklistMode,
    defaultNoteType,
  ]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExpanded(true);
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
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
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

  const [showCompleted, setShowCompleted] = useState(true);
  const [draggedChecklistIdx, setDraggedChecklistIdx] = useState<number | null>(null);

  const handleToggleCheckItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleChecklistDragStart = (e: React.DragEvent, index: number) => {
    setDraggedChecklistIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleChecklistDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedChecklistIdx === null || draggedChecklistIdx === targetIndex) return;

    const uncompleted = checklist.filter((c) => !c.completed);
    const itemToMove = uncompleted[draggedChecklistIdx];
    if (!itemToMove) return;

    const newUncompleted = [...uncompleted];
    newUncompleted.splice(draggedChecklistIdx, 1);
    newUncompleted.splice(targetIndex, 0, itemToMove);

    const completed = checklist.filter((c) => c.completed);
    setChecklist([...newUncompleted, ...completed]);
    setDraggedChecklistIdx(null);
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
              if (defaultNoteType === 'voice') {
                setShowVoiceRecorder(true);
              }
              setIsExpanded(true);
            }}
            className="flex items-center justify-between px-5 py-3.5 cursor-text select-none text-slate-500 dark:text-[#A7EBF2]/70"
          >
            <span className="text-sm font-medium">
              {defaultNoteType === 'checklist'
                ? 'Create a checklist...'
                : defaultNoteType === 'image'
                ? 'Add an image note...'
                : defaultNoteType === 'voice'
                ? 'Record a voice note...'
                : 'Take a note...'}
            </span>
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
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-black/20">
                    <img
                      src={img}
                      alt={`Attached image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                {/* Active Uncompleted Checklist with Drag & Drop */}
                <div className="space-y-1">
                  {checklist.filter((item) => !item.completed).map((item, idx) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleChecklistDragStart(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleChecklistDrop(e, idx)}
                      className={cn(
                        'flex items-center gap-2.5 group rounded-xl p-1 -ml-1 transition-all',
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

                      {/* Checklist text (larger, readable font) */}
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
                            const nextInput = document.getElementById('new-check-item-input');
                            if (nextInput) nextInput.focus();
                          } else if (e.key === 'Backspace' && item.text === '') {
                            e.preventDefault();
                            setChecklist((prev) => prev.filter((c) => c.id !== item.id));
                          }
                        }}
                        className="flex-1 text-sm sm:text-base font-normal bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#54ACBF] focus:outline-none transition-colors text-[#011C40] dark:text-white py-0.5"
                      />

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

                {/* Add new checklist item input */}
                <div className="flex items-center gap-2 pt-1 pl-6">
                  <Plus className="w-4 h-4 text-[#54ACBF] shrink-0" />
                  <input
                    id="new-check-item-input"
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={handleAddCheckItem}
                    placeholder="List item (press Enter for next)..."
                    className="w-full bg-transparent text-sm sm:text-base text-[#011C40] dark:text-white placeholder-slate-400 dark:placeholder-[#A7EBF2]/50 focus:outline-none"
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
                        {checklist.filter((item) => item.completed).map((item) => (
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
                disabled={isUploading}
                className="px-5 font-semibold text-xs flex items-center gap-1.5"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </div>

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
        description="Are you sure you want to delete this voice memo attachment?"
        confirmText="Delete Voice Memo"
        variant="danger"
      />
    </div>
  );
}
