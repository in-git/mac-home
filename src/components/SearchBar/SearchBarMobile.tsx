import { Menu } from 'lucide-react';
import React from 'react';
import { IconButton } from '../IconButton/IconButton';
import { SearchInput } from './SearchInput';

interface SearchBarMobileProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  compact?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** 三横杠：打开全屏菜单抽屉 */
  onOpenMenu: () => void;
}

/**
 * 移动端搜索行：三横杠 + 搜索框同排，占满整行宽度。
 * 桌面端不渲染（sm 起隐藏）。
 */
export const SearchBarMobile: React.FC<SearchBarMobileProps> = ({
  onOpenMenu,
  ...searchProps
}) => (
  <div className="flex items-center gap-2 sm:hidden">
    <IconButton label="打开菜单" onClick={onOpenMenu} icon={<Menu size={20} />} />
    <SearchInput {...searchProps} />
  </div>
);

export default SearchBarMobile;
