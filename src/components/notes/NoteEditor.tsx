"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NotesContext";
import { encryptNoteContent, decryptNoteContent } from "@/lib/crypto-client";
import {
  Save,
  Shield,
  ShieldOff,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  Check,
  Circle,
  Share2,
  Pin,
  AlertTriangle,
  X,
  Folder,
} from "lucide-react";
import Link from "next/link";
import MinimalMarkdownEditor from "@/components/editor/MinimalMarkdownEditor";

interface NoteEditorProps {
  noteId?: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [content, setContent] = useState<string>("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!noteId);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const [showRemoteView, setShowRemoteView] = useState(false);
  const lastSyncedAtRef = useRef<number>(0);
  const isDirtyRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isFetchingRef = useRef(!!noteId);
  const remoteChangedRef = useRef(false);
  const remoteNoteRef = useRef<{
    title: string;
    folder: string;
    content: string;
    isEncrypted: boolean;
    isPinned: boolean;
    updatedAt: string;
  } | null>(null);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isFetchingRef.current = isFetching; }, [isFetching]);
  useEffect(() => { remoteChangedRef.current = remoteChanged; }, [remoteChanged]);

  useEffect(() => {
    const savedMode = localStorage.getItem("editorPreviewMode");
    if (savedMode === "edit" || savedMode === "preview") {
      setPreviewMode(savedMode);
    }
  }, []);

  const togglePreviewMode = () => {
    setPreviewMode((prev) => {
      const newMode = prev === "edit" ? "preview" : "edit";
      localStorage.setItem("editorPreviewMode", newMode);
      return newMode;
    });
  };

  const { masterKey } = useAuth();
  const { upsertNote, deleteNote } = useNotes();
  const router = useRouter();

  useEffect(() => {
    setRemoteChanged(false);
    setShowRemoteView(false);
    remoteNoteRef.current = null;
    if (noteId) {
      fetchNote();
    } else {
      setTitle("");
      setFolder("");
      setContent("");
      setIsEncrypted(false);
      setIsPinned(false);
      setIsDirty(false);
    }
  }, [noteId]);

  // Track changes to trigger auto-save
  useEffect(() => {
    if (isFetching) return;
    setIsDirty(true);
  }, [title, folder, content, isEncrypted, isPinned]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || isFetching || isLoading || remoteChanged) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [isDirty, title, folder, content, isEncrypted, isFetching, isLoading, remoteChanged]);

  // Poll for remote updates every 5s + on tab focus
  useEffect(() => {
    if (!noteId) return;

    const fetchAndStashRemote = async () => {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) return null;
      const { note } = await res.json();
      let plaintext = note.content as string;
      if (note.isEncrypted && note.iv && masterKey) {
        plaintext = await decryptNoteContent(note.content, note.iv, masterKey);
      }
      return {
        title: note.title as string,
        folder: (note.folder as string) || '',
        content: plaintext,
        isEncrypted: !!note.isEncrypted,
        isPinned: !!note.isPinned,
        updatedAt: note.updatedAt as string,
      };
    };

    const pollOnce = async () => {
      if (document.hidden) return;
      if (isFetchingRef.current || isLoadingRef.current) return;

      try {
        if (isDirtyRef.current) {
          // Dirty: lightweight check only; surface banner if newer
          const metaRes = await fetch(`/api/notes/${noteId}/meta`);
          if (!metaRes.ok) return;
          const meta = await metaRes.json();
          const serverUpdatedAt = new Date(meta.updatedAt).getTime();
          if (serverUpdatedAt <= lastSyncedAtRef.current) return;
          const existing = remoteNoteRef.current;
          if (existing && new Date(existing.updatedAt).getTime() === serverUpdatedAt) return;

          const remote = await fetchAndStashRemote();
          if (!remote) return;
          remoteNoteRef.current = remote;
          setRemoteChanged(true);
          return;
        }

        // Clean: apply newer remote
        const remote = await fetchAndStashRemote();
        if (!remote) return;
        const serverUpdatedAt = new Date(remote.updatedAt).getTime();
        if (serverUpdatedAt <= lastSyncedAtRef.current) return;
        if (isDirtyRef.current) {
          remoteNoteRef.current = remote;
          setRemoteChanged(true);
          return;
        }

        setTitle(remote.title);
        setFolder(remote.folder);
        setContent(remote.content);
        setIsEncrypted(remote.isEncrypted);
        setIsPinned(remote.isPinned);
        lastSyncedAtRef.current = serverUpdatedAt;
        setTimeout(() => setIsDirty(false), 0);
      } catch {
        // swallow; will retry next tick
      }
    };

    const interval = setInterval(pollOnce, 5_000);
    const onVisible = () => {
      if (!document.hidden) pollOnce();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [noteId, masterKey]);

  const fetchNote = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error("Failed to fetch note");

      const data = await res.json();
      const note = data.note;

      setTitle(note.title);
      setFolder(note.folder || "");
      setIsEncrypted(note.isEncrypted);
      setIsPinned(note.isPinned || false);

      if (note.isEncrypted && note.iv && masterKey) {
        const decrypted = await decryptNoteContent(
          note.content,
          note.iv,
          masterKey,
        );
        setContent(decrypted);
      } else {
        setContent(note.content);
      }
      lastSyncedAtRef.current = new Date(note.updatedAt).getTime();
      // After fetching, it's not dirty
      setTimeout(() => setIsDirty(false), 0);
    } catch (err: any) {
      setError(err.message || "Error loading note");
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
    setError("");

    try {
      let finalContent = content || "";
      let iv: string | undefined = undefined;

      if (isEncrypted) {
        if (!masterKey)
          throw new Error("Master key is missing. Cannot encrypt.");
        const encryptedData = await encryptNoteContent(finalContent, masterKey);
        finalContent = encryptedData.ciphertext;
        iv = encryptedData.iv;
      }

      const payload: Record<string, unknown> = {
        title,
        folder: folder.trim(),
        content: finalContent,
        snippet: isEncrypted ? "" : (content || "").substring(0, 100).replace(/\n/g, " "),
        isEncrypted,
        isPinned,
        iv,
      };

      const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
      const method = noteId ? "PUT" : "POST";

      if (noteId && lastSyncedAtRef.current > 0) {
        payload.expectedUpdatedAt = new Date(lastSyncedAtRef.current).toISOString();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const data = await res.json();
        const note = data.note;
        let plaintext = note.content as string;
        if (note.isEncrypted && note.iv && masterKey) {
          plaintext = await decryptNoteContent(note.content, note.iv, masterKey);
        }
        remoteNoteRef.current = {
          title: note.title,
          folder: note.folder || '',
          content: plaintext,
          isEncrypted: !!note.isEncrypted,
          isPinned: !!note.isPinned,
          updatedAt: note.updatedAt,
        };
        setRemoteChanged(true);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save note");
      }

      const result = await res.json();
      upsertNote({
        _id: result.note._id,
        title: result.note.title,
        folder: result.note.folder || "",
        content: content || "",
        snippet: result.note.snippet,
        isEncrypted: result.note.isEncrypted,
        iv: result.note.iv,
        updatedAt: result.note.updatedAt,
        isPinned: result.note.isPinned,
      });
      setIsDirty(false);
      setLastSaved(new Date());
      lastSyncedAtRef.current = new Date(result.note.updatedAt).getTime();

      if (!noteId) {
        router.push(`/notes/${result.note._id}`);
      }
    } catch (err: any) {
      setError(err.message || "Error saving note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseRemote = () => {
    const r = remoteNoteRef.current;
    if (!r) return;
    setTitle(r.title);
    setFolder(r.folder);
    setContent(r.content);
    setIsEncrypted(r.isEncrypted);
    setIsPinned(r.isPinned);
    lastSyncedAtRef.current = new Date(r.updatedAt).getTime();
    remoteNoteRef.current = null;
    setRemoteChanged(false);
    setShowRemoteView(false);
    setTimeout(() => setIsDirty(false), 0);
  };

  const handleOverwriteMine = async () => {
    const r = remoteNoteRef.current;
    if (!r) return;
    lastSyncedAtRef.current = new Date(r.updatedAt).getTime();
    remoteNoteRef.current = null;
    setRemoteChanged(false);
    setShowRemoteView(false);
    await handleSave();
  };

  const handleDelete = async () => {
    if (noteId) {
      await deleteNote(noteId);
      router.push("/notes");
    }
  };

  const handleShare = () => {
    if (!noteId) return;
    const url = `${window.location.origin}/shared/${noteId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (isFetching)
    return (
      <div
        className="flex-1 flex flex-col gap-4 p-6 note-enter md:animate-none"
        aria-busy="true"
        aria-label="Loading note"
      >
        <div className="h-6 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] note-enter md:animate-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Link
            href="/notes"
            className="md:hidden flex items-center gap-1 mr-1 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition"
            title="Back to notes"
            aria-label="Back to notes"
          >
            <ChevronLeft size={18} />
          </Link>

          <button
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={`flex items-center gap-1.5 p-1.5 md:px-2.5 md:py-1.5 rounded-md text-xs font-medium transition ${
              isEncrypted
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            title={isEncrypted ? "Encrypted" : "Plain Text"}
            aria-label={isEncrypted ? "Encrypted" : "Plain Text"}
          >
            {isEncrypted ? <Shield size={16} /> : <ShieldOff size={16} />}
            <span className="hidden md:inline">
              {isEncrypted ? "Encrypted" : "Plain Text"}
            </span>
          </button>

          <div className="flex items-center ml-2 text-[10px] text-zinc-400 font-mono">
            {isLoading ? (
              <>
                <Loader2
                  size={14}
                  className="md:hidden animate-spin text-zinc-500"
                  aria-label="Saving"
                />
                <span className="hidden md:inline animate-pulse">
                  Saving...
                </span>
              </>
            ) : lastSaved ? (
              <>
                <Check
                  size={14}
                  className="md:hidden text-green-500"
                  aria-label={`Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                />
                <span className="hidden md:inline">
                  Last saved:{" "}
                  {lastSaved.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </>
            ) : isDirty ? (
              <>
                <Circle
                  size={10}
                  className="md:hidden text-amber-500 fill-amber-500"
                  aria-label="Unsaved changes"
                />
                <span className="hidden md:inline text-amber-500/70">
                  Unsaved changes
                </span>
              </>
            ) : null}
          </div>

          {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
        </div>

        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-1 p-1.5 md:px-3 md:py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-blue-600 dark:text-blue-400 disabled:opacity-50 text-sm font-medium"
            title="Save Note"
            aria-label="Save Note"
          >
            <Save size={18} className="md:hidden" />
            <Save size={16} className="hidden md:inline" />
            <span className="hidden md:inline">Save</span>
          </button>

          {noteId && !isEncrypted && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-1 p-1.5 md:px-3 md:py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-medium ${
                isCopied 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
              title="Share Link"
            >
              <Share2 size={18} className="md:hidden" />
              <Share2 size={16} className="hidden md:inline" />
              <span className="hidden md:inline">{isCopied ? 'Link Copied!' : 'Share'}</span>
            </button>
          )}

          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`flex items-center gap-1 p-1.5 md:px-3 md:py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-medium ${
              isPinned 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
            title={isPinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin size={18} className={`md:hidden ${isPinned ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
            <Pin size={16} className={`hidden md:inline ${isPinned ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
            <span className="hidden md:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
          <button
            onClick={togglePreviewMode}
            className={`p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${previewMode === "preview" ? "text-blue-500" : ""}`}
            title="Toggle Preview"
            aria-label="Toggle preview mode"
          >
            {previewMode === "edit" ? <Eye size={18} /> : <EyeOff size={18} />}
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

      {remoteChanged && (
        <div className="px-3 md:px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/30">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-300">
                This note was updated elsewhere.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRemoteView(true)}
                className="flex-1 md:flex-none px-3 py-2 md:py-1 text-xs font-medium text-amber-800 dark:text-amber-200 bg-white/60 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded transition active:scale-[0.97] touch-manipulation [-webkit-tap-highlight-color:transparent]"
              >
                View
              </button>
              <button
                type="button"
                onClick={handleUseRemote}
                className="flex-1 md:flex-none px-3 py-2 md:py-1 text-xs font-medium text-amber-800 dark:text-amber-200 bg-white/60 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded transition active:scale-[0.97] touch-manipulation [-webkit-tap-highlight-color:transparent]"
              >
                Use new
              </button>
              <button
                type="button"
                onClick={handleOverwriteMine}
                className="flex-1 md:flex-none px-3 py-2 md:py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition active:scale-[0.97] touch-manipulation [-webkit-tap-highlight-color:transparent]"
              >
                Keep mine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-6 pb-2 flex-shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Note Title"
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600 p-0"
          />
          <div className="flex items-center gap-1.5 mt-2 text-zinc-500 dark:text-zinc-400">
            <Folder size={14} className="flex-shrink-0" />
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Folder (optional)"
              maxLength={100}
              className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 p-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <MinimalMarkdownEditor
            value={content}
            onChange={setContent}
            mode={previewMode}
          />
        </div>
      </div>

      {showRemoteView && remoteNoteRef.current && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowRemoteView(false)}
        >
          <div
            className="w-full max-w-2xl h-[85vh] md:h-auto md:max-h-[80vh] bg-white dark:bg-[#252525] rounded-t-2xl md:rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="min-w-0 pr-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Server version
                </h2>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                  Updated {new Date(remoteNoteRef.current.updatedAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRemoteView(false)}
                className="p-2 -mr-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition active:scale-95 touch-manipulation [-webkit-tap-highlight-color:transparent]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-4 md:px-5 py-4">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2 break-words">
                {remoteNoteRef.current.title}
              </div>
              <pre className="text-xs whitespace-pre-wrap break-words font-mono text-zinc-700 dark:text-zinc-300">
                {remoteNoteRef.current.content}
              </pre>
            </div>
            <div className="px-4 md:px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRemoteView(false)}
                className="flex-1 md:flex-none px-3 py-2 md:py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition active:scale-[0.98] touch-manipulation [-webkit-tap-highlight-color:transparent]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleUseRemote}
                className="flex-1 md:flex-none px-3 py-2 md:py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition active:scale-[0.98] touch-manipulation [-webkit-tap-highlight-color:transparent]"
              >
                Load this version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
