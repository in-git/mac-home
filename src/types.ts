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
// AI 模型对接配置
// ############################################################

/** 内置主流 AI 厂商（OpenAI 兼容接口） */
export interface AIProvider {
  /** 唯一标识 */
  id: string;
  /** 展示名 */
  label: string;
  /** API Base URL（不含末尾 /chat/completions） */
  baseURL: string;
  /** 该厂商推荐的默认模型名 */
  defaultModel: string;
  /** 官网/文档地址，便于用户获取 KEY */
  docs?: string;
}

/** 内置主流厂商预设 */
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    docs: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    docs: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'qwen',
    label: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    docs: 'https://dashscope.console.aliyun.com/apiKey',
  },
  {
    id: 'moonshot',
    label: 'Kimi (Moonshot)',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    docs: 'https://platform.moonshot.cn/console/api-keys',
  },
  {
    id: 'zhipu',
    label: '智谱 GLM',
    baseURL: 'https://open.bigmodel.cn/api/paitext/v1',
    defaultModel: 'glm-4-flash',
    docs: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  {
    id: 'anthropic',
    label: 'Claude (Azure/Official)',
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet',
    docs: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-1.5-flash',
    docs: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'custom',
    label: '自定义',
    baseURL: '',
    defaultModel: '',
  },
];

/** 用户在设置中保存的 AI 对接配置 */
export interface AIConfig {
  /** 选中的厂商 id（含 'custom'） */
  provider: string;
  /** 自定义厂商的 Base URL（当 provider==='custom' 或覆盖时使用） */
  baseURL: string;
  /** API Key */
  apiKey: string;
  /** 模型名（可手写，支持任意模型） */
  model: string;
}

/** AI 配置默认值：默认走后端内置通道，不直连 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  baseURL: '',
  apiKey: '',
  model: 'gpt-4o-mini',
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
