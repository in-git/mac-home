import type { WidgetSize } from '../../types';

/**
 * 组件尺寸候选项（全局单一来源）。
 *
 * 以「预设数组」方式集中维护：每个预设有唯一 id 与对应的 options（可选尺寸列表）。
 * 组件在 widgetConfig.ts 中通过 getSizeOptions(id) 按 id 查询，避免尺寸候选散落各处。
 * 尺寸值即分数文案（1/4 / 1/2 / 1/1 / 1/8 / 1/16 ...），与 types.ts 的 WidgetSize 一致。
 */

/** 尺寸预设：id 稳定不变，options 为可选尺寸列表。 */
export interface SizeOptionPreset {
  id: string;
  options: WidgetSize[];
}

/** 所有尺寸预设（使用时按 id 查询）。 */
export const SIZE_OPTION_PRESETS: SizeOptionPreset[] = [
  { id: 'all', options: ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/8', '1/10', '1/12', '1/16'] },
  { id: 'wide-large', options: ['1/2', '1/1'] },
  { id: 'wide-sm-large', options: ['1/2', '1/4', '1/1'] },
  { id: 'sm-wide-large', options: ['1/4', '1/2', '1/1'] },
  { id: 'wide-sm', options: ['1/2', '1/4'] },
  { id: 'sm-only', options: ['1/4'] },
  { id: 'icon', options: ['1/8', '1/16'] },
  { id: 'icon-grid', options: ['1/8', '1/16', '1/12', '1/10', '1/6'] },
  { id: 'search', options: ['1/2', '1/1', '1/4'] },
  { id: 'fifth-up', options: ['1/5', '1/2', '1/1'] },
  { id: 'third-fifth-sixth', options: ['1/3', '1/5', '1/6'] },
];

/** 未知 id 的兜底预设（等价于 wide-sm-large）。 */
export const DEFAULT_SIZE_OPTION_ID = 'wide-sm-large';

/** 按 id 查询尺寸候选项；未命中时回退到 DEFAULT_SIZE_OPTION_ID。 */
export function getSizeOptions(id: string): WidgetSize[] {
  const preset = SIZE_OPTION_PRESETS.find((p) => p.id === id);
  if (preset) return preset.options;
  const fallback = SIZE_OPTION_PRESETS.find((p) => p.id === DEFAULT_SIZE_OPTION_ID);
  return fallback ? fallback.options : [];
}
