import React from 'react';
import { SearchBarDesktop } from './SearchBarDesktop';
import { SearchBarMobile } from './SearchBarMobile';
import { SearchInputMobileHeight } from './SearchInput';

export { SearchInput } from './SearchInput';
export type { SearchInputMobileHeight } from './SearchInput';
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
   * 移动端尺寸档位，默认 md（搜索框 36px）。
   * 只影响移动端；桌面端搜索框保持原尺寸。
   * 可选 xs / sm / md / lg，对应 24 / 28 / 36 / 40px。
   */
  mobileSize?: SearchInputMobileHeight;
}

/**
 * 通用搜索栏：移动端与桌面端**两套独立布局**，各自成组件，互不干扰。
 *
 * - 移动端（< sm）：搜索框占满整行
 * - 桌面端（≥ sm）：容器一半宽且整体居中
 *
 * 两者都渲染，靠各自的 `sm:hidden` / `hidden sm:flex` 互斥显示。
 * 注意移动端那套**不能**做成「传了某个 prop 才渲染」——
 * 早期它依赖 `onOpenMenu` 是否存在来决定渲染，抽屉移除后该 prop 消失，
 * 移动端就会完全没有搜索框（桌面端那套在移动端是 hidden）。
 *
 * 文本统一居中加粗，不提供对齐配置；输入框本体（SearchInput）为两者共用内核。
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  mobileSize = 'md',
  ...searchProps
}) => (
  <>
    <SearchBarMobile size={mobileSize} {...searchProps} />
    <SearchBarDesktop {...searchProps} />
  </>
);

export default SearchBar;
