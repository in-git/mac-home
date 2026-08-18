import { migrateData } from '../../utils/migration';
import type {
  AIConfig,
  CardRadiusTier,
  FontVariant,
  StickyNote,
  WallpaperConfig,
  WidgetItem,
} from '../../types';
import type { WeatherCity } from '../../utils/weatherApi';

// 主题色（强调色）唯一数据源，见 src/data/options/themeColors.options.ts
export { ACCENT_COLORS } from '../../data/options/themeColors.options';

// 导入后返回的全部可恢复字段（除 widgets / notes 必选外，其余均为可选，缺省时不覆盖当前值）。
export interface ParsedConfig {
  version?: number;
  widgets: WidgetItem[];
  notes: StickyNote[];
  wallpaper?: WallpaperConfig;
  isDarkMode?: boolean;
  themeColor?: string;
  soundEnabled?: boolean;
  fontVariant?: FontVariant;
  cardRadius?: CardRadiusTier;
  screenBrightness?: number;
  aiConfig?: AIConfig;
  petAutoActivity?: boolean;
  weatherCities?: WeatherCity[];
  selectedCityId?: string;
  lastLocation?: { city: string; lat: number; lon: number } | null;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

// 解析导入的配置文件（与“导出布局”格式对应：导出的本地存储全部持久化数据）。
// 先使用 migrateData 迁移/补全数据，再做类型过滤并返回。
export function parseImport(text: string): ParsedConfig {
  let rawData: unknown;
  try {
    rawData = JSON.parse(text);
  } catch {
    throw new Error('无法解析 JSON，请确认是导出的配置文件');
  }
  if (!isObject(rawData)) {
    throw new Error('配置文件格式不正确');
  }

  // 使用 migrateData 进行全量补全与版本升级迁移
  const data = migrateData<Record<string, any>>(rawData);
  const { widgets, notes } = data;
  if (!Array.isArray(widgets) || !Array.isArray(notes)) {
    throw new Error('配置缺少 widgets / notes 数据');
  }
  const validWidgets = widgets.filter(
    (w): w is WidgetItem =>
      !!w &&
      typeof w === 'object' &&
      typeof (w as WidgetItem).id === 'string' &&
      typeof (w as WidgetItem).type === 'string',
  );
  const validNotes = notes.filter(
    (n): n is StickyNote =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as StickyNote).id === 'string',
  );

  return {
    version: data.version,
    widgets: validWidgets,
    notes: validNotes,
    wallpaper: data.wallpaper,
    isDarkMode: data.isDarkMode,
    themeColor: data.themeColor,
    soundEnabled: data.soundEnabled,
    fontVariant: data.fontVariant,
    cardRadius: data.cardRadius,
    screenBrightness: data.screenBrightness,
    aiConfig: data.aiConfig,
    petAutoActivity: data.petAutoActivity,
    weatherCities: data.weatherCities,
    selectedCityId: data.selectedCityId,
    lastLocation: data.lastLocation,
  };
}
