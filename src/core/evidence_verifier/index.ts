import type { Citation } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Domain pattern lists used for source classification.
 */
const PEER_REVIEWED_DOMAINS = [
  'nature.com',
  'science.org',
  'sciencedirect.com',
  'springer.com',
  'wiley.com',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'jstor.org',
  'arxiv.org',
  'scholar.google.com',
  'thelancet.com',
  'nejm.org',
  'bmj.com',
  'pnas.org',
  'cell.com',
  'oup.com',
  'cambridge.org',
  'ieee.org',
  'acm.org',
  'plos.org',
  'frontiersin.org',
  'mdpi.com',
  'researchgate.net',
  'ssrn.com',
  'doi.org',
];

const GOVERNMENT_DOMAINS = [
  '.gov',
  '.gov.uk',
  '.gov.au',
  '.gov.ca',
  '.gc.ca',
  '.europa.eu',
  'who.int',
  'un.org',
  'worldbank.org',
  'imf.org',
  'oecd.org',
  'nato.int',
  'census.gov',
  'bls.gov',
  'cdc.gov',
  'nih.gov',
  'fda.gov',
  'epa.gov',
  'nasa.gov',
  'noaa.gov',
];

const NEWS_DOMAINS = [
  'nytimes.com',
  'washingtonpost.com',
  'bbc.com',
  'bbc.co.uk',
  'reuters.com',
  'apnews.com',
  'theguardian.com',
  'economist.com',
  'wsj.com',
  'ft.com',
  'bloomberg.com',
  'cnn.com',
  'npr.org',
  'pbs.org',
  'aljazeera.com',
  'politico.com',
  'theatlantic.com',
  'newyorker.com',
  'propublica.org',
  'axios.com',
  'time.com',
  'usatoday.com',
  'latimes.com',
  'chicagotribune.com',
  'foreignaffairs.com',
  'foreignpolicy.com',
];

const SOCIAL_MEDIA_DOMAINS = [
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'threads.net',
  'mastodon.social',
  'tumblr.com',
];

const BLOG_INDICATORS = [
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
  'blogger.com',
  'ghost.io',
  'hashnode.dev',
  'dev.to',
  'wix.com',
];

/**
 * Handles citation extraction, URL verification, source classification,
 * and credibility scoring for debate evidence.
 */
export class EvidenceVerifier {
  /**
   * Parse URLs and citation patterns from debate text.
   * Supports:
   *   - Markdown links: [Title](URL)
   *   - Bare URLs: https://example.com/path
   *   - Bracketed references: [1] Title - URL
   */
  extractCitations(text: string): Citation[] {
    const citations: Citation[] = [];
    const seenUrls = new Set<string>();

    // Pattern 1: Markdown links — [Title](URL)
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      const title = match[1].trim();
      const url = match[2].trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        citations.push(this.buildCitation(url, title, this.extractPassage(text, match.index)));
      }
    }

    // Pattern 2: Bracketed references — [1] or [1]: followed by text and optionally a URL
    const bracketRefRegex = /\[(\d+)\][:\s]+([^\n]+)/g;
    while ((match = bracketRefRegex.exec(text)) !== null) {
      const refLine = match[2].trim();
      // Try to extract a URL from the reference line
      const urlInRef = refLine.match(/(https?:\/\/[^\s,)]+)/);
      if (urlInRef && !seenUrls.has(urlInRef[1])) {
        const url = urlInRef[1];
        seenUrls.add(url);
        // Title is the text before the URL
        const title = refLine.replace(url, '').replace(/[-–—,\s]+$/, '').trim() || `Reference ${match[1]}`;
        citations.push(this.buildCitation(url, title, this.extractPassage(text, match.index)));
      } else if (!urlInRef) {
        // Bracketed reference without a URL — still capture it
        const url = '';
        const title = refLine;
        citations.push({
          id: uuidv4(),
          url,
          title,
          passage: this.extractPassage(text, match.index),
          verified: false,
          sourceType: 'unknown',
          credibilityScore: 20,
        });
      }
    }

    // Pattern 3: Bare URLs not already captured
    const bareUrlRegex = /(?<!\()(https?:\/\/[^\s,)>\]]+)/g;
    while ((match = bareUrlRegex.exec(text)) !== null) {
      const url = match[1].trim().replace(/[.;:]+$/, ''); // strip trailing punctuation
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        citations.push(this.buildCitation(url, this.titleFromUrl(url), this.extractPassage(text, match.index)));
      }
    }

    return citations;
  }

  /**
   * Check whether a URL is reachable by sending a HEAD request.
   * Falls back to GET if HEAD is not supported.
   * Returns true if the response status is in the 200-399 range.
   */
  async verifyUrl(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) {
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });
      } catch {
        // Some servers reject HEAD — retry with GET
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
        });
      }

      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Determine the source type based on domain patterns.
   */
  classifySource(url: string): Citation['sourceType'] {
    if (!url) return 'unknown';

    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      return 'unknown';
    }

    // Check government domains (includes TLD checks like .gov)
    for (const domain of GOVERNMENT_DOMAINS) {
      if (domain.startsWith('.')) {
        // TLD check
        if (hostname.endsWith(domain)) return 'government';
      } else {
        if (hostname === domain || hostname.endsWith('.' + domain)) return 'government';
      }
    }

    // Check peer-reviewed / academic sources
    for (const domain of PEER_REVIEWED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return 'peer-reviewed';
    }

    // Check news sources
    for (const domain of NEWS_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return 'news';
    }

    // Check social media
    for (const domain of SOCIAL_MEDIA_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return 'social-media';
    }

    // Check blog platforms
    for (const domain of BLOG_INDICATORS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return 'blog';
    }

    // Check for .edu domains
    if (hostname.endsWith('.edu') || hostname.endsWith('.ac.uk') || hostname.endsWith('.edu.au')) {
      return 'peer-reviewed';
    }

    // Check for .org that might be research-oriented
    if (hostname.endsWith('.org')) {
      return 'news'; // conservative classification for .org
    }

    return 'unknown';
  }

  /**
   * Calculate a credibility score (0-100) based on source type and verification status.
   */
  calculateCredibility(citation: Citation): number {
    const sourceType = citation.sourceType ?? this.classifySource(citation.url);

    // Base score by source type
    const baseScores: Record<NonNullable<Citation['sourceType']>, number> = {
      'peer-reviewed': 90,
      'government': 85,
      'news': 65,
      'blog': 35,
      'social-media': 20,
      'unknown': 30,
    };

    let score = sourceType ? (baseScores[sourceType] ?? 30) : 30;

    // Bonus for verified URLs
    if (citation.verified) {
      score = Math.min(100, score + 10);
    } else {
      score = Math.max(0, score - 10);
    }

    // Bonus for having a descriptive title (not just a URL or "Reference N")
    if (
      citation.title &&
      citation.title.length > 10 &&
      !citation.title.startsWith('http') &&
      !/^Reference \d+$/.test(citation.title)
    ) {
      score = Math.min(100, score + 5);
    }

    // Bonus for having a passage/context
    if (citation.passage && citation.passage.length > 20) {
      score = Math.min(100, score + 5);
    }

    return Math.round(score);
  }

  /**
   * Classify and score all citations in a list.
   * Performs domain-based classification and credibility scoring.
   * URL verification is skipped in browser context due to CORS restrictions.
   */
  async verifyAndScoreAll(citations: Citation[]): Promise<Citation[]> {
    return citations.map((citation) => {
      // Classify source by domain
      citation.sourceType = this.classifySource(citation.url);

      // Attempt lightweight verification (same-origin only, skip cross-origin)
      // In Electron renderer, most external URLs will be blocked by CORS
      // so we mark as verified if it's a well-known domain
      citation.verified = this.isKnownDomain(citation.url);

      // Calculate credibility score
      citation.credibilityScore = this.calculateCredibility(citation);

      return citation;
    });
  }

  /**
   * Check if a URL belongs to a well-known, established domain.
   * Used as a lightweight alternative to HTTP verification in browser contexts.
   */
  private isKnownDomain(url: string): boolean {
    if (!url) return false;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const allKnownDomains = [
        ...PEER_REVIEWED_DOMAINS,
        ...GOVERNMENT_DOMAINS.filter(d => !d.startsWith('.')),
        ...NEWS_DOMAINS,
      ];
      return allKnownDomains.some(d => hostname === d || hostname.endsWith('.' + d))
        || hostname.endsWith('.gov')
        || hostname.endsWith('.edu')
        || hostname.endsWith('.ac.uk');
    } catch {
      return false;
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Build a Citation object from a URL and title.
   */
  private buildCitation(url: string, title: string, passage: string): Citation {
    const sourceType = this.classifySource(url);
    const citation: Citation = {
      id: uuidv4(),
      url,
      title,
      passage,
      verified: false,
      sourceType,
    };
    citation.credibilityScore = this.calculateCredibility(citation);
    return citation;
  }

  /**
   * Extract surrounding context (passage) around a match index.
   */
  private extractPassage(text: string, matchIndex: number): string {
    const windowSize = 200;
    const start = Math.max(0, matchIndex - windowSize);
    const end = Math.min(text.length, matchIndex + windowSize);

    let passage = text.slice(start, end).trim();

    // Clean up partial words at boundaries
    if (start > 0) {
      const firstSpace = passage.indexOf(' ');
      if (firstSpace > 0 && firstSpace < 30) {
        passage = '...' + passage.slice(firstSpace + 1);
      }
    }
    if (end < text.length) {
      const lastSpace = passage.lastIndexOf(' ');
      if (lastSpace > passage.length - 30) {
        passage = passage.slice(0, lastSpace) + '...';
      }
    }

    return passage;
  }

  /**
   * Generate a fallback title from a URL.
   */
  private titleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Use the hostname minus www. as a basic title
      const host = parsed.hostname.replace(/^www\./, '');

      // Try to extract a readable path segment
      const pathSegments = parsed.pathname
        .split('/')
        .filter((s) => s.length > 0)
        .slice(-2); // last two segments

      if (pathSegments.length > 0) {
        const readablePath = pathSegments
          .map((s) =>
            s
              .replace(/[-_]/g, ' ')
              .replace(/\.\w+$/, '') // remove file extensions
              .trim()
          )
          .filter((s) => s.length > 0)
          .join(' — ');

        if (readablePath.length > 3) {
          return `${host}: ${readablePath}`;
        }
      }

      return host;
    } catch {
      return url;
    }
  }
}
