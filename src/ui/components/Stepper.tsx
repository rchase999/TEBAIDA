import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface StepperProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={clsx('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                    ? 'border-forge-500 bg-forge-50 text-forge-600 dark:bg-forge-900/20 dark:text-forge-400'
                    : 'border-gray-300 bg-white text-gray-400 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-500',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={clsx(
                  'mt-1.5 text-xs font-medium',
                  isCurrent ? 'text-forge-600 dark:text-forge-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{step.description}</span>
              )}
            </div>
            {!isLast && (
              <div
                className={clsx(
                  'mx-2 h-0.5 flex-1 rounded-full transition-all duration-500',
                  isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-surface-dark-3',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
