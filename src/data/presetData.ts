import { WidgetItem, StickyNote, WeatherCondition, QuickShortcut, WallpaperConfig } from '../types';

export const INITIAL_WIDGETS: WidgetItem[] = [
  { id: 'widget-search', type: 'search', title: '网络搜索', size: 'wide' },
  { id: 'widget-ai-chat', type: 'ai-chat', title: 'AI 大模型助手', size: 'large' },
  { id: 'widget-weather', type: 'weather', title: '天气预报', size: 'wide' },
  { id: 'widget-sticky', type: 'sticky-notes', title: '便签', size: 'wide' },
  { id: 'widget-clock', type: 'clock', title: '时间 & 日历', size: 'sm' },
  { id: 'widget-clock-mini', type: 'clock-mini', title: '时钟', size: 'sm' },
  { id: 'widget-shortcuts', type: 'shortcuts', title: '快捷导航', size: 'sm' },
  { id: 'widget-control', type: 'control-center', title: '控制中心', size: 'sm' },
  { id: 'widget-settings', type: 'settings', title: '设置', size: 'icon-1-8', showHeader: false,
    iconType: 'action', iconGlyph: 'Settings', iconLabel: '设置' },
  { id: 'widget-icon', type: 'icon-grid', title: '图标', size: 'icon-1-8', showHeader: false,
    iconType: 'link', iconGlyph: 'Globe', iconLabel: '官网', iconHref: 'https://www.apple.com' },
  { id: 'widget-add', type: 'icon-grid', title: '添加组件', size: 'icon-1-8', showHeader: false,
    iconType: 'action', iconGlyph: 'Plus', iconLabel: '添加' },
];

export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'dynamic',
  dynamicPreset: 'aurora',
  blur: 0,
  brightness: 100,
  contrast: 1,
  saturation: 1,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

export const STATIC_WALLPAPERS = [
  {
    id: 'sonoma-light',
    name: 'Sonoma Light',
    gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'sonoma-dusk',
    name: 'Sonoma Dusk',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'ventura-bloom',
    name: 'Ventura Bloom',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'minimal-slate',
    name: 'Studio Minimal Grey',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream Studio',
    gradient: 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)',
  },
  {
    id: 'dark-cyber-glass',
    name: 'Midnight Dark Glass',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
];

export const INITIAL_NOTES: StickyNote[] = [

];

export const PRESET_WEATHER: Record<string, WeatherCondition> = {
 

};

export const INITIAL_SHORTCUTS: QuickShortcut[] = [
  { id: 'sc-1', title: 'Apple 官网', url: 'https://www.apple.com.cn', iconName: 'Apple', category: '工具', bgColor: 'bg-black text-white' },
  { id: 'sc-2', title: 'GitHub', url: 'https://github.com', iconName: 'Github', category: '开发', bgColor: 'bg-slate-900 text-white' },
  { id: 'sc-3', title: 'Figma', url: 'https://www.figma.com', iconName: 'Palette', category: '设计', bgColor: 'bg-rose-500 text-white' },
  { id: 'sc-4', title: 'ChatGPT', url: 'https://chatgpt.com', iconName: 'Sparkles', category: 'AI', bgColor: 'bg-emerald-600 text-white' },
  { id: 'sc-5', title: 'Google AI Studio', url: 'https://ai.google.dev', iconName: 'Compass', category: 'AI', bgColor: 'bg-blue-600 text-white' },
  { id: 'sc-6', title: 'Notion 笔记', url: 'https://notion.so', iconName: 'StickyNote', category: '效率', bgColor: 'bg-stone-800 text-white' },
];
