import { WidgetSize, WidgetType } from '../types';
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

export interface WidgetTypeConfig {
  /** 标题 / 标签：组件创建时默认使用，同时用作「添加组件」模态框的展示文案（合并原 title 与 label）。 */
  title: string;
  /** 最大安装数量，有些只能安装一次，所以用它限制 */
  maxInstances: number;
  /** Size applied to a newly created widget of this type. */
  defaultSize: WidgetSize;
  /** Sizes offered in the size picker for this type. */
  sizeOptions: WidgetSize[];
  /** Whether this type can be added from the "添加组件" modal. */
  isAddable: boolean;
  /** Emoji/glyph shown in the add-widget picker. */
  glyph: string;

  showHeader?: boolean;
  /** 点击事件：卡片被点击（非编辑模式）时触发，接收点击事件对象。合并原 onClick 与 onAction（后者统一走事件触发）。可选。 */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** 封面：组件封面图地址，可选。 */
  cover?: string;
  /** 是否可删除：为 false 时该类型组件不可被用户删除（默认 true）。 */
  deletable?: boolean;
  /** 快捷导航等组件的私有数据空间：存储 SiteItem[]（。 */
  shortcuts?: SiteItem[];
  /** 图标型组件（web-grid）携带的站点数据：从「网页列表」添加时存储的单个 SiteItem。 */
  site?: SiteItem;
  /** 卡片外观样式集合：将卡片相关的视觉属性（内边距、毛玻璃模糊、边框、阴影、圆角）集中于此，便于统一配置。 */
  cardStyle?: CardStyle;
}

/**
 * 卡片外观样式：集中定义卡片（含放大模态框）的视觉属性。
 * - padding：卡片内容区内边距，例如 'p-4' 常规留白，'p-0' 内容满铺。
 */
export interface CardStyle {
  /** 卡片内容区内边距，例如 'p-4' 常规留白，'p-0' 内容满铺。 */
  padding: 'p-2' | 'p-0' | 'p-4';
  /** 是否启用毛玻璃质感（对应 `.glass-panel`：半透明底 + backdrop-filter 模糊）。关闭后卡片不再有毛玻璃效果。 */
  glass: boolean;
}

/** 全局默认卡片样式（放大模态框等未单独配置时回退到此）。 */
export const DEFAULT_CARD_STYLE: CardStyle = {
  padding: 'p-4',
  glass: true,
};

export const WIDGET_CONFIG: Partial<Record<WidgetType, WidgetTypeConfig>> = {
  search: {
    title: '网络搜索',
    maxInstances: Infinity,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_SEARCH,
    isAddable: true,
    glyph: '🔍',
    showHeader: false,
  },
  weather: {
    title: '天气预报',
    maxInstances: 1,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_WIDE_LARGE,
    isAddable: true,
    glyph: '⛅',
    showHeader: false,
  },
  'sticky-notes': {
    title: '便签笔记',
    maxInstances: 1,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '📝',
    showHeader: false,
  },
  clock: {
    title: '时钟日历',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🕒',
    showHeader: false,
  },
  'clock-mini': {
    title: '时钟',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_WIDE_SM,
    isAddable: true,
    glyph: '⏰',
    showHeader: false,
  },
  'clock-lunar': {
    title: '农历时钟',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🌙',
    showHeader: false,
    cardStyle: {
      padding: 'p-4',
      glass: false
    },
  },
  'control-center': {
    title: '控制中心',
    maxInstances: 1,
    defaultSize: '1/4',
    sizeOptions: SIZE_OPTIONS_SM_ONLY,
    isAddable: true,
    glyph: '🎛️',
    showHeader: false,
  },
  'web-grid': {
    title: '网页',
    maxInstances: Infinity,
    defaultSize: '1/8',
    sizeOptions: SIZE_OPTIONS_ICON_GRID,
    isAddable: false,
    glyph: '🌐',
    showHeader: false,
    cardStyle: {
      padding: 'p-0',
      glass: false
    },
    onClick(_event: MouseEvent<HTMLDivElement>){}
  },
  shortcuts: {
    title: '快捷导航',
    maxInstances: Infinity,
    defaultSize: '1/3',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🔗',
    shortcuts: [],
    showHeader: false,
  
  },
  banner: {
    title: 'Prismatic Burst',
    maxInstances: Infinity,
    defaultSize: '1/2',
    sizeOptions: SIZE_OPTIONS_FIFTH_UP,
    isAddable: true,
    glyph: '🌈',
    showHeader: false,
    cardStyle: {
      padding: 'p-0',
      glass: false
    },
  },

};

/**
 * 兜底配置：用于未在 WIDGET_CONFIG 中注册的组件类型（例如已迁移为独立视图、
 * 不从「添加组件」注册但仍可被渲染/添加的 shortcuts）。保证 getWidgetConfig /
 * canAddWidget 等调用在缺省类型下也能取得合理的 title、sizeOptions、maxInstances。
 */
const FALLBACK_CONFIG: WidgetTypeConfig = {
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
  return WIDGET_CONFIG[type] ?? FALLBACK_CONFIG;
}

/**
 * Find a widget type's optional `onClick` by type and execute it with the click
 * event if present. Returns `true` when a handler was executed.
 */
export function executeWidgetClick(
  type: WidgetType,
  event: MouseEvent<HTMLDivElement>,
): boolean {
  const entry = Object.entries(WIDGET_CONFIG).find(([t]) => t === type);
  if (entry?.[1].onClick) {
    entry[1].onClick(event);
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
export const ADDABLE_WIDGETS = Object.entries(WIDGET_CONFIG)
  .filter(([, cfg]) => cfg.isAddable)
  .map(([type, cfg]) => ({
    type: type as WidgetType,
    glyph: cfg.glyph,
    label: cfg.title,
    // 分类由集中映射决定（缺省为 'system'）。
    category: getWidgetCategory(type as WidgetType),
  }));

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
