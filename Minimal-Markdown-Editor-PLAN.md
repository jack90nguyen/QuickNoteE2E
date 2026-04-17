# Minimal Markdown Editor - Implementation Plan

## 1. Goal

Build a custom lightweight markdown editor for the notes app with a minimal UI and only essential features.

## Core Requirements

* Simple and fast editor
* Clean minimal interface
* Edit mode
* Preview mode
* Markdown toolbar shortcuts
* Support headings: H1, H2, H3, H4
* Bullet list
* Task list / checkbox list
* Mobile friendly
* Dark mode ready
* Easy integration with encrypted notes flow

---

## 2. Recommended Tech Stack

* React
* TypeScript
* Tailwind CSS
* react-markdown
* remark-gfm
* lucide-react (icons optional)

---

## 3. Component Structure

Create reusable component:

```text
components/editor/MinimalMarkdownEditor.tsx
```

Optional subcomponents:

```text
components/editor/Toolbar.tsx
components/editor/Preview.tsx
```

---

## 4. Props API

```ts
interface MinimalMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}
```

---

## 5. UI Layout

```text
+-----------------------------------+
| H1 H2 H3 H4 List Checkbox Preview |
+-----------------------------------+
|                                   |
| Textarea (Edit Mode)              |
|                                   |
+-----------------------------------+
```

When Preview enabled:

```text
+-----------------------------------+
| Toolbar                           |
+-----------------------------------+
| Rendered Markdown Preview         |
+-----------------------------------+
```

Optional split mode later.

---

## 6. State Management

Internal state:

```ts
const [mode, setMode] = useState<'edit' | 'preview'>('edit')
```

Content is controlled from parent via props.

---

## 7. Toolbar Actions

All actions operate on textarea cursor selection.

## H1

Insert:

```md
# Heading
```

## H2

Insert:

```md
## Heading
```

## H3

Insert:

```md
### Heading
```

## H4

Insert:

```md
#### Heading
```

## Bullet List

Insert:

```md
- item
```

## Checkbox List

Insert:

```md
- [ ] task
```

## Preview Toggle

Switch between edit and preview.

---

## 8. Textarea Behavior

Requirements:

* Preserve cursor position
* Auto focus after toolbar click
* Tab inserts spaces
* Enter continues list optionally (future)
* Full width
* Responsive height
* Resize vertical or fixed height

Suggested classes:

```text
w-full min-h-[400px] p-4 outline-none bg-transparent
```

---

## 9. Markdown Preview Rendering

Use:

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {value}
</ReactMarkdown>
```

Supports:

* headings
* lists
* task lists
* paragraphs
* bold/italic if manually typed

---

## 10. Styling Rules

## Toolbar

* Sticky top optional
* Small buttons
* Rounded corners
* Hover state
* Active preview state

## Editor

* Monospace font optional
* Good spacing
* Comfortable line height

## Preview

Use prose classes or custom typography.

Example:

```text
prose prose-sm max-w-none dark:prose-invert
```

---

## 11. Accessibility

* Buttons have aria-label
* Keyboard tab navigation
* Visible focus ring
* Sufficient contrast

---

## 12. Mobile UX

* Wrap toolbar buttons
* Large tap targets
* Good padding
* Avoid horizontal scroll
* Height adapted for mobile keyboard

---

## 13. Integration With Notes App

Use inside note page:

```tsx
<MinimalMarkdownEditor
  value={content}
  onChange={setContent}
/>
```

Save flow:

* Parent receives markdown string
* If note encrypted => encrypt before API call
* Else save directly

---

## 14. Future Enhancements

Phase 2 optional:

* Split view edit + preview
* Auto-save indicator
* Keyboard shortcuts (Ctrl+1 for H1)
* Continue list on Enter
* Drag/drop image upload
* Code block button
* Quote button
* Word count

---

## 15. Testing Checklist

* Typing works normally
* Toolbar inserts syntax correctly
* Selection replacement works
* Preview renders correctly
* Checkbox list renders correctly
* Mobile usable
* Dark mode readable
* Controlled value updates correctly
* Works with encrypted note load/save flow

---

## 16. Build Order

1. Create base component
2. Add textarea
3. Add toolbar buttons
4. Implement insertAtCursor helper
5. Add preview mode
6. Style UI
7. Mobile polish
8. Integrate with note page
9. Test encrypted notes flow

---

## 17. Deliverables For AI Agent

Create:

* MinimalMarkdownEditor.tsx
* insertMarkdownAtCursor helper
* Tailwind styling
* Example usage page
* Clean reusable component

Code must be:

* TypeScript
* Next.js compatible
* Client component
* Clean and maintainable
* No heavy dependencies except react-markdown + remark-gfm
