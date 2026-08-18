import React, {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';

interface SubmenuFlyoutProps {
  /** 是否展开（hover 触发）。 */
  open: boolean;
  /** 子菜单内容。 */
  children: ReactNode;
  /**
   * 完整样式类名（含 absolute / 定位 / 背景 / 阴影 / 内边距等）。
   * 组件仅在该 flyout 超出屏幕时通过 inline style 翻转 top↔bottom、left↔right，
   * 不改动任何外观样式，也不影响一级菜单。
   */
  className: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MARGIN = 10;

/**
 * 二级 flyout 子菜单容器：仅在展开时测量自身位置，
 * 靠近屏幕底部则向上翻转（bottom:0）、靠近屏幕右侧则向左翻转（right:100%），
 * 避免超出可视区域。仅调整二级菜单自身坐标，一级菜单不受影响。
 */
export const SubmenuFlyout: React.FC<SubmenuFlyoutProps> = ({
  open,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState<{ up: boolean; left: boolean }>({
    up: false,
    left: false,
  });

  useLayoutEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const up = r.top + r.height > screenH - MARGIN;
    const left = r.left + r.width > screenW - MARGIN;
    setFlip({ up, left });
  }, [open, children]);

  if (!open) return null;

  const style: CSSProperties = {};
  // 向上翻转：取消 top，改用 bottom 对齐触发项底部（向上展开）。
  if (flip.up) {
    style.top = 'auto';
    style.bottom = 0;
  }
  // 向左翻转：取消 left，改用 right 贴靠触发项左侧。
  if (flip.left) {
    style.left = 'auto';
    style.right = '100%';
    style.marginLeft = 0;
    style.marginRight = '0.75rem';
  }

  return (
    <div
      ref={panelRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
};

export default SubmenuFlyout;
