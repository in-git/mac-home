import type { WidgetSize, WidgetType } from '../../types';

/**
 * 各组件尺寸可选项（从 widgetConfig 剥离后的单一数据源）。
 * 以组件类型 (WidgetType) 为 key，值为可选尺寸数组。
 * 使用时通过 getSizeOptions(type) 数组查询，组件配置本身不再持有该字段。
 */
export const SIZE_OPTIONS: Partial<Record<WidgetType, WidgetSize[]>> = {
  weather: ['1/2', '1/1','1/3'],
  'sticky-notes': ['1/3', '1/5', '1/6'],
  clock: ['1/3','1/4', '1/5', '1/6'],
  'clock-mini': ['1/3','1/4', '1/5', '1/6'],
  'clock-lunar': ['1/3', '1/5', '1/6'],
  'control-center': ['1/4'],
  'web-grid': ['1/8', '1/16', '1/12', '1/10', '1/6'],
  shortcuts: ['1/1', '1/2','1/3',  '1/4',],
  'member-count': ['1/3', '1/5', '1/6'],
  blank: ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/8', '1/10', '1/12', '1/16'],
};

/** 兜底：未注册的组件类型返回空数组（即不可切换尺寸）。 */
const DEFAULT_SIZE_OPTIONS: WidgetSize[] = [];

/**
 * 按组件类型查询其可选尺寸列表（数组查找）。
 * 未配置时返回空数组，调用方应据此判断是否需要显示尺寸切换入口。
 */
export function getSizeOptions(type: WidgetType): WidgetSize[] {
  return SIZE_OPTIONS[type] ?? DEFAULT_SIZE_OPTIONS;
}
