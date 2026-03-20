import React from 'react';
import clsx from 'clsx';
import { Cpu, Zap, Clock, DollarSign, MessageSquare } from 'lucide-react';
import { ModelProviderBadge } from './ModelProviderBadge';

export interface ModelInfo {
  name: string;
  displayName: string;
  provider: string;
  description: string;
  strengths: string[];
  maxTokens: number;
  speed: 'fast' | 'medium' | 'slow';
  costTier: 'free' | 'low' | 'medium' | 'high';
  bestFor: string;
}

export const MODEL_INFO_DATABASE: Record<string, ModelInfo> = {
  'claude-opus-4-20250514': {
    name: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    provider: 'anthropic',
    description: 'Most capable Claude model with deep reasoning and extended thinking.',
    strengths: ['Deep analysis', 'Nuanced arguments', 'Extended thinking'],
    maxTokens: 8192,
    speed: 'slow',
    costTier: 'high',
    bestFor: 'Complex philosophical debates requiring deep reasoning',
  },
  'claude-sonnet-4-20250514': {
    name: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Balanced performance with strong reasoning and fast responses.',
    strengths: ['Balanced quality', 'Good speed', 'Strong evidence use'],
    maxTokens: 8192,
    speed: 'medium',
    costTier: 'medium',
    bestFor: 'Most debate formats - great all-rounder',
  },
  'gpt-4o': {
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s flagship multimodal model with broad knowledge.',
    strengths: ['Broad knowledge', 'Creative arguments', 'Fast responses'],
    maxTokens: 4096,
    speed: 'fast',
    costTier: 'medium',
    bestFor: 'Fast-paced debates with diverse topics',
  },
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Google\'s most capable model with strong analytical abilities.',
    strengths: ['Data analysis', 'Technical depth', 'Long context'],
    maxTokens: 8192,
    speed: 'medium',
    costTier: 'medium',
    bestFor: 'Data-heavy topics and technical debates',
  },
};

export interface ModelInfoCardProps {
  modelId: string;
  className?: string;
}

const SPEED_LABELS: Record<string, { label: string; color: string }> = {
  fast: { label: 'Fast', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  slow: { label: 'Slow', color: 'text-red-600 dark:text-red-400' },
};

const COST_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-emerald-600 dark:text-emerald-400' },
  low: { label: '$', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: '$$', color: 'text-amber-600 dark:text-amber-400' },
  high: { label: '$$$', color: 'text-red-600 dark:text-red-400' },
};

export const ModelInfoCard: React.FC<ModelInfoCardProps> = ({ modelId, className }) => {
  const info = MODEL_INFO_DATABASE[modelId];
  if (!info) return null;

  const speed = SPEED_LABELS[info.speed];
  const cost = COST_LABELS[info.costTier];

  return (
    <div className={clsx(
      'rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2',
      'dark:border-surface-dark-3 dark:bg-surface-dark-2',
      className,
    )}>
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-forge-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{info.displayName}</span>
        <ModelProviderBadge provider={info.provider} size="xs" />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{info.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-gray-400" />
          <span className={speed.color}>{speed.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-gray-400" />
          <span className={cost.color}>{cost.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400">{(info.maxTokens / 1000).toFixed(0)}K tokens</span>
        </div>
      </div>

      {/* Strengths */}
      <div className="flex flex-wrap gap-1">
        {info.strengths.map((s) => (
          <span key={s} className="rounded-full bg-forge-100 px-2 py-0.5 text-[9px] font-medium text-forge-700 dark:bg-forge-900/30 dark:text-forge-400">
            {s}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
        Best for: {info.bestFor}
      </p>
    </div>
  );
};

export default ModelInfoCard;
