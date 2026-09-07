'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Note, NoteColorId, ViewMode } from '@/types/note';
import { useSession } from '@/lib/auth-client';
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
    archive: number;
    trash: number;
  };
  isAuthenticated: boolean;
  currentUser: { id: string; email: string; name?: string } | null;
  requireAuth: (actionName?: string) => boolean;
  createNote: (noteData: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  changeColor: (id: string, color: NoteColorId) => Promise<void>;
  addLabel: (id: string, label: string) => Promise<void>;
  removeLabel: (id: string, label: string) => Promise<void>;
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

  const userId = session?.user?.id;
  const isAuthenticated = Boolean(session?.user);
  const currentUser = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    : null;

  // Enforce authentication guard on actions
  const requireAuth = useCallback(
    (actionName = 'perform this action'): boolean => {
      if (!session?.user) {
        toast.error(`Please sign in to ${actionName}`, {
          icon: '🔒',
          duration: 3500,
        });
        router.push('/login');
        return false;
      }
      return true;
    },
    [session, router]
  );

  // Fetch real data directly from MongoDB via API (used for manual refresh)
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mykeeps-notes');
      }

      const params = new URLSearchParams({ filter: 'all' });
      if (userId) {
        params.set('userId', userId);
      }

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
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mykeeps-notes');
        }

        const params = new URLSearchParams({ filter: 'all' });
        if (userId) {
          params.set('userId', userId);
        }

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
      archive: notes.filter((n) => n.isArchived && !n.isTrashed).length,
      trash: notes.filter((n) => n.isTrashed).length,
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
        toast.success('Note saved to MongoDB');
        return createdNote;
      } else {
        toast.error('Failed to save note');
      }
    } catch (err) {
      console.error('Error creating note in MongoDB:', err);
      toast.error('Failed to connect to MongoDB');
    }
    return null;
  };

  // UPDATE Note in MongoDB
  const updateNote = async (id: string, updates: Partial<Note>): Promise<void> => {
    if (!requireAuth('update notes')) return;

    // Optimistic UI update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
    if (activeEditNote && activeEditNote.id === id) {
      setActiveEditNoteState((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
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

  // ARCHIVE
  const archiveNote = async (id: string): Promise<void> => {
    if (!requireAuth('archive notes')) return;

    toast('Note archived', { icon: '📦' });
    if (activeEditNote?.id === id) setActiveEditNoteState(null);

    await updateNote(id, { isArchived: true, isPinned: false });
  };

  // UNARCHIVE
  const unarchiveNote = async (id: string): Promise<void> => {
    if (!requireAuth('unarchive notes')) return;

    toast('Note unarchived', { icon: '📂' });
    await updateNote(id, { isArchived: false });
  };

  // TRASH
  const trashNote = async (id: string): Promise<void> => {
    if (!requireAuth('delete notes')) return;

    toast('Note moved to trash', { icon: '🗑️' });
    if (activeEditNote?.id === id) setActiveEditNoteState(null);

    await updateNote(id, { isTrashed: true, isPinned: false });
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
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
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
        isAuthenticated,
        currentUser,
        requireAuth,
        createNote,
        updateNote,
        togglePin,
        archiveNote,
        unarchiveNote,
        trashNote,
        restoreNote,
        deletePermanently,
        emptyTrash,
        changeColor,
        addLabel,
        removeLabel,
      }}
    >
      {children}
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
