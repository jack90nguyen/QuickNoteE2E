"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  value: string;
}

export default function Preview({ value }: PreviewProps) {
  return (
    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert px-6 py-4 overflow-auto h-full">
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]}>{value || '*Nothing to preview*'}</ReactMarkdown>
    </div>
  );
}
