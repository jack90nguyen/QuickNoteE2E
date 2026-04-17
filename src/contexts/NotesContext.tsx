"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { decryptNoteContent } from '@/lib/crypto-client';

interface Note {
  _id: string;
  title: string;
  content?: string;
  snippet?: string;
  isEncrypted: boolean;
  iv?: string;
  updatedAt: string;
  isPinned: boolean;
}

type SortBy = 'updatedAt' | 'title';

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const { masterKey, user } = useAuth();

  // Load sort preference
  useEffect(() => {
    const savedSort = localStorage.getItem('note_sort_by') as SortBy;
    if (savedSort === 'updatedAt' || savedSort === 'title') {
      setSortBy(savedSort);
    }
  }, []);

  // Save sort preference
  const handleSetSortBy = useCallback((sort: SortBy) => {
    setSortBy(sort);
    localStorage.setItem('note_sort_by', sort);
  }, []);

  const sortNotes = useCallback((notesList: Note[], currentSortBy: SortBy) => {
    return [...notesList].sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by user preference
      if (currentSortBy === 'title') {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(sortNotes(data.notes, sortBy));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy, sortNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Re-sort when sortBy changes without re-fetching
  useEffect(() => {
    setNotes(prev => sortNotes(prev, sortBy));
  }, [sortBy, sortNotes]);

  const upsertNote = useCallback((note: Note) => {
    setNotes((prev) => {
      const without = prev.filter((n) => n._id !== note._id);
      return sortNotes([note, ...without], sortBy);
    });
  }, [sortBy, sortNotes]);

  const deleteNote = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n._id === id);
    if (!note) return;

    const newPinnedStatus = !note.isPinned;
    
    // Optimistic update
    setNotes(prev => {
      const updated = prev.map(n => n._id === id ? { ...n, isPinned: newPinnedStatus } : n);
      return sortNotes(updated, sortBy);
    });

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinnedStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle pin');
    } catch (error) {
      console.error('Failed to toggle pin', error);
      // Revert on error
      setNotes(prev => {
        const reverted = prev.map(n => n._id === id ? { ...n, isPinned: !newPinnedStatus } : n);
        return sortNotes(reverted, sortBy);
      });
    }
  }, [notes, sortBy, sortNotes]);

  const value = useMemo(
    () => ({
      notes,
      isLoading,
      refreshNotes: fetchNotes,
      upsertNote,
      deleteNote,
      togglePin,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy: handleSetSortBy,
    }),
    [notes, isLoading, fetchNotes, upsertNote, deleteNote, togglePin, searchQuery, sortBy, handleSetSortBy]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
