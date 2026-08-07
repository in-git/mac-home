import React, { useState, useEffect, useRef } from 'react';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { TopBar } from './components/TopBar';
import { MuuriDashboard } from './components/MuuriDashboard';
import { ContextMenu, ContextMenuPosition } from './components/ContextMenu';
import { WallpaperModal } from './components/WallpaperModal';
import { SpotlightModal } from './components/SpotlightModal';
import { AddWidgetModal } from './components/AddWidgetModal';
import { useHomeStore } from './store/useHomeStore';

export default function App() {
  // Persisted data + actions are handled by the zustand store.
  const widgets = useHomeStore((s) => s.widgets);
  const wallpaper = useHomeStore((s) => s.wallpaper);
  const notes = useHomeStore((s) => s.notes);
  const tasks = useHomeStore((s) => s.tasks);
  const setWidgets = useHomeStore((s) => s.setWidgets);
  const addWidget = useHomeStore((s) => s.addWidget);
  const deleteWidget = useHomeStore((s) => s.deleteWidget);
  const resizeWidget = useHomeStore((s) => s.resizeWidget);
  const moveToTopWidget = useHomeStore((s) => s.moveToTopWidget);
  const resetLayout = useHomeStore((s) => s.resetLayout);
  const updateNotes = useHomeStore((s) => s.updateNotes);
  const updateTasks = useHomeStore((s) => s.updateTasks);
  const updateWallpaper = useHomeStore((s) => s.updateWallpaper);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState<boolean>(false);

  // Right Click Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onResetLayout={resetLayout}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        onAddWidgetModalOpen={() => setIsAddWidgetModalOpen(true)}
      />

      {/* Main Desktop Dashboard Container */}
      <main
        ref={mainRef}
        className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-12 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
          tasks={tasks}
          onUpdateTasks={updateTasks}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        />
      </main>

      {/* Right Click Desktop & Widget Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        widgets={widgets}
        onAddWidget={addWidget}
        onDeleteWidget={deleteWidget}
        onResizeWidget={resizeWidget}
        onMoveToTopWidget={moveToTopWidget}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onResetLayout={resetLayout}
      />

      {/* Wallpaper Setting Modal */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        wallpaper={wallpaper}
        onUpdateWallpaper={updateWallpaper}
      />

      {/* Spotlight Search Modal */}
      <SpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        notes={notes}
        tasks={tasks}
        onAddWidget={addWidget}
      />

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        onAddWidget={addWidget}
      />
    </div>
  );
}
