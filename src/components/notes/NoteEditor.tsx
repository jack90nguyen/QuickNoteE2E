"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import MinimalMarkdownEditor from "@/components/editor/MinimalMarkdownEditor";

interface NoteEditorProps {
  noteId?: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!noteId);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    if (noteId) {
      fetchNote();
    } else {
      setTitle("");
      setContent("");
      setIsEncrypted(false);
      setIsDirty(false);
    }
  }, [noteId]);

  // Track changes to trigger auto-save
  useEffect(() => {
    if (isFetching) return;
    setIsDirty(true);
  }, [title, content, isEncrypted]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || isFetching || isLoading) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [isDirty, title, content, isEncrypted, isFetching, isLoading]);

  const fetchNote = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error("Failed to fetch note");

      const data = await res.json();
      const note = data.note;

      setTitle(note.title);
      setIsEncrypted(note.isEncrypted);

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

      const payload = {
        title,
        content: finalContent,
        snippet: isEncrypted ? "" : (content || "").substring(0, 100).replace(/\n/g, " "),
        isEncrypted,
        iv,
      };

      const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
      const method = noteId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save note");
      }

      const result = await res.json();
      upsertNote({
        _id: result.note._id,
        title: result.note.title,
        content: content || "",
        snippet: result.note.snippet,
        isEncrypted: result.note.isEncrypted,
        iv: result.note.iv,
        updatedAt: result.note.updatedAt,
        isPinned: result.note.isPinned,
      });
      setIsDirty(false);
      setLastSaved(new Date());

      if (!noteId) {
        router.push(`/notes/${result.note._id}`);
      }
    } catch (err: any) {
      setError(err.message || "Error saving note");
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Loading note...
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
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

        <div className="flex-1 overflow-hidden">
          <MinimalMarkdownEditor
            value={content}
            onChange={setContent}
            mode={previewMode}
          />
        </div>
      </div>
    </div>
  );
}
