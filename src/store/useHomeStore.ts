import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_ROLE_ID } from '../data/roles';
import { PRESET_DATA } from '../data/presetData';
import { canAddWidget, DEFAULT_CARD_STYLE, getWidgetConfig } from '../data/widgetConfig';
import {
  AIConfig,
  CardRadiusTier,
  FontVariant,
  StickyNote as StickyNoteType,
  WallpaperConfig,
  WidgetItem,
  WidgetSize,
  WidgetType,
} from '../types';
import { WeatherCity } from '../utils/weatherApi';

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

// 默认配置：首次加载与重置系统统一使用 data.json（见 presetData.DEFAULT_STATE）
const DEFAULT_STATE = PRESET_DATA.DEFAULT_STATE;

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
  // 当前选中的桌宠形象（角色皮肤 id），持久化以便下次进入恢复
  selectedRoleId: string;
  // 天气卡片已添加的城市列表（持久化，跟随主页整体存储）
  weatherCities: WeatherCity[];
  // 当前选中的天气城市 id（持久化，保证下次进入恢复上次的查看/定位城市）
  selectedCityId: string;
  // 最近一次成功定位的位置（持久化，控制中心位置模块下次进入时回显）
  lastLocation?: { city: string; lat: number; lon: number } | null;

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
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      // 默认配置（data.json）整体展开，首次启动后由 persist 接管；
      // 下方仅覆盖需要旧版 localStorage 迁移的字段与对话历史。
      ...DEFAULT_STATE,
      widgets: readLegacy('apple_homepage_widgets', DEFAULT_STATE.widgets),
      wallpaper: readLegacy('apple_homepage_wallpaper', DEFAULT_STATE.wallpaper),
      notes: readLegacy('apple_homepage_notes', DEFAULT_STATE.notes),
      soundEnabled: readLegacy('apple_homepage_sound_enabled', DEFAULT_STATE.soundEnabled),
      aiConfig: readLegacy('apple_homepage_ai_config', DEFAULT_STATE.aiConfig),
      // 桌宠对话历史不随默认配置重置，初始为空
      petChatHistory: [],
      selectedRoleId: DEFAULT_ROLE_ID,

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
      setPetChatHistory: (messages) =>
        // 统一在 store 层截断到最近 10 轮，超出自动删除最早记录（调用方无需各自处理）
        set({ petChatHistory: messages.slice(-MAX_PET_CHAT_MESSAGES) }),
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
    }),
    {
      name: 'apple-homepage-store',
      // Only persist the data slices, not the action functions.
      partialize: (state) => ({
 ...state
      }),
    },
  ),
);
