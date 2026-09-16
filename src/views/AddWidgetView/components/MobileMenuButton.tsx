import { Menu } from 'lucide-react';
import React from 'react';
import { IconButton } from '@/components/IconButton/IconButton';

interface MobileMenuButtonProps {
  onClick: () => void;
  /** 不可交互时置为 true（例如折叠动画期间），避免聚焦到隐藏元素 */
  disabled?: boolean;
  className?: string;
}

/**
 * 移动端三横杠按钮：打开全屏菜单抽屉。
 * 供「我的」页的独立顶栏使用（「网页」「视频」页的三横杠已并入 SearchBar）。
 */
export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  onClick,
  disabled,
  className = '',
}) => (
  <IconButton
    label="打开菜单"
    onClick={onClick}
    disabled={disabled}
    tabIndex={disabled ? -1 : undefined}
    icon={<Menu size={20} />}
    className={className}
  />
);

export default MobileMenuButton;
