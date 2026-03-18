import React, { useCallback, useState } from 'react';
import clsx from 'clsx';
import { Share2, Download, Copy, Check, FileText } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import type { Debate, DebateScore } from '../../types';
import { getBestQuoteForCard } from '../../core/highlights/index';
import { calculateScores } from '../../utils/scoring';

// ---------------------------------------------------------------------------
// Canvas drawing helpers
// ---------------------------------------------------------------------------

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/** Draw a rounded rectangle path on a canvas context. */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Word-wrap text into lines that fit within maxWidth. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Draw the Oxford Union badge (small crest icon). */
function drawOxfordBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Shield shape
  ctx.save();
  ctx.translate(cx, cy);

  // Shield outline
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.45, -size * 0.35);
  ctx.lineTo(size * 0.45, size * 0.1);
  ctx.quadraticCurveTo(size * 0.45, size * 0.5, 0, size * 0.6);
  ctx.quadraticCurveTo(-size * 0.45, size * 0.5, -size * 0.45, size * 0.1);
  ctx.lineTo(-size * 0.45, -size * 0.35);
  ctx.closePath();

  // Fill with gradient
  const shieldGrad = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.6);
  shieldGrad.addColorStop(0, '#D97706');
  shieldGrad.addColorStop(1, '#92400E');
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Border
  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner cross
  ctx.strokeStyle = '#FEF3C7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.25);
  ctx.lineTo(0, size * 0.35);
  ctx.moveTo(-size * 0.25, size * 0.05);
  ctx.lineTo(size * 0.25, size * 0.05);
  ctx.stroke();

  ctx.restore();
}

/** Draw a momentum bar indicator. */
function drawMomentumBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  propScore: number,
  oppScore: number,
): void {
  const total = propScore + oppScore;
  if (total === 0) return;

  const propWidth = (propScore / total) * width;

  // Background
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();

  // Proposition side (blue)
  if (propWidth > 0) {
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, x, y, width, height, height / 2);
    ctx.clip();

    const propGrad = ctx.createLinearGradient(x, y, x + propWidth, y);
    propGrad.addColorStop(0, '#3B82F6');
    propGrad.addColorStop(1, '#6366F1');
    ctx.fillStyle = propGrad;
    ctx.fillRect(x, y, propWidth, height);
    ctx.restore();
  }

  // Opposition side (rose)
  const oppWidth = width - propWidth;
  if (oppWidth > 0) {
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, x, y, width, height, height / 2);
    ctx.clip();

    const oppGrad = ctx.createLinearGradient(x + propWidth, y, x + width, y);
    oppGrad.addColorStop(0, '#F43F5E');
    oppGrad.addColorStop(1, '#E11D48');
    ctx.fillStyle = oppGrad;
    ctx.fillRect(x + propWidth, y, oppWidth, height);
    ctx.restore();
  }

  // Labels
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  const centerY = y + height / 2;

  if (propWidth > 40) {
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`${propScore.toFixed(1)}`, x + 8, centerY);
  }

  if (oppWidth > 40) {
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${oppScore.toFixed(1)}`, x + width - 8, centerY);
  }
}

// ---------------------------------------------------------------------------
// Main card generation
// ---------------------------------------------------------------------------

function generateShareCardCanvas(debate: Debate): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // ── Background: dark gradient ──────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bgGrad.addColorStop(0, '#0F172A');   // slate-900
  bgGrad.addColorStop(0.4, '#1E1B3A'); // deep purple-dark
  bgGrad.addColorStop(0.7, '#1A1020'); // forge dark
  bgGrad.addColorStop(1, '#0C0A1A');   // near black
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Subtle grid/texture overlay
  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let x = 0; x < CARD_WIDTH; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_HEIGHT);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  for (let y = 0; y < CARD_HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  // Decorative glow spot
  ctx.save();
  const glowGrad = ctx.createRadialGradient(200, 150, 0, 200, 150, 350);
  glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
  glowGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.restore();

  // Second glow spot (bottom right)
  ctx.save();
  const glowGrad2 = ctx.createRadialGradient(1000, 500, 0, 1000, 500, 300);
  glowGrad2.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
  glowGrad2.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.restore();

  // ── Top-left branding ──────────────────────────────────────────────────
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('DebateForge', 48, 36);

  // Subtle tagline
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('AI-Powered Oxford Union Debate', 48, 62);

  // ── Oxford Union badge (top right) ────────────────────────────────────
  drawOxfordBadge(ctx, CARD_WIDTH - 70, 52, 36);
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('Oxford Union Format', CARD_WIDTH - 100, 46);

  // ── Divider ────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(48, 88);
  ctx.lineTo(CARD_WIDTH - 48, 88);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Motion / topic ─────────────────────────────────────────────────────
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const topicLines = wrapText(ctx, debate.topic, CARD_WIDTH - 96);
  const topicY = 104;
  for (let i = 0; i < Math.min(topicLines.length, 2); i++) {
    let line = topicLines[i];
    if (i === 1 && topicLines.length > 2) {
      line = line.replace(/\s+\S*$/, '') + '...';
    }
    ctx.fillText(line, 48, topicY + i * 36);
  }

  const afterTopicY = topicY + Math.min(topicLines.length, 2) * 36 + 16;

  // ── Proposition vs Opposition ──────────────────────────────────────────
  const propDebater = debate.debaters.find((d) => d.position === 'proposition');
  const oppDebater = debate.debaters.find((d) => d.position === 'opposition');

  const versusY = afterTopicY;

  // Proposition box
  const boxWidth = (CARD_WIDTH - 96 - 60) / 2; // 48px padding on each side, 60px gap
  const boxHeight = 56;
  const boxLeft = 48;
  const boxRight = 48 + boxWidth + 60;

  // Proposition rounded rect
  roundedRect(ctx, boxLeft, versusY, boxWidth, boxHeight, 12);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#60A5FA';
  ctx.textAlign = 'left';
  ctx.fillText('PROPOSITION', boxLeft + 16, versusY + 14);

  ctx.font = '15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const propLabel = propDebater
    ? `${propDebater.name} (${propDebater.model.displayName})`
    : 'Proposition';
  const propTruncated = ctx.measureText(propLabel).width > boxWidth - 32
    ? propLabel.slice(0, 30) + '...'
    : propLabel;
  ctx.fillText(propTruncated, boxLeft + 16, versusY + 36);

  // "VS" in the middle
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', boxLeft + boxWidth + 30, versusY + boxHeight / 2 + 6);

  // Opposition rounded rect
  roundedRect(ctx, boxRight, versusY, boxWidth, boxHeight, 12);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FB7185';
  ctx.textAlign = 'left';
  ctx.fillText('OPPOSITION', boxRight + 16, versusY + 14);

  ctx.font = '15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const oppLabel = oppDebater
    ? `${oppDebater.name} (${oppDebater.model.displayName})`
    : 'Opposition';
  const oppTruncated = ctx.measureText(oppLabel).width > boxWidth - 32
    ? oppLabel.slice(0, 30) + '...'
    : oppLabel;
  ctx.fillText(oppTruncated, boxRight + 16, versusY + 36);

  const afterVersusY = versusY + boxHeight + 20;

  // ── Verdict / Winner ───────────────────────────────────────────────────
  const scores: DebateScore[] = debate.scores ?? calculateScores(debate);
  const sorted = [...scores].sort(
    (a, b) => b.categories.overall - a.categories.overall,
  );

  let verdictText = 'Debate Concluded';
  let winnerName = '';
  let winnerColor = '#F59E0B';

  if (sorted.length >= 2) {
    const margin = sorted[0].categories.overall - sorted[1].categories.overall;
    winnerName = sorted[0].debaterName;

    // Determine the winner's role color
    const winnerDebater = debate.debaters.find(
      (d) => d.id === sorted[0].debaterId,
    );
    if (winnerDebater?.position === 'proposition') {
      winnerColor = '#60A5FA';
    } else if (winnerDebater?.position === 'opposition') {
      winnerColor = '#FB7185';
    }

    if (margin > 0.5) {
      verdictText = `Winner: ${winnerName}`;
    } else if (margin > 0) {
      verdictText = `Narrow Victory: ${winnerName}`;
    } else {
      verdictText = 'Result: Draw';
      winnerColor = '#F59E0B';
    }
  }

  // Verdict banner
  roundedRect(ctx, 48, afterVersusY, CARD_WIDTH - 96, 44, 10);
  ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Gavel emoji stand-in (text)
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('VERDICT', 68, afterVersusY + 22);

  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = winnerColor;
  ctx.textAlign = 'right';
  ctx.fillText(verdictText, CARD_WIDTH - 68, afterVersusY + 22);

  const afterVerdictY = afterVersusY + 44 + 16;

  // ── Best quote ─────────────────────────────────────────────────────────
  const bestQuote = getBestQuoteForCard(debate);

  if (bestQuote) {
    // Quote box
    roundedRect(ctx, 48, afterVerdictY, CARD_WIDTH - 96, 90, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fill();

    // Left accent bar
    roundedRect(ctx, 48, afterVerdictY, 4, 90, 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.fill();

    // Quote mark
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u201C', 64, afterVerdictY + 4);

    // Quote text
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const quoteLines = wrapText(ctx, bestQuote, CARD_WIDTH - 150);
    for (let i = 0; i < Math.min(quoteLines.length, 3); i++) {
      let line = quoteLines[i];
      if (i === 2 && quoteLines.length > 3) {
        line = line.replace(/\s+\S*$/, '') + '...\u201D';
      } else if (i === quoteLines.length - 1 || (i === 2 && quoteLines.length <= 3)) {
        line += '\u201D';
      }
      ctx.fillText(line, 88, afterVerdictY + 18 + i * 22);
    }
  }

  const afterQuoteY = bestQuote ? afterVerdictY + 90 + 12 : afterVerdictY;

  // ── Momentum / score bar ───────────────────────────────────────────────
  if (sorted.length >= 2) {
    const propScore = scores.find((s) => {
      const d = debate.debaters.find((db) => db.id === s.debaterId);
      return d?.position === 'proposition';
    })?.categories.overall ?? 5;

    const oppScore = scores.find((s) => {
      const d = debate.debaters.find((db) => db.id === s.debaterId);
      return d?.position === 'opposition';
    })?.categories.overall ?? 5;

    const barY = Math.min(afterQuoteY, CARD_HEIGHT - 80);

    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 48, barY);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#60A5FA';
    ctx.fillText('Proposition', 90, barY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FB7185';
    ctx.fillText('Opposition', CARD_WIDTH - 48, barY);

    drawMomentumBar(ctx, 48, barY + 16, CARD_WIDTH - 96, 18, propScore, oppScore);
  }

  // ── Bottom bar ─────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(48, CARD_HEIGHT - 44);
  ctx.lineTo(CARD_WIDTH - 48, CARD_HEIGHT - 44);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `Oxford Union Format  \u2022  ${debate.turns.length} turns  \u2022  ${new Date(debate.createdAt).toLocaleDateString()}`,
    48,
    CARD_HEIGHT - 20,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillText('Generated by DebateForge', CARD_WIDTH - 48, CARD_HEIGHT - 20);

  return canvas;
}

// ---------------------------------------------------------------------------
// Text summary generator
// ---------------------------------------------------------------------------

function generateTextSummary(debate: Debate): string {
  const propDebater = debate.debaters.find((d) => d.position === 'proposition');
  const oppDebater = debate.debaters.find((d) => d.position === 'opposition');
  const scores: DebateScore[] = debate.scores ?? calculateScores(debate);
  const sorted = [...scores].sort(
    (a, b) => b.categories.overall - a.categories.overall,
  );

  const lines: string[] = [];
  lines.push('=== DebateForge - Oxford Union Debate ===');
  lines.push('');
  lines.push(`Motion: ${debate.topic}`);
  lines.push('');

  if (propDebater) {
    lines.push(`Proposition: ${propDebater.name} (${propDebater.model.displayName})`);
  }
  if (oppDebater) {
    lines.push(`Opposition: ${oppDebater.name} (${oppDebater.model.displayName})`);
  }
  lines.push('');

  if (sorted.length >= 2) {
    lines.push('--- Scores ---');
    for (const score of sorted) {
      lines.push(
        `${score.debaterName}: ${score.categories.overall}/10 (Arg: ${score.categories.argumentation}, Evi: ${score.categories.evidence}, Reb: ${score.categories.rebuttal}, Rhet: ${score.categories.rhetoric})`,
      );
    }
    lines.push('');

    const margin = sorted[0].categories.overall - sorted[1].categories.overall;
    if (margin > 0.5) {
      lines.push(`Winner: ${sorted[0].debaterName} (by ${margin.toFixed(1)} points)`);
    } else if (margin > 0) {
      lines.push(`Narrow Winner: ${sorted[0].debaterName} (by ${margin.toFixed(1)} points)`);
    } else {
      lines.push('Result: Draw');
    }
  }

  lines.push('');
  const bestQuote = getBestQuoteForCard(debate);
  if (bestQuote) {
    lines.push(`Best Quote: "${bestQuote}"`);
  }

  lines.push('');
  lines.push(`Date: ${new Date(debate.createdAt).toLocaleDateString()}`);
  lines.push(`Turns: ${debate.turns.length}`);
  lines.push('');
  lines.push('Generated by DebateForge');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Share buttons component
// ---------------------------------------------------------------------------

interface ShareCardButtonsProps {
  debate: Debate;
}

export const ShareCardButtons: React.FC<ShareCardButtonsProps> = ({ debate }) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const handleDownloadCard = useCallback(async () => {
    setDownloadState('generating');
    try {
      // Small delay to let the UI update
      await new Promise((r) => setTimeout(r, 50));

      const canvas = generateShareCardCanvas(debate);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debateforge-${debate.id.slice(0, 8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (err) {
      console.error('[ShareCard] Failed to generate card:', err);
      setDownloadState('idle');
    }
  }, [debate]);

  const handleCopyText = useCallback(async () => {
    try {
      const summary = generateTextSummary(debate);
      await navigator.clipboard.writeText(summary);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.error('[ShareCard] Failed to copy text:', err);
    }
  }, [debate]);

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Download share card as PNG">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCard}
          loading={downloadState === 'generating'}
          icon={
            downloadState === 'done' ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )
          }
        >
          {downloadState === 'done' ? 'Saved!' : 'Share Card'}
        </Button>
      </Tooltip>

      <Tooltip content="Copy debate summary to clipboard">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyText}
          icon={
            copyState === 'copied' ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <FileText className="h-4 w-4" />
            )
          }
        >
          {copyState === 'copied' ? 'Copied!' : 'Copy Text'}
        </Button>
      </Tooltip>
    </div>
  );
};

export default ShareCardButtons;
