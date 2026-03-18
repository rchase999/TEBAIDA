import React from 'react';
import clsx from 'clsx';

export interface TypingIndicatorProps {
  name?: string;
  color?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  name,
  color,
  className,
}) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: color ?? '#4c6ef5',
              animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      {name && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium" style={{ color: color ?? undefined }}>
            {name}
          </span>{' '}
          is thinking...
        </span>
      )}

      {/* Inline keyframes - only rendered once */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
