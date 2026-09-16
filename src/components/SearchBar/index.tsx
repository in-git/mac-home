import React from 'react';
import { SearchBarDesktop } from './SearchBarDesktop';
import { SearchBarMobile } from './SearchBarMobile';

export { SearchInput } from './SearchInput';
export { SearchBarDesktop } from './SearchBarDesktop';
export { SearchBarMobile } from './SearchBarMobile';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  /** 紧凑态：滚动折叠时收窄内边距与按钮尺寸 */
  compact?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /**
   * 移动端三横杠回调；**不传则移动端不渲染三横杠**
   * （用于「我的」等页面，三横杠由父级单独提供）。
   */
  onOpenMenu?: () => void;
}

/**
 * 通用搜索栏：移动端与桌面端**两套独立布局**，各自成组件，互不干扰。
 *
 * - 移动端（< sm）：三横杠 + 搜索框同排，占满整行
 * - 桌面端（≥ sm）：仅搜索框，容器一半宽且整体居中
 *
 * 文本统一居中加粗，不提供对齐配置；输入框本体（SearchInput）为两者共用内核。
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  onOpenMenu,
  ...searchProps
}) => (
  <>
    {onOpenMenu && (
      <SearchBarMobile onOpenMenu={onOpenMenu} {...searchProps} />
    )}
    <SearchBarDesktop {...searchProps} />
  </>
);

export default SearchBar;
