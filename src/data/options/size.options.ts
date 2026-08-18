import type { WidgetSize, WidgetType } from '../../types';

/**
 * 各组件尺寸可选项（以组件类型 WidgetType 为 key）。
 * 值为可选尺寸数组（按大小升序排列，最多 12）。
 */
export const SIZE_OPTIONS: Partial<Record<WidgetType, WidgetSize[]>> = {
  search: [ 4,  6, 8, 10, 12],
  weather: [6,8],
  'sticky-notes': [3, 5, 6, 8, 10, 12],
  clock: [3, 4,5,6 ],
  'clock-mini': [2,3, 4, ],
  'clock-lunar': [ 6, 8,10,12],
  'control-center': [3],
  'web-grid': [1,2],
  shortcuts: [1, 2, 3, 4, 6],
  'member-count': [3, 4, ],
};

/** 兜底尺寸列表 */
const DEFAULT_SIZE_OPTIONS: WidgetSize[] = [1, 2, 3, 4, 6, 12];

/**
 * 按组件类型 (type) 查询尺寸列表。
 */
export function getSizeOptions(type?: WidgetType): WidgetSize[] {
  if (!type) return DEFAULT_SIZE_OPTIONS;
  return SIZE_OPTIONS[type] ?? DEFAULT_SIZE_OPTIONS;
}
