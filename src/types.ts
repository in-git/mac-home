export type WidgetType =
  | 'sticky-notes'
  | 'weather'
  | 'tasks'
  | 'clock'
  | 'shortcuts'
  | 'control-center'
  | 'icon-grid';

export type WidgetSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'wide'
  | 'tall'
  | 'large'
  | 'icon-1-6'
  | 'icon-1-8'
  | 'icon-1-12'
  | 'icon-1-16';

// Icon configuration for `icon-grid` widgets. Mirrors the shape consumed by
// <IconWidget>: a glyph (emoji), a caption, and either a link or an action.
export type IconKind = 'link' | 'action';

export interface IconConfig {
  glyph: string;
  label: string;
  /** link → open href in a new tab; action → invoke action()/onAction() */
  kind: IconKind;
  /** Required when kind === 'link' */
  href?: string;
  /** Required when kind === 'action' */
  action?: () => void;
}

// Mapping between the internal size tokens and the human-readable fractions
// shown in the UI (e.g. "1/2", "1:1"). Used for the size picker labels.
export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  sm: '1/4',
  md: '1/3',
  lg: '1/4',
  wide: '1/2',
  tall: '1/3',
  large: '1:1',
  'icon-1-6': '1/6',
  'icon-1-8': '1/8',
  'icon-1-12': '1/12',
  'icon-1-16': '1:16',
};

// Each widget type exposes its own set of allowed sizes. This drives both the
// right-click size picker and the size dropdown so that every component only
// offers the sizes that make sense for it.
export const WIDGET_SIZE_OPTIONS: Record<WidgetType, WidgetSize[]> = {
  weather: ['wide', 'large'], // 1/2, 1:1
  shortcuts: ['wide', 'md', 'large'], // 1/2, 1/3, 1:1
  'icon-grid': ['icon-1-6', 'icon-1-8', 'icon-1-12', 'icon-1-16'], // 1/6, 1/8, 1/12, 1:16 (square 1:1)
  'sticky-notes': ['sm', 'md', 'wide', 'large'],
  tasks: ['sm', 'md', 'wide', 'large'],
  clock: ['sm', 'md', 'wide', 'large'],
  'control-center': ['sm', 'md'],
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
  // Optional per-widget icon config (used by `icon-grid` widgets). When set,
  // it overrides the default demo icon rendered by <IconWidget>.
  icon?: IconConfig;
}

export type WallpaperType = 'dynamic' | 'static';

export type DynamicPreset = 'aurora' | 'day-night' | 'particles' | 'mesh-wave';

export interface WallpaperConfig {
  type: WallpaperType;
  dynamicPreset?: DynamicPreset;
  imageUrl?: string;
  gradient?: string;
  blur: number; // 0 to 20px
  brightness: number; // 50% to 120%
}

export type NoteColor = 'yellow' | 'mint' | 'pink' | 'lavender' | 'blue' | 'glass';

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

export type TaskPriority = 'low' | 'medium' | 'high';

export interface ReminderTask {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  completed: boolean;
  priority: TaskPriority;
  category: 'today' | 'scheduled' | 'work' | 'personal';
  hasAlarm?: boolean;
  alarmSound?: boolean;
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
  hourlyForecast: { time: string; temp: number; condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunder' }[];
  dailyForecast: { day: string; high: number; low: number; condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunder' }[];
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
  isFocusMode: boolean;
  volume: number;
  brightness: number;
  cpuUsage: number;
  memoryUsage: number;
  soundEnabled: boolean;
  isLayoutLocked: boolean;
}
