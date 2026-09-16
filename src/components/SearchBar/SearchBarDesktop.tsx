import React from 'react';
import { SearchInput } from './SearchInput';

interface SearchBarDesktopProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  compact?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * 桌面端搜索行：仅搜索框，整体居中且宽度为容器的一半。
 * 移动端专属元素（三横杠等）不在此组件内。
 */
export const SearchBarDesktop: React.FC<SearchBarDesktopProps> = (props) => (
  <div className="mx-auto hidden w-1/2 items-center sm:flex">
    <SearchInput {...props} />
  </div>
);

export default SearchBarDesktop;
