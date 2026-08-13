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
// 对 widgets / notes 做宽松校验并过滤出有效项，其余字段按类型校验后选择性返回，结构不合法时抛错提示用户。
export function parseImport(text: string): ParsedConfig {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('无法解析 JSON，请确认是导出的配置文件');
  }
  if (!isObject(data)) {
    throw new Error('配置文件格式不正确');
  }
  const { widgets, notes } = data as { widgets?: unknown; notes?: unknown };
  if (!Array.isArray(widgets) || !Array.isArray(notes)) {
    throw new Error('配置缺少 widgets / notes 数据');
  }
  const validWidgets = widgets.filter(
    (w): w is WidgetItem =>
      !!w &&
      typeof w === 'object' &&
      typeof (w as WidgetItem).id === 'string' &&
      typeof (w as WidgetItem).type === 'string' &&
      typeof (w as WidgetItem).size === 'string',
  );
  const validNotes = notes.filter(
    (n): n is StickyNote =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as StickyNote).id === 'string',
  );
  if (widgets.length > 0 && validWidgets.length === 0) {
    throw new Error('未找到有效的小组件数据');
  }

  // 桌面背景：存在且结构合法时才纳入导入。
  let wallpaper: WallpaperConfig | undefined;
  if (isObject(data.wallpaper)) {
    const wp = data.wallpaper as Partial<WallpaperConfig>;
    if (
      typeof wp.type === 'string' &&
      Array.isArray(wp.colors) &&
      (wp.type !== 'static' || typeof wp.image === 'string')
    ) {
      wallpaper = wp as WallpaperConfig;
    }
  }

  const str = (v: unknown): string | undefined =>
    typeof v === 'string' ? v : undefined;
  const bool = (v: unknown): boolean | undefined =>
    typeof v === 'boolean' ? v : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
  const arr = (v: unknown): unknown[] | undefined =>
    Array.isArray(v) ? v : undefined;

  return {
    widgets: validWidgets,
    notes: validNotes,
    wallpaper,
    isDarkMode: bool(data.isDarkMode),
    themeColor: str(data.themeColor),
    soundEnabled: bool(data.soundEnabled),
    fontVariant: str(data.fontVariant) as FontVariant | undefined,
    cardRadius: str(data.cardRadius) as CardRadiusTier | undefined,
    screenBrightness: num(data.screenBrightness),
    aiConfig: isObject(data.aiConfig)
      ? (data.aiConfig as AIConfig)
      : undefined,
    petAutoActivity: bool(data.petAutoActivity),
    weatherCities: arr(data.weatherCities) as WeatherCity[] | undefined,
    selectedCityId: str(data.selectedCityId),
    lastLocation: isObject(data.lastLocation)
      ? (data.lastLocation as { city: string; lat: number; lon: number })
      : data.lastLocation === null
        ? null
        : undefined,
  };
}
