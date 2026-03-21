import React, { useCallback } from 'react';
import clsx from 'clsx';
import { FileDown, Printer } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import type { Debate, DebaterConfig, DebateScore, DetectedFallacy, Citation } from '../../types';

/* ======================================================================
   DebateExportPDF — Generates a styled, print-optimized HTML document
   in a new window and triggers window.print() so the user can save as
   a real PDF via the system dialog.

   Includes:
   - DebateForge branded header
   - Topic + format info
   - Debater profiles
   - Full transcript with speaker labels and phase tags
   - Score summary table
   - Fallacy report
   - Evidence / citation list
   - Branded footer
   ====================================================================== */

export interface DebateExportPDFProps {
  debate: Debate;
  className?: string;
}

// ── helpers ──────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ROLE_PALETTE: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  proposition: { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', badge: '#DBEAFE' },
  opposition: { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF', badge: '#FFE4E6' },
  housemaster: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', badge: '#FEF3C7' },
};

const PHASE_LABEL: Record<string, string> = {
  introduction: 'Introduction',
  opening: 'Opening Statement',
  transition: 'Transition',
  rebuttal: 'Rebuttal',
  'cross-examination': 'Cross-Examination',
  closing: 'Closing Statement',
  verdict: 'Verdict',
};

// ── HTML builder ─────────────────────────────────────────────────────

function buildPrintHTML(debate: Debate): string {
  const {
    topic,
    format,
    debaters,
    turns,
    scores,
    createdAt,
    completedAt,
    status,
  } = debate;

  // Collect all citations across turns
  const allCitations: (Citation & { turnIndex: number; speaker: string })[] = [];
  turns.forEach((t, i) => {
    (t.citations ?? []).forEach((c) => {
      allCitations.push({ ...c, turnIndex: i + 1, speaker: t.debaterName });
    });
  });

  // Collect all fallacies across turns
  const allFallacies: (DetectedFallacy & { turnIndex: number; speaker: string })[] = [];
  turns.forEach((t, i) => {
    (t.fallacies ?? []).forEach((f) => {
      allFallacies.push({ ...f, turnIndex: i + 1, speaker: t.debaterName });
    });
  });

  // ── Debater profiles section
  const profilesHTML = debaters
    .map((d: DebaterConfig) => {
      const pal = ROLE_PALETTE[d.position] ?? ROLE_PALETTE.proposition;
      return `
        <div style="flex:1;min-width:220px;border:1px solid ${pal.border};border-radius:10px;padding:16px;background:${pal.bg};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:${pal.border};color:${pal.text};font-weight:700;text-align:center;line-height:32px;font-size:14px;">${esc(d.name.charAt(0).toUpperCase())}</span>
            <div>
              <div style="font-weight:600;color:${pal.text};font-size:14px;">${esc(d.name)}</div>
              <div style="font-size:11px;color:#6B7280;text-transform:uppercase;">${d.position}</div>
            </div>
          </div>
          <div style="font-size:12px;color:#374151;line-height:1.5;">
            <div><strong>Model:</strong> ${esc(d.model.displayName)}</div>
            <div><strong>Persona:</strong> ${esc(d.persona.name)}</div>
            <div style="font-style:italic;margin-top:4px;">"${esc(d.persona.tagline)}"</div>
          </div>
        </div>`;
    })
    .join('');

  // ── Transcript
  const transcriptHTML = turns
    .map((t, i) => {
      const debater = debaters.find((d) => d.id === t.debaterId);
      const role = debater?.position ?? 'proposition';
      const pal = ROLE_PALETTE[role] ?? ROLE_PALETTE.proposition;
      const phase = PHASE_LABEL[t.phase] ?? t.phase;
      const wc = t.content.split(/\s+/).filter(Boolean).length;

      const fallacyBadges =
        t.fallacies && t.fallacies.length > 0
          ? `<div style="margin-top:8px;">${t.fallacies.map((f) => `<span style="background:#FEF2F2;color:#991B1B;padding:2px 8px;border-radius:10px;font-size:10px;margin-right:4px;">&#9888; ${esc(f.name)}</span>`).join('')}</div>`
          : '';

      return `
        <div style="border-left:4px solid ${pal.border};background:${pal.bg};padding:14px 18px;border-radius:8px;margin-bottom:12px;page-break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <span style="background:${pal.badge};color:${pal.text};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">${role}</span>
            <span style="font-weight:600;color:#1F2937;font-size:13px;">${esc(t.debaterName)}</span>
            <span style="color:#9CA3AF;font-size:11px;">Turn ${i + 1} &mdash; ${esc(phase)}</span>
            <span style="color:#9CA3AF;font-size:10px;margin-left:auto;">${wc} words</span>
          </div>
          <div style="color:#374151;line-height:1.65;white-space:pre-wrap;font-size:13px;">${esc(t.content)}</div>
          ${fallacyBadges}
        </div>`;
    })
    .join('');

  // ── Score table
  let scoresHTML = '';
  if (scores && scores.length > 0) {
    const headerRow = `<tr style="background:#F3F4F6;">
      <th style="padding:8px 12px;text-align:left;font-size:12px;">Debater</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;">Argumentation</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;">Evidence</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;">Rebuttal</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;">Rhetoric</th>
      <th style="padding:8px 12px;text-align:center;font-size:12px;font-weight:700;">Overall</th>
    </tr>`;

    const rows = scores
      .map((s: DebateScore) => {
        const debater = debaters.find((d) => d.id === s.debaterId);
        const pal = ROLE_PALETTE[debater?.position ?? 'proposition'];
        return `<tr>
          <td style="padding:8px 12px;font-weight:600;color:${pal.text};font-size:13px;">${esc(s.debaterName)}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${s.categories.argumentation}/10</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${s.categories.evidence}/10</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${s.categories.rebuttal}/10</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${s.categories.rhetoric}/10</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;font-size:14px;">${s.categories.overall}/10</td>
        </tr>
        ${s.notes ? `<tr><td colspan="6" style="padding:4px 12px 10px;font-size:11px;color:#6B7280;font-style:italic;">${esc(s.notes)}</td></tr>` : ''}`;
      })
      .join('');

    scoresHTML = `
      <div style="page-break-before:auto;margin-top:28px;">
        <h2 style="font-size:18px;font-weight:700;color:#1F2937;margin-bottom:12px;">Score Summary</h2>
        <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
          ${headerRow}${rows}
        </table>
      </div>`;
  }

  // ── Fallacy report
  let fallacyHTML = '';
  if (allFallacies.length > 0) {
    const fallacyRows = allFallacies
      .map(
        (f) => `
        <tr>
          <td style="padding:6px 10px;font-size:12px;">${f.turnIndex}</td>
          <td style="padding:6px 10px;font-size:12px;">${esc(f.speaker)}</td>
          <td style="padding:6px 10px;font-weight:600;font-size:12px;">${esc(f.name)}</td>
          <td style="padding:6px 10px;font-size:12px;">${esc(f.description)}</td>
          <td style="padding:6px 10px;font-size:12px;text-transform:capitalize;">${f.severity}</td>
        </tr>`,
      )
      .join('');

    fallacyHTML = `
      <div style="margin-top:28px;">
        <h2 style="font-size:18px;font-weight:700;color:#1F2937;margin-bottom:12px;">Fallacy Report</h2>
        <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;">
          <tr style="background:#FEF2F2;">
            <th style="padding:6px 10px;text-align:left;font-size:11px;">Turn</th>
            <th style="padding:6px 10px;text-align:left;font-size:11px;">Speaker</th>
            <th style="padding:6px 10px;text-align:left;font-size:11px;">Fallacy</th>
            <th style="padding:6px 10px;text-align:left;font-size:11px;">Description</th>
            <th style="padding:6px 10px;text-align:left;font-size:11px;">Severity</th>
          </tr>
          ${fallacyRows}
        </table>
      </div>`;
  }

  // ── Citations
  let citationsHTML = '';
  if (allCitations.length > 0) {
    const citItems = allCitations
      .map(
        (c, i) =>
          `<li style="margin-bottom:6px;font-size:12px;line-height:1.5;">
            <span style="color:#6B7280;">[Turn ${c.turnIndex}, ${esc(c.speaker)}]</span>
            <strong>${esc(c.title || 'Untitled')}</strong>
            ${c.url ? ` &mdash; <a href="${esc(c.url)}" style="color:#2563EB;">${esc(c.url)}</a>` : ''}
            ${c.passage ? `<br/><span style="color:#9CA3AF;font-style:italic;">"${esc(c.passage.slice(0, 200))}"</span>` : ''}
          </li>`,
      )
      .join('');

    citationsHTML = `
      <div style="margin-top:28px;">
        <h2 style="font-size:18px;font-weight:700;color:#1F2937;margin-bottom:12px;">Evidence &amp; Citations</h2>
        <ol style="padding-left:20px;color:#374151;">${citItems}</ol>
      </div>`;
  }

  // ── Full document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>DebateForge Report — ${esc(topic)}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1F2937; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 26px; line-height: 1.3; }
    h2 { border-bottom: 2px solid #E5E7EB; padding-bottom: 6px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7C3AED;padding-bottom:16px;margin-bottom:24px;">
    <div>
      <div style="font-size:24px;font-weight:800;color:#7C3AED;letter-spacing:-0.5px;">DebateForge</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">AI-Powered Debate Platform</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#6B7280;">
      <div>Format: <strong>${esc(format.name)}</strong></div>
      <div>Created: ${formatDate(createdAt)}</div>
      ${completedAt ? `<div>Completed: ${formatDate(completedAt)}</div>` : ''}
      <div>Status: <strong style="text-transform:capitalize;">${status}</strong></div>
    </div>
  </div>

  <!-- Topic -->
  <h1 style="margin-bottom:20px;color:#111827;">${esc(topic)}</h1>

  <!-- Debater profiles -->
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">
    ${profilesHTML}
  </div>

  <!-- Transcript -->
  <h2 style="font-size:18px;font-weight:700;color:#1F2937;margin-bottom:14px;">Debate Transcript</h2>
  ${transcriptHTML}

  ${scoresHTML}
  ${fallacyHTML}
  ${citationsHTML}

  <!-- Footer -->
  <div style="margin-top:40px;border-top:2px solid #E5E7EB;padding-top:16px;text-align:center;color:#9CA3AF;font-size:11px;">
    Generated by <strong style="color:#7C3AED;">DebateForge</strong> &mdash; ${formatDate(new Date().toISOString())}
  </div>

  <!-- Print button (hidden in print) -->
  <div class="no-print" style="position:fixed;bottom:24px;right:24px;">
    <button onclick="window.print()" style="background:#7C3AED;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,0.3);">
      Save as PDF
    </button>
  </div>
</body>
</html>`;
}

// ── React component ──────────────────────────────────────────────────

export const DebateExportPDF: React.FC<DebateExportPDFProps> = ({ debate, className }) => {
  const handleExport = useCallback(() => {
    const html = buildPrintHTML(debate);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Give fonts a moment to load then trigger print dialog
    win.addEventListener('load', () => {
      setTimeout(() => win.print(), 400);
    });
  }, [debate]);

  return (
    <Tooltip content="Export debate as PDF">
      <Button
        variant="outline"
        size="sm"
        icon={<FileDown className="w-4 h-4" />}
        onClick={handleExport}
        className={clsx('gap-1.5', className)}
        aria-label="Export debate as PDF"
      >
        <span className="hidden sm:inline">Export PDF</span>
      </Button>
    </Tooltip>
  );
};

export default DebateExportPDF;
