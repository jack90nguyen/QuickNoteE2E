"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  value: string;
}

export default function Preview({ value }: PreviewProps) {
  return (
    <div className="markdown-body prose max-w-none dark:prose-invert px-6 py-4 overflow-auto h-full 
      prose-p:leading-[var(--line-height-editor)] 
      prose-li:leading-[var(--line-height-editor)]
      prose-headings:mt-6 prose-headings:mb-4">
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]}>{value || '*Nothing to preview*'}</ReactMarkdown>
    </div>
  );
}
