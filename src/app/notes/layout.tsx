"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NotesSidebar from '@/components/notes/NotesSidebar';
import { NotesProvider } from '@/contexts/NotesContext';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Loading...</div>;
  }

  return (
    <NotesProvider>
      <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
        <NotesSidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] border-l border-zinc-200 dark:border-zinc-800">
          {children}
        </main>
      </div>
    </NotesProvider>
  );
}