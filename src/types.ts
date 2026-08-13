// 字体方案（三种），每方案给出三档字号（直接写入 CSS 变量，不做派生）：
//   A → --font-sm 12 / --font-md 14 / --font-lg 16
//   B → --font-sm 13 / --font-md 15 / --font-lg 17

import { SiteItem } from './api/site';

//   C → --font-sm 14 / --font-md 16 / --font-lg 18
export type FontVariant = 'A' | 'B' | 'C';

/** 字号方案：UI 展示名 + 三档字号（直接写入 CSS 变量，不做派生）。 */
export const FONT_VARIANT: Record<
  FontVariant,
  { label: string; px: { sm: number; md: number; lg: number } }
> = {
  A: { label: '小', px: { sm: 12, md: 14, lg: 16 } },
  B: { label: '中', px: { sm: 13, md: 15, lg: 17 } },
  C: { label: '大', px: { sm: 14, md: 16, lg: 18 } },
};

// 卡片圆角：极小 / 小 / 中 / 大 四档，写入 CSS 变量 --card-radius 供全站卡片引用。
export type CardRadiusTier = 'tiny' | 'small' | 'medium' | 'large';

/** 卡片圆角：UI 展示名 + 像素值。 */
export const CARD_RADIUS: Record<CardRadiusTier, { label: string; px: number }> = {
  tiny: { label: '极小', px: 6 },
  small: { label: '小', px: 12 },
  medium: { label: '中', px: 18 },
  large: { label: '大', px: 24 },
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
  | 'clock-lunar'
  | 'shortcuts'
  | 'control-center'
  | 'settings'
  | 'web-grid'
  | 'application'
  | 'banner';

// 尺寸统一使用分数写法（如 1/2、1/8），值即展示文案，无需额外映射表。
export type WidgetSize =
  | '1/1' // 1/1 占满整行
  | '1/2'
  | '1/3'
  | '1/4'
  | '1/5'
  | '1/6'
  | '1/8'
  | '1/10'
  | '1/12'
  | '1/16'; // 1/16 纯图标, 不显示文本

// Behaviour of an icon widget (web-grid / settings). `link` → open iconHref in a new tab;
// `action` → invoke the onAction() callback wired up at render time.
export type IconBehavior = 'link' | 'action';

// Props shared by every widget component. `editing` reflects whether the
// dashboard is in free-layout (unlocked) mode.
export interface WidgetProps {
  editing?: boolean;
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
// 卡片颜色
  background?: string;
  /** 卡片背景主题：light / dark / none，影响卡片内文字与图标的对比度处理。 */
  backgroundTheme?: 'light' | 'dark' | 'none';
}
export interface WidgetItem {
  id: string;
  /** 组件类型：决定渲染哪个组件、能否添加、尺寸选项等核心逻辑（复用全局 WidgetType 联合类型）。 */
  type: WidgetType;
  /** 标题 / 标签：组件创建时默认使用，同时用作「添加组件」模态框的展示文案（合并原 title 与 label）。 */
  title: string;
  /** 最大安装数量，有些只能安装一次，所以用它限制 */
  maxInstances: number;
  /** Size applied to a newly created widget of this type. */
  size: WidgetSize;
  /** Sizes offered in the size picker for this type. */
  sizeOptions: WidgetSize[];
  /** Whether this type can be added from the "添加组件" modal. */
  isAddable: boolean;
  /** Emoji/glyph shown in the add-widget picker. */
  logo: string;

  showHeader?: boolean;
  /** 点击事件：卡片被点击（非编辑模式）时触发，接收点击事件对象。合并原 onClick 与 onAction（后者统一走事件触发）。可选。 */
  onClick?: (event: any) => void;
  /** 封面：组件封面图地址，可选。 */
  cover?: string;
  /** 是否可删除：为 false 时该类型组件不可被用户删除（默认 true）。 */
  deletable?: boolean;

  /** 卡片外观样式集合：将卡片相关的视觉属性（内边距、毛玻璃模糊、边框、阴影、圆角）集中于此，便于统一配置。 */
  cardStyle?: CardStyle;
  // 私有数据：组件实例级别的自定义数据（快捷导航、图标站点、卡片背景等）集中存放。
  data: {
    /** 快捷导航等组件的私有数据空间：存储 SiteItem[]。 */
    shortcuts?: SiteItem[];
    /** 图标型组件（web-grid）携带的站点数据：从「网页列表」添加时存储的单个 SiteItem（图标图片取 site.logo、标签取 site.name、链接取 site.link、背景取 site.background）。 */
    site?: SiteItem;
  }
}


/**
 * 壁纸类型，三类完全区分：
 *  - `dynamic`  动效壁纸：由组件 / canvas 实现（dynamicPreset 决定具体动效）
 *  - `static`   静态壁纸：图片壁纸（imageUrl）
 *  - `gradient` 渐变壁纸：纯 CSS 渐变背景（gradient）
 */
export type WallpaperType = 'dynamic' | 'static' | 'gradient';

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
  /** 壁纸类型：决定渲染哪种壁纸（见 WallpaperType 注释） */
  type: WallpaperType;
  /** 仅 dynamic：动效预设 id */
  dynamicPreset?: DynamicPreset;
  /** 仅 static：静态图片地址 */
  imageUrl?: string;
  /** 仅 gradient：CSS 渐变背景字符串 */
  gradient?: string;
  blur: number; // 0 to 20px
  brightness: number; // 50% to 120%
  /** 以下为桌面主题滤镜参数（filter.options.ts 预设），缺省时视为中性值 */
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
