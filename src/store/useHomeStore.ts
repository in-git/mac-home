import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESET_DATA } from '../data/presetData';
import { canAddWidget, getWidgetConfig } from '../data/widgetConfig';
import {
  AIConfig,
  DEFAULT_AI_CONFIG,
  CardRadiusTier,
  FontVariant,
  StickyNote as StickyNoteType,
  WallpaperConfig,
  WidgetItem,
  WidgetSize,
  WidgetType,
} from '../types';


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
  openWallpaper: () => void;
  setAiConfig: (patch: Partial<AIConfig>) => void;
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
          size: cfg.defaultSize,
          // Header visibility is driven by the type-level config (default: shown).
          showHeader: cfg.showHeader ?? true,
          // icon 型组件补充图标字段：settings 以齿轮图标呈现，点击后弹窗显示设置
          ...(type === 'settings'
            ? { iconType: 'action', iconGlyph: 'Settings', iconLabel: '设置' }
            : {}),
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
              ? { ...w, background, backgroundTheme }
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
          wallpaper: PRESET_DATA.DEFAULT_WALLPAPER,
          notes: PRESET_DATA.INITIAL_NOTES,
          isDarkMode:
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches,
          themeColor: '#007AFF',
          soundEnabled: true,
          fontVariant: 'A',
          cardRadius: 'large',
          screenBrightness: 100,
          aiConfig: DEFAULT_AI_CONFIG,
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
      // Registered by App on mount so the store can open the wallpaper modal
      // without threading the setter through the whole component tree.
      openWallpaper: () => {},
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
      }),
    },
  ),
);
