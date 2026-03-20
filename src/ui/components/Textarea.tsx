import React, { useId, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxChars?: number;
  autoResize?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, showCount, maxChars, autoResize = false, className, id: externalId, value, ...rest }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const charCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxChars ? charCount > maxChars : false;

    const resize = useCallback(() => {
      const el = textareaRef.current;
      if (el && autoResize) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [autoResize, textareaRef]);

    useEffect(() => {
      resize();
    }, [value, resize]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          aria-invalid={!!error || isOverLimit}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={clsx(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors duration-150',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500',
            'resize-y min-h-[80px]',
            error || isOverLimit
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500'
              : 'border-gray-300 focus:border-forge-500 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:focus:border-forge-500',
            autoResize && 'resize-none overflow-hidden',
            className,
          )}
          onInput={autoResize ? resize : undefined}
          {...rest}
        />

        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id={`${id}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            )}
          </div>
          {showCount && (
            <p className={clsx(
              'text-xs tabular-nums',
              isOverLimit ? 'text-red-500' : 'text-gray-400 dark:text-gray-500',
            )}>
              {charCount}{maxChars ? `/${maxChars}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
