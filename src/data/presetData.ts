import {
  AIConfig,
  CardRadiusTier,
  FontVariant,
  WallpaperConfig,
  WeatherCondition,
  WidgetItem,

} from '../types';
import { WeatherCity } from '../utils/weatherApi';
import dataJson from './data.json';
import {
  STATIC_WALLPAPERS,
  PresetStaticWallpaper,
} from './options/gradient.options';

export type { PresetStaticWallpaper };




export const PRESET_DATA = {
  STATIC_WALLPAPERS,
  PRESET_WEATHER: {} as Record<string, WeatherCondition>,
  // 完整默认状态（与 src/data/data.json 导出完全一致）：
  // 首次加载与重置系统（resetAll / resetLayout）统一使用这一份配置。
  DEFAULT_STATE: {
    ...dataJson,
    widgets: dataJson.widgets as WidgetItem[],
    wallpaper: dataJson.wallpaper as WallpaperConfig,
    notes: [],
    fontVariant: dataJson.fontVariant as FontVariant,
    cardRadius: dataJson.cardRadius as CardRadiusTier,
    screenBrightness: dataJson.screenBrightness,
    aiConfig: dataJson.aiConfig as AIConfig,
    weatherCities: dataJson.weatherCities as WeatherCity[],
  },
};
