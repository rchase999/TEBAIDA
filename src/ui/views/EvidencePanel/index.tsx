import React, { useMemo, useState, useCallback } from 'react';
import clsx from 'clsx';
import {
  ExternalLink, Globe, ShieldCheck, ShieldAlert,
  ShieldQuestion, Link2, FileText, X,
  Star, Copy, Check, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import type { Citation } from '../../../types';

/* ------- Credibility helpers ------- */

const SOURCE_LABELS: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'default'; description: string }> = {
  'peer-reviewed': { label: 'Peer Reviewed', variant: 'success', description: 'Published in academic journals with expert review' },
  government: { label: 'Government', variant: 'success', description: 'Official government data and reports' },
  news: { label: 'News', variant: 'info', description: 'Mainstream media reporting' },
  blog: { label: 'Blog', variant: 'warning', description: 'Personal or organizational blog content' },
  'social-media': { label: 'Social Media', variant: 'error', description: 'User-generated social media content' },
  unknown: { label: 'Unknown', variant: 'default', description: 'Unclassified source' },
};

const SOURCE_DOT_COLORS: Record<string, string> = {
  'peer-reviewed': 'bg-emerald-500',
  government: 'bg-emerald-400',
  news: 'bg-blue-500',
  blog: 'bg-amber-500',
  'social-media': 'bg-red-500',
  unknown: 'bg-gray-400',
};

function credibilityToStars(score: number): number {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

function StarRating({ score }: { score: number }) {
  const stars = credibilityToStars(score);
  return (
    <div className="flex items-center gap-0.5" title={`Credibility: ${score}/100`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={clsx(
            'h-3 w-3',
            i < stars ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300 dark:text-gray-600',
          )}
        />
      ))}
    </div>
  );
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [url]);

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300"
      aria-label="Copy citation URL"
      title="Copy URL"
    >
      {copied ? (
        <span className="flex items-center gap-0.5">
          <Check className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] text-emerald-500">Copied!</span>
        </span>
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

function credibilityColor(score: number | undefined): string {
  if (score === undefined) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function CredibilityIcon({ score }: { score?: number }) {
  if (score === undefined) return <ShieldQuestion className="h-4 w-4 text-gray-400" />;
  if (score >= 70) return <ShieldCheck className={clsx('h-4 w-4', credibilityColor(score))} />;
  return <ShieldAlert className={clsx('h-4 w-4', credibilityColor(score))} />;
}

/* ------- Component ------- */

const EvidencePanel: React.FC = () => {
  const evidenceUrl = useStore((s) => s.evidenceUrl);
  const evidenceHighlight = useStore((s) => s.evidenceHighlight);
  const clearEvidence = useStore((s) => s.clearEvidence);
  const currentDebate = useStore((s) => s.currentDebate);

  // Collect all citations from debate turns
  const allCitations = useMemo(() => {
    if (!currentDebate) return [];
    const seen = new Set<string>();
    const result: Citation[] = [];
    for (const turn of currentDebate.turns) {
      for (const cite of (turn.citations ?? [])) {
        if (!seen.has(cite.id)) {
          seen.add(cite.id);
          result.push(cite);
        }
      }
    }
    return result;
  }, [currentDebate?.turns]);

  const handleOpenExternal = (url: string) => {
    try {
      if (window.electronAPI) {
        window.electronAPI.openExternalUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-surface-dark-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-surface-dark-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-forge-600 dark:text-forge-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Evidence</h3>
        </div>
        {evidenceUrl && (
          <button
            onClick={clearEvidence}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-2 dark:hover:text-gray-300"
            aria-label="Clear evidence"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* URL bar */}
      {evidenceUrl && (
        <div className="border-b border-gray-200 px-4 py-2 dark:border-surface-dark-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-surface-dark-4 dark:bg-surface-dark-1">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">{evidenceUrl}</span>
            <button
              onClick={() => handleOpenExternal(evidenceUrl)}
              className="shrink-0 text-forge-600 hover:text-forge-700 dark:text-forge-400 dark:hover:text-forge-300"
              aria-label="Open in browser"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {evidenceUrl ? (
          <div className="space-y-4">
            {/* Highlighted passage */}
            {evidenceHighlight && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Cited Passage
                </p>
                <blockquote className="border-l-4 border-amber-400 pl-3 text-sm italic text-gray-700 dark:text-gray-300">
                  {evidenceHighlight}
                </blockquote>
              </div>
            )}

            {/* Source info */}
            <Card className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {(() => { try { return new URL(evidenceUrl).hostname; } catch { return evidenceUrl; } })()}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{evidenceUrl}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenExternal(evidenceUrl)}
                icon={<ExternalLink className="h-4 w-4" />}
                className="w-full"
              >
                Open in Browser
              </Button>
            </Card>

            {/* Note about embedding */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-surface-dark-3 dark:bg-surface-dark-1">
              <FileText className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                For security, external pages are opened in your default browser rather than embedded inline.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-center">
            <div>
              <Globe className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Click a citation link to view evidence here.</p>
            </div>
          </div>
        )}
      </div>

      {/* All citations list */}
      {allCitations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-surface-dark-3">
          {/* Citation count summary bar */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-surface-dark-3 dark:bg-surface-dark-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {allCitations.length} citation{allCitations.length !== 1 ? 's' : ''}
              </span>
              {(() => {
                const scored = allCitations.filter((c) => c.credibilityScore !== undefined);
                const avg = scored.length > 0
                  ? Math.round(scored.reduce((sum, c) => sum + (c.credibilityScore ?? 0), 0) / scored.length)
                  : null;
                return avg !== null ? (
                  <span className={clsx('text-xs font-medium', credibilityColor(avg))}>
                    Avg credibility: {avg}/100
                  </span>
                ) : null;
              })()}
              <div className="flex items-center gap-1" title="Source type distribution">
                {(() => {
                  const counts: Record<string, number> = {};
                  for (const c of allCitations) {
                    const st = c.sourceType ?? 'unknown';
                    counts[st] = (counts[st] || 0) + 1;
                  }
                  return Object.entries(counts).map(([type, count]) => (
                    <span key={type} className="flex items-center gap-0.5" title={`${SOURCE_LABELS[type]?.label ?? type}: ${count}`}>
                      {Array.from({ length: count }, (_, i) => (
                        <span
                          key={i}
                          className={clsx('inline-block h-2 w-2 rounded-full', SOURCE_DOT_COLORS[type] ?? 'bg-gray-400')}
                        />
                      ))}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              All Citations ({allCitations.length})
            </p>
          </div>
          <div className="max-h-48 overflow-auto px-4 pb-3 space-y-1.5">
            {allCitations.map((cite) => {
              const sourceInfo = SOURCE_LABELS[cite.sourceType ?? 'unknown'] ?? SOURCE_LABELS.unknown;
              const isLowCredibility = cite.credibilityScore !== undefined && cite.credibilityScore < 40;
              return (
                <div
                  key={cite.id}
                  className={clsx(
                    'flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                    evidenceUrl === cite.url
                      ? 'border-forge-400 bg-forge-50 dark:border-forge-600 dark:bg-forge-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-surface-dark-4 dark:hover:bg-surface-dark-2',
                  )}
                  onClick={() => {
                    const store = useStore.getState();
                    store.setEvidence(cite.url, cite.passage);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const store = useStore.getState();
                      store.setEvidence(cite.url, cite.passage);
                    }
                  }}
                >
                  <CredibilityIcon score={cite.credibilityScore} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-gray-900 dark:text-gray-100">{cite.title || 'Untitled'}</p>
                      {isLowCredibility && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Low Credibility
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {(() => { try { return new URL(cite.url).hostname; } catch { return cite.url; } })()}
                      </p>
                      <CopyUrlButton url={cite.url} />
                    </div>
                    {cite.credibilityScore !== undefined && (
                      <div className="mt-1">
                        <StarRating score={cite.credibilityScore} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Badge size="sm" variant={sourceInfo.variant}>{sourceInfo.label}</Badge>
                      {cite.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[140px] text-right leading-tight">
                      {sourceInfo.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;
