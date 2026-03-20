import React from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  variant?: 'default' | 'glass' | 'gradient' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'border border-gray-200 bg-white shadow-sm dark:border-surface-dark-3 dark:bg-surface-dark-1',
  glass: 'border border-gray-200/60 bg-white/80 backdrop-blur-xl shadow-sm dark:border-surface-dark-3/60 dark:bg-surface-dark-1/80',
  gradient: 'border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm dark:border-surface-dark-3 dark:from-surface-dark-1 dark:to-surface-dark-2',
  outlined: 'border-2 border-dashed border-gray-300 bg-transparent dark:border-surface-dark-4',
};

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hover = false,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'rounded-xl',
        variantStyles[variant],
        paddingStyles[padding],
        hover &&
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-forge-300 dark:hover:border-forge-700',
        onClick && 'cursor-pointer text-left w-full',
        className,
      )}
      style={style}
    >
      {children}
    </Component>
  );
};

export default Card;
