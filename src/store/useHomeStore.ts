import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WidgetItem,
  WidgetType,
  WidgetSize,
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
import { getWidgetConfig, canAddWidget } from '../data/widgetConfig';
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
