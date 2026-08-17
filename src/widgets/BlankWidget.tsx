import React from 'react';

interface BlankWidgetProps {
  /** 编辑态：显示提示文字与纯白背景；正常态为纯空卡片（用于布局留白）。 */
  isEditMode: boolean;
  /** 私有属性：宽高比（CSS aspect-ratio 值，如 '1 / 1'、'16 / 9'），缺省不限制。 */
  aspect?: string;
}

/**
 * 空白占位组件：用于布局留白。
 * - 正常态：完全透明、无内容的卡片。
 * - 编辑态：纯白背景 + 居中「空白占位」提示，辅助识别与拖拽。
 * aspect（私有属性）自定义占位块纵横比，组件内实现。
 */
export const BlankWidget: React.FC<BlankWidgetProps> = ({ isEditMode, aspect }) => {
  const aspectStyle = aspect ? { aspectRatio: aspect } : undefined;

  if (isEditMode) {
    return (
      <div
        style={aspectStyle}
        className="flex h-full w-full items-center justify-center rounded-[var(--card-radius)] bg-white text-[color:var(--accent)]/70 dark:text-[color:var(--accent)]/70"
      >
        <span className="text-sm">空白占位</span>
      </div>
    );
  }

  return <div style={aspectStyle} className="h-full w-full" />;
};
