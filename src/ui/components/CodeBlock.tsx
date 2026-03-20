import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Copy, Check } from 'lucide-react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  showCopy = true,
  showLineNumbers = false,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const lines = code.split('\n');

  return (
    <div className={clsx('group relative rounded-xl border border-gray-200 bg-gray-50 dark:border-surface-dark-3 dark:bg-surface-dark-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-surface-dark-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {language}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className={clsx(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all',
              copied
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
            )}
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5" /> Copied</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy</>
            )}
          </button>
        )}
      </div>

      {/* Code */}
      <div className="overflow-x-auto p-4">
        <pre className="text-sm leading-relaxed">
          <code className="font-mono text-gray-800 dark:text-gray-200">
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 inline-block w-8 shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500 select-none">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
