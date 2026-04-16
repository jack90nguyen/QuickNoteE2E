"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText } from 'lucide-react';

export default function NotesIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 h-full">
      <FileText size={64} className="mb-4 opacity-20" strokeWidth={1} />
      <p className="text-lg font-medium">Select a note</p>
      <p className="text-sm mt-1">or create a new one to get started</p>
    </div>
  );
}