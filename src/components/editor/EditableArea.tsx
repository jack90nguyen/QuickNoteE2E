"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

export interface EditableAreaHandle {
  getValue: () => string;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}

const HEADING_CLASS: Record<string, string> = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
};

function classForLine(line: string): string {
  if (/^#### /.test(line)) return HEADING_CLASS.h4;
  if (/^### /.test(line)) return HEADING_CLASS.h3;
  if (/^## /.test(line)) return HEADING_CLASS.h2;
  if (/^# /.test(line)) return HEADING_CLASS.h1;
  return '';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildLinesHtml(value: string): string {
  const lines = value.split('\n');
  return lines
    .map((line) => {
      const cls = classForLine(line);
      const body = line.length === 0 ? '<br>' : escapeHtml(line);
      return `<div class="${cls}">${body}</div>`;
    })
    .join('');
}

function getValueFromDom(root: HTMLElement): string {
  const children = Array.from(root.children) as HTMLElement[];
  if (children.length === 0) return root.textContent ?? '';
  return children.map((c) => c.textContent ?? '').join('\n');
}

function getTextOffset(root: HTMLElement, node: Node, offset: number): number {
  const lines = Array.from(root.children) as HTMLElement[];
  let running = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === node || line.contains(node)) {
      let within = 0;
      if (node === line) {
        for (let j = 0; j < offset && j < line.childNodes.length; j++) {
          within += line.childNodes[j].textContent?.length ?? 0;
        }
      } else {
        const range = document.createRange();
        range.selectNodeContents(line);
        range.setEnd(node, offset);
        within = range.toString().length;
      }
      return running + within;
    }
    running += (line.textContent ?? '').length + 1;
  }
  return running;
}

function locateOffset(
  root: HTMLElement,
  offset: number
): { node: Node; nodeOffset: number } {
  const lines = Array.from(root.children) as HTMLElement[];
  let remaining = offset;
  for (const line of lines) {
    const len = (line.textContent ?? '').length;
    if (remaining <= len) {
      if (len === 0) {
        return { node: line, nodeOffset: 0 };
      }
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      let used = 0;
      let node = walker.nextNode() as Text | null;
      while (node) {
        const l = node.data.length;
        if (used + l >= remaining) {
          return { node, nodeOffset: remaining - used };
        }
        used += l;
        node = walker.nextNode() as Text | null;
      }
      return { node: line, nodeOffset: line.childNodes.length };
    }
    remaining -= len + 1;
  }
  const last = lines[lines.length - 1];
  if (!last) return { node: root, nodeOffset: 0 };
  return { node: last, nodeOffset: last.childNodes.length };
}

function setRange(root: HTMLElement, start: number, end: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const s = locateOffset(root, start);
  const e = start === end ? s : locateOffset(root, end);
  const range = document.createRange();
  range.setStart(s.node, s.nodeOffset);
  range.setEnd(e.node, e.nodeOffset);
  sel.removeAllRanges();
  sel.addRange(range);
}

const EditableArea = forwardRef<EditableAreaHandle, Props>(function EditableArea(
  { value, onChange, placeholder, readOnly, onKeyDown, className },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getValue() {
      return rootRef.current ? getValueFromDom(rootRef.current) : value;
    },
    getSelection() {
      const root = rootRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.rangeCount === 0) return { start: 0, end: 0 };
      const range = sel.getRangeAt(0);
      if (!root.contains(range.startContainer)) return { start: 0, end: 0 };
      const start = getTextOffset(root, range.startContainer, range.startOffset);
      const end = getTextOffset(root, range.endContainer, range.endOffset);
      return { start: Math.min(start, end), end: Math.max(start, end) };
    },
    setSelection(start, end) {
      if (!rootRef.current) return;
      rootRef.current.focus();
      setRange(rootRef.current, start, end);
    },
    focus() {
      rootRef.current?.focus();
    },
  }));

  useLayoutEffect(() => {
    if (rootRef.current && rootRef.current.innerHTML === '') {
      rootRef.current.innerHTML = buildLinesHtml(value);
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (getValueFromDom(root) !== value) {
      root.innerHTML = buildLinesHtml(value);
    }
  }, [value]);

  const reclassifyLines = () => {
    const root = rootRef.current;
    if (!root) return;
    for (const child of Array.from(root.children)) {
      if (child instanceof HTMLElement) {
        const cls = classForLine(child.textContent ?? '');
        if (child.className !== cls) child.className = cls;
      }
    }
  };

  const handleInput = () => {
    const root = rootRef.current;
    if (!root) return;
    reclassifyLines();
    const next = getValueFromDom(root);
    if (next !== value) onChange(next);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    document.execCommand('insertText', false, text);
  };

  const isEmpty = value.length === 0;

  return (
    <div
      ref={rootRef}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onPaste={handlePaste}
      spellCheck={false}
      data-placeholder={placeholder}
      data-empty={isEmpty ? 'true' : 'false'}
      className={className}
    />
  );
});

export default EditableArea;
