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
 * 桌面端搜索行：仅搜索框，整体居中。
 * 移动端专属元素（三横杠等）不在此组件内。
 *
 * 宽度按断点分档，越宽屏越收窄：`w-1/2` 在窄桌面尚可，
 * 到 xl / 2xl 会被拉成很长的横条，视觉上压过下方的分类与卡片。
 * 因此用固定上限约束，屏幕越宽占比越小、绝对宽度基本封顶。
 */
export const SearchBarDesktop: React.FC<SearchBarDesktopProps> = (props) => (
  <div className="mx-auto hidden w-1/2 items-center sm:flex xl:w-[38%] 2xl:w-[30%]">
    <SearchInput {...props} />
  </div>
);

export default SearchBarDesktop;
