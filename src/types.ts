// 字体方案（三种），每方案给出三档字号（直接写入 CSS 变量，不做派生）：
//   A → --font-sm 12 / --font-md 14 / --font-lg 16
//   B → --font-sm 13 / --font-md 15 / --font-lg 17
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

export type WidgetType =
  | 'sticky-notes'
  | 'weather'
  | 'search'
  | 'ai-chat'
  | 'clock'
  | 'clock-mini'
  | 'shortcuts'
  | 'control-center'
  | 'settings'
  | 'icon-grid'
  | 'agent-test';

export type WidgetSize =
  | 'sm' // 1/4
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
  // Action callback resolved at runtime by id (see getWidgetAction in
  // widgetConfig). Functions are not serialized to localStorage, so this field is
  // only meaningful for widgets sourced from code (INITIAL_WIDGETS).
  onAction?: () => void;
  iconHref?: string;
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

export interface QuickShortcut {
  id: string;
  title: string;
  url: string;
  iconName: string;
  category: string;
  bgColor?: string;
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
