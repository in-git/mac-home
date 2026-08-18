import {
  AlarmClock,
  Clock,
  CloudSun,
  Compass,
  Globe,
  Moon,
  Search,
  SlidersHorizontal,
  Square,
  StickyNote,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { WidgetType, CardStyle, WidgetItem, WidgetSize } from '../types';
import type { MouseEvent } from 'react';
import { getSizeOptions } from './options/size.options';

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
  'web-grid': 'web',
};

/** 获取组件分类，缺省返回 'system'。 */
export function getWidgetCategory(type: WidgetType): WidgetCategory {
  return WIDGET_CATEGORIES[type] ?? 'system';
}



/** 全局默认卡片样式（放大模态框等未单独配置时回退到此）。 */
export const DEFAULT_CARD_STYLE: CardStyle = {
  padding: 'p-4',
  glass: true,
  'backgroundTheme': undefined
};


export const WIDGET_CONFIG: WidgetItem[] = [
  {
    id: 'cfg-search',
    type: 'search',
    title: '网络搜索',
    maxInstances: 1,
    size: '1/2',
    isAddable: true,
    data: {},
  },
  {
    id: 'cfg-weather',
    type: 'weather',
    title: '天气预报',
    maxInstances: 1,
    size: '1/2',
    isAddable: true,
    data: {},
  },
  {
    id: 'cfg-sticky-notes',
    type: 'sticky-notes',
    title: '便签笔记',
    maxInstances: 1,
    size: '1/2',
    isAddable: true,
    data: {},
  },
  {
    id: 'cfg-clock',
    type: 'clock',
    title: '时钟日历',
    maxInstances: 1,
    size: '1/4',
    isAddable: true,
    data: {},
    cardStyle: {
      height: 320,
    },
  },
  {
    id: 'cfg-clock-mini',
    type: 'clock-mini',
    title: '时钟',
    maxInstances: 1,
    size: '1/4',

    isAddable: true,

    data: {},
    cardStyle: {
      height: 160,
    },
  },
  {
    id: 'cfg-clock-lunar',
    type: 'clock-lunar',
    title: '农历时钟',
    maxInstances: 1,
    size: '1/4',
    isAddable: true,
    cardStyle: {
      height: 160,
    },
    data: {
      color: 'var(--accent)',
      size: '3.5rem',
      bold: true,
    },
  },
  {
    id: 'cfg-control-center',
    type: 'control-center',
    title: '控制中心',
    maxInstances: 1,
    size: '1/4',
    isAddable: true,
    data: {},
    cardStyle: {
      ...DEFAULT_CARD_STYLE,
      height: 320,
    }
  },
  {
    id: 'cfg-web-grid',
    type: 'web-grid',
    title: '网页',
    maxInstances: Infinity,
    size: '1/8',
    isAddable: false,
    cardStyle: {
      glass: false,
    },
    data: {},
  },
  {
    id: 'cfg-shortcuts',
    type: 'shortcuts',
    title: '快捷导航',
    maxInstances: Infinity,
    size: '1/3',
    isAddable: true,

    data: { shortcuts: [] },
  },
  {
    id: 'cfg-member-count',
    type: 'member-count',
    title: '在线人数',
    maxInstances: 1,
    size: '1/3',

    isAddable: true,

    cardStyle: {
      padding: 'p-4',
      glass: true,
    },
    data: {},
  },
  {
    id: 'cfg-blank',
    type: 'blank',
    title: '空白占位',
    maxInstances: 999,
    size: '1/4',

    isAddable: true,

    cardStyle: {
      padding: 'p-0',
      glass: false,
    },
    data: {
      aspect: '1 / 1',
    },
  },
];

/** type -> config 的快速查找表（由 WIDGET_CONFIG 派生）。 */
const WIDGET_CONFIG_MAP: Record<string, WidgetItem> = Object.fromEntries(
  WIDGET_CONFIG.map((cfg) => [cfg.type, cfg]),
);

/** 每个小组件类型对应的细线性图标（遵循 Apple HIG 细线性图标风格），UI 层统一从此处取用。 */
export const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  search: Search,
  weather: CloudSun,
  'sticky-notes': StickyNote,
  clock: Clock,
  'clock-mini': AlarmClock,
  'clock-lunar': Moon,
  shortcuts: Compass,
  'control-center': SlidersHorizontal,
  'web-grid': Globe,
  application: Globe,
  'member-count': UsersRound,
  blank: Square,
};

/**
 * 兜底配置：用于未在 WIDGET_CONFIG 中注册的组件类型（例如已迁移为独立视图、
 * 不从「添加组件」注册但仍可被渲染/添加的 shortcuts）。保证 getWidgetConfig /
 * canAddWidget 等调用在缺省类型下也能取得合理的 title、sizeOptions、maxInstances。
 */
const FALLBACK_CONFIG: WidgetItem = {
  id: 'cfg-unknown',
  type: 'unknown' as WidgetType,
  title: '组件',
  maxInstances: Infinity,
  size: '1/4',
  isAddable: false,

  data: {},
};

/** 解析后的组件配置：在 WidgetItem 基础上补充运行时查询得到的 sizeOptions。 */
export type ResolvedWidgetConfig = WidgetItem & { sizeOptions: WidgetSize[] };

/** Resolve the config for a widget type (falls back to a safe default). */
export function getWidgetConfig(type: WidgetType): ResolvedWidgetConfig {
  const cfg = WIDGET_CONFIG_MAP[type] ?? FALLBACK_CONFIG;
  return { ...cfg, sizeOptions: getSizeOptions(type) };
}

/**
 * Find a widget type's optional `onClick` by type and execute it with the click
 * event if present. Returns `true` when a handler was executed.
 */
export function executeWidgetClick(
  type: WidgetType,
  event: MouseEvent<HTMLDivElement>,
): boolean {
  const cfg = WIDGET_CONFIG_MAP[type];
  if (cfg?.onClick) {
    cfg.onClick(event);
    return true;
  }
  return false;
}

/** Whether another instance of `type` may be added given the current count. */
export function canAddWidget(type: WidgetType, currentCount: number): boolean {
  const max = getWidgetConfig(type).maxInstances;
  return max === Infinity || currentCount < max;
}

/** Types that may be added from the "添加组件" modal. */
export const ADDABLE_WIDGETS = WIDGET_CONFIG.filter((cfg) => cfg.isAddable).map(
  (cfg) => ({
    type: cfg.type,
    label: cfg.title,
    // 分类由集中映射决定（缺省为 'system'）。
    category: getWidgetCategory(cfg.type),
  }),
);

/** Get addable widgets filtered by category. */
export function getAddableWidgetsByCategory(category: WidgetCategory) {
  return ADDABLE_WIDGETS.filter((w) => w.category === category);
}

/** 网页类图标组件（新增网页创建的类型）。 */
export function isWebGrid(type: WidgetType): boolean {
  return type === 'web-grid';
}

// ---------------------------------------------------------------------------
// Instance-level click actions
//
// Action callbacks are functions and therefore not serializable to
// localStorage. Instead of storing them on the widget object, we register them
// here keyed by the widget `id`. At click time the dashboard looks the handler
// up via `getWidgetAction(id)`, so behaviour is always restored from code
// rather than from persisted (function-less) data.
// ---------------------------------------------------------------------------
const WIDGET_ACTION_REGISTRY: Record<string, () => void> = {};

/** Register the action callback for a widget id (called once at app startup). */
export function registerWidgetAction(id: string, fn: () => void): void {
  WIDGET_ACTION_REGISTRY[id] = fn;
}

/** Resolve the action callback for a widget id, if any. */
export function getWidgetAction(id: string): (() => void) | undefined {
  return WIDGET_ACTION_REGISTRY[id];
}
