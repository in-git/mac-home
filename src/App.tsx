import { Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ContextMenu, ContextMenuPosition } from './views/ContextMenu';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas/DynamicWallpaperCanvas';
import { DashboardGrid } from './views/DashboardGrid';
import { TopBar } from './components/TopBar/TopBar';
import { useAppInit } from './hooks/useAppInit';
import { useGreeting } from './hooks/useGreeting';
import { usePetAutoActivity } from './hooks/usePetAutoActivity';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useHomeStore } from './store/useHomeStore';
import { AddWidgetModal } from './views/AddWidgetModal';
import { SettingsModal } from './views/SettingsModal';
import { SpotlightModal } from './views/SpotlightModal';
import { WallpaperModal } from './views/WallpaperModal';
import { RoleCharacterCanvas } from './widgets/RoleCharacter/RoleCharacterCanvas';
import { visitorApi } from './api/visitor';
import { handleAddSite, handleRemoveSite } from './utils/siteHelper';

// Actions are stable function references — read them once outside the render
// path so they never trigger a re-render or a per-render subscription.
const storeActions = {
  setWidgets: useHomeStore.getState().setWidgets,
  addWidget: useHomeStore.getState().addWidget,
  deleteWidget: useHomeStore.getState().deleteWidget,
  resizeWidget: useHomeStore.getState().resizeWidget,
  moveToTopWidget: useHomeStore.getState().moveToTopWidget,
  updateWidgetBackground: useHomeStore.getState().updateWidgetBackground,
  updateWidget: useHomeStore.getState().updateWidget,
  updateNotes: useHomeStore.getState().updateNotes,
  updateWallpaper: useHomeStore.getState().updateWallpaper,
  setDarkMode: useHomeStore.getState().setDarkMode,
  setThemeColor: useHomeStore.getState().setThemeColor,
  setShowDesktopIcons: useHomeStore.getState().setShowDesktopIcons,
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
    cardRadius,
    screenBrightness,
    showDesktopIcons,
  } = useHomeStore(
    useShallow((s) => ({
      widgets: s.widgets,
      wallpaper: s.wallpaper,
      notes: s.notes,
      isDarkMode: s.isDarkMode,
      themeColor: s.themeColor,
      fontVariant: s.fontVariant,
      cardRadius: s.cardRadius,
      screenBrightness: s.screenBrightness,
      showDesktopIcons: s.showDesktopIcons,
    })),
  );

  // 桌宠自由活动配置（是否开启），驱动下面的定时器 effect
  const petAutoActivity = useHomeStore((s) => s.petAutoActivity);

  const {
    setWidgets,
    addWidget,
    deleteWidget,
    resizeWidget,
    updateWidgetBackground,
    updateWidget,
    setShowDesktopIcons,
  } = storeActions;
  const { updateNotes, updateWallpaper, setDarkMode } =
    storeActions;

  const toggleDarkMode = () => setDarkMode(!isDarkMode);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
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

  // Apply persisted dark mode + theme color + font scale + card radius to the
  // document root via CSS variables.
  useThemeVariables({ isDarkMode, themeColor, fontVariant, cardRadius });

  // One-time app startup: register the add-widget action, restore scheduled
  // agent tasks, and wire up global click sound.
  const openWallpaperModal = () => setIsWallpaperModalOpen(true);
  useAppInit({ onOpenAddWidget: () => setIsAddWidgetModalOpen(true) });

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi
      .report()
      .catch(() => {
        /* 上报失败静默，不影响主流程 */
      });
  }, []);

  // 进入页面打招呼（仅触发一次）。
  useGreeting();

  // 桌宠定时自主活动（仅在设置开启时运行）。
  usePetAutoActivity(petAutoActivity);

  // SEO：动态同步标题与描述，确保关键词「吴文龙 / 吴文龙的游戏空间」一致。
  useEffect(() => {
    document.title = '吴文龙的游戏空间 | 吴文龙';
    const desc =
      '吴文龙的游戏空间——吴文龙打造的 macOS 风格个性化桌面主页，集成可拖拽组件、便签、天气、实时任务提醒与动态壁纸。';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  // 「清屏」关闭时，隐藏桌面上的所有组件（整个仪表盘），
  // 直接传空数组，确保 Muuri 同步能正确清空所有卡片。
  const dashboardWidgets = showDesktopIcons ? widgets : [];

  // Main Right Click Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY,
      targetWidgetId: null,
    });
  };

  // 点击仪表盘容器（<main>）外的区域时，退出编辑模式
  const dashboardRef = React.useRef<HTMLElement | null>(null);
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    if (dashboardRef.current && !dashboardRef.current.contains(e.target as Node)) {
      setIsEditMode(false);
    }
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

  // 天气状态：以天气卡片为准，同步给顶部状态栏
  const [weatherInfo, setWeatherInfo] = useState<{
    cityName: string;
    country: string;
    temp: number | null;
  }>({ cityName: '', country: '', temp: null });

  return (
    <div
      onContextMenu={handleContextMenu}
      className="relative h-screen w-full flex flex-col overflow-y-hidden font-sans overflow-x-hidden selection:bg-[color:var(--accent)] selection:text-white"
    >
      {/* Dynamic Canvas Background */}
      <DynamicWallpaperCanvas
        wallpaper={wallpaper}
        isDarkMode={isDarkMode}
        screenBrightness={screenBrightness}
      />

      {/* 2D Role Character Overlay */}
      <RoleCharacterCanvas />

      {/* Top macOS Navigation Bar */}
      <TopBar
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaperModal={openWallpaperModal}
        weatherCity={weatherInfo.cityName || weatherInfo.country}
        weatherTemp={
          weatherInfo.temp != null ? `${weatherInfo.temp}°` : undefined
        }
      />

      {/* Scroll wrapper — sits ABOVE <main>, owns the scrollbar styling. */}
      <div
        className={
          'flex-1 w-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors duration-200 ' +
          (isEditMode
            ? 'cursor-default ring-1 ring-inset ring-black/10'
            : '')
        }
        onClick={handleOutsideClick}
      >
        {/* Main Desktop Dashboard Container */}
        <main
          ref={dashboardRef}
          className={
            'relative max-w-7xl w-full mx-auto px-3 sm:px-6 pb-6 rounded-2xl transition-shadow duration-200'
          }
        >
          {/* Grid Layout Engine */}
          <DashboardGrid
            widgets={dashboardWidgets}
            onUpdateWidgetOrder={setWidgets}
            onContextMenuWidget={handleContextMenuWidget}
            onEnterEditMode={() => setIsEditMode(true)}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            notes={notes}
            onUpdateNotes={updateNotes}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onWeatherChange={setWeatherInfo}
            onUpdateWidget={updateWidget}
          />

          {/* 右下角完成按钮（仅在编辑模式展示）：圆形放大 */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              aria-label="完成"
              className="fixed right-5 sm:right-7 bottom-6 z-[60] flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] active:scale-95 text-white shadow-lg shadow-black/20 transition-transform"
            >
              <Check size={28} strokeWidth={3} />
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
        onChangeWidgetBackground={updateWidgetBackground}
        onUpdateWidget={updateWidget}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaper={openWallpaperModal}
        onOpenAddWidget={() => setIsAddWidgetModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        showDesktopIcons={showDesktopIcons}
        onToggleDesktopIcons={() => setShowDesktopIcons(!showDesktopIcons)}
      />

      {/* Wallpaper Setting Modal */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        wallpaper={wallpaper}
        isDarkMode={isDarkMode}
        onUpdateWallpaper={updateWallpaper}
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
        onAddSite={handleAddSite}
        onRemoveSite={handleRemoveSite}
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
