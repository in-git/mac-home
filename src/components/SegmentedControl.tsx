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
  size?: 'sm' | 'md' | 'mini';
  /** 占满父容器宽度，各分段平均分配。 */
  fullWidth?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<'sm' | 'md' | 'mini', string> = {
  sm: 'text-xs px-2.5 py-1',
  md: 'text-xs px-3 py-1',
  mini: 'text-xs px-0 py-0',
};

/** macOS 风格的分段选择器（滑动高亮块 + 选中项高亮）。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative flex p-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* 滑动高亮块：随选中项平移，过渡产生切换动画 */}
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 rounded-[var(--card-radius)] bg-white dark:bg-[#3A3A3C] shadow-xs transition-transform duration-200 ease-out pointer-events-none"
        style={{
          width: `calc(${100 / options.length}% - 0.25rem)`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />

      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 flex-1 transition-colors font-medium rounded-[var(--card-radius)] ${SIZE_CLASS[size]} ${
              active
                ? 'text-[color:var(--accent)] dark:text-white'
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
