import type { Citation } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * URL regex pattern — matches http/https URLs.
 */
const URL_REGEX = /https?:\/\/[^\s,)>\]"']+/g;

/**
 * Markdown link pattern — [Title](URL)
 */
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * Bracketed numeric reference with content — [1] Some title or description
 */
const BRACKET_REF_REGEX = /\[(\d+)\][:\s]+([^\n]+)/g;

/**
 * Inline parenthetical citation — (Author, Year) or (Author Year)
 */
const INLINE_CITATION_REGEX = /\(([A-Z][a-z]+(?:\s(?:et\s+al\.?|&\s+[A-Z][a-z]+))?),?\s+(\d{4})\)/g;

/**
 * Footnote-style reference — text^[1] or text[^1]
 */
const FOOTNOTE_REGEX = /[\^]?\[(\d+)\]|\[\^(\d+)\]/g;

/**
 * Extract all citations from debate text.
 *
 * Detects:
 *   - Markdown links: [Title](URL)
 *   - Bare URLs: https://example.com/path
 *   - Bracketed numeric references: [1] Title - URL
 *   - Inline parenthetical citations: (Author, Year)
 *
 * Returns a deduplicated array of Citation objects.
 */
export function parseCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  const seenUrls = new Set<string>();
  const seenRefs = new Set<string>();

  // ── Pass 1: Markdown links ──
  let match: RegExpExecArray | null;
  MARKDOWN_LINK_REGEX.lastIndex = 0;

  while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const title = match[1].trim();
    const url = cleanUrl(match[2]);

    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      citations.push({
        id: uuidv4(),
        url,
        title,
        passage: extractSurroundingText(text, match.index, match[0].length),
        verified: false,
      });
    }
  }

  // ── Pass 2: Bracketed references ──
  BRACKET_REF_REGEX.lastIndex = 0;

  while ((match = BRACKET_REF_REGEX.exec(text)) !== null) {
    const refNum = match[1];
    const refContent = match[2].trim();
    const refKey = `ref-${refNum}`;

    if (seenRefs.has(refKey)) continue;
    seenRefs.add(refKey);

    // Try to extract a URL from the reference content
    const urlMatch = refContent.match(/(https?:\/\/[^\s,)]+)/);
    const url = urlMatch ? cleanUrl(urlMatch[1]) : '';
    const title = urlMatch
      ? refContent.replace(urlMatch[1], '').replace(/[-–—,\s]+$/, '').trim() || `Reference ${refNum}`
      : refContent;

    if (url && seenUrls.has(url)) continue;
    if (url) seenUrls.add(url);

    citations.push({
      id: uuidv4(),
      url,
      title,
      passage: extractSurroundingText(text, match.index, match[0].length),
      verified: false,
    });
  }

  // ── Pass 3: Inline parenthetical citations — (Author, Year) ──
  INLINE_CITATION_REGEX.lastIndex = 0;

  while ((match = INLINE_CITATION_REGEX.exec(text)) !== null) {
    const author = match[1].trim();
    const year = match[2];
    const refKey = `inline-${author}-${year}`;

    if (seenRefs.has(refKey)) continue;
    seenRefs.add(refKey);

    citations.push({
      id: uuidv4(),
      url: '',
      title: `${author}, ${year}`,
      passage: extractSurroundingText(text, match.index, match[0].length),
      verified: false,
      sourceType: 'unknown',
    });
  }

  // ── Pass 4: Bare URLs not already captured ──
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = cleanUrl(match[0]);
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    citations.push({
      id: uuidv4(),
      url,
      title: titleFromUrl(url),
      passage: extractSurroundingText(text, match.index, match[0].length),
      verified: false,
    });
  }

  return citations;
}

/**
 * Format a citation for display in the UI.
 */
export function formatCitation(citation: Citation): string {
  const parts: string[] = [];

  // Title
  if (citation.title) {
    parts.push(citation.title);
  }

  // URL (if present)
  if (citation.url) {
    if (citation.title && !citation.title.startsWith('http')) {
      parts.push(`(${citation.url})`);
    } else if (!citation.title) {
      parts.push(citation.url);
    }
  }

  // Source type badge
  if (citation.sourceType && citation.sourceType !== 'unknown') {
    const badges: Record<string, string> = {
      'peer-reviewed': '[Academic]',
      'government': '[Government]',
      'news': '[News]',
      'blog': '[Blog]',
      'social-media': '[Social Media]',
    };
    parts.push(badges[citation.sourceType] ?? '');
  }

  // Credibility score
  if (citation.credibilityScore !== undefined) {
    parts.push(`Credibility: ${citation.credibilityScore}/100`);
  }

  // Verification status
  parts.push(citation.verified ? 'Verified' : 'Unverified');

  return parts.filter(Boolean).join(' — ');
}

/**
 * Format a list of citations as a numbered reference list.
 */
export function formatCitationList(citations: Citation[]): string {
  if (citations.length === 0) return 'No citations found.';

  return citations
    .map((c, i) => `[${i + 1}] ${formatCitation(c)}`)
    .join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Clean trailing punctuation from a URL.
 */
function cleanUrl(url: string): string {
  return url.replace(/[.;:,!?)]+$/, '').trim();
}

/**
 * Extract surrounding text around a match for context.
 */
function extractSurroundingText(text: string, matchIndex: number, matchLength: number): string {
  const contextWindow = 150;
  const start = Math.max(0, matchIndex - contextWindow);
  const end = Math.min(text.length, matchIndex + matchLength + contextWindow);

  let passage = text.slice(start, end).trim();

  // Clean up partial words at boundaries
  if (start > 0) {
    const firstSpace = passage.indexOf(' ');
    if (firstSpace > 0 && firstSpace < 25) {
      passage = '...' + passage.slice(firstSpace + 1);
    }
  }
  if (end < text.length) {
    const lastSpace = passage.lastIndexOf(' ');
    if (lastSpace > passage.length - 25 && lastSpace > 0) {
      passage = passage.slice(0, lastSpace) + '...';
    }
  }

  return passage;
}

/**
 * Generate a display title from a URL.
 */
function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    const pathSegments = parsed.pathname
      .split('/')
      .filter((s) => s.length > 0)
      .slice(-2);

    if (pathSegments.length > 0) {
      const readablePath = pathSegments
        .map((s) =>
          s.replace(/[-_]/g, ' ').replace(/\.\w+$/, '').trim()
        )
        .filter((s) => s.length > 0)
        .join(' / ');

      if (readablePath.length > 3) {
        return `${host}: ${readablePath}`;
      }
    }

    return host;
  } catch {
    return url;
  }
}
