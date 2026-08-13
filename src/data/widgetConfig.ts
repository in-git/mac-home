import {
  AlarmClock,
  Clock,
  CloudSun,
  Compass,
  Globe,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { WidgetSize, WidgetType, CardStyle } from '../types';
import type { SiteItem } from '../api/site';
import type { MouseEvent } from 'react';
import {
  SIZE_OPTIONS_ICON_GRID,
  SIZE_OPTIONS_SEARCH,
  SIZE_OPTIONS_SM_ONLY,
  SIZE_OPTIONS_SM_WIDE_LARGE,
  SIZE_OPTIONS_WIDE_LARGE,
  SIZE_OPTIONS_WIDE_SM,
  SIZE_OPTIONS_WIDE_SM_LARGE,
  SIZE_OPTIONS_FIFTH_UP,
} from './options';

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
};

/**
 * 组件类型配置。数组形式（单一数据源），每个元素含 `type` 主键。
 * 字段统一按 type / title / maxInstances / defaultSize / sizeOptions /
 * isAddable / glyph / showHeader / cardStyle 顺序声明，便于维护。
 */
export interface WidgetTypeConfig {
  /** 组件类型标识（主键）。 */
  type: WidgetType;
  /** 标题 / 标签：组件创建时默认使用，同时用作「添加组件」模态框的展示文案。 */
  title: string;
  /** 最大安装数量，有些只能安装一次，所以用它限制。 */
  maxInstances: number;
  /** 新建该类型组件时应用的尺寸。 */
  defaultSize: WidgetSize;
  /** 尺寸选择器提供的可选尺寸。 */
  sizeOptions: WidgetSize[];
  /** 是否可从「添加组件」模态框添加。 */
  isAddable: boolean;
  /** 「添加组件」选择器中展示的 emoji / 图标。 */
  glyph: string;
  /** 是否显示卡片头部，缺省为 false。 */
  showHeader?: boolean;
  /** 卡片被点击（非编辑模式）时触发，接收点击事件对象。可选。 */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** 封面图地址，可选。 */
  cover?: string;
  /** 是否可删除：为 false 时该类型组件不可被用户删除（默认 true）。 */
  deletable?: boolean;
  /** 快捷导航等组件的私有数据空间：存储 SiteItem[]。 */
  shortcuts?: SiteItem[];
  /** 图标型组件（web-grid）携带的站点数据。 */
  site?: SiteItem;
  /** 卡片外观样式集合（内边距、毛玻璃等）。 */
  cardStyle?: CardStyle;
}

export const WIDGET_CONFIG: WidgetTypeConfig[] = [
  {
    type: 'search',
    title: '网络搜索',
    maxInstances: Infinity,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_SEARCH,
    isAddable: true,
    glyph: '🔍',
    showHeader: false,
  },
  {
    type: 'weather',
    title: '天气预报',
    maxInstances: 1,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_WIDE_LARGE,
    isAddable: true,
    glyph: '⛅',
    showHeader: false,
  },
  {
    type: 'sticky-notes',
    title: '便签笔记',
    maxInstances: 1,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '📝',
    showHeader: false,
  },
  {
    type: 'clock',
    title: '时钟日历',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🕒',
    showHeader: false,
  },
  {
    type: 'clock-mini',
    title: '时钟',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_WIDE_SM,
    isAddable: true,
    glyph: '⏰',
    showHeader: false,
  },
  {
    type: 'clock-lunar',
    title: '农历时钟',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🌙',
    showHeader: false,
    cardStyle: {
      padding: 'p-4',
      glass: false,
    },
  },
  {
    type: 'control-center',
    title: '控制中心',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_ONLY,
    isAddable: true,
    glyph: '🎛️',
    showHeader: false,
  },
  {
    type: 'web-grid',
    title: '网页',
    maxInstances: Infinity,
    defaultSize: '1/8',
    sizeOptions: SIZE_OPTIONS_ICON_GRID,
    isAddable: false,
    glyph: '🌐',
    showHeader: false,
    cardStyle: {
      padding: 'p-0',
      glass: false,
    },
  },
  {
    type: 'shortcuts',
    title: '快捷导航',
    maxInstances: Infinity,
    defaultSize: '1/3',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🔗',
    shortcuts: [],
    showHeader: false,
  },
  {
    type: 'banner',
    title: 'Prismatic Burst',
    maxInstances: Infinity,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_FIFTH_UP,
    isAddable: true,
    glyph: '🌈',
    showHeader: false,
    cardStyle: {
      padding: 'p-0',
      glass: false,
    },
  },
];

/** type -> config 的快速查找表（由 WIDGET_CONFIG 派生）。 */
const WIDGET_CONFIG_MAP: Record<string, WidgetTypeConfig> = Object.fromEntries(
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
  banner: Sparkles,
};

/** 图标气泡哑光底色（主色以主题色点缀），UI 层统一从此处取用。 */
export const WIDGET_ICON_BUBBLE: Record<WidgetType, string> = {
  search: 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]',
  weather: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'sticky-notes': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  clock: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'clock-mini': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'clock-lunar': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  shortcuts: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'control-center': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'web-grid': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  application: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  banner: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

/**
 * 兜底配置：用于未在 WIDGET_CONFIG 中注册的组件类型（例如已迁移为独立视图、
 * 不从「添加组件」注册但仍可被渲染/添加的 shortcuts）。保证 getWidgetConfig /
 * canAddWidget 等调用在缺省类型下也能取得合理的 title、sizeOptions、maxInstances。
 */
const FALLBACK_CONFIG: WidgetTypeConfig = {
  type: 'unknown' as WidgetType,
  title: '组件',
  maxInstances: Infinity,
  defaultSize: '1/4',
  sizeOptions: SIZE_OPTIONS_WIDE_SM_LARGE,
  isAddable: false,
  glyph: '🔗',
  showHeader: false,
};

/** Resolve the config for a widget type (falls back to a safe default). */
export function getWidgetConfig(type: WidgetType): WidgetTypeConfig {
  return WIDGET_CONFIG_MAP[type] ?? FALLBACK_CONFIG;
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
    glyph: cfg.glyph,
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
