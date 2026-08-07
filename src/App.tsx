import React, { useEffect, useRef, useState } from 'react';
import { AddWidgetModal } from './components/AddWidgetModal';
import { ContextMenu, ContextMenuPosition } from './components/ContextMenu';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { MuuriDashboard } from './components/MuuriDashboard';
import { SpotlightModal } from './components/SpotlightModal';
import { TopBar } from './components/TopBar';
import { WallpaperModal } from './components/WallpaperModal';
import { registerWidgetAction } from './data/widgetConfig';
import { useHomeStore } from './store/useHomeStore';

export default function App() {
  // Persisted data + actions are handled by the zustand store.
  const widgets = useHomeStore((s) => s.widgets);
  const wallpaper = useHomeStore((s) => s.wallpaper);
  const notes = useHomeStore((s) => s.notes);
  const setWidgets = useHomeStore((s) => s.setWidgets);
  const addWidget = useHomeStore((s) => s.addWidget);
  const deleteWidget = useHomeStore((s) => s.deleteWidget);
  const resizeWidget = useHomeStore((s) => s.resizeWidget);
  const moveToTopWidget = useHomeStore((s) => s.moveToTopWidget);
  const resetLayout = useHomeStore((s) => s.resetLayout);
  const updateNotes = useHomeStore((s) => s.updateNotes);
  const updateWallpaper = useHomeStore((s) => s.updateWallpaper);
  const isDarkMode = useHomeStore((s) => s.isDarkMode);
  const setDarkMode = useHomeStore((s) => s.setDarkMode);
  const themeColor = useHomeStore((s) => s.themeColor);
  const setThemeColor = useHomeStore((s) => s.setThemeColor);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] =
    useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] =
    useState<boolean>(false);

  // Right Click Context Menu State
  const [contextMenuPos, setContextMenuPos] =
    useState<ContextMenuPosition | null>(null);

  // Apply persisted dark mode + theme color to the document root.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--accent', themeColor);
  }, [isDarkMode, themeColor]);

  // Register the "添加组件" action by widget id so IconWidget can resolve it at
  // click time via getWidgetAction('widget-add'), independent of localStorage.
  useEffect(() => {
    registerWidgetAction('widget-add', () => setIsAddWidgetModalOpen(true));
  }, []);

  // Wire the store's openWallpaper() to the local wallpaper modal so the
  // Settings widget can open it without prop-drilling through MuuriDashboard.
  useEffect(() => {
    useHomeStore.setState({
      openWallpaper: () => setIsWallpaperModalOpen(true),
    });
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

  // Clicking empty space (anything that isn't a widget card) exits edit mode.
  // Cards are wrapped in `.muuri-item` (with data-widget-id); clicks on them or
  // their inner controls must NOT close edit mode.
  const handleRootClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    const onCard = target.closest('.muuri-item');
    if (!onCard) {
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
      <DynamicWallpaperCanvas wallpaper={wallpaper} isDarkMode={isDarkMode} />

      {/* Top macOS Navigation Bar */}
      <TopBar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setDarkMode(!isDarkMode)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onResetLayout={resetLayout}
      />

      {/* Scroll wrapper — sits ABOVE <main>, owns the scrollbar styling. */}
      <div className="flex-1 w-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Main Desktop Dashboard Container */}
        <main
          ref={mainRef}
          className="max-w-7xl w-full mx-auto p-3 sm:p-6 pb-12"
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
            onToggleDarkMode={() => setDarkMode(!isDarkMode)}
          />
        </main>
      </div>

      {/* Right Click Desktop & Widget Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        widgets={widgets}
        onDeleteWidget={deleteWidget}
        onResizeWidget={resizeWidget}
        onMoveToTopWidget={moveToTopWidget}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setDarkMode(!isDarkMode)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onResetLayout={resetLayout}
        onOpenAddWidget={() => setIsAddWidgetModalOpen(true)}
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
        onToggleDarkMode={() => setDarkMode(!isDarkMode)}
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
    </div>
  );
}
