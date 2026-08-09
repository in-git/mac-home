import type { WallpaperItem } from '../api/wallpaper';
import {
  QuickShortcut,
  StickyNote,
  WallpaperConfig,
  WeatherCondition,
  WidgetItem,
} from '../types';

/** 系统预设静态壁纸：兼容 WallpaperItem 字段，另带渐变背景（无图时兜底） */
export type PresetStaticWallpaper = WallpaperItem & {
  gradient?: string;
  /** 明暗适配：亮色模式只显示 'light'，暗色模式只显示 'dark'；'both' 两端均显示 */
  theme?: 'light' | 'dark' | 'both';
};

export const PRESET_DATA = {
  INITIAL_WIDGETS: [
    { id: 'widget-search', type: 'search', title: '网络搜索', size: 'wide' },
    { id: 'widget-weather', type: 'weather', title: '天气预报', size: 'wide' },
    { id: 'widget-sticky', type: 'sticky-notes', title: '便签', size: 'wide' },
    { id: 'widget-clock', type: 'clock', title: '时间 & 日历', size: 'sm' },
    { id: 'widget-clock-mini', type: 'clock-mini', title: '时钟', size: 'sm' },
    {
      id: 'widget-shortcuts',
      type: 'shortcuts',
      title: '快捷导航',
      size: 'sm',
    },
    {
      id: 'widget-control',
      type: 'control-center',
      title: '控制中心',
      size: 'sm',
    },
    {
      id: 'widget-settings',
      type: 'settings',
      title: '设置',
      size: 'icon-1-8',
      showHeader: false,
      iconType: 'action',
      iconGlyph: 'Settings',
      iconLabel: '设置',
    },
    {
      id: 'widget-icon',
      type: 'icon-grid',
      title: '图标',
      size: 'icon-1-8',
      showHeader: false,
      iconType: 'link',
      iconGlyph: 'Globe',
      iconLabel: '官网',
      iconHref: 'https://www.apple.com',
    },
    {
      id: 'widget-add',
      type: 'icon-grid',
      title: '添加组件',
      size: 'icon-1-8',
      showHeader: false,
      iconType: 'action',
      iconGlyph: 'Plus',
      iconLabel: '添加',
    },
  ] as WidgetItem[],

  DEFAULT_WALLPAPER: {
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
  } as WallpaperConfig,

  STATIC_WALLPAPERS: [
    {
      id: 'sonoma-light',
      title: 'Sonoma Light',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
      imageUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'sonoma-dusk',
      title: 'Sonoma Dusk',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      imageUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'ventura-bloom',
      title: 'Ventura Bloom',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      imageUrl:
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'minimal-slate',
      title: 'Studio Minimal Grey',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    },
    {
      id: 'warm-cream',
      title: 'Warm Cream Studio',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)',
    },
    {
      id: 'dark-cyber-glass',
      title: 'Midnight Dark Glass',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
    {
      id: 'aurora-mint',
      title: 'Aurora Mint',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
    {
      id: 'sunset-glow',
      title: 'Sunset Glow',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    },
    {
      id: 'ocean-depth',
      title: 'Ocean Depth',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    },
    {
      id: 'forest-mist',
      title: 'Forest Mist',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    },
    {
      id: 'lilac-dream',
      title: 'Lilac Dream',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    },
    {
      id: 'peach-sunrise',
      title: 'Peach Sunrise',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    },
    {
      id: 'cobalt-night',
      title: 'Cobalt Night',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #1a2a6c 0%, #2a5298 100%)',
    },
    {
      id: 'rose-quartz',
      title: 'Rose Quartz',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    },
    {
      id: 'emerald-veil',
      title: 'Emerald Veil',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    },
    {
      id: 'amber-dusk',
      title: 'Amber Dusk',
      theme: 'light',
      gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    },
    {
      id: 'nebula-violet',
      title: 'Nebula Violet',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0b0614 0%, #2d1b4e 50%, #4b2c7f 100%)',
    },
    {
      id: 'abyss-blue',
      title: 'Abyss Blue',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #020024 0%, #090979 50%, #00d4ff 100%)',
    },
    {
      id: 'charcoal-steel',
      title: 'Charcoal Steel',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    },
    {
      id: 'magma-red',
      title: 'Magma Red',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #1a0000 0%, #5a0000 50%, #e53935 100%)',
    },
    {
      id: 'deep-forest-night',
      title: 'Deep Forest Night',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0b1d0f 0%, #16321c 50%, #1f5c34 100%)',
    },
    {
      id: 'midnight-purple',
      title: 'Midnight Purple',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    },
    {
      id: 'ice-cave',
      title: 'Ice Cave',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0b1a2b 0%, #13344f 50%, #2a6f97 100%)',
    },
    {
      id: 'gold-ember',
      title: 'Gold Ember',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #1a0e00 0%, #5c3a00 50%, #c9952b 100%)',
    },
    {
      id: 'toxic-green',
      title: 'Toxic Green',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #001a0d 0%, #014421 50%, #39ff14 100%)',
    },
    {
      id: 'crimson-rose',
      title: 'Crimson Rose',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #200016 0%, #5e1a3a 50%, #c2185b 100%)',
    },
    {
      id: 'storm-grey',
      title: 'Storm Grey',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #16222a 0%, #3a6073 100%)',
    },
    {
      id: 'cosmic-teal',
      title: 'Cosmic Teal',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #02111b 0%, #00343f 50%, #00808a 100%)',
    },
  ] as PresetStaticWallpaper[],

  INITIAL_NOTES: [] as StickyNote[],

  PRESET_WEATHER: {} as Record<string, WeatherCondition>,

  INITIAL_SHORTCUTS: [
    {
      id: 'sc-1',
      title: 'Apple 官网',
      url: 'https://www.apple.com.cn',
      iconName: 'Apple',
      category: '工具',
      bgColor: 'bg-black text-white',
    },
    {
      id: 'sc-2',
      title: 'GitHub',
      url: 'https://github.com',
      iconName: 'Github',
      category: '开发',
      bgColor: 'bg-slate-900 text-white',
    },
    {
      id: 'sc-3',
      title: 'Figma',
      url: 'https://www.figma.com',
      iconName: 'Palette',
      category: '设计',
      bgColor: 'bg-rose-500 text-white',
    },
    {
      id: 'sc-4',
      title: 'ChatGPT',
      url: 'https://chatgpt.com',
      iconName: 'Sparkles',
      category: 'AI',
      bgColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'sc-5',
      title: 'Google AI Studio',
      url: 'https://ai.google.dev',
      iconName: 'Compass',
      category: 'AI',
      bgColor: 'bg-blue-600 text-white',
    },
    {
      id: 'sc-6',
      title: 'Notion 笔记',
      url: 'https://notion.so',
      iconName: 'StickyNote',
      category: '效率',
      bgColor: 'bg-stone-800 text-white',
    },
  ] as QuickShortcut[],
};
