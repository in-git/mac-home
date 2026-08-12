import { WidgetSize } from '../../types';

// Size helper for responsive width classes on Muuri item containers
// IMPORTANT: widths MUST be fixed percentages (no Tailwind responsive
// breakpoints). Muuri measures each item's real pixel width via
// getBoundingClientRect() to compute layout & free space. Responsive
// classes (sm:/lg:/md:) change the width with the viewport, so below
// 1024px a `sm` item was actually full-width and Muuri saw NO 1/4 gap ->
// a ≤1/4 component could never be dragged up into the "remaining" space.
// Fixed % keeps Muuri's measured width viewport-independent and correct.
export const getItemSizeClasses = (size: WidgetSize): string => {
  switch (size) {
    case 'sm':
      return 'w-[25%]'; // 1/4
    case 'third':
      return 'w-[33.333%]'; // 1/3
    case 'fifth':
      return 'w-[20%]'; // 1/5
    case 'sixth':
      return 'w-[16.666%]'; // 1/6
    case 'tenth':
      return 'w-[10%] aspect-[1/1]'; // 1/10
    case 'twelfth':
      return 'w-[8.333%] aspect-[1/1]'; // 1/12
    case 'wide':
      return 'w-[50%]'; // 1/2
    case 'large':
      return 'w-full'; // 1:1 占满整行
    case 'icon-1-8':
      return 'w-[12.5%] aspect-[1/1]'; // 1:8
    case 'icon-1-16':
      return 'w-[6.25%] aspect-[1/1]'; // 1:16
    default:
      return 'w-[50%]';
  }
};
