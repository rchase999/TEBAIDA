import React from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, hover = false }) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        'dark:border-surface-dark-3 dark:bg-surface-dark-1',
        hover &&
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-forge-300 dark:hover:border-forge-700',
        onClick && 'cursor-pointer text-left w-full',
        className,
      )}
    >
      {children}
    </Component>
  );
};

export default Card;
