import { WidgetSize, WidgetType } from '../../types';
import { isWebGrid } from '../../data/widgetConfig';

// Size helper for responsive width classes on Muuri item containers
// IMPORTANT: widths MUST be fixed percentages (no Tailwind responsive
// breakpoints). Muuri measures each item's real pixel width via
// getBoundingClientRect() to compute layout & free space. Responsive
// classes (sm:/lg:/md:) change the width with the viewport, so below
// 1024px a `sm` item was actually full-width and Muuri saw NO 1/4 gap ->
// a ≤1/4 component could never be dragged up into the "remaining" space.
// Fixed % keeps Muuri's measured width viewport-independent and correct.
// 纯图标类型（web-grid）使用固定像素正方形尺寸（不再随视口百分比缩放），
// 由尺寸分数映射到像素边长。锚点：1/16→48、1/12→64、1/10→96，后续尺寸按
// 同一递增规律延展，且整体以 48 为最小边长（最小值即 48x48）。
// 注意：固定 px 必须作用于「内部图标容器」而非 .muuri-item 外层。Muuri 在布局
// 时会给 .muuri-item 写内联 width/height，覆盖 Tailwind 类，导致切尺寸时类名
// 变化无法被观测到（内部 w-full 不变量 → ResizeObserver 不触发 → 无法重排）。
// 因此外层用 w-fit 收缩到内容宽度，真正的固定 px 由 WidgetCard 以内联样式写到
// 内层 .muuri-item-content 上，尺寸变化时内层盒子改变即可驱动 Muuri 重新测量。
export const WEB_GRID_PX: Record<WidgetSize, number> = {
  '1/16': 48,
  '1/12': 64,
  '1/10': 96,
  '1/8': 128,
  '1/6': 160,
  '1/5': 192,
  '1/4': 224,
  '1/3': 288,
  '1/2': 352,
  '1/1': 416,
};

export const getWebGridPx = (size: WidgetSize): number =>
  Math.max(48, WEB_GRID_PX[size] ?? 48);

export const getItemSizeClasses = (
  size: WidgetSize,
  type: WidgetType,
): string => {
  // 纯图标类型（web-grid）：外层收缩到内容宽度，固定 px 由 WidgetCard 内层承载
  if (isWebGrid(type)) {
    return 'w-fit';
  }
  const widthClass = (() => {
    switch (size) {
      case '1/4':
        return 'w-[25%]'; // 1/4
      case '1/3':
        return 'w-[33.333%]'; // 1/3
      case '1/5':
        return 'w-[20%]'; // 1/5
      case '1/6':
        return 'w-[16.666%]'; // 1/6
      case '1/10':
        return 'w-[10%]'; // 1/10
      case '1/12':
        return 'w-[8.333%]'; // 1/12
      case '1/2':
        return 'w-[50%]'; // 1/2
      case '1/1':
        return 'w-full'; // 1/1 占满整行
      case '1/8':
        return 'w-[12.5%]'; // 1/8
      case '1/16':
        return 'w-[6.25%]'; // 1/16
      default:
        return 'w-[50%]';
    }
  })();
  return widthClass;
};
