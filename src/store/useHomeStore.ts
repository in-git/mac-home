import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESET_DATA } from '../data/presetData';
import { canAddWidget, DEFAULT_CARD_STYLE, getWidgetConfig } from '../data/widgetConfig';
import {
  AIConfig,
  CardRadiusTier,
  DEFAULT_AI_CONFIG,
  FontVariant,
  StickyNote as StickyNoteType,
  WallpaperConfig,
  WidgetItem,
  WidgetSize,
  WidgetType,
} from '../types';
import { DEFAULT_WEATHER_CITIES, WeatherCity } from '../utils/weatherApi';

// 桌宠对话历史上限：最多保留 10 轮（每轮 = 1 条 user + 1 条 assistant，
// 即最多 20 条消息），超出时自动删除最早的记录。
export const MAX_PET_CHAT_ROUNDS = 10;
export const MAX_PET_CHAT_MESSAGES = MAX_PET_CHAT_ROUNDS * 2;

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

interface HomeState {
  // Persisted data
  widgets: WidgetItem[];
  wallpaper: WallpaperConfig;
  notes: StickyNoteType[];
  isDarkMode: boolean;
  themeColor: string;
  soundEnabled: boolean;
  // 字体方案：A(12/14/16) / B(13/15/17) / C(14/16/18)
  fontVariant: FontVariant;
  // 卡片圆角：small / medium / large
  cardRadius: CardRadiusTier;
  // 屏幕亮度（10-100，100 为原始亮度），作用于整个桌面容器
  screenBrightness: number;
  // AI 模型对接配置（厂商 / 自定义 BaseURL / KEY / 模型名）
  aiConfig: AIConfig;
  // 桌宠对话历史（跨轮上下文，持久化），只存 user/assistant 文本，不含 tool 消息
  petChatHistory: import('../agent/types').AgentChatMessage[];
  // 桌宠自由活动开关（模型定时驱动移动/跳跃/问候），开启会消耗更多 token
  petAutoActivity: boolean;
  // 天气卡片已添加的城市列表（持久化，跟随主页整体存储）
  weatherCities: WeatherCity[];
  // 当前选中的天气城市 id（持久化，保证下次进入恢复上次的查看/定位城市）
  selectedCityId: string;
  // 最近一次成功定位的位置（持久化，控制中心位置模块下次进入时回显）
  lastLocation: { city: string; lat: number; lon: number } | null;

  // Widget actions
  setWidgets: (widgets: WidgetItem[]) => void;
  addWidget: (type: WidgetType) => void;
  deleteWidget: (id: string) => void;
  resizeWidget: (id: string, newSize: WidgetSize) => void;
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
  // 桌宠对话历史写入（追加本轮 user/assistant 消息）
  setPetChatHistory: (
    messages: import('../agent/types').AgentChatMessage[],
  ) => void;
  setPetAutoActivity: (value: boolean) => void;
  // 天气城市：整体替换列表（增/删/改后调用），并在被删城市为当前选中时回退选中项
  setWeatherCities: (cities: WeatherCity[]) => void;
  // 切换当前选中的天气城市
  setSelectedCityId: (id: string) => void;
  /** 写入最近一次成功定位的位置（null 表示清除）。 */
  setLastLocation: (
    loc: { city: string; lat: number; lon: number } | null,
  ) => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      widgets: readLegacy(
        'apple_homepage_widgets',
        PRESET_DATA.INITIAL_WIDGETS,
      ),
      wallpaper: readLegacy(
        'apple_homepage_wallpaper',
        PRESET_DATA.DEFAULT_WALLPAPER,
      ),
      notes: readLegacy('apple_homepage_notes', PRESET_DATA.INITIAL_NOTES),
      isDarkMode:
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches,
      themeColor: '#007AFF',
      soundEnabled: readLegacy('apple_homepage_sound_enabled', true),
      fontVariant: 'A',
      cardRadius: 'large',
      screenBrightness: 100,
      aiConfig: readLegacy('apple_homepage_ai_config', DEFAULT_AI_CONFIG),
      petChatHistory: [],
      // 默认关闭自由活动（开启会持续消耗模型 token）
      petAutoActivity: false,
      // 天气默认城市（广州/上海/北京/深圳/杭州），首次启动后由 persist 接管
      weatherCities: DEFAULT_WEATHER_CITIES,
      // 默认选中第一个城市
      selectedCityId: DEFAULT_WEATHER_CITIES[0]?.id ?? '',
      // 尚未定位过，无回显位置
      lastLocation: null,

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
        const newWidget: WidgetItem = {
          id: `widget-${Date.now()}`,
          type,
          title: count > 0 ? `${cfg.title} ${count + 1}` : cfg.title,
          maxInstances: cfg.maxInstances,
          size: cfg.size,
          sizeOptions: cfg.sizeOptions,
          isAddable: cfg.isAddable,
          logo: cfg.logo,
          // Header visibility is driven by the type-level config (default: shown).
          showHeader: cfg.showHeader ?? true,
          cardStyle: {
            ...DEFAULT_CARD_STYLE,
            ...cfg.cardStyle,
            // 新建卡片默认与右键「切换卡片背景 → 透明」一致：亮色文本主题（深色前景 #1d1d1f），
            // 颜色由 index.css 的 --card-fg 变量控制，此处不写死任何颜色值。
            backgroundTheme: 'light',
          },
          // 类型级提供的私有数据默认值（如快捷导航的空列表）放在 data 下。
          data: {
            ...(cfg.data?.shortcuts ? { shortcuts: cfg.data.shortcuts } : {}),
            ...(cfg.data?.site ? { site: cfg.data.site } : {}),
          },
        };
        set({ widgets: [...widgets, newWidget] });
      },

      deleteWidget: (id) => {
        set({ widgets: get().widgets.filter((w) => w.id !== id) });
      },

      resizeWidget: (id, newSize) => {
        set({
          widgets: get().widgets.map((w) =>
            w.id === id ? { ...w, size: newSize } : w,
          ),
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
                    background: background ?? undefined,
                    backgroundTheme: backgroundTheme,
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
          widgets: PRESET_DATA.INITIAL_WIDGETS,
          wallpaper: PRESET_DATA.DEFAULT_WALLPAPER,
        });
      },

      resetAll: () => {
        set({
          widgets: PRESET_DATA.INITIAL_WIDGETS,
          wallpaper: PRESET_DATA.INITIAL_WALLPAPER,
          notes: PRESET_DATA.INITIAL_NOTES,
          // 其余系统配置整体恢复为 data.json 中的默认值
          ...PRESET_DATA.INITIAL_CONFIG,
        });
      },

      updateNotes: (notes) => set({ notes }),
      updateWallpaper: (cfg) =>
        set({ wallpaper: { ...get().wallpaper, ...cfg } }),
      setDarkMode: (value) => set({ isDarkMode: value }),
      setThemeColor: (color) => set({ themeColor: color }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setFontVariant: (variant) => set({ fontVariant: variant }),
      setCardRadius: (tier) => set({ cardRadius: tier }),
      setScreenBrightness: (value) =>
        set({ screenBrightness: Math.max(10, Math.min(100, value)) }),
      setAiConfig: (patch) =>
        set({ aiConfig: { ...get().aiConfig, ...patch } }),
      setPetChatHistory: (messages) =>
        // 统一在 store 层截断到最近 10 轮，超出自动删除最早记录（调用方无需各自处理）
        set({ petChatHistory: messages.slice(-MAX_PET_CHAT_MESSAGES) }),
      setPetAutoActivity: (value) => set({ petAutoActivity: value }),
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
    }),
    {
      name: 'apple-homepage-store',
      // Only persist the data slices, not the action functions.
      partialize: (state) => ({
        widgets: state.widgets,
        wallpaper: state.wallpaper,
        notes: state.notes,
        isDarkMode: state.isDarkMode,
        themeColor: state.themeColor,
        soundEnabled: state.soundEnabled,
        fontVariant: state.fontVariant,
        cardRadius: state.cardRadius,
        screenBrightness: state.screenBrightness,
        aiConfig: state.aiConfig,
        petAutoActivity: state.petAutoActivity,
        weatherCities: state.weatherCities,
        selectedCityId: state.selectedCityId,
        lastLocation: state.lastLocation,
      }),
    },
  ),
);
