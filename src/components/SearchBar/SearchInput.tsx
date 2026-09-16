import { Search } from 'lucide-react';
import React from 'react';
import { IconButton } from '../IconButton/IconButton';

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
}

/**
 * 搜索输入框本体（Desktop / Mobile 变体共用的内核）：
 * 居中文本的胶囊输入框 + 内嵌右侧搜索按钮。
 * 不含三横杠，外层的排布由 SearchBar 的变体负责。
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
        compact ? 'py-1.5 pl-4 pr-12' : 'py-3.5 pl-5 pr-14 text-base'
      }`}
    />
    {/* 内嵌右侧搜索按钮：加载中显示 spinner */}
    <IconButton
      label="搜索"
      variant="accent"
      size={compact ? 'sm' : 'lg'}
      absolute
      disabled={loading}
      onClick={onSubmit}
      icon={
        loading ? (
          <span
            className={`animate-spin rounded-full border-2 border-white/40 border-t-white ${
              compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
            }`}
          />
        ) : (
          <Search size={compact ? 15 : 18} />
        )
      }
    />
  </div>
);

export default SearchInput;
