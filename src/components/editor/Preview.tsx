"use client";

import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  value: string;
  onChange?: (value: string) => void;
  interactive?: boolean;
}

function findTaskBracketPositions(source: string): number[] {
  const masked = source
    .replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
  const re = /^([ \t]*(?:[-*+]|\d+\.)[ \t]+)\[([ xX])\]/gm;
  const positions: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked)) !== null) {
    positions.push(m.index + m[1].length + 1);
  }
  return positions;
}

export default function Preview({ value, onChange, interactive = false }: PreviewProps) {
  const canToggle = interactive && !!onChange;

  const bracketPositions = useMemo(
    () => (canToggle ? findTaskBracketPositions(value) : []),
    [value, canToggle]
  );

  const components: Components | undefined = canToggle
    ? {
        input: ({ node, ...rest }) => {
          void node;
          if (rest.type !== 'checkbox') return <input {...rest} />;
          return (
            <input
              {...rest}
              disabled={false}
              className="cursor-pointer align-middle mr-1"
              onChange={(e) => {
                const root = e.currentTarget.closest('.markdown-body');
                if (!root) return;
                const boxes = Array.from(
                  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
                );
                const idx = boxes.indexOf(e.currentTarget);
                const pos = bracketPositions[idx];
                if (pos === undefined) return;
                const ch = value[pos];
                if (ch !== ' ' && ch !== 'x' && ch !== 'X') return;
                const next = ch === ' ' ? 'x' : ' ';
                onChange!(value.slice(0, pos) + next + value.slice(pos + 1));
              }}
            />
          );
        },
      }
    : undefined;

  return (
    <div className="markdown-body prose max-w-none dark:prose-invert px-6 py-4 overflow-auto h-full
      prose-p:leading-[var(--line-height-editor)]
      prose-li:leading-[var(--line-height-editor)]
      prose-headings:mt-6 prose-headings:mb-4">
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={components}>
        {value || '*Nothing to preview*'}
      </ReactMarkdown>
    </div>
  );
}
