import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface StepDef {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  return (
    <>
      {/* Desktop: Horizontal */}
      <div
        className={clsx('hidden sm:flex items-start', className)}
        role="list"
        aria-label="Progress steps"
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <React.Fragment key={`step-${index}`}>
              <div
                className="flex flex-col items-center"
                role="listitem"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <button
                  type="button"
                  onClick={isClickable ? () => onStepClick(index) : undefined}
                  disabled={!isClickable}
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    'transition-all duration-300 motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forge-500',
                    'dark:focus-visible:ring-offset-surface-dark-0',
                    isCompleted &&
                      'border-emerald-500 bg-emerald-500 text-white shadow-sm',
                    isCompleted && isClickable && 'cursor-pointer hover:bg-emerald-600 hover:border-emerald-600',
                    isCurrent &&
                      'border-forge-500 bg-forge-50 text-forge-600 shadow-glow dark:bg-forge-900/20 dark:text-forge-400 dark:border-forge-400',
                    isUpcoming &&
                      'border-gray-300 bg-white text-gray-400 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-500 cursor-default',
                  )}
                  aria-label={`Step ${index + 1}: ${step.label}${
                    isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </button>

                <div className="mt-2 flex flex-col items-center text-center">
                  <span
                    className={clsx(
                      'text-xs font-medium',
                      'transition-colors duration-200',
                      isCompleted && 'text-emerald-600 dark:text-emerald-400',
                      isCurrent && 'text-forge-600 dark:text-forge-400',
                      isUpcoming && 'text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span
                      className={clsx(
                        'mt-0.5 text-[11px] max-w-[120px]',
                        isUpcoming
                          ? 'text-gray-300 dark:text-gray-600'
                          : 'text-gray-400 dark:text-gray-500',
                      )}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="mt-5 mx-2 flex-1 min-w-[40px]">
                  <div
                    className={clsx(
                      'h-0.5 w-full rounded-full transition-all duration-500 motion-reduce:transition-none',
                      isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-gray-200 dark:bg-surface-dark-3',
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: Vertical */}
      <div
        className={clsx('flex sm:hidden flex-col', className)}
        role="list"
        aria-label="Progress steps"
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <div
              key={`step-mobile-${index}`}
              className="flex"
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Left column: indicator + line */}
              <div className="flex flex-col items-center mr-3">
                <button
                  type="button"
                  onClick={isClickable ? () => onStepClick(index) : undefined}
                  disabled={!isClickable}
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    'transition-all duration-300 motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                    isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                    isCompleted && isClickable && 'cursor-pointer hover:bg-emerald-600',
                    isCurrent && 'border-forge-500 bg-forge-50 text-forge-600 dark:bg-forge-900/20 dark:text-forge-400',
                    isUpcoming && 'border-gray-300 bg-white text-gray-400 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-500 cursor-default',
                  )}
                  aria-label={`Step ${index + 1}: ${step.label}`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </button>

                {!isLast && (
                  <div
                    className={clsx(
                      'w-0.5 flex-1 min-h-[24px] rounded-full transition-all duration-500 motion-reduce:transition-none',
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-surface-dark-3',
                    )}
                  />
                )}
              </div>

              {/* Right column: label + description */}
              <div className={clsx('pb-6', isLast && 'pb-0')}>
                <span
                  className={clsx(
                    'text-sm font-medium leading-8',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400',
                    isCurrent && 'text-forge-600 dark:text-forge-400',
                    isUpcoming && 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <p
                    className={clsx(
                      'text-xs mt-0.5',
                      isUpcoming
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Stepper;
