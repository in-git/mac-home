import { Check } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ContextMenu, ContextMenuPosition } from './views/ContextMenu';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { MuuriDashboard } from './components/MuuriDashboard';
import { TopBar } from './components/TopBar';
import { getStoredUser, LoginUser } from './api/auth';
import { siteApi, SiteItem } from './api/site';
import type { WidgetItem } from './types';
import { isWebGrid } from './data/widgetConfig';
import { SIZE_OPTIONS_ICON_GRID } from './data/options';
import { useAppInit } from './hooks/useAppInit';
import { useBwsConnection } from './hooks/useBwsConnection';
import { useGreeting } from './hooks/useGreeting';
import { usePetAutoActivity } from './hooks/usePetAutoActivity';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useHomeStore } from './store/useHomeStore';
import { AddWidgetModal } from './views/AddWidgetModal';
import { SettingsModal } from './views/SettingsModal';
import { SpotlightModal } from './views/SpotlightModal';
import { WallpaperModal } from './views/WallpaperModal';
import { RoleCharacterCanvas } from './widgets/RoleCharacterCanvas';

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
  } = storeActions;
  const { updateNotes, updateWallpaper, setDarkMode, setThemeColor } =
    storeActions;

  const toggleDarkMode = () => setDarkMode(!isDarkMode);

  // 登录态：初始化时从 localStorage 读取已登录用户
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(() =>
    getStoredUser(),
  );

  const handleLoginSuccess = (user: LoginUser) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  // 网页列表：点击「添加」把站点做成桌面图标（web-grid 类型，携带 site 数据）
  const handleAddSite = (item: SiteItem) => {
    const url = item.link || '#';
    if (widgets.some((w) => isWebGrid(w.type) && w.data.site?.link === url)) {
      return;
    }
    const newWidget: WidgetItem = {
      id: `widget-${Date.now()}`,
      type: 'web-grid',
      title: item.name || '未命名',
      maxInstances: Infinity,
      size: '1/12',
      sizeOptions: SIZE_OPTIONS_ICON_GRID,
      isAddable: false,
      logo: '🌐',
      showHeader: false,
      data: {
        site: item,
      },
    };
    setWidgets([...widgets, newWidget]);
    void (async () => {
      try {
        await siteApi.recordClick(item.id);
      } catch {
        /* noop */
      }
    })();
  };

  // 网页列表：点击「删除」移除对应的桌面图标（web-grid）
  const handleRemoveSite = (item: SiteItem) => {
    const url = item.link || '#';
    const target = widgets.find(
      (w) => isWebGrid(w.type) && w.data.site?.link === url,
    );
    if (!target) return;
    deleteWidget(target.id);
  };

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showDesktopIcons, setShowDesktopIcons] = useState<boolean>(true);
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

  // Apply persisted dark mode + theme color + font scale + card radius to the
  // document root via CSS variables.
  useThemeVariables({ isDarkMode, themeColor, fontVariant, cardRadius });

  // One-time app startup: register the add-widget action, restore scheduled
  // agent tasks, and wire up global click sound.
  const openWallpaperModal = () => setIsWallpaperModalOpen(true);
  useAppInit({ onOpenAddWidget: () => setIsAddWidgetModalOpen(true) });

  // 进入页面打招呼（仅触发一次）。
  useGreeting();

  // 桌宠定时自主活动（仅在设置开启时运行）。
  usePetAutoActivity(petAutoActivity);

  // B 端 WebSocket 对接：监听用户上线事件并让桌宠气泡提示。
  // 详见 md/B端WebSocket对接文档.md。
  useBwsConnection();

  // 「显示桌面图标」关闭时，隐藏桌面上的所有组件（整个仪表盘），
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

  // 天气状态：以天气卡片为准，同步给顶部状态栏
  const [weatherInfo, setWeatherInfo] = useState<{
    cityName: string;
    country: string;
    temp: number | null;
  }>({ cityName: '', country: '', temp: null });

  return (
    <div
      onClick={handleRootClick}
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
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        weatherCity={weatherInfo.cityName || weatherInfo.country}
        weatherTemp={
          weatherInfo.temp != null ? `${weatherInfo.temp}°` : undefined
        }
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
            widgets={dashboardWidgets}
            onUpdateWidgetOrder={setWidgets}
            onDeleteWidget={deleteWidget}
            onResizeWidget={resizeWidget}
            onContextMenuWidget={handleContextMenuWidget}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            notes={notes}
            onUpdateNotes={updateNotes}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onWeatherChange={setWeatherInfo}
            onUpdateWidget={updateWidget}
          />

          {/* 右下角完成按钮（仅在编辑模式展示） */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="fixed right-4 sm:right-6 bottom-5 z-[60] flex items-center space-x-1.5 px-4 py-2 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] active:scale-95 text-white text-xs font-semibold rounded-[var(--card-radius)] shadow-lg"
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
        onChangeWidgetBackground={updateWidgetBackground}
        onUpdateWidget={updateWidget}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaper={openWallpaperModal}
        onOpenAddWidget={() => setIsAddWidgetModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        showDesktopIcons={showDesktopIcons}
        onToggleDesktopIcons={() => setShowDesktopIcons((v) => !v)}
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
