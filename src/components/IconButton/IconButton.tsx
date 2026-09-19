import React from 'react';

/** 视觉风格：soft 浅灰底（默认）/ accent 强调色实心 / ghost 无底色 */
export type IconButtonVariant = 'soft' | 'accent' | 'ghost';
/**
 * 尺寸档位：
 * - xs 24px / sm 28px / md 36px / lg 40px
 * - sm-lg 移动端 28px、sm 断点起 40px（用于需要随屏幕放大的按钮）
 */
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'sm-lg';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 无障碍标签，纯图标按钮必填 */
  label: string;
  /** 图标内容（通常传 lucide 图标） */
  icon: React.ReactNode;
  /**
   * 圆形按钮的视觉风格，默认 soft。
   * - soft：浅灰底 + 次级文本色（用于菜单等工具栏按钮）
   * - accent：强调色实心 + 白字（用于主操作，如搜索）
   * - ghost：无底色，仅 hover 时出现浅底
   */
  variant?: IconButtonVariant;
  /** 尺寸档位，默认 md（36px） */
  size?: IconButtonSize;
  /** 是否绝对定位于父容器（需父级 relative），默认 false */
  absolute?: boolean;
}

const SIZE_CLASS: Record<IconButtonSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
  'sm-lg': 'h-7 w-7 sm:h-10 sm:w-10',
};

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  soft: 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20',
  accent: 'bg-blue-500 text-white hover:brightness-110',
  ghost:
    'bg-transparent text-slate-500 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10',
};

/**
 * 通用圆形图标按钮：三横杠、搜索、关闭等纯图标操作统一走这里。
 * - 正方形容器 + 全圆角
 * - 可选的绝对定位（用于输入框内嵌按钮等场景）
 * - 默认带按压缩放与颜色过渡
 */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  icon,
  variant = 'soft',
  size = 'md',
  absolute = false,
  className = '',
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled}
    aria-label={label}
    title={rest.title ?? label}
    className={[
      'flex shrink-0 items-center justify-center rounded-full',
      'cursor-pointer',
      'transition-[background-color,color,filter,transform,width,height] duration-200 ease-out',
      'active:scale-95 disabled:opacity-60 disabled:pointer-events-none',
      SIZE_CLASS[size],
      VARIANT_CLASS[variant],
      absolute ? 'absolute right-1.5 top-1/2 -translate-y-1/2' : '',
      className,
    ].join(' ')}
  >
    {icon}
  </button>
);

export default IconButton;
