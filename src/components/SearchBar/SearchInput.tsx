import { Search } from 'lucide-react';
import React from 'react';
import { IconButton } from '../IconButton/IconButton';

/**
 * 移动端尺寸档位（三横杠按钮与搜索框共用，保证两者永远等高）：
 * - xs：按钮/输入框 24px（最紧凑，本站默认）
 * - sm：28px / md：36px / lg：40px
 */
export type SearchInputMobileHeight = 'xs' | 'sm' | 'md' | 'lg';

/** 移动端尺寸档位 → 输入框高度类名（sm 断点起解除固定高度，交给 py 撑开） */
const MOBILE_HEIGHT_CLASS: Record<SearchInputMobileHeight, string> = {
  xs: 'h-6 sm:h-auto',
  sm: 'h-7 sm:h-auto',
  md: 'h-9 sm:h-auto',
  lg: 'h-10 sm:h-auto',
};

/**
 * 移动端尺寸档位 → 内嵌搜索按钮尺寸档位。
 * 与同级的三横杠按钮使用**同一个档位**，宽度方向内缩 2px 视觉更透气。
 */
const MOBILE_SEARCH_BTN: Record<
  SearchInputMobileHeight,
  'xs' | 'sm' | 'md' | 'lg'
> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** 点击按钮 / 回车触发 */
  onSubmit?: () => void;
  placeholder?: string;
  /** 加载中：按钮显示 spinner 并禁用 */
  loading?: boolean;
  /** 紧凑态：滚动折叠时收窄内边距与按钮尺寸 */
  compact?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** 移动端输入框高度档位，默认 md（36px），需与三横杠按钮尺寸一致 */
  mobileHeight?: SearchInputMobileHeight;
}

/**
 * 搜索输入框本体（Desktop / Mobile 变体共用的内核）：
 * 居中文本的胶囊输入框 + 内嵌右侧搜索按钮。
 * 不含三横杠，外层的排布由 SearchBar 的变体负责。
 *
 * 移动端高度由 mobileHeight 参数决定（默认 md = 36px），
 * sm 断点起恢复为 py 撑开的舒展高度，不再受该参数影响。
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = '输入关键词搜索',
  loading = false,
  compact = false,
  onFocus,
  onBlur,
  mobileHeight = 'md',
}) => (
  <div className="relative min-w-0 flex-1">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit?.();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full rounded-full bg-black/5 text-center font-bold outline-none ring-[color:var(--accent)]/40 transition-[padding,font-size] duration-300 ease-out focus:ring-2 dark:bg-white/10 ${
        // 移动端高度由 mobileHeight 参数决定（与旁边三横杠按钮等高）；
        // sm 起解除固定高度，交回 py 撑开的舒展高度
        MOBILE_HEIGHT_CLASS[mobileHeight]
      } ${compact ? 'pl-4 pr-12 sm:py-1.5' : 'pl-5 pr-12 sm:py-3.5 sm:pr-14 sm:text-base'}`}
    />
    {/* 内嵌右侧搜索按钮：与同级的三横杠同档位；加载中显示 spinner；sm 起固定 40px */}
    <IconButton
      label="搜索"
      variant="accent"
      size={MOBILE_SEARCH_BTN[mobileHeight]}
      absolute
      disabled={loading}
      onClick={onSubmit}
      className={compact ? '' : 'sm:h-10 sm:w-10'}
      icon={
        loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white sm:h-4 sm:w-4" />
        ) : (
          <Search size={compact ? 13 : 14} className="sm:h-[18px] sm:w-[18px]" />
        )
      }
    />
  </div>
);

export default SearchInput;
