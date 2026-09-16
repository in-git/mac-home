import { Menu } from 'lucide-react';
import React from 'react';
import { IconButton } from '../IconButton/IconButton';
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
  /** 三横杠：打开全屏菜单抽屉 */
  onOpenMenu: () => void;
  /**
   * 移动端尺寸档位，默认 md（三横杠 36px 与搜索框同高）。
   * 同一档位同时驱动三横杠与输入框，保证两者始终等高。
   */
  size?: SearchInputMobileHeight;
}

/** 尺寸档位 → 三横杠图标尺寸（px），按钮越小图标越小 */
const MENU_ICON_SIZE: Record<SearchInputMobileHeight, number> = {
  xs: 14,
  sm: 15,
  md: 18,
  lg: 20,
};

/**
 * 移动端搜索行：三横杠 + 搜索框同排，占满整行宽度。
 * 桌面端不渲染（sm 起隐藏）。
 *
 * 三横杠与搜索框的高度由同一个 size 参数驱动，天然等高。
 */
export const SearchBarMobile: React.FC<SearchBarMobileProps> = ({
  onOpenMenu,
  size = 'md',
  ...searchProps
}) => (
  <div className="flex items-center gap-2 sm:hidden">
    <IconButton
      label="打开菜单"
      size={size}
      onClick={onOpenMenu}
      icon={<Menu size={MENU_ICON_SIZE[size]} />}
    />
    <SearchInput {...searchProps} mobileHeight={size} />
  </div>
);

export default SearchBarMobile;
