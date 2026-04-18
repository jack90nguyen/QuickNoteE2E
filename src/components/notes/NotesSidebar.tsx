"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotes } from '@/contexts/NotesContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Lock, 
  Search, 
  SquarePen, 
  LogOut, 
  Sun, 
  Moon, 
  Pin, 
  PinOff,
  Clock,
  Type
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';

export default function NotesSidebar() {
  const { 
    notes, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    sortBy, 
    setSortBy
  } = useNotes();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => setMounted(true), []);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result = !q ? notes : notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q)
    );
    return result;
  }, [notes, searchQuery]);

  const isIndexPath = pathname === '/notes';

  return (
    <div className={`${isIndexPath ? 'flex w-full' : 'hidden'} md:flex md:w-80 flex-shrink-0 flex-col h-full bg-[#f9f9f9] dark:bg-[#252525] border-r border-zinc-200 dark:border-zinc-800`}>
      {/* Top bar */}
      <div className="p-4 flex flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
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
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition"
          >
            {sortBy === 'updatedAt' ? <Clock size={14} /> : <Type size={14} />}
            Sort by {sortBy === 'updatedAt' ? 'Date' : 'Title'}
          </button>
          
          {showSortOptions && (
            <div className="flex gap-2 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-md">
              <button
                onClick={() => { setSortBy('updatedAt'); setShowSortOptions(false); }}
                className={`p-1 rounded ${sortBy === 'updatedAt' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                title="Sort by Date"
              >
                <Clock size={12} />
              </button>
              <button
                onClick={() => { setSortBy('title'); setShowSortOptions(false); }}
                className={`p-1 rounded ${sortBy === 'title' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                title="Sort by Title"
              >
                <Type size={12} />
              </button>
            </div>
          )}
        </div>
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
                <div key={note._id} className="relative group">
                  <Link
                    href={`/notes/${note._id}`}
                    className={`block p-4 border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 active:bg-zinc-300 dark:active:bg-[#3a3a3a] active:scale-[0.98] transition-all duration-150 touch-manipulation [-webkit-tap-highlight-color:transparent] cursor-pointer ${
                      isActive ? 'bg-zinc-200 dark:bg-[#323232]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1 pr-6">
                      <h3 className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {note.isPinned && <Pin size={12} className="inline-block mr-1 text-blue-500 fill-blue-500" />}
                        {note.title || "Untitled"}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1">
                      {note.isEncrypted ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 font-medium">
                          <Lock size={12} />
                          <span>Encrypted Note</span>
                        </div>
                      ) : note.snippet ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {note.snippet}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No preview available</p>
                      )}
                    </div>
                  </Link>
                </div>
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
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <button 
            onClick={logout}
            className="p-1.5 text-zinc-500 hover:text-red-500 rounded-md transition"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}