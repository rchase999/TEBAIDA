import { describe, it, expect } from 'vitest';
import { EvidenceVerifier } from '../src/core/evidence_verifier/index';

describe('EvidenceVerifier', () => {
  const verifier = new EvidenceVerifier();

  describe('extractCitations', () => {
    it('extracts markdown links', () => {
      const text = 'According to [Nature Article](https://www.nature.com/articles/123) the data shows...';
      const citations = verifier.extractCitations(text);
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations[0].url).toContain('nature.com');
    });

    it('extracts bare URLs', () => {
      const text = 'As shown in https://www.bbc.com/news/article-123 the report indicates...';
      const citations = verifier.extractCitations(text);
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations[0].url).toContain('bbc.com');
    });

    it('returns empty array for text without citations', () => {
      const text = 'This is a plain argument with no citations or links.';
      const citations = verifier.extractCitations(text);
      expect(citations).toEqual([]);
    });

    it('extracts multiple citations from one text', () => {
      const text = 'See [Source 1](https://example.com/1) and [Source 2](https://example.com/2) for evidence.';
      const citations = verifier.extractCitations(text);
      expect(citations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('classifySource', () => {
    it('classifies nature.com as peer-reviewed', () => {
      const result = verifier.classifySource('https://www.nature.com/articles/123');
      expect(result).toBe('peer-reviewed');
    });

    it('classifies .gov domains as government', () => {
      const result = verifier.classifySource('https://www.cdc.gov/reports/2024');
      expect(result).toBe('government');
    });

    it('classifies bbc.com as news', () => {
      const result = verifier.classifySource('https://www.bbc.com/news/article');
      expect(result).toBe('news');
    });

    it('classifies medium.com as blog', () => {
      const result = verifier.classifySource('https://medium.com/some-article');
      expect(result).toBe('blog');
    });

    it('classifies twitter/x.com as social-media', () => {
      const result = verifier.classifySource('https://x.com/user/status/123');
      expect(result).toBe('social-media');
    });

    it('classifies unknown domains as unknown', () => {
      const result = verifier.classifySource('https://randomsite12345.com/page');
      expect(result).toBe('unknown');
    });
  });

  describe('verifyAndScoreAll', () => {
    it('scores citations and assigns source types', async () => {
      const citations = [
        { id: 'c1', url: 'https://www.nature.com/articles/abc', title: 'Nature Study', passage: '', verified: false },
        { id: 'c2', url: 'https://medium.com/some-post', title: 'Blog Post', passage: '', verified: false },
      ];
      await verifier.verifyAndScoreAll(citations);
      expect(citations[0].sourceType).toBe('peer-reviewed');
      expect(citations[1].sourceType).toBe('blog');
      expect(typeof citations[0].credibilityScore).toBe('number');
      expect(typeof citations[1].credibilityScore).toBe('number');
    });

    it('peer-reviewed gets higher score than blog', async () => {
      const citations = [
        { id: 'c1', url: 'https://pubmed.ncbi.nlm.nih.gov/123', title: 'PubMed', passage: '', verified: false },
        { id: 'c2', url: 'https://medium.com/blog', title: 'Blog', passage: '', verified: false },
      ];
      await verifier.verifyAndScoreAll(citations);
      expect(citations[0].credibilityScore!).toBeGreaterThan(citations[1].credibilityScore!);
    });
  });
});
