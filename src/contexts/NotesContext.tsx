"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { decryptNoteContent } from '@/lib/crypto-client';

interface Note {
  _id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  iv?: string;
  updatedAt: string;
  tags?: string[];
}

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { masterKey, user } = useAuth();

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      
      const decryptedNotes = await Promise.all(
        data.notes.map(async (note: Note) => {
          if (note.isEncrypted && note.iv && masterKey) {
            try {
              const decryptedContent = await decryptNoteContent(note.content, note.iv, masterKey);
              return { ...note, content: decryptedContent };
            } catch (err) {
              console.error('Failed to decrypt note', note._id);
              return { ...note, content: 'Failed to decrypt content' };
            }
          }
          return note;
        })
      );
      
      setNotes(decryptedNotes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  };

  return (
    <NotesContext.Provider value={{ notes, isLoading, refreshNotes: fetchNotes, deleteNote, searchQuery, setSearchQuery }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}