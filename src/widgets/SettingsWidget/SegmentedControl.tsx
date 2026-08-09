import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 可选：无障碍标签 */
  ariaLabel?: string;
  className?: string;
}

/** macOS 风格的分段选择器（胶囊容器 + 选中项高亮）。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex p-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-[var(--card-radius)] text-xs transition-colors font-medium ${
              active
                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
