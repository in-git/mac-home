import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** 可选：禁用该项。 */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 可选：无障碍标签。 */
  ariaLabel?: string;
  /** 尺寸档位，控制内边距与字号。默认 md。 */
  size?: 'sm' | 'md';
  /** 占满父容器宽度，各分段平均分配。 */
  fullWidth?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<'sm' | 'md', string> = {
  sm: 'text-xs px-2.5 py-1',
  md: 'text-xs px-3 py-1',
};

/** macOS 风格的分段选择器（胶囊容器 + 选中项高亮）。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex p-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 transition-colors font-medium rounded-[var(--card-radius)] ${SIZE_CLASS[size]} ${
              active
                ? 'bg-white dark:bg-[#3A3A3C] text-[color:var(--accent)] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
