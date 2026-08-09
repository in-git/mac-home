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
      id: 'mac-bigsur-night',
      title: 'Big Sur Night',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #1b1f3b 0%, #3b2f63 45%, #6d5a8f 100%)',
    },
    {
      id: 'mac-monterey-dusk',
      title: 'Monterey Dusk',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #2a1a3e 0%, #5b3a7a 45%, #c06c9e 100%)',
    },
    {
      id: 'mac-ventura-deep',
      title: 'Ventura Deep',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0a2e2a 0%, #0f5a52 50%, #2bb6a4 100%)',
    },
    {
      id: 'mac-sonoma-noir',
      title: 'Sonoma Noir',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0d0d12 0%, #1c1c28 55%, #3a3a52 100%)',
    },
    {
      id: 'mac-sequoia-twilight',
      title: 'Sequoia Twilight',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #15102b 0%, #3a2b5c 50%, #6b4f9e 100%)',
    },
    {
      id: 'mac-space-black',
      title: 'Space Black',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #0b0b0f 0%, #1a1a22 50%, #2c2c38 100%)',
    },
    {
      id: 'mac-graphite',
      title: 'Graphite',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 50%, #636366 100%)',
    },
    {
      id: 'mac-indigo-night',
      title: 'Indigo Night',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #141433 0%, #2e2e6e 50%, #4f4fb0 100%)',
    },
    {
      id: 'mac-cosmos',
      title: 'Cosmos',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #05010f 0%, #1b0b3a 55%, #3d1f6e 100%)',
    },
    {
      id: 'mac-aurora-night',
      title: 'Aurora Night',
      theme: 'dark',
      gradient: 'linear-gradient(135deg, #04111f 0%, #0a3a4a 50%, #1f8a8a 100%)',
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
