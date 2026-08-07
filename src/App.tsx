import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { TopBar } from './components/TopBar';
import { MuuriDashboard } from './components/MuuriDashboard';
import { ContextMenu, ContextMenuPosition } from './components/ContextMenu';
import { WallpaperModal } from './components/WallpaperModal';
import { SpotlightModal } from './components/SpotlightModal';
import { AppleFormShowcase } from './components/AppleFormShowcase';
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
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isFormShowcaseModalOpen, setIsFormShowcaseModalOpen] = useState<boolean>(false);

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

  return (
    <div
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
        onOpenFormShowcase={() => setIsFormShowcaseModalOpen(true)}
        onResetLayout={resetLayout}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        onAddWidget={addWidget}
      />

      {/* Main Desktop Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-12 overflow-y-auto">
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
        onOpenFormShowcase={() => setIsFormShowcaseModalOpen(true)}
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

      {/* Form Showcase Standalone Modal */}
      <AnimatePresence>
        {isFormShowcaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl glass-panel rounded-2xl shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden"
            >
              <AppleFormShowcase
                isModalMode
                onCloseModal={() => setIsFormShowcaseModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
