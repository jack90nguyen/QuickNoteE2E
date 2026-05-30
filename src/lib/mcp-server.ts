import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';

function notFoundError(id: string) {
  return {
    content: [{ type: 'text' as const, text: `Note not found: ${id}` }],
    isError: true,
  };
}

function validationError(message: string) {
  return {
    content: [{ type: 'text' as const, text: `Validation error: ${message}` }],
    isError: true,
  };
}

function toMeta(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    title: doc.title,
    folder: doc.folder ?? '',
    snippet: doc.snippet ?? '',
    isPinned: Boolean(doc.isPinned),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toFull(doc: Record<string, unknown>) {
  return {
    ...toMeta(doc),
    content: typeof doc.content === 'string' ? doc.content : '',
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createMcpServer(userId: string): McpServer {
  const server = new McpServer(
    { name: 'quicknote', version: '1.0.0' },
    {
      capabilities: { tools: {} },
      instructions:
        'QuickNote MCP server. Provides read and create/update access to the authenticated user\'s plaintext notes. Encrypted notes are not accessible through this server.',
    }
  );

  const userFilter = { userId, isEncrypted: false };

  server.registerTool(
    'list_notes',
    {
      title: 'List notes',
      description:
        'List the user\'s plaintext notes (metadata only — no content). Encrypted notes are excluded.',
      inputSchema: {
        folder: z
          .string()
          .optional()
          .describe('Filter by exact folder name. Use empty string for notes without a folder.'),
        limit: z.number().int().min(1).max(200).optional().describe('Max results (default 50).'),
        pinnedFirst: z.boolean().optional().describe('Sort pinned notes first (default true).'),
      },
    },
    async ({ folder, limit, pinnedFirst }) => {
      await connectToDatabase();
      const query: Record<string, unknown> = { ...userFilter };
      if (typeof folder === 'string') query.folder = folder;
      const sort: Record<string, 1 | -1> =
        pinnedFirst === false ? { updatedAt: -1 } : { isPinned: -1, updatedAt: -1 };
      const notes = await Note.find(query)
        .select('-content -iv')
        .sort(sort)
        .limit(limit ?? 50)
        .lean();
      return {
        content: [
          { type: 'text', text: JSON.stringify(notes.map(toMeta), null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    'search_notes',
    {
      title: 'Search notes',
      description:
        'Case-insensitive search across title and content of the user\'s plaintext notes. Returns metadata plus a matched snippet.',
      inputSchema: {
        query: z.string().min(1).describe('Search query (matched against title and content).'),
        limit: z.number().int().min(1).max(100).optional().describe('Max results (default 20).'),
      },
    },
    async ({ query, limit }) => {
      await connectToDatabase();
      const regex = new RegExp(escapeRegex(query), 'i');
      const notes = await Note.find({
        ...userFilter,
        $or: [{ title: regex }, { content: regex }],
      })
        .sort({ isPinned: -1, updatedAt: -1 })
        .limit(limit ?? 20)
        .lean<Array<Record<string, unknown>>>();

      const results = notes.map((n) => {
        const content = typeof n.content === 'string' ? n.content : '';
        const idx = content.search(regex);
        let match = '';
        if (idx >= 0) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + 120);
          match = (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
        }
        return { ...toMeta(n), match };
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_note',
    {
      title: 'Get note',
      description: 'Retrieve a single plaintext note by id, including its full content.',
      inputSchema: {
        id: z.string().min(1).describe('Note id.'),
      },
    },
    async ({ id }) => {
      if (!mongoose.isValidObjectId(id)) return validationError('Invalid note id');
      await connectToDatabase();
      const note = await Note.findOne({ _id: id, ...userFilter }).lean<Record<string, unknown> | null>();
      if (!note) return notFoundError(id);
      return {
        content: [{ type: 'text', text: JSON.stringify(toFull(note), null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_note',
    {
      title: 'Create note',
      description:
        'Create a new plaintext note. Notes created via MCP are never encrypted.',
      inputSchema: {
        title: z.string().min(1).max(200).describe('Note title.'),
        content: z.string().max(1_000_000).optional().describe('Markdown content.'),
        folder: z.string().max(100).optional().describe('Folder name (empty = no folder).'),
        isPinned: z.boolean().optional().describe('Pin the note (default false).'),
      },
    },
    async ({ title, content, folder, isPinned }) => {
      await connectToDatabase();
      const doc = await Note.create({
        userId,
        title,
        content: content ?? '',
        folder: folder ?? '',
        isPinned: isPinned ?? false,
        isEncrypted: false,
        snippet: (content ?? '').slice(0, 200),
      });
      const note = doc.toObject();
      return {
        content: [{ type: 'text', text: JSON.stringify(toFull(note), null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_note',
    {
      title: 'Update note',
      description:
        'Update fields of an existing plaintext note. Pass `expectedUpdatedAt` for optimistic concurrency.',
      inputSchema: {
        id: z.string().min(1).describe('Note id.'),
        title: z.string().min(1).max(200).optional(),
        content: z.string().max(1_000_000).optional(),
        folder: z.string().max(100).optional(),
        isPinned: z.boolean().optional(),
        expectedUpdatedAt: z
          .string()
          .datetime()
          .optional()
          .describe('If set, update will fail with conflict when the note has been modified since.'),
      },
    },
    async ({ id, title, content, folder, isPinned, expectedUpdatedAt }) => {
      if (!mongoose.isValidObjectId(id)) return validationError('Invalid note id');
      await connectToDatabase();
      const note = await Note.findOne({ _id: id, ...userFilter });
      if (!note) return notFoundError(id);

      if (
        expectedUpdatedAt &&
        new Date(note.updatedAt).getTime() !== new Date(expectedUpdatedAt).getTime()
      ) {
        return {
          content: [
            {
              type: 'text',
              text: `Conflict: note was modified at ${new Date(note.updatedAt).toISOString()}.`,
            },
          ],
          isError: true,
        };
      }

      if (typeof title === 'string') note.title = title;
      if (typeof content === 'string') {
        note.content = content;
        note.snippet = content.slice(0, 200);
      }
      if (typeof folder === 'string') note.folder = folder;
      if (typeof isPinned === 'boolean') note.isPinned = isPinned;

      await note.save();

      return {
        content: [{ type: 'text', text: JSON.stringify(toFull(note.toObject()), null, 2) }],
      };
    }
  );

  server.registerTool(
    'list_folders',
    {
      title: 'List folders',
      description: 'List distinct folder names that contain at least one plaintext note.',
      inputSchema: {},
    },
    async () => {
      await connectToDatabase();
      const folders: unknown[] = await Note.distinct('folder', userFilter);
      const cleaned = folders
        .filter((f): f is string => typeof f === 'string' && f.length > 0)
        .sort();
      return {
        content: [{ type: 'text', text: JSON.stringify(cleaned, null, 2) }],
      };
    }
  );

  return server;
}
