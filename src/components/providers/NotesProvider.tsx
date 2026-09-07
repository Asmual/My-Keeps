'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Note, NoteColorId, ViewMode } from '@/types/note';
import { INITIAL_NOTES } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NotesContextType {
  notes: Note[];
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
  createNote: (noteData: Partial<Note>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  togglePin: (id: string) => void;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  trashNote: (id: string) => void;
  restoreNote: (id: string) => void;
  deletePermanently: (id: string) => void;
  emptyTrash: () => void;
  changeColor: (id: string, color: NoteColorId) => void;
  addLabel: (id: string, label: string) => void;
  removeLabel: (id: string, label: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mykeeps-notes');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notes from storage:', e);
      }
    }
    return INITIAL_NOTES;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeEditNote, setActiveEditNote] = useState<Note | null>(null);

  // Save to LocalStorage on modification
  useEffect(() => {
    try {
      localStorage.setItem('mykeeps-notes', JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to storage:', e);
    }
  }, [notes]);

  // Extract all unique labels
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

  const createNote = (noteData: Partial<Note>): Note => {
    const newNote: Note = {
      id: generateId(),
      title: noteData.title || '',
      content: noteData.content || '',
      color: noteData.color || 'default',
      isPinned: !!noteData.isPinned,
      isArchived: false,
      isTrashed: false,
      labels: noteData.labels || [],
      checklist: noteData.checklist,
      reminder: noteData.reminder || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    toast.success('Note added');
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
    if (activeEditNote && activeEditNote.id === id) {
      setActiveEditNote((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextPinned = !n.isPinned;
          toast(nextPinned ? 'Note pinned' : 'Note unpinned', {
            icon: nextPinned ? '📌' : '📍',
          });
          return { ...n, isPinned: nextPinned, updatedAt: new Date().toISOString() };
        }
        return n;
      })
    );
  };

  const archiveNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              isArchived: true,
              isPinned: false, // Archiving unpins
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    toast('Note archived', { icon: '📦' });
    if (activeEditNote?.id === id) setActiveEditNote(null);
  };

  const unarchiveNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isArchived: false, updatedAt: new Date().toISOString() }
          : n
      )
    );
    toast('Note unarchived', { icon: '📂' });
  };

  const trashNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              isTrashed: true,
              isPinned: false,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    toast('Note moved to trash', { icon: '🗑️' });
    if (activeEditNote?.id === id) setActiveEditNote(null);
  };

  const restoreNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isTrashed: false, updatedAt: new Date().toISOString() }
          : n
      )
    );
    toast.success('Note restored');
  };

  const deletePermanently = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.error('Note deleted forever');
    if (activeEditNote?.id === id) setActiveEditNote(null);
  };

  const emptyTrash = () => {
    setNotes((prev) => prev.filter((n) => !n.isTrashed));
    toast.success('Trash emptied');
  };

  const changeColor = (id: string, color: NoteColorId) => {
    updateNote(id, { color });
  };

  const addLabel = (id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const currentLabels = n.labels || [];
          if (currentLabels.includes(trimmed)) return n;
          return {
            ...n,
            labels: [...currentLabels, trimmed],
            updatedAt: new Date().toISOString(),
          };
        }
        return n;
      })
    );
  };

  const removeLabel = (id: string, label: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            labels: (n.labels || []).filter((l) => l !== label),
            updatedAt: new Date().toISOString(),
          };
        }
        return n;
      })
    );
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
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
