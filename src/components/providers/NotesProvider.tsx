'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Note, NoteColorId, ViewMode } from '@/types/note';
import { useSession } from '@/lib/auth-client';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import toast from 'react-hot-toast';

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  selectedLabel: string | null;
  setSelectedLabel: (label: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeEditNote: Note | null;
  setActiveEditNote: (note: Note | null) => void;
  allLabels: string[];
  counts: {
    active: number;
    textNotes: number;
    archive: number;
    trash: number;
    checklists: number;
    important: number;
    imageNotes: number;
    voiceNotes: number;
  };
  selectedNoteIds: string[];
  toggleSelectNote: (id: string) => void;
  selectAll: (ids?: string[]) => void;
  clearSelection: () => void;
  isAuthenticated: boolean;
  currentUser: { id: string; email: string; name?: string } | null;
  requireAuth: (actionName?: string) => boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (actionName?: string) => void;
  closeAuthModal: () => void;
  createNote: (noteData: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleImportant: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  batchTrash: () => Promise<void>;
  batchArchive: () => Promise<void>;
  batchUnarchive: () => Promise<void>;
  batchDeletePermanently: () => Promise<void>;
  batchRestore: () => Promise<void>;
  batchChangeColor: (color: NoteColorId) => Promise<void>;
  batchToggleImportant: (mark?: boolean) => Promise<void>;
  batchTogglePin: () => Promise<void>;
  changeColor: (id: string, color: NoteColorId) => Promise<void>;
  addLabel: (id: string, label: string) => Promise<void>;
  removeLabel: (id: string, label: string) => Promise<void>;
  toggleCheckItem: (noteId: string, itemId: string) => Promise<void>;
  lockNote: (id: string, password: string) => Promise<boolean>;
  unlockNote: (id: string, password: string) => Promise<Note | null>;
  removeLock: (id: string, password: string) => Promise<boolean>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Completely dynamic: starts with empty array and loads from MongoDB
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeEditNote, setActiveEditNoteState] = useState<Note | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  const toggleSelectNote = useCallback((id: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids?: string[]) => {
    if (ids && ids.length > 0) {
      setSelectedNoteIds(ids);
    } else {
      const activeIds = notes.filter((n) => !n.isArchived && !n.isTrashed).map((n) => n.id);
      setSelectedNoteIds(activeIds);
    }
  }, [notes]);

  const clearSelection = useCallback(() => {
    setSelectedNoteIds([]);
  }, []);

  const userId = session?.user?.id;
  const isAuthenticated = Boolean(session?.user);
  const currentUser = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    : null;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('create notes');

  const openAuthModal = useCallback((actionName = 'create notes') => {
    setAuthActionTitle(actionName);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Enforce authentication guard on actions
  const requireAuth = useCallback(
    (actionName = 'perform this action'): boolean => {
      if (!session?.user) {
        setAuthActionTitle(actionName);
        setIsAuthModalOpen(true);
        return false;
      }
      return true;
    },
    [session]
  );

  // Fetch real data directly from MongoDB via API (used for manual refresh)
  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mykeeps-notes');
      }

      const params = new URLSearchParams({ filter: 'all', userId });
      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotes(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load from MongoDB on mount or user change
  useEffect(() => {
    let ignore = false;

    async function loadInitialNotes() {
      // If user is not logged in, clear notes immediately and stop loading
      if (!userId) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mykeeps-notes');
        }

        const params = new URLSearchParams({ filter: 'all', userId });
        const res = await fetch(`/api/notes?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success && Array.isArray(json.data)) {
            setNotes(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load notes from MongoDB:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialNotes();

    return () => {
      ignore = true;
    };
  }, [userId]);

  // Extract all unique labels dynamically from active notes
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    notes.forEach((n) => {
      n.labels?.forEach((l) => labelSet.add(l));
    });
    return Array.from(labelSet).sort();
  }, [notes]);

  // Counts for sidebar badges
  const counts = useMemo(() => {
    return {
      active: notes.filter((n) => !n.isArchived && !n.isTrashed).length,
      textNotes: notes.filter(
        (n) =>
          !n.isArchived &&
          !n.isTrashed &&
          n.noteType !== 'image' &&
          n.noteType !== 'voice' &&
          n.noteType !== 'checklist' &&
          (!n.images || n.images.length === 0) &&
          !n.audioUrl &&
          (!n.checklist || n.checklist.length === 0)
      ).length,
      archive: notes.filter((n) => n.isArchived && !n.isTrashed).length,
      trash: notes.filter((n) => n.isTrashed).length,
      checklists: notes.filter(
        (n) => !n.isArchived && !n.isTrashed && (n.noteType === 'checklist' || (n.checklist && n.checklist.length > 0))
      ).length,
      important: notes.filter((n) => !n.isArchived && !n.isTrashed && Boolean(n.isImportant)).length,
      imageNotes: notes.filter(
        (n) => !n.isArchived && !n.isTrashed && (n.noteType === 'image' || (n.images && n.images.length > 0))
      ).length,
      voiceNotes: notes.filter(
        (n) => !n.isArchived && !n.isTrashed && (n.noteType === 'voice' || Boolean(n.audioUrl))
      ).length,
    };
  }, [notes]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const toggleViewMode = () =>
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));

  const setActiveEditNote = (note: Note | null) => {
    if (note && !requireAuth('edit notes')) {
      return;
    }
    setActiveEditNoteState(note);
  };

  // CREATE Note in MongoDB
  const createNote = async (noteData: Partial<Note>): Promise<Note | null> => {
    if (!requireAuth('create notes')) return null;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteData,
          userId: userId || null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const createdNote: Note = json.data;
        setNotes((prev) => [createdNote, ...prev]);
        toast.success('Note saved');
        return createdNote;
      } else {
        toast.error('Failed to save note');
      }
    } catch (err) {
      console.error('Error creating note in MongoDB:', err);
      toast.error('Failed to save note');
    }
    return null;
  };

  // UPDATE Note in MongoDB
  const updateNote = async (id: string, updates: Partial<Note>): Promise<void> => {
    if (!requireAuth('update notes')) return;

    // Optimistic UI update with lock masking
    const isLockedNote =
      updates.isLocked !== undefined
        ? updates.isLocked
        : (notes.find((x) => x.id === id)?.isLocked ?? false);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              ...(isLockedNote
                ? { content: '', images: [], checklist: [], audioUrl: null }
                : {}),
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    if (activeEditNote && activeEditNote.id === id) {
      setActiveEditNoteState((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      const url = params.toString() ? `/api/notes/${id}?${params.toString()}` : `/api/notes/${id}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setNotes((prev) => prev.map((n) => (n.id === id ? json.data : n)));
        }
      }
    } catch (err) {
      console.error('Error updating note in MongoDB:', err);
    }
  };

  // PIN / UNPIN
  const togglePin = async (id: string): Promise<void> => {
    if (!requireAuth('pin notes')) return;

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const nextPinned = !note.isPinned;
    toast(nextPinned ? 'Note pinned' : 'Note unpinned', {
      icon: nextPinned ? '📌' : '📍',
    });

    await updateNote(id, { isPinned: nextPinned });
  };

  // TOGGLE IMPORTANT
  const toggleImportant = async (id: string): Promise<void> => {
    if (!requireAuth('mark notes as important')) return;

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const nextImportant = !note.isImportant;
    toast(nextImportant ? 'Marked as Important ⭐' : 'Removed from Important', {
      icon: nextImportant ? '⭐' : '☆',
    });

    await updateNote(id, { isImportant: nextImportant });
  };

  // ARCHIVE
  const archiveNote = async (id: string): Promise<void> => {
    if (!requireAuth('archive notes')) return;

    if (activeEditNote?.id === id) setActiveEditNoteState(null);
    await updateNote(id, { isArchived: true, isPinned: false });

    toast(
      (t) => (
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <span>Your note is archived</span>
          <button
            type="button"
            onClick={() => {
              unarchiveNote(id);
              toast.dismiss(t.id);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#54ACBF] text-[#011C40] hover:bg-[#A7EBF2] transition-colors cursor-pointer shadow-xs shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: 4000,
        icon: '📦',
      }
    );
  };

  // UNARCHIVE
  const unarchiveNote = async (id: string): Promise<void> => {
    if (!requireAuth('unarchive notes')) return;

    toast.success('Note unarchived');
    await updateNote(id, { isArchived: false });
  };

  // TRASH
  const trashNote = async (id: string): Promise<void> => {
    if (!requireAuth('delete notes')) return;

    if (activeEditNote?.id === id) setActiveEditNoteState(null);
    await updateNote(id, { isTrashed: true, isPinned: false });

    toast(
      (t) => (
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <span>Successfully Deleted</span>
          <button
            type="button"
            onClick={() => {
              restoreNote(id);
              toast.dismiss(t.id);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#54ACBF] text-[#011C40] hover:bg-[#A7EBF2] transition-colors cursor-pointer shadow-xs shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: 4000,
        icon: '🗑️',
      }
    );
  };

  // RESTORE
  const restoreNote = async (id: string): Promise<void> => {
    if (!requireAuth('restore notes')) return;

    toast.success('Note restored');
    await updateNote(id, { isTrashed: false });
  };

  // DELETE PERMANENTLY from MongoDB
  const deletePermanently = async (id: string): Promise<void> => {
    if (!requireAuth('permanently delete notes')) return;

    // Optimistic removal
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.error('Note deleted permanently');
    if (activeEditNote?.id === id) setActiveEditNoteState(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      const url = params.toString() ? `/api/notes/${id}?${params.toString()}` : `/api/notes/${id}`;
      await fetch(url, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting note from MongoDB:', err);
    }
  };

  // EMPTY TRASH in MongoDB
  const emptyTrash = async (): Promise<void> => {
    if (!requireAuth('empty trash')) return;

    setNotes((prev) => prev.filter((n) => !n.isTrashed));
    toast.success('Trash emptied');

    try {
      const params = new URLSearchParams({ action: 'empty-trash' });
      if (userId) {
        params.set('userId', userId);
      }
      await fetch(`/api/notes?${params.toString()}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error emptying trash in MongoDB:', err);
    }
  };

  // CHANGE COLOR
  const changeColor = async (id: string, color: NoteColorId): Promise<void> => {
    if (!requireAuth('change color')) return;
    await updateNote(id, { color });
  };

  // ADD LABEL
  const addLabel = async (id: string, label: string): Promise<void> => {
    if (!requireAuth('add tags')) return;

    const trimmed = label.trim();
    if (!trimmed) return;

    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    const currentLabels = targetNote.labels || [];
    if (currentLabels.includes(trimmed)) return;

    const updatedLabels = [...currentLabels, trimmed];
    await updateNote(id, { labels: updatedLabels });
  };

  // REMOVE LABEL
  const removeLabel = async (id: string, label: string): Promise<void> => {
    if (!requireAuth('remove tags')) return;

    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    const updatedLabels = (targetNote.labels || []).filter((l) => l !== label);
    await updateNote(id, { labels: updatedLabels });
  };

  // TOGGLE CHECKLIST ITEM
  const toggleCheckItem = async (noteId: string, itemId: string): Promise<void> => {
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote || !targetNote.checklist) return;

    const updatedChecklist = targetNote.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    await updateNote(noteId, { checklist: updatedChecklist });
  };

  // BATCH TRASH
  const batchTrash = async (): Promise<void> => {
    if (!requireAuth('delete notes')) return;
    if (selectedNoteIds.length === 0) return;

    const count = selectedNoteIds.length;
    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id)
          ? { ...n, isTrashed: true, isPinned: false }
          : n
      )
    );
    const idsToTrash = [...selectedNoteIds];
    setSelectedNoteIds([]);
    toast.success(`${count} notes moved to trash`);

    try {
      await Promise.all(
        idsToTrash.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isTrashed: true, isPinned: false }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch trash:', err);
    }
  };

  // BATCH ARCHIVE
  const batchArchive = async (): Promise<void> => {
    if (!requireAuth('archive notes')) return;
    if (selectedNoteIds.length === 0) return;

    const count = selectedNoteIds.length;
    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id)
          ? { ...n, isArchived: true, isPinned: false }
          : n
      )
    );
    const idsToArchive = [...selectedNoteIds];
    setSelectedNoteIds([]);
    toast.success(`${count} notes archived`);

    try {
      await Promise.all(
        idsToArchive.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isArchived: true, isPinned: false }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch archive:', err);
    }
  };

  // BATCH UNARCHIVE
  const batchUnarchive = async (): Promise<void> => {
    if (!requireAuth('unarchive notes')) return;
    if (selectedNoteIds.length === 0) return;

    const count = selectedNoteIds.length;
    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id) ? { ...n, isArchived: false } : n
      )
    );
    const idsToUnarchive = [...selectedNoteIds];
    setSelectedNoteIds([]);
    toast.success(`${count} notes unarchived`);

    try {
      await Promise.all(
        idsToUnarchive.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch unarchive:', err);
    }
  };

  // BATCH DELETE PERMANENTLY
  const batchDeletePermanently = async (): Promise<void> => {
    if (!requireAuth('delete notes permanently')) return;
    if (selectedNoteIds.length === 0) return;

    const count = selectedNoteIds.length;
    setNotes((prev) => prev.filter((n) => !selectedNoteIds.includes(n.id)));
    const idsToDelete = [...selectedNoteIds];
    setSelectedNoteIds([]);
    toast.error(`${count} notes permanently deleted`);

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      const url = params.toString() ? `/api/notes?${params.toString()}` : '/api/notes';
      await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });
    } catch (err) {
      console.error('Error in batch delete permanently:', err);
    }
  };

  // BATCH RESTORE
  const batchRestore = async (): Promise<void> => {
    if (!requireAuth('restore notes')) return;
    if (selectedNoteIds.length === 0) return;

    const count = selectedNoteIds.length;
    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id) ? { ...n, isTrashed: false } : n
      )
    );
    const idsToRestore = [...selectedNoteIds];
    setSelectedNoteIds([]);
    toast.success(`${count} notes restored`);

    try {
      await Promise.all(
        idsToRestore.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isTrashed: false }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch restore:', err);
    }
  };

  // BATCH CHANGE COLOR
  const batchChangeColor = async (color: NoteColorId): Promise<void> => {
    if (!requireAuth('change note color')) return;
    if (selectedNoteIds.length === 0) return;

    setNotes((prev) =>
      prev.map((n) => (selectedNoteIds.includes(n.id) ? { ...n, color } : n))
    );
    const ids = [...selectedNoteIds];
    toast.success('Color updated for selected notes');

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch color change:', err);
    }
  };

  // BATCH TOGGLE IMPORTANT
  const batchToggleImportant = async (mark?: boolean): Promise<void> => {
    if (!requireAuth('mark notes as important')) return;
    if (selectedNoteIds.length === 0) return;

    const shouldMark =
      mark !== undefined
        ? mark
        : notes.some(
            (n) => selectedNoteIds.includes(n.id) && !n.isImportant
          );

    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id)
          ? { ...n, isImportant: shouldMark }
          : n
      )
    );
    const ids = [...selectedNoteIds];
    toast(
      shouldMark
        ? 'Selected notes marked as Important ⭐'
        : 'Removed Important from selected notes'
    );

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isImportant: shouldMark }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch toggle important:', err);
    }
  };

  // BATCH TOGGLE PIN
  const batchTogglePin = async (): Promise<void> => {
    if (!requireAuth('pin notes')) return;
    if (selectedNoteIds.length === 0) return;

    const shouldPin = notes.some(
      (n) => selectedNoteIds.includes(n.id) && !n.isPinned
    );

    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id) ? { ...n, isPinned: shouldPin } : n
      )
    );
    const ids = [...selectedNoteIds];
    toast(shouldPin ? 'Selected notes pinned 📌' : 'Selected notes unpinned');

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: shouldPin }),
          })
        )
      );
    } catch (err) {
      console.error('Error in batch pin toggle:', err);
    }
  };

  // LOCK NOTE
  const lockNote = async (id: string, password: string): Promise<boolean> => {
    if (!requireAuth('lock notes')) return false;
    try {
      const res = await fetch(`/api/notes/${id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  isLocked: true,
                  content: '',
                  images: [],
                  checklist: [],
                  audioUrl: null,
                }
              : n
          )
        );
        return true;
      } else {
        toast.error(json.error || json.message || 'Failed to lock note');
        return false;
      }
    } catch (err) {
      console.error('Error locking note:', err);
      toast.error('Failed to lock note');
      return false;
    }
  };

  // UNLOCK NOTE
  const unlockNote = async (id: string, password: string): Promise<Note | null> => {
    try {
      const res = await fetch(`/api/notes/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'unlock', userId }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const fullNote = json.data as Note;
        setNotes((prev) => prev.map((n) => (n.id === id ? fullNote : n)));
        return fullNote;
      }
      return null;
    } catch (err) {
      console.error('Error unlocking note:', err);
      return null;
    }
  };

  // REMOVE LOCK
  const removeLock = async (id: string, password: string): Promise<boolean> => {
    if (!requireAuth('remove note lock')) return false;
    try {
      const res = await fetch(`/api/notes/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'remove-lock', userId }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const updatedNote = json.data as Note;
        setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
        toast.success('Note lock removed');
        return true;
      } else {
        toast.error(json.error || json.message || 'Failed to remove lock');
        return false;
      }
    } catch (err) {
      console.error('Error removing note lock:', err);
      toast.error('Failed to remove lock');
      return false;
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        isLoading,
        refreshNotes: fetchNotes,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        toggleViewMode,
        selectedLabel,
        setSelectedLabel,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        activeEditNote,
        setActiveEditNote,
        allLabels,
        counts,
        selectedNoteIds,
        toggleSelectNote,
        selectAll,
        clearSelection,
        isAuthenticated,
        currentUser,
        requireAuth,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        createNote,
        updateNote,
        togglePin,
        toggleImportant,
        archiveNote,
        unarchiveNote,
        trashNote,
        restoreNote,
        deletePermanently,
        emptyTrash,
        batchTrash,
        batchArchive,
        batchUnarchive,
        batchDeletePermanently,
        batchRestore,
        batchChangeColor,
        batchToggleImportant,
        batchTogglePin,
        changeColor,
        addLabel,
        removeLabel,
        toggleCheckItem,
        lockNote,
        unlockNote,
        removeLock,
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        actionTitle={authActionTitle}
      />
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
