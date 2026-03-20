import React, { useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  showHex?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_PRESETS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#D97706', '#7C3AED', '#059669', '#DC2626',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  showHex = true,
  label,
  className,
}) => {
  const [customHex, setCustomHex] = useState(value);

  const handleHexChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      )}

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => { onChange(color); setCustomHex(color); }}
            className={clsx(
              'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
              value === color
                ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-forge-500/50 dark:ring-offset-surface-dark-1'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
            )}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <Check className="h-3.5 w-3.5 mx-auto text-white drop-shadow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Custom hex input */}
      {showHex && (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg border border-gray-300 dark:border-surface-dark-4 shrink-0"
            style={{ backgroundColor: value }}
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            maxLength={7}
            className="w-24 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-mono text-gray-900 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/20 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
