import { WidgetType, CardStyle, WidgetItem } from '../types';
import type { MouseEvent } from 'react';
import { getSizeOptions, type WidgetSizeOption } from './options/size.options';

/**
 * Type-level configuration registry for every widget type. This consolidates
 * the previously scattered maps (title / max instances / default size / size
 * options / addability / picker glyph & label) into a single source of truth.
 *
 * Edit an entry here to change how that widget type behaves across the app.
 */
export type WidgetCategory = 'system' | 'web';

/**
 * 组件分类映射（集中维护）。未在此声明的组件默认归入 'system' 分类，
 * 用于「添加组件」模态框的左侧分组。
 */
export const WIDGET_CATEGORIES: Partial<Record<WidgetType, WidgetCategory>> = {
  'web-app': 'web',
};

/** 获取组件分类，缺省返回 'system'。 */
export function getWidgetCategory(type: WidgetType): WidgetCategory {
  return WIDGET_CATEGORIES[type] ?? 'system';
}



/** 全局默认卡片样式（放大模态框等未单独配置时回退到此）。 */
export const DEFAULT_CARD_STYLE: CardStyle = {
  padding: 'p-4',
  glass: true,
  'backgroundTheme': undefined,
  background: undefined
};


/** 组件配置注册表（模板）：位置/大小由 react-grid-layout 的 grid 字段直接驱动，
 *故每个配置项自带默认 grid（x/y/w/h），运行时按此创建实例，用户可拖拽调整并持久化。 */
export const WIDGET_CONFIG: Array<WidgetItem> = [
  {
    id: 'cfg-search',
    type: 'search',
    title: '网络搜索',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    cardStyle: {
      disableBackgroundMenu: true,
      background:'transparent'
    },
    grid: {
      x: 0,
      y: 0,
      w: 96,
      h: 12
    }
  },
  {
    id: 'cfg-clock',
    type: 'clock',
    title: '时钟日历',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 24,
    },
  },
  {
    id: 'cfg-weather',
    type: 'weather',
    title: '天气预报',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 40,
      h: 34,
    },
  },
  {
    id: 'cfg-sticky-notes',
    type: 'sticky-notes',
    title: '便签笔记',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 32,
      h: 24,
    },
  },

  {
    id: 'cfg-clock-mini',
    type: 'clock-mini',
    title: '时钟',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 16,
      h: 16,
    },
  },
  {
    id: 'cfg-clock-lunar',
    type: 'clock-lunar',
    title: '农历时钟',
    maxInstances: 1,
    isAddable: true,
    grid: {
      x: 0,
      y: 0,
      w: 32,
      h: 18,
    },
    data: {
      color: 'var(--accent)',
      size: '3.5rem',
    },
    cardStyle: {
      background: 'transparent'
    }
  },
  {
    id: 'cfg-control-center',
    type: 'control-center',
    title: '控制中心',
    maxInstances: 1,
    isAddable: true,
    data: {
      color: 'var(--accent)',
    },
    cardStyle: {
      ...DEFAULT_CARD_STYLE,
    },
    grid: {
      x: 0,
      y: 0,
      w: 20,
      h: 26,
    }
  },
  {
    id: 'cfg-web-app',
    type: 'web-app',
    title: '网页应用',
    maxInstances: Infinity,
    isAddable: false,
    cardStyle: {
      glass: false,
      padding: 'p-0'
    },
    grid: {
      x: 0,
      y: 0,
      w: 8,
      h: 8,
    },
    data: {
      color: 'var(--accent)',
    },
  },
  {
    id: 'cfg-random-web',
    type: 'random-web',
    title: '随机网页',
    maxInstances: 1,
    isAddable: true,
    cardStyle: {
      padding: 'p-0',
      background: 'transparent',
      backgroundTheme: 'dark'
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 16,
    },
    data: {},
  },
  {
    id: 'cfg-member-count',
    type: 'member-count',
    title: '在线人数',
    maxInstances: 1,
    isAddable: true,
    cardStyle: {
      padding: 'p-4',
      glass: true,
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 24,
    },
    data: {
      color: 'var(--accent)',
    },
  },
];

/** type -> config 的快速查找表（由 WIDGET_CONFIG 派生）。 */
const WIDGET_CONFIG_MAP: Record<string, WidgetItem> = Object.fromEntries(
  WIDGET_CONFIG.map((cfg) => [cfg.type, cfg]),
);



/** 解析后的组件配置：模板（含默认 grid）+ 运行时查询的 sizeOptions。 */
export type ResolvedWidgetConfig = WidgetItem & { sizeOptions: WidgetSizeOption[] };

/** Resolve the config for a widget type (falls back to a safe default). */
export function getWidgetConfig(type: WidgetType): ResolvedWidgetConfig {
  const cfg = WIDGET_CONFIG_MAP[type];
  return { ...cfg, sizeOptions: getSizeOptions(type) };
}



/** Whether another instance of `type` may be added given the current count. */
export function canAddWidget(type: WidgetType, currentCount: number): boolean {
  const max = getWidgetConfig(type).maxInstances;
  return max === Infinity || currentCount < max;
}




/** 网页应用类图标组件（新增网页创建的类型）。 */
export function isWebApp(type: WidgetType): boolean {
  return type === 'web-app';
}

