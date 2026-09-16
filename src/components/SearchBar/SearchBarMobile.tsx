import React from 'react';
import { SearchInput, SearchInputMobileHeight } from './SearchInput';

interface SearchBarMobileProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  compact?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /**
   * 移动端尺寸档位，默认 md（输入框 36px）。
   * 原先需与三横杠按钮等高，三横杠移除后仅决定输入框自身高度。
   */
  size?: SearchInputMobileHeight;
}

/**
 * 移动端搜索行：仅搜索框，占满整行宽度。桌面端不渲染（sm 起隐藏）。
 *
 * 原本这里是「三横杠 + 搜索框」同排；三横杠用于打开全屏菜单抽屉，
 * 抽屉移除后（移动端导航改由底部 tabbar 承担）这一行只留搜索框。
 */
export const SearchBarMobile: React.FC<SearchBarMobileProps> = ({
  size = 'md',
  ...searchProps
}) => (
  <div className="sm:hidden">
    <SearchInput {...searchProps} mobileHeight={size} />
  </div>
);

export default SearchBarMobile;
