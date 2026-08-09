import {
  QuickShortcut,
  StickyNote,
  WeatherCondition,
  WidgetItem,
} from '../types';
import {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
  STATIC_IMAGE_WALLPAPERS,
  PresetStaticWallpaper,
} from './options/gradient.options';

export type { PresetStaticWallpaper };

export const PRESET_DATA = {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
  STATIC_IMAGE_WALLPAPERS,
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
  ] 
};
