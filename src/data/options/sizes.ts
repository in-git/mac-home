import type { WidgetSize } from '../../types';

/**
 * 组件尺寸候选项（全局单一来源）。
 *
 * 各组件在「添加组件」/尺寸选择器里可选择的尺寸组合集中定义于此，
 * `data/widgetConfig.ts` 通过引用这些常量来配置每个组件的 sizeOptions，
 * 避免尺寸候选项散落在各处、便于统一维护。
 * 尺寸值即分数文案（1/4 / 1/2 / 1/1 / 1/8 / 1/16 ...），与 types.ts 的 WidgetSize 一致。
 */

/** 极小 / 宽 / 大 三种（通用全集）。 */
export const SIZE_OPTIONS_ALL: WidgetSize[] = ['1/4', '1/2', '1/1'];

/** 宽 / 大。 */
export const SIZE_OPTIONS_WIDE_LARGE: WidgetSize[] = ['1/2', '1/1'];


/** 宽 / 极小 / 大。 */
export const SIZE_OPTIONS_WIDE_SM_LARGE: WidgetSize[] = ['1/2', '1/4', '1/1'];

/** 极小 / 宽 / 大。 */
export const SIZE_OPTIONS_SM_WIDE_LARGE: WidgetSize[] = ['1/4', '1/2', '1/1'];

/** 宽 / 极小。 */
export const SIZE_OPTIONS_WIDE_SM: WidgetSize[] = ['1/2', '1/4'];

/** 仅极小。 */
export const SIZE_OPTIONS_SM_ONLY: WidgetSize[] = ['1/4'];

/** 图标尺寸（1/8 / 1/16）。 */
export const SIZE_OPTIONS_ICON: WidgetSize[] = ['1/8', '1/16'];

/** 图标网格专用：1/12 / 1/10 / 1/6 及图标尺寸。 */
export const SIZE_OPTIONS_ICON_GRID: WidgetSize[] = [
  '1/8',
  '1/16',
  '1/12',
  '1/10',
  '1/6',
];

/** 网络搜索专用：宽 / 大 / 极小。 */
export const SIZE_OPTIONS_SEARCH: WidgetSize[] = ['1/2', '1/1', '1/4'];

/** Banner 专用：1/5 及以上尺寸（1/5 / 1/2 / 1/1）。 */
export const SIZE_OPTIONS_FIFTH_UP: WidgetSize[] = ['1/5', '1/2', '1/1'];
