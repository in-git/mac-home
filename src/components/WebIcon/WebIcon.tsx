import React from 'react';

type WebIconProps = {
  size?: number | string;
  className?: string;
  /** 激活态：外框填充主题色（currentColor）、内部圆点白色；未激活则为灰色空心描边 */
  filled?: boolean;
  strokeWidth?: number;
};

/**
 * 网页/App 分类图标：苹果 App Store 风格（圆角方框 + 内部四宫格圆点）。
 *
 * - 未激活：灰色空心方框（仅描边），内部圆点同为灰色；
 * - 激活（filled）：方框填充 currentColor（主题色）、四颗圆点用白色绘制，
 *   因此「实心 + 图形清晰」可同时成立，不会出现填充后整块同色糊掉的情况。
 *
 * 之所以不复用 lucide：lucide 为单色描边，填充后内部图形会被同色覆盖，
 * 无法做到「实心且细节可见」，故此处用自带双调填充的双色 SVG。
 */
export const WebIcon: React.FC<WebIconProps> = ({
  size = 22,
  className = '',
  filled = false,
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
    {/* 内部四宫格圆点（App Store 风格） */}
    <circle cx="9" cy="9" r="1.6" fill={filled ? '#ffffff' : 'currentColor'} />
    <circle cx="15" cy="9" r="1.6" fill={filled ? '#ffffff' : 'currentColor'} />
    <circle cx="9" cy="15" r="1.6" fill={filled ? '#ffffff' : 'currentColor'} />
    <circle cx="15" cy="15" r="1.6" fill={filled ? '#ffffff' : 'currentColor'} />
  </svg>
);

export default WebIcon;
