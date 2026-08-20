import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_ROLE_ID } from '../data/roles';
import { PRESET_DATA } from '../data/presetData';
import { canAddWidget, DEFAULT_CARD_STYLE, getWidgetConfig } from '../data/widgetConfig';
import { ensureGrid, findFirstAvailablePosition } from '../components/dashboard/itemSize';
import { migrateData } from '../utils/migration';
import {
  AIConfig,
  CardRadiusTier,
  FontVariant,
  StickyNote as StickyNoteType,
  WallpaperConfig,
  WidgetItem,
  WidgetType,
} from '../types';
import { WeatherCity } from '../utils/weatherApi';
import { type WidgetSizeOption } from '@/data/options/size.options';

// One-time migration from the previous per-key localStorage layout so existing
// user data is not lost when switching to the single-store persist key.
function readLegacy<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// 默认配置：首次加载与重置系统统一使用 data.json（见 presetData.DEFAULT_STATE）
const DEFAULT_STATE = PRESET_DATA.DEFAULT_STATE;

interface HomeState {
  // Persisted data
  widgets: WidgetItem[];
  // 当前数据版本号
  version: number;
  // 壁纸配置
  wallpaper: WallpaperConfig;
  notes: StickyNoteType[];
  // 是否开启暗黑模式
  isDarkMode: boolean;
  // 主题颜色
  themeColor: string;
  // 是否开启音效
  soundEnabled: boolean;
  // 字体方案
  fontVariant: FontVariant;
  // 卡片圆角：small / medium / large
  cardRadius: CardRadiusTier;
  // 屏幕亮度（10-100，100 为原始亮度），作用于整个桌面容器
  screenBrightness: number;
  // AI 模型对接配置（厂商 / 自定义 BaseURL / KEY / 模型名）
  aiConfig: AIConfig;

  // 桌宠自由活动开关（模型定时驱动移动/跳跃/问候），开启会消耗更多 token
  petAutoActivity: boolean;
  // 当前选中的桌宠形象（角色皮肤 id），持久化以便下次进入恢复
  selectedRoleId: string;
  // 天气卡片已添加的城市列表（持久化，跟随主页整体存储）
  weatherCities: WeatherCity[];
  // 当前选中的天气城市 id（持久化，保证下次进入恢复上次的查看/定位城市）
  selectedCityId: string;
  // 最近一次成功定位的位置（持久化，控制中心位置模块下次进入时回显）
  lastLocation?: { city: string; lat: number; lon: number } | null;
  // 是否显示桌面图标（清屏功能，false 时隐藏所有组件）
  showDesktopIcons: boolean;

  // Widget actions
  setWidgets: (widgets: WidgetItem[]) => void;
  addWidget: (type: WidgetType) => void;
  deleteWidget: (id: string) => void;
  resizeWidget: (id: string, newSize: WidgetSizeOption) => void;
  moveToTopWidget: (id: string) => void;
  /** 局部更新某个 widget 的任意字段（用于图标编辑等）。 */
  updateWidget: (id: string, patch: Partial<WidgetItem>) => void;
  updateWidgetBackground: (
    id: string,
    background: string | undefined,
    backgroundTheme?: 'light' | 'dark',
  ) => void;
  resetLayout: () => void;
  // 重置系统：恢复所有持久化配置（布局、壁纸、便签、外观、主题色、音效、字号、亮度）
  resetAll: () => void;

  // Notes / Wallpaper / Appearance
  updateNotes: (notes: StickyNoteType[]) => void;
  updateWallpaper: (cfg: Partial<WallpaperConfig>) => void;
  setDarkMode: (value: boolean) => void;
  setThemeColor: (color: string) => void;
  setSoundEnabled: (value: boolean) => void;
  setFontVariant: (variant: FontVariant) => void;
  setCardRadius: (tier: CardRadiusTier) => void;
  setScreenBrightness: (value: number) => void;
  setAiConfig: (patch: Partial<AIConfig>) => void;
  setPetAutoActivity: (value: boolean) => void;
  /** 切换当前桌宠形象（角色皮肤 id）。 */
  setSelectedRoleId: (id: string) => void;
  // 天气城市：整体替换列表（增/删/改后调用），并在被删城市为当前选中时回退选中项
  setWeatherCities: (cities: WeatherCity[]) => void;
  // 切换当前选中的天气城市
  setSelectedCityId: (id: string) => void;
  /** 写入最近一次成功定位的位置（null 表示清除）。 */
  setLastLocation: (
    loc: { city: string; lat: number; lon: number } | null,
  ) => void;
  /** 切换是否显示桌面图标（清屏功能）。 */
  setShowDesktopIcons: (value: boolean) => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // 默认配置（data.json）整体展开，首次启动后由 persist 接管；
      // 下方仅覆盖需要旧版 localStorage 迁移的字段与对话历史。
      ...DEFAULT_STATE,
      widgets: (readLegacy<WidgetItem[]>('apple_homepage_widgets', DEFAULT_STATE.widgets)).map(
        (w) => ensureGrid(w),
      ),
      wallpaper: readLegacy('apple_homepage_wallpaper', DEFAULT_STATE.wallpaper),
      notes: readLegacy('apple_homepage_notes', DEFAULT_STATE.notes),
      soundEnabled: readLegacy('apple_homepage_sound_enabled', DEFAULT_STATE.soundEnabled),
      aiConfig: readLegacy('apple_homepage_ai_config', DEFAULT_STATE.aiConfig),
      selectedRoleId: DEFAULT_ROLE_ID,
      showDesktopIcons: true,

      setWidgets: (widgets) => set({ widgets }),

      addWidget: (type) => {
        const { widgets } = get();
        const count = widgets.filter((w) => w.type === type).length;

        if (!canAddWidget(type, count)) {
          // Already at the cap for this type — bring the existing one to the top
          // instead of adding a duplicate.
          const existing = widgets.find((w) => w.type === type);
          if (existing) get().moveToTopWidget(existing.id);
          return;
        }

        const cfg = getWidgetConfig(type);
        const targetW = cfg.grid?.w ?? 1;
        const targetH = cfg.grid?.h ?? 1;
        const pos = findFirstAvailablePosition(widgets, targetW, targetH);

        const newWidget: WidgetItem = {
          id: `widget-${Date.now()}`,
          type,
          title: count > 0 ? `${cfg.title} ${count + 1}` : cfg.title,
          maxInstances: cfg.maxInstances,
          isAddable: cfg.isAddable,
          cardStyle: {
            ...DEFAULT_CARD_STYLE,
            ...cfg.cardStyle,
            // 新建卡片默认与右键「切换卡片背景 → 透明」一致：亮色文本主题（深色前景 #1d1d1f），
            // 颜色由 index.css 的 --card-fg 变量控制，此处不写死任何颜色值。
            backgroundTheme: 'light',
          },
          // 类型级提供的私有数据默认值放在 data 下。
          data: {
            ...(cfg.data?.site ? { site: cfg.data.site } : {}),
          },
          // 初始网格坐标：查找桌面剩余空间计算出的 x, y
          grid: {
            x: pos.x,
            y: pos.y,
            w: targetW,
            h: targetH,
          },
        };
        set({ widgets: [...widgets, newWidget] });
      },

      deleteWidget: (id) => {
        set({ widgets: get().widgets.filter((w) => w.id !== id) });
      },

      resizeWidget: (id, newSize) => {
        set({
          widgets: get().widgets.map((w) => {
            if (w.id !== id) return w;
            // 档位未配置 h 时仅调整宽度、保留当前高度
            const newH = newSize.h ?? w.grid?.h ?? 5;
            return {
              ...w,
              size: newSize.w,
              grid: { ...w.grid, w: newSize.w, h: newH },
            };
          }),
        });
      },

      moveToTopWidget: (id) => {
        const { widgets } = get();
        const target = widgets.find((w) => w.id === id);
        if (!target) return;
        const rest = widgets.filter((w) => w.id !== id);
        set({ widgets: [target, ...rest] });
      },

      updateWidgetBackground: (id, background, backgroundTheme) => {
        set({
          widgets: get().widgets.map((w) =>
            w.id === id
              ? {
                ...w,
                cardStyle: {
                  ...w.cardStyle,
                  background,
                  backgroundTheme,
                },
              }
              : w,
          ),
        });
      },

      updateWidget: (id, patch) => {
        set({
          widgets: get().widgets.map((w) =>
            w.id === id ? { ...w, ...patch } : w,
          ),
        });
      },

      resetLayout: () => {
        set({
          widgets: DEFAULT_STATE.widgets,
          wallpaper: DEFAULT_STATE.wallpaper,
        });
      },

      resetAll: () => {
        // 重置系统：整体恢复为 data.json 默认配置
        set(DEFAULT_STATE);
      },

      updateNotes: (notes) => set({ notes }),
      updateWallpaper: (cfg) =>
        set(() => {
          const prev = get().wallpaper;
          // 切换壁纸类型时，隔离三种类型各自的专属字段（dynamicPreset / imageUrl / gradient），
          // 避免浅合并导致跨类型字段残留，从而误判选中态。公共滤镜字段（blur/brightness 等）保留。
          if (cfg.type && cfg.type !== prev.type) {
            const base = {
              type: cfg.type,
              blur: prev.blur,
              brightness: prev.brightness,
              contrast: prev.contrast,
              saturation: prev.saturation,
              hue: prev.hue,
              sepia: prev.sepia,
              grayscale: prev.grayscale,
              invert: prev.invert,
            };
            const typed: Partial<WallpaperConfig> =
              cfg.type === 'dynamic'
                ? { dynamicPreset: undefined, imageUrl: undefined, gradient: undefined }
                : cfg.type === 'static'
                  ? { dynamicPreset: undefined, imageUrl: undefined, gradient: undefined }
                  : { dynamicPreset: undefined, imageUrl: undefined, gradient: undefined };
            return { wallpaper: { ...base, ...typed, ...cfg } as WallpaperConfig };
          }
          return { wallpaper: { ...prev, ...cfg } };
        }),
      setDarkMode: (value) => set({ isDarkMode: value }),
      setThemeColor: (color) => set({ themeColor: color }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setFontVariant: (variant) => set({ fontVariant: variant }),
      setCardRadius: (tier) => set({ cardRadius: tier }),
      setScreenBrightness: (value) =>
        set({ screenBrightness: Math.max(10, Math.min(100, value)) }),
      setAiConfig: (patch) =>
        set({ aiConfig: { ...get().aiConfig, ...patch } }),
  
      setPetAutoActivity: (value) => set({ petAutoActivity: value }),
      setSelectedRoleId: (id) => set({ selectedRoleId: id }),
      setWeatherCities: (cities) =>
        set((state) => ({
          weatherCities: cities,
          // 若被删除的城市恰好是当前选中项，则回退到列表中第一个城市
          selectedCityId: cities.some((c) => c.id === state.selectedCityId)
            ? state.selectedCityId
            : cities[0]?.id ?? '',
        })),
      setSelectedCityId: (id) => set({ selectedCityId: id }),
      setLastLocation: (lastLocation) => set({ lastLocation }),
      setShowDesktopIcons: (value) => set({ showDesktopIcons: value }),
    }),
    {
      name: 'apple-homepage-store',
      // Only persist the data slices, not the action functions.
      partialize: (state) => ({
        ...state
      }),
      // hydration 后用 ensureGrid 补齐旧数据中缺失的 grid 坐标，
      // 保证 grid 必选契约在任意持久化数据下都成立。
      // 注意：zustand persist 写入的结构是 { state: {...}, version }，
      // 需要先解包出真正的 state 再交给 migrateData，否则 migrateData
      // 会把 data.json 默认值（widgets 等）整体覆盖回本地数据，导致
      // 卡片背景等自定义配置丢失。
      merge: (persisted, current) => {
        const persistedAny = persisted as Record<string, any>;
        const realPersisted = persistedAny?.state ?? persistedAny;
        const migrated = migrateData<Partial<HomeState>>(realPersisted);
        return { ...current, ...migrated };
      },
    },
  ),
);
