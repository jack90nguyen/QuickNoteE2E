# Note E2E

A secure, minimal markdown notes app with optional end-to-end encryption. Notes are encrypted and decrypted entirely in the browser — the server never sees plaintext content of encrypted notes.

![cover](public/cover.jpg)

## Features

- **Markdown notes** with a custom lightweight editor (headings H1–H4 rendered at real size in edit mode, bullet/checkbox lists, live preview).
- **Synchronized Typography** — font-size (15px) and line-height (1.625) are perfectly matched between Edit and Preview modes for a seamless experience.
- **Per-note encryption** toggle — each note is either plaintext or AES-GCM encrypted with your master key.
- **Public Sharing** — generate shared links (`/shared/id`) for unencrypted notes with a dedicated public viewer and theme toggle.
- **Performance Optimized** — "Lazy Loading" architecture: lists only load metadata and content snippets. Full content is fetched and decrypted only when needed.
- **Pinning & Sorting** — pin important notes to the top and sort the rest by Title or Date (preferences saved to localStorage).
- **Zero-knowledge design** — master key is derived in-browser from your password via PBKDF2, never sent to the server.
- **Auth** — email/password with JWT in an HttpOnly cookie.
- **Auto-save** with a 5-second debounce and visible saving / saved / unsaved indicators.
- **Search** across titles.
- **Dark / light theme**, mobile-friendly split-pane UI, PWA manifest.
- **Developed by Jack90Nguyen** — minimal, secure, and personal.

## Tech stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4, lucide-react icons, next-themes
- **Editor**: custom `MinimalMarkdownEditor` using `react-markdown` + `remark-gfm`
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (`jsonwebtoken`), bcrypt password hashing
- **Crypto**: Web Crypto API (PBKDF2 key derivation, AES-GCM content encryption)
- **Validation**: Zod

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Environment variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/note-e2e
JWT_SECRET=replace-with-a-long-random-string
```

> `JWT_SECRET` is **required** in production — the app will refuse to start without it.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Security model

- Password is never stored or sent beyond the login/register call. The server keeps only a bcrypt hash.
- Each user has a randomly generated **master key** (created at register time).
- The master key is encrypted in the browser with a key derived from the password via PBKDF2 + salt, then stored on the server as ciphertext.
- On login, the browser fetches the encrypted master key + salt + iv, derives the unwrap key from the password, decrypts the master key, and keeps it in `sessionStorage` for the session.
- Encrypted notes are saved as AES-GCM ciphertext + iv; plaintext never leaves the browser.
- API input is validated with Zod; server errors are logged internally and returned to clients as generic `Internal server error`.

## Project structure

```
src/
  app/
    api/            # Route handlers (auth, notes CRUD)
    login/ register/ notes/
  components/
    editor/         # MinimalMarkdownEditor, EditableArea, Toolbar, Preview
    notes/          # NoteEditor, NotesSidebar
    auth/ ThemeProvider
  contexts/         # AuthContext, NotesContext
  lib/              # db, auth, crypto (server + client), validators, markdown-insert
  models/           # User, Note (Mongoose schemas)
  middleware.ts     # auth guard
```

## Deployment

Deploy to Vercel + MongoDB Atlas, or any Node host. Make sure `MONGODB_URI` and `JWT_SECRET` are set in the environment.

## License

Private / personal project.
