import React from 'react';
import clsx from 'clsx';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ── Inline parsing ──────────────────────────────────────────────────────────

interface InlineNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'highlight';
  text: string;
  href?: string;
  children?: InlineNode[];
}

/**
 * Tokenise a single line of text into inline nodes (bold, italic, code, links).
 * Handles nesting of bold/italic but keeps implementation simple and
 * dependency-free.
 */
function parseInline(raw: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  // Order matters: code first (so backtick-wrapped text is never split),
  // then links, strikethrough, highlight, bold, italic.
  const inlineRegex =
    /(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(~~(.+?)~~)|(==(.+?)==)|(\*\*(.+?)\*\*|__(.+?)__)|(\*(.+?)\*|_([^_]+)_)/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(raw)) !== null) {
    // Push preceding plain text
    if (match.index > cursor) {
      nodes.push({ type: 'text', text: raw.slice(cursor, match.index) });
    }

    if (match[1]) {
      // Inline code
      nodes.push({ type: 'code', text: match[2] });
    } else if (match[3]) {
      // Link [text](url)
      nodes.push({ type: 'link', text: match[4], href: match[5] });
    } else if (match[6]) {
      // Strikethrough ~~text~~
      const inner = match[7];
      nodes.push({ type: 'strikethrough', text: inner, children: parseInline(inner) });
    } else if (match[8]) {
      // Highlight ==text==
      const inner = match[9];
      nodes.push({ type: 'highlight', text: inner, children: parseInline(inner) });
    } else if (match[10]) {
      // Bold **text** or __text__
      const inner = match[11] ?? match[12];
      nodes.push({ type: 'bold', text: inner, children: parseInline(inner) });
    } else if (match[13]) {
      // Italic *text* or _text_
      const inner = match[14] ?? match[15];
      nodes.push({ type: 'italic', text: inner, children: parseInline(inner) });
    }

    cursor = match.index + match[0].length;
  }

  // Remaining plain text
  if (cursor < raw.length) {
    nodes.push({ type: 'text', text: raw.slice(cursor) });
  }

  return nodes;
}

/** Render an array of InlineNodes to React elements. */
function renderInline(nodes: InlineNode[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case 'text':
        return <React.Fragment key={key}>{node.text}</React.Fragment>;
      case 'code':
        return (
          <code
            key={key}
            className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:bg-surface-dark-3 dark:text-pink-400"
          >
            {node.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forge-600 underline decoration-forge-400/40 hover:decoration-forge-500 dark:text-forge-400 dark:decoration-forge-500/40 dark:hover:decoration-forge-400"
          >
            {node.text}
          </a>
        );
      case 'bold':
        return (
          <strong key={key} className="font-semibold">
            {node.children ? renderInline(node.children, key) : node.text}
          </strong>
        );
      case 'italic':
        return (
          <em key={key}>
            {node.children ? renderInline(node.children, key) : node.text}
          </em>
        );
      case 'strikethrough':
        return (
          <del key={key} className="text-gray-400 line-through dark:text-gray-500">
            {node.children ? renderInline(node.children, key) : node.text}
          </del>
        );
      case 'highlight':
        return (
          <mark
            key={key}
            className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-500/30"
          >
            {node.children ? renderInline(node.children, key) : node.text}
          </mark>
        );
      default:
        return <React.Fragment key={key}>{node.text}</React.Fragment>;
    }
  });
}

/** Convenience: parse + render inline markdown for a raw string. */
function renderInlineText(text: string, keyPrefix: string): React.ReactNode[] {
  return renderInline(parseInline(text), keyPrefix);
}

// ── Block parsing ───────────────────────────────────────────────────────────

interface Block {
  type:
    | 'paragraph'
    | 'heading'
    | 'blockquote'
    | 'ordered-list'
    | 'unordered-list'
    | 'horizontal-rule'
    | 'table'
    | 'task-list';
  level?: number; // heading level (2 | 3)
  lines: string[];
  /** For task-list: tracks checked state per line. */
  checked?: boolean[];
  /** For table: stores header cells, separator alignments, and body rows. */
  headerCells?: string[];
  alignments?: ('left' | 'center' | 'right' | null)[];
  bodyRows?: string[][];
}

/** Group raw lines into logical blocks. */
function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = () => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Empty line → flush current block
    if (trimmed === '') {
      flush();
      continue;
    }

    // Horizontal rule: --- or *** or ___ (at least 3 chars, nothing else)
    if (/^(?:[-]{3,}|[*]{3,}|[_]{3,})$/.test(trimmed)) {
      flush();
      blocks.push({ type: 'horizontal-rule', lines: [] });
      continue;
    }

    // Table: detect a line that looks like a table row and peek ahead for
    // the separator row. We require at least: header row, separator row.
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\|?[\s:]*-{2,}[\s:]*(\|[\s:]*-{2,}[\s:]*)*\|?$/.test(lines[i + 1].trim())
    ) {
      flush();

      const parseCells = (row: string): string[] =>
        row
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headerCells = parseCells(trimmed);

      // Parse separator to determine column alignments
      const sepCells = parseCells(lines[i + 1].trim());
      const alignments: ('left' | 'center' | 'right' | null)[] = sepCells.map(
        (sep) => {
          const left = sep.startsWith(':');
          const right = sep.endsWith(':');
          if (left && right) return 'center';
          if (right) return 'right';
          if (left) return 'left';
          return null;
        },
      );

      // Consume body rows
      const bodyRows: string[][] = [];
      let j = i + 2;
      while (j < lines.length) {
        const rowTrimmed = lines[j].trim();
        if (rowTrimmed === '' || !rowTrimmed.includes('|')) break;
        bodyRows.push(parseCells(rowTrimmed));
        j++;
      }

      blocks.push({
        type: 'table',
        lines: [],
        headerCells,
        alignments,
        bodyRows,
      });

      // Advance past all consumed lines (loop will do i++ so subtract 1)
      i = j - 1;
      continue;
    }

    // Task list item: - [x] or - [ ]
    const taskMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      const text = taskMatch[2];
      if (current?.type === 'task-list') {
        current.lines.push(text);
        current.checked!.push(isChecked);
      } else {
        flush();
        current = { type: 'task-list', lines: [text], checked: [isChecked] };
      }
      continue;
    }

    // Heading (## or ###, ignore #)
    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      flush();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        lines: [headingMatch[2]],
      });
      continue;
    }

    // Blockquote
    const bqMatch = trimmed.match(/^>\s?(.*)$/);
    if (bqMatch) {
      if (current?.type === 'blockquote') {
        current.lines.push(bqMatch[1]);
      } else {
        flush();
        current = { type: 'blockquote', lines: [bqMatch[1]] };
      }
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (current?.type === 'ordered-list') {
        current.lines.push(olMatch[1]);
      } else {
        flush();
        current = { type: 'ordered-list', lines: [olMatch[1]] };
      }
      continue;
    }

    // Unordered list (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (current?.type === 'unordered-list') {
        current.lines.push(ulMatch[1]);
      } else {
        flush();
        current = { type: 'unordered-list', lines: [ulMatch[1]] };
      }
      continue;
    }

    // Regular text → paragraph (merge consecutive lines)
    if (current?.type === 'paragraph') {
      current.lines.push(trimmed);
    } else {
      flush();
      current = { type: 'paragraph', lines: [trimmed] };
    }
  }

  flush();
  return blocks;
}

// ── Render blocks ───────────────────────────────────────────────────────────

function renderBlock(block: Block, index: number): React.ReactNode {
  const key = `block-${index}`;

  switch (block.type) {
    case 'heading': {
      const text = block.lines[0];
      if (block.level === 2) {
        return (
          <h2
            key={key}
            className="mb-2 mt-4 text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            {renderInlineText(text, key)}
          </h2>
        );
      }
      return (
        <h3
          key={key}
          className="mb-1.5 mt-3 text-base font-semibold text-gray-800 dark:text-gray-200"
        >
          {renderInlineText(text, key)}
        </h3>
      );
    }

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="my-2 border-l-4 border-forge-400 pl-4 italic text-gray-600 dark:border-forge-600 dark:text-gray-400"
        >
          {block.lines.map((line, li) => (
            <p key={`${key}-l${li}`}>{renderInlineText(line, `${key}-l${li}`)}</p>
          ))}
        </blockquote>
      );

    case 'ordered-list':
      return (
        <ol
          key={key}
          className="my-2 list-decimal space-y-1 pl-6 text-gray-700 dark:text-gray-300"
        >
          {block.lines.map((line, li) => (
            <li key={`${key}-li${li}`}>{renderInlineText(line, `${key}-li${li}`)}</li>
          ))}
        </ol>
      );

    case 'unordered-list':
      return (
        <ul
          key={key}
          className="my-2 list-disc space-y-1 pl-6 text-gray-700 dark:text-gray-300"
        >
          {block.lines.map((line, li) => (
            <li key={`${key}-li${li}`}>{renderInlineText(line, `${key}-li${li}`)}</li>
          ))}
        </ul>
      );

    case 'horizontal-rule':
      return (
        <hr
          key={key}
          className="my-4 border-t border-gray-200 dark:border-gray-700"
        />
      );

    case 'table': {
      const aligns = block.alignments ?? [];
      const alignClass = (col: number): string | undefined => {
        const a = aligns[col];
        if (a === 'center') return 'text-center';
        if (a === 'right') return 'text-right';
        return 'text-left';
      };

      return (
        <div key={key} className="my-3 overflow-x-auto">
          <table className="min-w-full rounded-lg border border-gray-200 text-sm dark:border-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-dark-3">
                {(block.headerCells ?? []).map((cell, ci) => (
                  <th
                    key={`${key}-th${ci}`}
                    className={clsx(
                      'border-b border-gray-200 px-3 py-2 font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100',
                      alignClass(ci),
                    )}
                  >
                    {renderInlineText(cell, `${key}-th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.bodyRows ?? []).map((row, ri) => (
                <tr
                  key={`${key}-tr${ri}`}
                  className={clsx(
                    ri % 2 === 0
                      ? 'bg-white dark:bg-surface-dark-1'
                      : 'bg-gray-50/50 dark:bg-surface-dark-2',
                  )}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={`${key}-td${ri}-${ci}`}
                      className={clsx(
                        'border-b border-gray-100 px-3 py-2 text-gray-700 dark:border-gray-800 dark:text-gray-300',
                        alignClass(ci),
                      )}
                    >
                      {renderInlineText(cell, `${key}-td${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'task-list':
      return (
        <ul
          key={key}
          className="my-2 list-none space-y-1 pl-2 text-gray-700 dark:text-gray-300"
        >
          {block.lines.map((line, li) => {
            const isChecked = block.checked?.[li] ?? false;
            return (
              <li key={`${key}-tl${li}`} className="flex items-start gap-2">
                <span
                  className={clsx(
                    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border',
                    isChecked
                      ? 'border-forge-500 bg-forge-500 text-white dark:border-forge-400 dark:bg-forge-400'
                      : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-surface-dark-2',
                  )}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={isChecked ? 'text-gray-400 line-through dark:text-gray-500' : ''}>
                  {renderInlineText(line, `${key}-tl${li}`)}
                </span>
              </li>
            );
          })}
        </ul>
      );

    case 'paragraph':
    default:
      return (
        <p key={key} className="my-1.5 leading-relaxed text-gray-700 dark:text-gray-300">
          {renderInlineText(block.lines.join(' '), key)}
        </p>
      );
  }
}

// ── Exported component ──────────────────────────────────────────────────────

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(
  ({ content, className }) => {
    const blocks = React.useMemo(() => parseBlocks(content), [content]);

    return (
      <div className={clsx('markdown-renderer', className)}>
        {blocks.map((block, i) => renderBlock(block, i))}
      </div>
    );
  },
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
