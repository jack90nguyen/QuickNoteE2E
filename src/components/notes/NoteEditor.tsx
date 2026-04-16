"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NotesContext';
import { encryptNoteContent, decryptNoteContent } from '@/lib/crypto-client';
import { Save, Shield, ShieldOff, Trash2, Eye, EyeOff } from 'lucide-react';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface NoteEditorProps {
  noteId?: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!noteId);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    const savedMode = localStorage.getItem('editorPreviewMode');
    if (savedMode === 'edit' || savedMode === 'preview') {
      setPreviewMode(savedMode);
    }
  }, []);

  const togglePreviewMode = () => {
    setPreviewMode(prev => {
      const newMode = prev === 'edit' ? 'preview' : 'edit';
      localStorage.setItem('editorPreviewMode', newMode);
      return newMode;
    });
  };

  const { masterKey } = useAuth();
  const { refreshNotes, deleteNote } = useNotes();
  const router = useRouter();

  useEffect(() => {
    if (noteId) {
      fetchNote();
    } else {
      setTitle('');
      setContent('');
      setIsEncrypted(false);
      setTags([]);
      setIsDirty(false);
    }
  }, [noteId]);

  // Track changes to trigger auto-save
  useEffect(() => {
    if (isFetching) return;
    setIsDirty(true);
  }, [title, content, isEncrypted, tags]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || isFetching || isLoading) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [isDirty, title, content, isEncrypted, tags, isFetching, isLoading]);

  const fetchNote = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error('Failed to fetch note');
      
      const data = await res.json();
      const note = data.note;
      
      setTitle(note.title);
      setIsEncrypted(note.isEncrypted);
      setTags(note.tags || []);
      
      if (note.isEncrypted && note.iv && masterKey) {
        const decrypted = await decryptNoteContent(note.content, note.iv, masterKey);
        setContent(decrypted);
      } else {
        setContent(note.content);
      }
      // After fetching, it's not dirty
      setTimeout(() => setIsDirty(false), 0);
    } catch (err: any) {
      setError(err.message || 'Error loading note');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      // Don't auto-save without a title
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let finalContent = content || '';
      let iv: string | undefined = undefined;

      if (isEncrypted) {
        if (!masterKey) throw new Error('Master key is missing. Cannot encrypt.');
        const encryptedData = await encryptNoteContent(finalContent, masterKey);
        finalContent = encryptedData.ciphertext;
        iv = encryptedData.iv;
      }

      const payload = {
        title,
        content: finalContent,
        isEncrypted,
        iv,
        tags,
      };

      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
      const method = noteId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save note');
      }
      
      const result = await res.json();
      await refreshNotes();
      setIsDirty(false);
      setLastSaved(new Date());
      
      if (!noteId) {
        router.push(`/notes/${result.note._id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error saving note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (noteId) {
      await deleteNote(noteId);
      router.push('/notes');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (isFetching) return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading note...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
              isEncrypted 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' 
                : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Encryption"
          >
            {isEncrypted ? <Shield size={14} /> : <ShieldOff size={14} />}
            {isEncrypted ? 'Encrypted' : 'Plain Text'}
          </button>
          
          <div className="text-[10px] text-zinc-400 font-mono ml-2">
            {isLoading ? (
              <span className="animate-pulse">Saving...</span>
            ) : lastSaved ? (
              <span>Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            ) : isDirty ? (
              <span className="text-amber-500/70">Unsaved changes</span>
            ) : null}
          </div>
          
          {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
        </div>
        
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-blue-600 dark:text-blue-400 disabled:opacity-50 text-sm font-medium"
            title="Save Note"
          >
            <Save size={16} /> Save
          </button>
          <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
          <button 
            onClick={togglePreviewMode}
            className={`p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${previewMode === 'preview' ? 'text-blue-500' : ''}`}
            title="Toggle Preview"
          >
            {previewMode === 'edit' ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          {noteId && (
            <button 
              onClick={handleDelete}
              className="p-1.5 rounded-md hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800 transition"
              title="Delete Note"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-6 pb-2 flex-shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 p-0"
          />
        </div>

        <div className="flex-1 overflow-hidden px-4" data-color-mode="dark">
          {/* We will apply CSS in globals.css to style .w-md-editor */}
          <MDEditor
            value={content}
            onChange={setContent}
            preview={previewMode}
            height="100%"
            className="w-full h-full seamless-editor"
            visibleDragbar={false}
          />
        </div>
      </div>

      {/* Bottom Tags Bar */}
      <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto bg-zinc-50 dark:bg-zinc-900/50">
        <span className="text-xs font-medium text-zinc-500">Tag:</span>
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-xs">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500">&times;</button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag..."
          className="bg-transparent border-none focus:ring-0 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 p-0 w-24"
        />
      </div>
    </div>
  );
}