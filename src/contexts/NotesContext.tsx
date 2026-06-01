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
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { decryptNoteContent } from '@/lib/crypto-client';

interface Note {
  _id: string;
  title: string;
  folder?: string;
  content?: string;
  snippet?: string;
  isEncrypted: boolean;
  iv?: string;
  updatedAt: string;
  isPinned: boolean;
}

type SortBy = 'updatedAt' | 'title' | 'folder';

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('folder');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const { masterKey, user } = useAuth();
  const confirm = useConfirm();

  // Load sort preference
  useEffect(() => {
    const savedSort = localStorage.getItem('note_sort_by') as SortBy;
    if (savedSort === 'updatedAt' || savedSort === 'title' || savedSort === 'folder') {
      setSortBy(savedSort);
    }
  }, []);

  // Save sort preference
  const handleSetSortBy = useCallback((sort: SortBy) => {
    setSortBy(sort);
    localStorage.setItem('note_sort_by', sort);
  }, []);

  // Load sidebar visibility preference
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_visible');
    if (saved === 'false') setIsSidebarVisible(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_visible', String(next));
      return next;
    });
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
      if (currentSortBy === 'folder') {
        const folderA = (a.folder || '').toLowerCase();
        const folderB = (b.folder || '').toLowerCase();
        const cmp = folderA.localeCompare(folderB);
        if (cmp !== 0) return cmp;
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, []);

  const fetchNotes = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(sortNotes(data.notes, sortBy));
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user, sortBy, sortNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Poll sidebar every 10s + refetch on tab focus
  useEffect(() => {
    if (!user) return;

    const tick = () => {
      if (document.hidden) return;
      fetchNotes(true);
    };

    const interval = setInterval(tick, 5_000);
    const onVisible = () => {
      if (!document.hidden) fetchNotes(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, fetchNotes]);

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
    const ok = await confirm({
      title: 'Delete note',
      message: 'Are you sure you want to delete this note?',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  }, [confirm]);

  const value = useMemo(
    () => ({
      notes,
      isLoading,
      refreshNotes: fetchNotes,
      upsertNote,
      deleteNote,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy: handleSetSortBy,
      isSidebarVisible,
      toggleSidebar,
    }),
    [notes, isLoading, fetchNotes, upsertNote, deleteNote, searchQuery, sortBy, handleSetSortBy, isSidebarVisible, toggleSidebar]
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
