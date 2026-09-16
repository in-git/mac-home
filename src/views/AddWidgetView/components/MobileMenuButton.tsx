import { Menu } from 'lucide-react';
import React from 'react';
import { IconButton, IconButtonSize } from '@/components/IconButton/IconButton';

interface MobileMenuButtonProps {
  onClick: () => void;
  /** 不可交互时置为 true（例如折叠动画期间），避免聚焦到隐藏元素 */
  disabled?: boolean;
  /** 尺寸档位，默认 md（36px），与 SearchBar 的移动端三横杠保持一致 */
  size?: IconButtonSize;
  className?: string;
}

/** 尺寸档位 → 图标尺寸（px） */
const ICON_SIZE: Record<IconButtonSize, number> = {
  xs: 14,
  sm: 15,
  md: 18,
  lg: 20,
  'sm-lg': 15,
};

/**
 * 移动端三横杠按钮：打开全屏菜单抽屉。
 * 供「我的」页的独立顶栏使用（「网页」「视频」页的三横杠已并入 SearchBar）。
 */
export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  onClick,
  disabled,
  size = 'md',
  className = '',
}) => (
  <IconButton
    label="打开菜单"
    size={size}
    onClick={onClick}
    disabled={disabled}
    tabIndex={disabled ? -1 : undefined}
    icon={<Menu size={ICON_SIZE[size]} />}
    className={className}
  />
);

export default MobileMenuButton;
