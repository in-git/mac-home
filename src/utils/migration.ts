import dataJson from '../data/data.json';
import { ensureGrid } from '../components/dashboard/itemSize';
import { DEFAULT_CARD_STYLE } from '../data/widgetConfig';

/** 当前全局数据规范版本号 */
export const CURRENT_DATA_VERSION = 1;

/**
 * 核心数据版本迁移与自动修复函数。
 * 根据传入的数据及其 version 字段，对比 data.json 标准结构，
 * 自动补齐缺失的顶级字段与深层配置，保证老版本或缺失属性的数据可平滑升级。
 *
 * @param rawData 待校验/迁移的数据
 * @param currentVersion 当前系统的目标版本号（默认使用 CURRENT_DATA_VERSION，可传入 store 的状态版本）
 */
export function migrateData<T = Record<string, any>>(
  rawData: unknown,
  currentVersion: number = CURRENT_DATA_VERSION,
): T {
  const defaults = dataJson as Record<string, any>;

  // 如果原始数据非法，或者 version 与当前系统的目标版本号不一致，直接使用完整的 data.json 默认配置清空/重置本地数据
  if (
    !rawData ||
    typeof rawData !== 'object' ||
    Array.isArray(rawData) ||
    (rawData as Record<string, any>).version !== currentVersion
  ) {
    return JSON.parse(JSON.stringify(defaults)) as T;
  }

  const data = { ...(rawData as Record<string, any>) };
  const dataVersion = typeof data.version === 'number' ? data.version : 0;

  // 1. 检查顶级字段：若当前数据中不存在 data.json 中的某个属性，则使用默认值自动补全
  for (const key of Object.keys(defaults)) {
    if (key === 'exportedAt') continue;
    if (data[key] === undefined || data[key] === null) {
      data[key] = JSON.parse(JSON.stringify(defaults[key]));
    }
  }

  // 2. 针对 version < CURRENT_DATA_VERSION 或缺失版本的针对性处理与结构升级
  if (dataVersion < CURRENT_DATA_VERSION) {
    // 可以在此处针对具体旧版本号编写专项升级逻辑，例如：
    // if (dataVersion < 1) { ... }
  }

  // 3. widgets 嵌套小组件格式校验与缺失属性补全
  if (Array.isArray(data.widgets)) {
    data.widgets = data.widgets.map((w: any) => {
      if (!w || typeof w !== 'object') return w;
      const widget = { ...w };

      // 自动补齐缺少的 cardStyle
      widget.cardStyle = {
        ...DEFAULT_CARD_STYLE,
        ...(widget.cardStyle || {}),
      };

      // 自动补齐缺少的 data 字段
      if (!widget.data || typeof widget.data !== 'object') {
        widget.data = {};
      }

      // 自动补齐并修正网格 grid 坐标
      return ensureGrid(widget);
    });
  } else {
    data.widgets = JSON.parse(JSON.stringify(defaults.widgets));
  }

  // 4. 壁纸配置 (wallpaper) 属性深层补全
  if (data.wallpaper && typeof data.wallpaper === 'object') {
    data.wallpaper = {
      ...defaults.wallpaper,
      ...data.wallpaper,
    };
  } else {
    data.wallpaper = JSON.parse(JSON.stringify(defaults.wallpaper));
  }

  // 5. AI 配置 (aiConfig) 属性深层补全
  if (data.aiConfig && typeof data.aiConfig === 'object') {
    data.aiConfig = {
      ...defaults.aiConfig,
      ...data.aiConfig,
    };
  } else {
    data.aiConfig = JSON.parse(JSON.stringify(defaults.aiConfig));
  }

  // 6. 天气城市与定位补全
  if (!Array.isArray(data.weatherCities) || data.weatherCities.length === 0) {
    data.weatherCities = JSON.parse(JSON.stringify(defaults.weatherCities));
  }
  if (!data.selectedCityId) {
    data.selectedCityId = defaults.selectedCityId;
  }

  // 7. 同步并升级 version 字段
  data.version = CURRENT_DATA_VERSION;
  data.app = defaults.app || 'macOS 主页';

  return data as T;
}
