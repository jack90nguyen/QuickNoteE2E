export interface InsertInput {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface InsertResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export function wrapSelection(
  input: InsertInput,
  before: string,
  after = '',
  placeholder = ''
): InsertResult {
  const { value, selectionStart, selectionEnd } = input;
  const selected = value.slice(selectionStart, selectionEnd);
  const inner = selected || placeholder;
  const next = value.slice(0, selectionStart) + before + inner + after + value.slice(selectionEnd);
  const start = selectionStart + before.length;
  const end = start + inner.length;
  return { value: next, selectionStart: start, selectionEnd: end };
}

export function insertLinePrefix(
  input: InsertInput,
  prefix: string
): InsertResult {
  const { value, selectionStart, selectionEnd } = input;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEndIdx = value.indexOf('\n', selectionEnd);
  const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  const block = value.slice(lineStart, blockEnd);
  const lines = block.split('\n');
  const prefixed = lines.map((line) => prefix + line).join('\n');
  const next = value.slice(0, lineStart) + prefixed + value.slice(blockEnd);
  const delta = prefixed.length - block.length;

  return {
    value: next,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + delta,
  };
}
