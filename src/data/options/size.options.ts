import type { WidgetSize, WidgetType } from '../../types';

/**
 * 各组件尺寸可选项（以组件类型 WidgetType 为 key）。
 * 值为可选尺寸数组（按大小升序排列，最多 12）。
 */
export const SIZE_OPTIONS: Partial<Record<WidgetType, WidgetSize[]>> = {
  search: [8, 12, 16, 20, 24],
  weather: [12, 16],
  'sticky-notes': [6, 10, 12, 16, 20, 24],
  clock: [6, 8, 10, 12],
  'clock-mini': [4, 6, 8],
  'clock-lunar': [12, 16, 20, 24],
  'control-center': [6],
  'web-app': [2, 4],
  shortcuts: [ 6, 8],
  'member-count': [6, 8],
};

/** 兜底尺寸列表 */
const DEFAULT_SIZE_OPTIONS: WidgetSize[] = [2, 4, 6, 8, 12, 24];

/**
 * 按组件类型 (type) 查询尺寸列表。
 */
export function getSizeOptions(type?: WidgetType): WidgetSize[] {
  if (!type) return DEFAULT_SIZE_OPTIONS;
  return SIZE_OPTIONS[type] ?? DEFAULT_SIZE_OPTIONS;
}
