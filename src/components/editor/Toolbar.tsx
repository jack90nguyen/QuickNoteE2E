"use client";

import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListChecks,
  Bold,
  Italic,
  Code2,
  Quote,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

export type ToolbarAction =
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'bullet' | 'check'
  | 'bold' | 'italic' | 'code'
  | 'quote' | 'link';

interface ToolbarProps {
  onAction: (action: ToolbarAction) => void;
  mode: 'edit' | 'preview';
  onToggleMode?: () => void;
  showPreviewToggle?: boolean;
}

type ButtonDef = { action: ToolbarAction; label: string; Icon: typeof Heading1 };

const GROUPS: ButtonDef[][] = [
  [
    { action: 'h1', label: 'Heading 1', Icon: Heading1 },
    { action: 'h2', label: 'Heading 2', Icon: Heading2 },
    { action: 'h3', label: 'Heading 3', Icon: Heading3 },
    { action: 'h4', label: 'Heading 4', Icon: Heading4 },
  ],
  [
    { action: 'bold', label: 'Bold', Icon: Bold },
    { action: 'italic', label: 'Italic', Icon: Italic },
    { action: 'code', label: 'Code block', Icon: Code2 },
  ],
  [
    { action: 'bullet', label: 'Bullet list', Icon: List },
    { action: 'check', label: 'Checkbox list', Icon: ListChecks },
  ],
  [
    { action: 'quote', label: 'Quote', Icon: Quote },
    { action: 'link', label: 'Link', Icon: LinkIcon },
  ],
];

function Divider() {
  return <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />;
}

export default function Toolbar({ onAction, mode, onToggleMode, showPreviewToggle }: ToolbarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap px-[18px] py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-transparent">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && <Divider />}
          {group.map(({ action, label, Icon }) => (
            <button
              key={action}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAction(action)}
              aria-label={label}
              title={label}
              disabled={mode === 'preview'}
              className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      ))}
      {showPreviewToggle && onToggleMode && (
        <>
          <Divider />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleMode}
            aria-label="Toggle preview"
            title="Toggle preview"
            className={`p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              mode === 'preview' ? 'text-blue-500' : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {mode === 'edit' ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </>
      )}
    </div>
  );
}
