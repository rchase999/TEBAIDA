import React from 'react';
import clsx from 'clsx';

export interface ModelProviderBadgeProps {
  provider: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const PROVIDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  anthropic: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Anthropic' },
  openai: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'OpenAI' },
  google: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Google' },
  mistral: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Mistral' },
  groq: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', label: 'Groq' },
  ollama: { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400', label: 'Ollama' },
  lmstudio: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', label: 'LM Studio' },
};

const sizeStyles: Record<NonNullable<ModelProviderBadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[11px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export const ModelProviderBadge: React.FC<ModelProviderBadgeProps> = ({
  provider,
  size = 'sm',
  className,
}) => {
  const style = PROVIDER_STYLES[provider] ?? { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-400', label: provider };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold leading-none',
        style.bg,
        style.text,
        sizeStyles[size],
        className,
      )}
    >
      {style.label}
    </span>
  );
};

export default ModelProviderBadge;
