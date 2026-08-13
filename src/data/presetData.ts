import {
  CardStyle,
  StickyNote,
  WeatherCondition,
  WidgetItem,
  WidgetSize,
  WidgetType,
} from '../types';
import dataJson from './data.json';
import {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
  PresetStaticWallpaper,
} from './options/gradient.options';
import { getWidgetConfig, DEFAULT_CARD_STYLE } from './widgetConfig';

export type { PresetStaticWallpaper };

// 桌面默认加载数据来自 src/data/data.json（可被用户导出 / 导入覆盖）。
// 该文件为完整导出格式：每个组件实例已自带 cardStyle（含 background / backgroundTheme 等自定义值）。
// 仅当 JSON 中缺失派生字段（maxInstances / sizeOptions / isAddable / logo / data）时，
// 才由类型级配置 getWidgetConfig 兜底，避免覆盖 JSON 中的自定义卡片样式。
type BaseWidgetSeed = {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetItem['size'];
  showHeader?: boolean;
  maxInstances?: number;
  sizeOptions?: WidgetSize[];
  isAddable?: boolean;
  logo?: string;
  cardStyle?: Partial<CardStyle>;
  data?: Record<string, unknown>;
};

const BASE_WIDGETS: BaseWidgetSeed[] = dataJson.widgets.map((w) => ({
  ...w,
  type: w.type as WidgetType,
  size: w.size as WidgetItem['size'],
  sizeOptions: w.sizeOptions as WidgetSize[] | undefined,
}));

export const PRESET_DATA = {
  DEFAULT_WALLPAPER,
  STATIC_WALLPAPERS,
  INITIAL_WIDGETS: BASE_WIDGETS.map((w) => {
    const cfg = getWidgetConfig(w.type as WidgetType);
    return {
      id: w.id,
      type: w.type,
      title: w.title,
      size: w.size,
      showHeader: w.showHeader ?? undefined,
      // JSON 中缺失的派生字段由类型级配置兜底，已存在的自定义值保留
      maxInstances: w.maxInstances ?? cfg.maxInstances,
      sizeOptions: w.sizeOptions ?? cfg.sizeOptions,
      isAddable: w.isAddable ?? cfg.isAddable,
      logo: w.logo ?? cfg.glyph,
      cardStyle: {
        ...DEFAULT_CARD_STYLE,
        ...cfg.cardStyle,
        // 以 data.json 中的 cardStyle（含 background / backgroundTheme）为准
        ...(w.cardStyle ?? {}),
      } as WidgetCardStyle,
      data: w.data ?? {},
    } as WidgetItem;
  }),

  INITIAL_NOTES: dataJson.notes as StickyNote[],

  PRESET_WEATHER: {} as Record<string, WeatherCondition>,
};
