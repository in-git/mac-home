import type { WidgetType } from '../../types';

/** 单个尺寸档位：w 为宽度（列），h 为高度（行）；h 缺省时仅调整宽度、保留当前高度。 */
export interface WidgetSizeOption {
  w: number;
  h?: number;
}

/**
 * 各组件尺寸可选项（以组件类型 WidgetType 为 key）。
 * 值为尺寸档位数组（w x h），按大小升序排列，最多 12 个。
 * 配置了 h 的档位选中后宽高同时应用（如 24x12）；未配置 h 的档位仅调整宽度。
 * 后续拓展：给对应类型的档位补上 h 即可获得固定宽高比。
 */
export const SIZE_OPTIONS: Partial<Record<WidgetType, WidgetSizeOption[]>> = {
  // 网页应用：正方形档位（基于 36 列系统，rowHeight=2）
  'web-app': [
    { w: 6, h: 6 },
    { w: 8, h: 8 },
    { w: 10, h: 10 },
    { w: 12, h: 12 },
  ],
  search: [ { w: 24, h: 12 },{ w: 30, h: 12 },{ w: 48, h: 12 },{ w: 96, h: 12 } ],
  'member-count': [{ w: 24, h: 24 }],
  weather: [{ w: 40, h: 34 }, { w: 48, h: 34 }],
  'sticky-notes': [{ w: 20, h: 24 }, { w: 32, h: 24 }, { w: 48, h: 24 }],
  clock: [{ w: 24, h: 24 }, { w: 32, h: 32 }],
  'clock-mini': [ { w: 16, h: 16 }],
  'clock-lunar': [{ w: 32, h: 18 },{w:64,h:18},{w:96,h:18}],
  'control-center': [{ w: 20, h: 24 }],
  // 随机网页：固定宽高比档位
  'random-web': [{ w: 24, h: 16 }, { w: 32, h: 16 }],
};

/** 兜底尺寸列表（基于 36 列系统） */
const DEFAULT_SIZE_OPTIONS: WidgetSizeOption[] = [
  { w: 6 },
  { w: 9 },
  { w: 12 },
  { w: 18 },
  { w: 24 },
];

/**
 * 按组件类型 (type) 查询尺寸档位列表。
 */
export function getSizeOptions(type?: WidgetType): WidgetSizeOption[] {
  if (!type) return DEFAULT_SIZE_OPTIONS;
  return SIZE_OPTIONS[type] ?? DEFAULT_SIZE_OPTIONS;
}
