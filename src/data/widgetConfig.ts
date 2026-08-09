import { WidgetSize, WidgetType } from '../types';
import {
  SIZE_OPTIONS_ICON,
  SIZE_OPTIONS_LARGE_WIDE,
  SIZE_OPTIONS_SEARCH,
  SIZE_OPTIONS_SM_ONLY,
  SIZE_OPTIONS_SM_WIDE_LARGE,
  SIZE_OPTIONS_WIDE_LARGE,
  SIZE_OPTIONS_WIDE_SM,
  SIZE_OPTIONS_WIDE_SM_LARGE,
} from './options';

/**
 * Type-level configuration registry for every widget type. This consolidates
 * the previously scattered maps (title / max instances / default size / size
 * options / addability / picker glyph & label) into a single source of truth.
 *
 * Edit an entry here to change how that widget type behaves across the app.
 */
export interface WidgetTypeConfig {
  /** Default title used when a widget of this type is created. */
  title: string;
  /** Maximum number of instances allowed at once. `Infinity` = unlimited. */
  maxInstances: number;
  /** Size applied to a newly created widget of this type. */
  defaultSize: WidgetSize;
  /** Sizes offered in the size picker for this type. */
  sizeOptions: WidgetSize[];
  /** Whether this type can be added from the "添加组件" modal. */
  isAddable: boolean;
  /** Emoji/glyph shown in the add-widget picker. */
  glyph: string;
  /** Human-readable label shown in the add-widget picker. */
  label: string;
  /** Whether cards of this type render the title bar (header). Optional — when
   *  omitted the header is shown by default. Icon-style types (e.g. icon-grid,
   *  settings) set this to `false` to render as a bare desktop icon. */
  showHeader?: boolean;
  /** Optional click handler invoked when the widget card is clicked (non-editing
   *  mode). Defined at the type level. Optional — omit to use no default action. */
  onAction?: () => void;
}

export const WIDGET_CONFIG: Record<WidgetType, WidgetTypeConfig> = {
  search: {
    title: '网络搜索',
    maxInstances: Infinity,
    defaultSize: 'wide',
    sizeOptions: SIZE_OPTIONS_SEARCH,
    isAddable: true,
    glyph: '🔍',
    label: '网络搜索',
  },
  'ai-chat': {
    title: 'AI 大模型助手',
    maxInstances: Infinity,
    defaultSize: 'large',
    sizeOptions: SIZE_OPTIONS_LARGE_WIDE,
    isAddable: true,
    glyph: '🤖',
    label: 'AI 聊天',
  },
  weather: {
    title: '天气预报',
    maxInstances: 1,
    defaultSize: 'wide',
    sizeOptions: SIZE_OPTIONS_WIDE_LARGE,
    isAddable: true,
    glyph: '⛅',
    label: '天气预报',
  },
  'sticky-notes': {
    title: '便签笔记',
    maxInstances: 1,
    defaultSize: 'wide',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '📝',
    label: '便签',
  },
  clock: {
    title: '时钟日历',
    maxInstances: 1,
    defaultSize: 'sm',
    sizeOptions: SIZE_OPTIONS_SM_WIDE_LARGE,
    isAddable: true,
    glyph: '🕒',
    label: '时间 & 日历',
  },
  'clock-mini': {
    title: '时钟',
    maxInstances: 1,
    defaultSize: 'sm',
    sizeOptions: SIZE_OPTIONS_WIDE_SM,
    isAddable: true,
    glyph: '⏰',
    label: '时钟',
  },
  shortcuts: {
    title: '快捷导航',
    maxInstances: Infinity,
    defaultSize: 'sm',
    sizeOptions: SIZE_OPTIONS_WIDE_SM_LARGE,
    isAddable: true,
    glyph: '🔗',
    label: '快捷导航',
  },
  'control-center': {
    title: '控制中心',
    maxInstances: 1,
    defaultSize: 'sm',
    sizeOptions: SIZE_OPTIONS_SM_ONLY,
    isAddable: true,
    glyph: '🎛️',
    label: '控制中心',
  },
  settings: {
    title: '系统设置',
    maxInstances: 1,
    defaultSize: 'icon-1-8',
    sizeOptions: SIZE_OPTIONS_ICON,
    isAddable: true,
    glyph: '⚙️',
    label: '系统设置',
    showHeader: false,
  },
  'icon-grid': {
    title: '图标',
    maxInstances: Infinity,
    defaultSize: 'icon-1-8',
    sizeOptions: SIZE_OPTIONS_ICON,
    isAddable: false,
    glyph: '🧩',
    label: '图标',
    showHeader: false,
  },
  application: {
    title: '迷你应用',
    maxInstances: Infinity,
    defaultSize: 'large',
    sizeOptions: ['sm', 'third', 'wide', 'large', 'icon-1-8'],
    isAddable: true,
    glyph: '🪟',
    label: '迷你应用',
    showHeader: true,
  },
};

/** Resolve the config for a widget type (falls back to a safe default). */
export function getWidgetConfig(type: WidgetType): WidgetTypeConfig {
  return WIDGET_CONFIG[type];
}

/**
 * Find a widget type's optional `onAction` by type and execute it if present.
 * Centralizes the type-level click trigger so callers don't reach into the
 * config object directly. Returns `true` when an action was executed.
 */
export function executeWidgetAction(type: WidgetType): boolean {
  const entry = Object.entries(WIDGET_CONFIG).find(([t]) => t === type);
  if (entry?.[1].onAction) {
    entry[1].onAction();
    return true;
  }
  return false;
}

/** Whether another instance of `type` may be added given the current count. */
export function canAddWidget(type: WidgetType, currentCount: number): boolean {
  const max = WIDGET_CONFIG[type].maxInstances;
  return max === Infinity || currentCount < max;
}

/** Types that may be added from the "添加组件" modal. */
export const ADDABLE_WIDGETS = Object.entries(WIDGET_CONFIG)
  .filter(([, cfg]) => cfg.isAddable)
  .map(([type, cfg]) => ({
    type: type as WidgetType,
    glyph: cfg.glyph,
    label: cfg.label,
  }));

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
