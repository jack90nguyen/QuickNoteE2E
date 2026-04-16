"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotes } from '@/contexts/NotesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Search, SquarePen, LogOut } from 'lucide-react';

export default function NotesSidebar() {
  const { notes, isLoading, searchQuery, setSearchQuery } = useNotes();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-[#f9f9f9] dark:bg-[#252525] border-r border-zinc-200 dark:border-zinc-800">
      {/* Top bar */}
      <div className="p-4 flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-200 dark:bg-[#1e1e1e] border-none rounded-md text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
          />
        </div>
        <Link 
          href="/notes/new" 
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          title="New Note"
        >
          <SquarePen size={20} />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-zinc-500">Loading...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">No notes found.</div>
        ) : (
          <div className="flex flex-col">
            {filteredNotes.map((note) => {
              const isActive = pathname === `/notes/${note._id}`;
              return (
                <Link
                  key={note._id}
                  href={`/notes/${note._id}`}
                  className={`p-4 border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition cursor-pointer ${
                    isActive ? 'bg-zinc-200 dark:bg-[#323232]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {note.title || "Untitled"}
                    </h3>
                    {note.isEncrypted && (
                      <Lock size={14} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {note.content || "No additional text"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User Area Bottom */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-100 dark:bg-[#1e1e1e]">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate pr-2">
          {user?.email}
        </div>
        <button 
          onClick={logout}
          className="text-zinc-500 hover:text-red-500 transition"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}