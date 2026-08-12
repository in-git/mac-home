// 字体方案（三种），每方案给出三档字号（直接写入 CSS 变量，不做派生）：
//   A → --font-sm 12 / --font-md 14 / --font-lg 16
//   B → --font-sm 13 / --font-md 15 / --font-lg 17

import { SiteItem } from './api/site';

//   C → --font-sm 14 / --font-md 16 / --font-lg 18
export type FontVariant = 'A' | 'B' | 'C';

/** 字号方案的 UI 展示名：小 / 中 / 大 */
export const FONT_VARIANT_LABEL: Record<FontVariant, string> = {
  A: '小',
  B: '中',
  C: '大',
};

export const FONT_TIER_PX: Record<
  FontVariant,
  { sm: number; md: number; lg: number }
> = {
  A: { sm: 12, md: 14, lg: 16 },
  B: { sm: 13, md: 15, lg: 17 },
  C: { sm: 14, md: 16, lg: 18 },
};

// 卡片圆角：极小 / 小 / 中 / 大 四档，写入 CSS 变量 --card-radius 供全站卡片引用。
export type CardRadiusTier = 'tiny' | 'small' | 'medium' | 'large';

export const CARD_RADIUS_LABEL: Record<CardRadiusTier, string> = {
  tiny: '极小',
  small: '小',
  medium: '中',
  large: '大',
};

export const CARD_RADIUS_PX: Record<CardRadiusTier, number> = {
  tiny: 6,
  small: 12,
  medium: 18,
  large: 24,
};

// ############################################################
// AI 模型对接配置 —— 定义集中在 src/agent/config/aiConfig.ts
// 此处仅重新导出，业务侧仍可从 '@/types' 引入，无需改动引用点。
// ############################################################
export type { AIProvider, AIConfig } from './agent/config/aiConfig';
export { AI_PROVIDERS, DEFAULT_AI_CONFIG } from './agent/config/aiConfig';

export type WidgetType =
  | 'sticky-notes'
  | 'weather'
  | 'search'
  | 'clock'
  | 'clock-mini'
  | 'shortcuts'
  | 'control-center'
  | 'settings'
  | 'icon-grid'
  | 'application'
  | 'banner';

export type WidgetSize =
  | 'sm' // 1/4
  | 'fifth' // 1/5
  | 'sixth' // 1/6
  | 'third' // 1/3
  | 'wide' // 1/2
  | 'large' // 1:1
  | 'icon-1-8' // 1:8
  | 'icon-1-16'; // 1:16 (纯图标, 不显示文本)

// Behaviour of an `icon-grid` widget. `link` → open iconHref in a new tab;
// `action` → invoke the onAction() callback wired up at render time.
export type IconBehavior = 'link' | 'action';

// Mapping between the internal size tokens and the human-readable fractions
// shown in the UI (e.g. "1/2", "1:1"). Used for the size picker labels.
export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  sm: '1/4',
  third: '1/3',
  wide: '1/2',
  large: '1:1',
  'icon-1-8': '1:8',
  'icon-1-16': '1:16',
  fifth: '1/5',
  sixth: '1/6'
};

// Props shared by every widget component. `editing` reflects whether the
// dashboard is in free-layout (unlocked) mode.
export interface WidgetProps {
  editing?: boolean;
}

export interface WidgetItem {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  pinned?: boolean;
  position?: { x: number; y: number };
  // Whether to render the widget card header (title bar + window dots/controls).
  // Defaults to true; false for widgets like the single icon block.
  showHeader?: boolean;
  // Fields for `icon-grid` widgets. `iconType` decides the behaviour:
  // `link` opens `iconHref` in a new tab, `action` triggers the onAction() callback.
  iconType?: IconBehavior;
  // Name of a lucide-react icon (e.g. 'Globe', 'Plus') rendered by IconWidget.
  iconGlyph?: string;
  iconLabel?: string;
  // Custom colors for `icon-grid` tiles. `iconTextColor` tints the glyph + label,
  // `iconBgColor` overrides the tile background. Both are any valid CSS color.
  iconTextColor?: string;
  iconBgColor?: string;
  // Optional custom background for the whole widget card. Any valid CSS
  // background value (e.g. a `linear-gradient(...)` string) is accepted; when
  // set it overrides the default translucent glass-panel background.
  background?: string;
  // 卡片背景的明暗分类（'light' | 'dark'），用于让卡片内文本自适应背景明暗，
  // 独立于系统主题。由预设背景的 theme 字段在切换时写入。
  backgroundTheme?: 'light' | 'dark';
  // Action callback resolved at runtime by id (see getWidgetAction in
  // widgetConfig). Functions are not serialized to localStorage, so this field is
  // only meaningful for widgets sourced from code (INITIAL_WIDGETS).
  onAction?: () => void;
  iconHref?: string;
  // 仅 icon / icon-grid 组件：为 true 时点击在内部浏览器（iframe）打开 iconHref，
  // 而非新标签页。若目标站点禁止被 iframe 嵌入，则内部浏览器提供「在外部打开」降级。
  openInApp?: boolean;
  // 仅 application 组件：直接渲染到 iframe 的 HTML 源码（经 srcDoc 注入）。
  html?: string;
  // 仅 application（网页列表）组件：要展示的网页条目列表。
  websites?: WebSite[];
  // 仅 快捷导航 组件：本组件实例独立的站点数据空间。
  shortcuts?: SiteItem[];
  // 仅 icon-grid 组件：从「网页列表」添加的站点数据，桌面点击图标时据此打开站点。
  site?: SiteItem;
}

/** 网页列表（application）组件中的单个网页条目 */
export interface WebSite {
  /** 站点名称，展示在列表里 */
  title: string;
  /** 站点地址，点击后在内置预览区以 iframe 打开 */
  url: string;
}

export type WallpaperType = 'dynamic' | 'static';

export type DynamicPreset =
  | 'aurora'
  | 'day-night'
  | 'particles'
  | 'mesh-wave'
  | 'starfield'
  | 'cyber-grid'
  | 'quantum-glow'
  | 'dual-sine'
  | 'matrix-rain'
  | 'pulse-rings'
  | 'shooting-stars'
  | 'constellation'
  | 'breathing-orbs'
  | 'floating-geometry'
  | 'tessellation'
  | 'molten-metal'
  | 'threads'
  | 'plasma-wave';

export interface WallpaperConfig {
  type: WallpaperType;
  dynamicPreset?: DynamicPreset;
  imageUrl?: string;
  gradient?: string;
  blur: number; // 0 to 20px
  brightness: number; // 50% to 120%
  /** 以下为桌面主题滤镜参数（theme.options.ts 预设），缺省时视为中性值 */
  contrast?: number; // 1 = 原始
  saturation?: number; // 1 = 原始
  hue?: number; // 色相旋转角度
  sepia?: number; // 0 - 1
  grayscale?: number; // 0 - 1
  invert?: number; // 0 - 1
}

export type NoteColor =
  | 'yellow'
  | 'mint'
  | 'pink'
  | 'lavender'
  | 'blue'
  | 'glass';

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  updatedAt: string;
  pinned: boolean;
  isChecklist?: boolean;
  checklistItems?: { id: string; text: string; completed: boolean }[];
}

export interface WeatherCondition {
  city: string;
  country: string;
  temp: number; // Celsius
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunder';
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  aqi: number; // Air Quality Index
  aqiLabel: 'Excellent' | 'Good' | 'Moderate' | 'Unhealthy';
  hourlyForecast: {
    time: string;
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunder';
  }[];
  dailyForecast: {
    day: string;
    high: number;
    low: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunder';
  }[];
}

export interface SystemStatus {
  isDarkMode: boolean;
  volume: number;
  brightness: number;
  cpuUsage: number;
  memoryUsage: number;
  soundEnabled: boolean;
  isLayoutLocked: boolean;
}

export interface ToolTask {
  name: string;
  args: any;
}
