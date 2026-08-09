import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { initScheduler } from './agent/scheduler';
import { ContextMenu, ContextMenuPosition } from './components/ContextMenu';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { MuuriDashboard } from './components/MuuriDashboard';
import { TopBar } from './components/TopBar';
import { registerWidgetAction } from './data/widgetConfig';
import { useHomeStore } from './store/useHomeStore';
import { FONT_TIER_PX } from './types';
import { initGlobalSound } from './utils/sound';
import { AddWidgetModal } from './views/AddWidgetModal';
import { SettingsModal } from './views/SettingsModal';
import { SpotlightModal } from './views/SpotlightModal';
import { WallpaperModal } from './views/WallpaperModal';

// Actions are stable function references — read them once outside the render
// path so they never trigger a re-render or a per-render subscription.
const storeActions = {
  setWidgets: useHomeStore.getState().setWidgets,
  addWidget: useHomeStore.getState().addWidget,
  deleteWidget: useHomeStore.getState().deleteWidget,
  resizeWidget: useHomeStore.getState().resizeWidget,
  moveToTopWidget: useHomeStore.getState().moveToTopWidget,
  updateNotes: useHomeStore.getState().updateNotes,
  updateWallpaper: useHomeStore.getState().updateWallpaper,
  setDarkMode: useHomeStore.getState().setDarkMode,
  setThemeColor: useHomeStore.getState().setThemeColor,
};

export default function App() {
  // Single subscription for the data slice; useShallow avoids re-renders when
  // none of these values actually change.
  const {
    widgets,
    wallpaper,
    notes,
    isDarkMode,
    themeColor,
    fontVariant,
    screenBrightness,
  } = useHomeStore(
    useShallow((s) => ({
      widgets: s.widgets,
      wallpaper: s.wallpaper,
      notes: s.notes,
      isDarkMode: s.isDarkMode,
      themeColor: s.themeColor,
      fontVariant: s.fontVariant,
      screenBrightness: s.screenBrightness,
    })),
  );

  const { setWidgets, addWidget, deleteWidget, resizeWidget } = storeActions;
  const { updateNotes, updateWallpaper, setDarkMode, setThemeColor } =
    storeActions;

  const toggleDarkMode = () => setDarkMode(!isDarkMode);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] =
    useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] =
    useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);

  // Right Click Context Menu State
  const [contextMenuPos, setContextMenuPos] =
    useState<ContextMenuPosition | null>(null);

  // Apply persisted dark mode + theme color + font scale to the document root.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--accent', themeColor);
  }, [isDarkMode, themeColor]);

  // Write the three font-size CSS variables directly from the chosen font variant.
  // Depends on fontVariant, so it must stay a separate effect.
  useEffect(() => {
    const root = document.documentElement;
    const t = FONT_TIER_PX[fontVariant];
    root.style.setProperty('--font-sm', `${t.sm}px`);
    root.style.setProperty('--font-md', `${t.md}px`);
    root.style.setProperty('--font-lg', `${t.lg}px`);
  }, [fontVariant]);

  // One-time app startup: register the add-widget action, restore scheduled
  // agent tasks, wire up global click sound, and expose openWallpaper() to the
  // store so the Settings widget can open the modal without prop-drilling.
  const openWallpaperModal = () => setIsWallpaperModalOpen(true);
  useEffect(() => {
    registerWidgetAction('widget-add', () => setIsAddWidgetModalOpen(true));
    initScheduler();
    const disposeSound = initGlobalSound();
    useHomeStore.setState({ openWallpaper: openWallpaperModal });
    return () => {
      disposeSound();
    };
  }, []);

  // Main Right Click Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY,
      targetWidgetId: null,
    });
  };

  // Specific Widget Right Click Handler
  const handleContextMenuWidget = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY,
      targetWidgetId: widgetId,
    });
  };

  // Clicking outside <main> (e.g. background/topbar/empty desktop margin outside main) exits edit mode.
  const handleRootClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    const insideMain = mainRef.current?.contains(target);
    if (!insideMain) {
      setIsEditMode(false);
    }
  };

  return (
    <div
      onClick={handleRootClick}
      onContextMenu={handleContextMenu}
      className="relative h-screen w-full flex flex-col overflow-y-hidden font-sans overflow-x-hidden selection:bg-[#007AFF] selection:text-white"
    >
      {/* Dynamic Canvas Background */}
      <DynamicWallpaperCanvas
        wallpaper={wallpaper}
        isDarkMode={isDarkMode}
        screenBrightness={screenBrightness}
      />

      {/* Top macOS Navigation Bar */}
      <TopBar
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaperModal={openWallpaperModal}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
      />

      {/* Scroll wrapper — sits ABOVE <main>, owns the scrollbar styling. */}
      <div className="flex-1 w-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Main Desktop Dashboard Container */}
        <main
          ref={mainRef}
          className="relative max-w-7xl w-full mx-auto p-3 sm:p-6 pb-16"
        >
          {/* Muuri Grid Layout Engine */}
          <MuuriDashboard
            widgets={widgets}
            onUpdateWidgetOrder={setWidgets}
            onDeleteWidget={deleteWidget}
            onResizeWidget={resizeWidget}
            onContextMenuWidget={handleContextMenuWidget}
            isEditMode={isEditMode}
            notes={notes}
            onUpdateNotes={updateNotes}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />

          {/* 右下角完成按钮（仅在编辑模式展示） */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="fixed right-4 sm:right-6 bottom-5 z-40 flex items-center space-x-1.5 px-4 py-2 bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold rounded-[12px] shadow-lg transition-all"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>完成</span>
            </button>
          )}
        </main>
      </div>

      {/* Right Click Desktop & Widget Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        widgets={widgets}
        onDeleteWidget={deleteWidget}
        onResizeWidget={resizeWidget}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaper={openWallpaperModal}
        onOpenAddWidget={() => setIsAddWidgetModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Wallpaper Setting Modal */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        wallpaper={wallpaper}
        isDarkMode={isDarkMode}
        themeColor={themeColor}
        onUpdateWallpaper={updateWallpaper}
        onUpdateThemeColor={setThemeColor}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Spotlight Search Modal */}
      <SpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        notes={notes}
        onAddWidget={addWidget}
      />

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        onAddWidget={addWidget}
        widgets={widgets}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
