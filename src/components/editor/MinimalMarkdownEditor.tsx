"use client";

import { useRef } from 'react';
import Toolbar, { ToolbarAction } from './Toolbar';
import Preview from './Preview';
import EditableArea, { EditableAreaHandle } from './EditableArea';
import { insertLinePrefix, wrapSelection } from '@/lib/markdown-insert';

interface MinimalMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'edit' | 'preview';
  onToggleMode?: () => void;
  showPreviewToggle?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

const PREFIX_MAP: Partial<Record<ToolbarAction, string>> = {
  h1: '# ',
  h2: '## ',
  h3: '### ',
  h4: '#### ',
  bullet: '- ',
  check: '- [ ] ',
  quote: '> ',
};

const WRAP_MAP: Partial<Record<ToolbarAction, { before: string; after: string; placeholder: string }>> = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '*', after: '*', placeholder: 'italic text' },
  code: { before: '\n```\n', after: '\n```\n', placeholder: 'code' },
  link: { before: '[', after: '](url)', placeholder: 'link text' },
};

export default function MinimalMarkdownEditor({
  value,
  onChange,
  mode = 'edit',
  onToggleMode,
  showPreviewToggle,
  placeholder = 'Start writing...',
  readOnly = false,
}: MinimalMarkdownEditorProps) {
  const editorRef = useRef<EditableAreaHandle>(null);

  const applyAndRestore = (result: {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  }) => {
    onChange(result.value);
    requestAnimationFrame(() => {
      editorRef.current?.setSelection(result.selectionStart, result.selectionEnd);
    });
  };

  const handleAction = (action: ToolbarAction) => {
    const handle = editorRef.current;
    if (!handle) return;
    const { start, end } = handle.getSelection();
    const input = { value: handle.getValue(), selectionStart: start, selectionEnd: end };

    const prefix = PREFIX_MAP[action];
    if (prefix !== undefined) {
      applyAndRestore(insertLinePrefix(input, prefix));
      return;
    }

    const wrap = WRAP_MAP[action];
    if (wrap) {
      applyAndRestore(wrapSelection(input, wrap.before, wrap.after, wrap.placeholder));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const handle = editorRef.current;
      if (!handle) return;
      const { start, end } = handle.getSelection();
      const result = wrapSelection(
        { value: handle.getValue(), selectionStart: start, selectionEnd: end },
        '  '
      );
      applyAndRestore(result);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <Toolbar
        onAction={handleAction}
        mode={mode}
        onToggleMode={onToggleMode}
        showPreviewToggle={showPreviewToggle}
      />
      <div className="flex-1 overflow-hidden">
        {mode === 'edit' ? (
          <EditableArea
            ref={editorRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            className="minimal-md-editor markdown-body w-full h-full px-6 py-4 overflow-auto outline-none text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words font-mono"
          />
        ) : (
          <Preview value={value} onChange={onChange} interactive={!readOnly} />
        )}
      </div>
    </div>
  );
}
