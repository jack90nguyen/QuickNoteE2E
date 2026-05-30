"use client";

import { useCallback, useEffect, useState } from 'react';
import { Copy, Plus, Trash2, Check, KeyRound } from 'lucide-react';

interface TokenRecord {
  _id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

function formatDate(iso?: string | null) {
  if (!iso) return 'never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ApiTokensSection() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedToken, setRevealedToken] = useState<{ token: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/tokens');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tokens');
      setTokens(data.tokens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create token');
      setRevealedToken({ token: data.token, name: data.record.name });
      setTokens((prev) => [data.record, ...prev]);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this token? Any client using it will lose access immediately.')) return;
    setError('');
    try {
      const res = await fetch(`/api/auth/tokens/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to revoke token');
      }
      setTokens((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const mcpUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'https://<your-domain>/api/mcp';

  const configExample = JSON.stringify(
    {
      mcpServers: {
        quicknote: {
          type: 'http',
          url: mcpUrl,
          headers: { Authorization: 'Bearer qn_...' },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <KeyRound size={14} />
        API tokens
        <span className="text-xs font-normal text-zinc-500">
          for MCP clients like Claude Code
        </span>
      </div>

      {revealedToken && (
        <div className="p-3 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 space-y-2">
          <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Copy this token now — you won&apos;t be able to see it again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 break-all text-xs px-2 py-1.5 rounded bg-white dark:bg-[#1e1e1e] border border-amber-200 dark:border-amber-800 text-zinc-900 dark:text-zinc-100">
              {revealedToken.token}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(revealedToken.token)}
              className="px-2 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition flex items-center gap-1"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedToken(null)}
            className="text-xs text-amber-800 dark:text-amber-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g., Claude Code)"
          maxLength={100}
          className="flex-1 min-w-0 px-3 py-1.5 bg-zinc-100 dark:bg-[#1e1e1e] border border-zinc-200 dark:border-zinc-700 rounded-md text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus size={14} />
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="p-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-3 text-xs text-zinc-500 text-center">Loading…</div>
        ) : tokens.length === 0 ? (
          <div className="p-3 text-xs text-zinc-500 text-center">No tokens yet.</div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tokens.map((t) => (
              <li
                key={t._id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 flex gap-2">
                    <code className="font-mono">{t.prefix}…</code>
                    <span>created {formatDate(t.createdAt)}</span>
                    <span>· last used {formatDate(t.lastUsedAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(t._id)}
                  className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                  aria-label="Revoke token"
                  title="Revoke"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowConfig((v) => !v)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showConfig ? 'Hide' : 'Show'} Claude Code config
        </button>
        {showConfig && (
          <pre className="mt-2 p-2.5 text-[11px] bg-zinc-100 dark:bg-[#1e1e1e] border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-zinc-700 dark:text-zinc-300">
{configExample}
          </pre>
        )}
      </div>
    </div>
  );
}
