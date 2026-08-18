import { useLayoutEffect, useRef, useState } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  /** 仅允许纯文本，禁止传入 DOM。 */
  label: string;
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
  className = '',
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );

  // 精确测量当前选中按钮的位置与宽度，避免高亮块与按钮错位
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const btn = btnRefs.current[activeIndex];
    if (btn) {
      setHighlight({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [activeIndex, options]);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-flex p-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 w-fit ${className}`}
    >
      {/* 滑动高亮块：精确跟随选中按钮的位置与宽度 */}
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 rounded-[var(--card-radius)] bg-white dark:bg-[#3A3A3C] shadow-xs transition-all duration-200 ease-out pointer-events-none"
        style={{ left: highlight.left, width: highlight.width }}
      />

      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 shrink-0 whitespace-nowrap transition-colors  rounded-[var(--card-radius)] ${SIZE_CLASS[size]} ${
              active
                ? 'text-[color:var(--accent)] dark:text-white'
                : ' hover:text-slate-700 dark:hover:text-slate-200'
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
