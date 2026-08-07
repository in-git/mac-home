import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WidgetItem,
  WidgetType,
  WidgetSize,
  WIDGET_SIZE_OPTIONS,
  WallpaperConfig,
  StickyNote as StickyNoteType,
  ReminderTask,
} from '../types';
import {
  INITIAL_WIDGETS,
  DEFAULT_WALLPAPER,
  INITIAL_NOTES,
  INITIAL_TASKS,
} from '../data/presetData';
import { playSound } from '../utils/sound';

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
  tasks: ReminderTask[];

  // Widget actions
  setWidgets: (widgets: WidgetItem[]) => void;
  addWidget: (type: WidgetType) => void;
  deleteWidget: (id: string) => void;
  resizeWidget: (id: string, newSize: WidgetSize) => void;
  moveToTopWidget: (id: string) => void;
  resetLayout: () => void;

  // Notes / Tasks / Wallpaper
  updateNotes: (notes: StickyNoteType[]) => void;
  updateTasks: (tasks: ReminderTask[]) => void;
  updateWallpaper: (cfg: Partial<WallpaperConfig>) => void;
}

const WIDGET_TITLE_MAP: Record<WidgetType, string> = {
  'sticky-notes': '便签笔记',
  weather: '天气预报',
  tasks: '实时提醒',
  clock: '时钟日历',
  shortcuts: '快捷导航',
  'control-center': '控制中心',
  'icon-grid': '图标',
};

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      widgets: readLegacy('apple_homepage_widgets', INITIAL_WIDGETS),
      wallpaper: readLegacy('apple_homepage_wallpaper', DEFAULT_WALLPAPER),
      notes: readLegacy('apple_homepage_notes', INITIAL_NOTES),
      tasks: readLegacy('apple_homepage_tasks', INITIAL_TASKS),

      setWidgets: (widgets) => set({ widgets }),

      addWidget: (type) => {
        playSound.playClick();
        const { widgets } = get();
        const existing = widgets.find((w) => w.type === type);
        if (existing) {
          get().moveToTopWidget(existing.id);
          return;
        }
        const newWidget: WidgetItem = {
          id: `widget-${Date.now()}`,
          type,
          title: WIDGET_TITLE_MAP[type],
          size: WIDGET_SIZE_OPTIONS[type][0],
          showHeader: type !== 'icon-grid',
        };
        set({ widgets: [newWidget, ...widgets] });
      },

      deleteWidget: (id) => {
        playSound.playClick();
        set({ widgets: get().widgets.filter((w) => w.id !== id) });
      },

      resizeWidget: (id, newSize) => {
        playSound.playClick();
        set({
          widgets: get().widgets.map((w) =>
            w.id === id ? { ...w, size: newSize } : w
          ),
        });
      },

      moveToTopWidget: (id) => {
        playSound.playClick();
        const { widgets } = get();
        const target = widgets.find((w) => w.id === id);
        if (!target) return;
        const rest = widgets.filter((w) => w.id !== id);
        set({ widgets: [target, ...rest] });
      },

      resetLayout: () => {
        playSound.playClick();
        set({ widgets: INITIAL_WIDGETS, wallpaper: DEFAULT_WALLPAPER });
      },

      updateNotes: (notes) => set({ notes }),
      updateTasks: (tasks) => set({ tasks }),
      updateWallpaper: (cfg) => set({ wallpaper: { ...get().wallpaper, ...cfg } }),
    }),
    {
      name: 'apple-homepage-store',
      // Only persist the data slices, not the action functions.
      partialize: (state) => ({
        widgets: state.widgets,
        wallpaper: state.wallpaper,
        notes: state.notes,
        tasks: state.tasks,
      }),
    }
  )
);
