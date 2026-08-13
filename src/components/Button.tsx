import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉风格：primary 强调色实心 / secondary 玻璃质感 / ghost 无底色纯文字。 */
  variant?: ButtonVariant;
  /** 尺寸档位，控制内边距与字号。 */
  size?: ButtonSize;
  /**
   * 纯 icon 模式：隐藏 children 文本，按钮呈正方形，适合工具栏 icon 按钮。
   * 开启时仍建议传入 aria-label 以保证可访问性。
   */
  iconOnly?: boolean;
  /** 加载态：禁用交互、显示旋转 spinner，并保留 icon 位置。 */
  loading?: boolean;
  /** 加载/常规时显示在文本左侧的图标。 */
  icon?: React.ReactNode;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-1.5',
  lg: 'h-11 px-5 text-[15px] gap-2',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--accent)] text-white hover:brightness-110 active:brightness-95 shadow-sm',
  secondary:
    'bg-black/5 text-slate-700 hover:bg-black/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15',
  ghost:
    'bg-transparent text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10',
};

/** 内置轻量旋转 spinner，避免外部图标库依赖。 */
function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Apple 风格通用按钮。
 * - 统一的圆角（var(--card-radius)）、按压缩放反馈与 hover 过渡。
 * - 内置 loading 态（禁用 + spinner）。
 * - 支持 iconOnly 纯图标模式，用于工具栏。
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      onClick={loading ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center rounded-[var(--card-radius)] font-medium',
        'transition-[transform,background-color,filter,box-shadow] duration-150 select-none',
        'hover:scale-[1.03] active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 ring-[color:var(--accent)]/50',
        'disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100',
        VARIANT_CLASS[variant],
        iconOnly ? ICON_ONLY_SIZE[size] : SIZE_CLASS[size],
        className,
      ].join(' ')}
    >
      {loading ? (
        <Spinner className="shrink-0" />
      ) : (
        icon && <span className="shrink-0 inline-flex">{icon}</span>
      )}
      {!iconOnly && children && (
        <span className="truncate">{children}</span>
      )}
    </button>
  );
};

export default Button;
