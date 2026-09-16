import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xs-md';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 视觉风格：
   * - primary 强调色实心 / secondary 玻璃质感 / ghost 无底色纯文字
   * - pill 胶囊标签：选中态为强调色实心，未选中为浅底
   *   （用于排序、分类这类「标签组」按钮）
   */
  variant?: ButtonVariant;
  /** 尺寸档位，控制内边距与字号。 */
  size?: ButtonSize;
  /**
   * 胶囊标签的选中态（仅 variant="pill" 生效）。
   * 未选中为浅底，选中为强调色实心。
   */
  active?: boolean;
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
  sm: 'h-8 px-3  gap-1.5',
  md: 'h-9 px-3.5 text-md gap-1.5',
  lg: 'h-11 px-5 text-[15px] gap-2',
  /** 移动端 24px、sm 断点起 36px（标签组按钮的响应式档位） */
  'xs-md': 'h-6 px-2 text-sm sm:h-9 sm:px-3 sm:text-md gap-1.5',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  'xs-md': 'h-6 w-6 sm:h-9 sm:w-9',
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-500 text-white hover:brightness-110 active:brightness-95 shadow-sm',
  secondary:
    'bg-black/5 hover:bg-black/10 dark:bg-white/10  dark:hover:bg-white/15',
  ghost: 'bg-transparent  hover:bg-black/5  dark:hover:bg-white/10',
  // 选中 / 未选中两态由 active 决定，见下方 PILL_ACTIVE / PILL_IDLE
  pill: '',
};

/** 胶囊标签：选中态（强调色实心） */
const PILL_ACTIVE = 'bg-blue-500 text-white';
/** 胶囊标签：未选中态（浅底 + 悬停加深） */
const PILL_IDLE =
  'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20';

/** 基于应用库图标的旋转 spinner。 */
function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

/**
 * Apple 风格通用按钮，覆盖项目内所有可点击的文字/标签按钮。
 * - 统一的圆角（var(--card-radius)）、按压缩放反馈与 hover 过渡。
 * - 内置 loading 态（禁用 + spinner）。
 * - 支持 iconOnly 纯图标模式，用于工具栏。
 * - 支持 pill 胶囊标签模式（配合 active 表达选中态）。
 *
 * 尺寸建议：标签组（排序 / 分类）用 size="xs-md"，
 * 即移动端 24px、sm 断点起 36px。
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  active = false,
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
  const isPill = variant === 'pill';

  return (
    <button
      {...rest}
      onClick={loading ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      // 胶囊标签用 aria-pressed 表达选中态，便于无障碍识别
      aria-pressed={isPill ? active : rest['aria-pressed']}
      className={[
        'inline-flex items-center justify-center rounded-md ',
        'transition-[transform,background-color,filter,box-shadow,padding,font-size] duration-150 select-none',
        // 胶囊标签在标签组里空间紧张，不要缩放位移，避免横向抖动
        isPill ? '' : 'hover:scale-[1.03] active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 ring-[color:var(--accent)]/50',
        'disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100',
        isPill ? (active ? PILL_ACTIVE : PILL_IDLE) : VARIANT_CLASS[variant],
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
