import React from 'react';
import clsx from 'clsx';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ── Inline parsing ──────────────────────────────────────────────────────────

interface InlineNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
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
  // then links, bold, italic.
  const inlineRegex =
    /(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*(.+?)\*\*|__(.+?)__)|(\*(.+?)\*|_([^_]+)_)/g;

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
      // Bold **text** or __text__
      const inner = match[7] ?? match[8];
      nodes.push({ type: 'bold', text: inner, children: parseInline(inner) });
    } else if (match[9]) {
      // Italic *text* or _text_
      const inner = match[10] ?? match[11];
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
  type: 'paragraph' | 'heading' | 'blockquote' | 'ordered-list' | 'unordered-list';
  level?: number; // heading level (2 | 3)
  lines: string[];
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
