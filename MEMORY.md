# MEMORY.md

## Project Preferences
- Keep solutions simple and maintainable
- Prefer minimal UI / minimal dependencies
- Follow existing project structure
- No animation libraries (no framer-motion, react-spring) — use Tailwind utilities + CSS keyframes in `src/app/globals.css`

## Coding Standards
- Strong typing required (no `any`)
- Use DTO / ViewModel for service outputs
- Keep functions focused and small
- Default no comments; only add when *why* is non-obvious

## Tech Stack
- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Styling: Tailwind CSS v4 + `@tailwindcss/typography`
- Icons: `lucide-react` only
- Markdown: `react-markdown` + `remark-gfm` (GFM task lists)
- Data: MongoDB via `mongoose`
- Auth: JWT in cookie
- Theme: `next-themes`

## Architecture Notes
- **Editor** (`src/components/editor/`): custom contenteditable (`EditableArea.tsx`), NOT a textarea. `MinimalMarkdownEditor.tsx` toggles between edit and preview modes via `previewMode` state in `NoteEditor.tsx`.
- **Preview** (`src/components/editor/Preview.tsx`): shared between authenticated editor and `/shared/[id]` public view. `interactive` prop controls whether task-list checkboxes are toggleable — defaults to `false` so public share stays read-only.
- **Notes layout** (`src/app/notes/layout.tsx`): mobile-first split-pane. On `< md`, sidebar shows full-width on `/notes` index and is hidden when a note is open; `<main>` is hidden on index. On `md+`, both panes always visible.
- **Auto-save**: `NoteEditor` debounces content changes and saves every ~5s. Any component mutating note content must flow through `onChange` → `setContent` in `NoteEditor`.

## Proven Patterns
- Reuse existing abstractions before creating new ones
- Prefer incremental changes over refactors
- Markdown insert: reuse `wrapSelection` / `insertLinePrefix` from `src/lib/markdown-insert.ts`. `wrapSelection` handles inline wrapping (bold, italic, link, fenced code). `insertLinePrefix` handles line-level prefixes (headings, bullet, check, quote) and applies to every selected line.
- Toolbar actions dispatch via two maps in `MinimalMarkdownEditor.tsx`: `PREFIX_MAP` → `insertLinePrefix`, `WRAP_MAP` → `wrapSelection`.
- Task-list toggle in Preview: scan source once for `^[ \t]*([-*+]|\d+\.)[ \t]+\[[ xX]\]` with code blocks masked out; map DOM index of clicked checkbox to source offset and flip ` `↔`x`.
- Mobile interaction feedback: use Tailwind `active:scale-[0.98]` + `active:bg-*` + `touch-manipulation` + `[-webkit-tap-highlight-color:transparent]` on tappable rows.

## Known Pitfalls
- Do not break existing APIs
- Do not rename shared contracts without checking usages
- Run `npx next build` before reporting completion (lint + type-check)
- `Preview` is imported by both `MinimalMarkdownEditor` and `/shared/[id]/page.tsx`; adding props must preserve read-only behavior on the public page
- Task-list regex must mask fenced/inline code, otherwise checkbox patterns inside code blocks get counted
- remark-gfm synthesizes the `<input>` for checkboxes with no `node.position` — can't derive source offset directly from the input node

## Decisions
- Markdown preview uses `react-markdown` + `remark-gfm`; custom component overrides passed via `components` prop (never fork the library).
- Mobile page transitions use a single shared `.note-enter` class in `globals.css` (keyframe `slideInRight`, 220ms), guarded with `md:animate-none` on desktop and `prefers-reduced-motion` media query.
- Skeleton loaders use `animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded` bars — no dedicated skeleton component.
- Dark/light color pairs follow `bg-zinc-200 dark:bg-[#323232]` / `bg-zinc-300 dark:bg-[#3a3a3a]` scale established in `NotesSidebar`.

## User Preferences
- Communicates in Vietnamese; prefers concise Vietnamese responses
- Prefer examples in C#, Node.js, React
- After a feature is built and verified, the user typically asks to commit + push directly to `main` (`git push origin main`); do not open PRs unless asked
- Commit message style: Conventional Commits (`feat:`, `fix:`, `docs:`)
