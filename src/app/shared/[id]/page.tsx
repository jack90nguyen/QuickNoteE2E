"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Preview from '@/components/editor/Preview';
import { Loader2, AlertCircle, Calendar, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface SharedNote {
  title: string;
  content: string;
  updatedAt: string;
}

export default function SharedNotePage() {
  const params = useParams();
  const id = params.id as string;
  
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function fetchSharedNote() {
      try {
        const res = await fetch(`/api/shared/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load shared note');
        }
        const data = await res.json();
        setNote(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSharedNote();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Oops!</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md">{error || 'Note not found or private.'}</p>
        <Link href="/" className="mt-6 text-blue-500 hover:underline">Go to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 p-6 max-w-4xl w-full mx-auto">
        <h1 className="text-3xl font-bold mb-4">{note.title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Calendar size={14} />
            <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md transition border border-zinc-200 dark:border-zinc-800"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <Link href="/" className="text-sm font-medium text-blue-500 border border-blue-500/30 px-3 py-2 rounded-md hover:bg-blue-500/10 transition">
              Create your own
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto overflow-hidden">
        <Preview value={note.content} />
      </main>

      <footer className="p-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
        NoteE2E Developed by Jack90Nguyen
      </footer>
    </div>
  );
}
