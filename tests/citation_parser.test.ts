import { describe, it, expect } from 'vitest';
import { parseCitations, formatCitation, formatCitationList } from '../src/utils/citation_parser';

describe('parseCitations', () => {
  it('extracts markdown links', () => {
    const text = 'According to [Example Study](https://example.com/study) this is true.';
    const citations = parseCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].title).toBe('Example Study');
    expect(citations[0].url).toBe('https://example.com/study');
  });

  it('extracts bare URLs', () => {
    const text = 'See https://example.com/data for more info.';
    const citations = parseCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].url).toBe('https://example.com/data');
  });

  it('extracts bracketed references', () => {
    const text = 'This is true [1].\n\n[1]: Smith et al. - https://example.com/smith';
    const citations = parseCitations(text);
    expect(citations.some(c => c.url.includes('example.com/smith'))).toBe(true);
  });

  it('extracts inline parenthetical citations', () => {
    const text = 'Research shows (Smith, 2023) that this is effective.';
    const citations = parseCitations(text);
    expect(citations.some(c => c.title === 'Smith, 2023')).toBe(true);
  });

  it('deduplicates URLs', () => {
    const text = 'See [Link](https://example.com/page) and also https://example.com/page for details.';
    const citations = parseCitations(text);
    const urls = citations.map(c => c.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('handles text with no citations', () => {
    const text = 'This is just a plain argument with no sources.';
    const citations = parseCitations(text);
    expect(citations).toHaveLength(0);
  });

  it('cleans trailing punctuation from URLs', () => {
    const text = 'Check https://example.com/path.';
    const citations = parseCitations(text);
    expect(citations[0].url).toBe('https://example.com/path');
  });

  it('extracts multiple citation types from same text', () => {
    const text = `
      According to [WHO Report](https://who.int/report), this is critical.
      Research by (Johnson, 2022) confirms the findings.
      More data: https://data.gov/stats
    `;
    const citations = parseCitations(text);
    expect(citations.length).toBeGreaterThanOrEqual(3);
  });
});

describe('formatCitation', () => {
  it('formats a citation with title and URL', () => {
    const result = formatCitation({
      id: '1', url: 'https://example.com', title: 'Example', passage: '', verified: false,
    });
    expect(result).toContain('Example');
    expect(result).toContain('https://example.com');
    expect(result).toContain('Unverified');
  });

  it('shows Verified for verified citations', () => {
    const result = formatCitation({
      id: '1', url: 'https://example.com', title: 'Example', passage: '', verified: true,
    });
    expect(result).toContain('Verified');
  });

  it('includes source type badge', () => {
    const result = formatCitation({
      id: '1', url: '', title: 'Study', passage: '', verified: false, sourceType: 'peer-reviewed',
    });
    expect(result).toContain('[Academic]');
  });
});

describe('formatCitationList', () => {
  it('returns message for empty list', () => {
    expect(formatCitationList([])).toBe('No citations found.');
  });

  it('numbers citations', () => {
    const citations = [
      { id: '1', url: 'https://a.com', title: 'A', passage: '', verified: false },
      { id: '2', url: 'https://b.com', title: 'B', passage: '', verified: false },
    ];
    const result = formatCitationList(citations);
    expect(result).toContain('[1]');
    expect(result).toContain('[2]');
  });
});
