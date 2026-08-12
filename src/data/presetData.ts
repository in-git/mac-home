import {
  StickyNote,
  WeatherCondition,
  WidgetItem,
} from '../types';
import {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
  PresetStaticWallpaper,
} from './options/gradient.options';

export type { PresetStaticWallpaper };

export const PRESET_DATA = {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
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
};
