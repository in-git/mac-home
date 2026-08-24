import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ContextMenu, ContextMenuPosition } from './views/ContextMenu';
import { confirm } from './components/confirm/confirm';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas/DynamicWallpaperCanvas';
import { DashboardGrid } from './views/DashboardGrid';
import { TopBar } from './components/TopBar/TopBar';
import { useAppInit } from './hooks/useAppInit';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useHomeStore } from './store/useHomeStore';
import { AddWidgetModal } from './views/AddWidgetModal';
import { SettingsModal } from './views/SettingsModal';
import { WallpaperModal } from './views/WallpaperModal';
import { RoleCharacterCanvas } from './widgets/Role/RoleCharacterCanvas';
import { ROLE_DIALOG_ACTION_EVENT } from './agent/pet/dialog';
import { visitorApi } from './api/visitor';
import { handleAddSite, handleRemoveSite } from './utils/siteHelper';
import dataJson from './data/data.json';
import { CURRENT_DATA_VERSION } from './utils/migration';
import THEME_OPTIONS from './data/options/filter.options';
import { useGreeting } from './agent/pet/actions';

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

  // 深浅色模式联动桌面主题：切到深色 → 应用「暗色」主题，切到浅色 → 应用「正常」主题。
  // 首次渲染不触发，仅在 isDarkMode 真正变化时联动，避免覆盖用户已有的自定义主题。
  const prevDarkModeRef = useRef(isDarkMode);
  useEffect(() => {
    if (prevDarkModeRef.current === isDarkMode) return;
    prevDarkModeRef.current = isDarkMode;
    // THEME_OPTIONS[1] = 暗色，THEME_OPTIONS[0] = 正常
    const opt = THEME_OPTIONS[isDarkMode ? 1 : 0];
    updateWallpaper({
      blur: opt.blur,
      brightness: Math.round(opt.brightness * 100),
      contrast: opt.contrast,
      saturation: opt.saturation,
      hue: opt.hue,
      sepia: opt.sepia,
      grayscale: opt.grayscale,
      invert: opt.invert,
    });
  }, [isDarkMode, updateWallpaper]);

  // One-time app startup: register the add-widget action, restore scheduled
  // agent tasks, and wire up global click sound.
  const openWallpaperModal = () => setIsWallpaperModalOpen(true);
  useAppInit({ onOpenAddWidget: () => setIsAddWidgetModalOpen(true) });

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi.report()
  }, []);

  // 版本一致性检测（诊断用）：对比代码目标版本、默认数据版本与本地持久化数据版本，
  // 不一致说明本地数据为旧版本，刷新后会走增量迁移/补全逻辑。
  useEffect(() => {
    const currentVersion = CURRENT_DATA_VERSION;
    const defaultVersion = (dataJson as { version?: number }).version;

    let persistedVersion: number | undefined;
    try {
      const raw = localStorage.getItem('apple-homepage-store');
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { version?: number } };
        persistedVersion = parsed.state?.version;
      }
    } catch {
      persistedVersion = undefined;
    }

    const defaultConsistent = defaultVersion === currentVersion;
    const persistedConsistent = persistedVersion === currentVersion;
    console.log(
      `[版本检测] ${defaultConsistent && persistedConsistent ? '版本一致' : '版本不一致'} ` +
        `代码目标=${currentVersion}，默认数据(data.json)=${defaultVersion ?? '未知'}，` +
        `本地持久化=${persistedVersion ?? '无'}`,
    );
    if (!defaultConsistent) {
      console.warn(
        `[版本检测] 默认数据版本(${defaultVersion ?? '未知'})与代码目标版本(${currentVersion})不一致，请检查 src/data/data.json 的 version 字段。`,
      );
    }
    if (!persistedConsistent) {
      console.warn(
        `[版本检测] 本地持久化数据版本(${persistedVersion ?? '无'})与代码目标版本(${currentVersion})不一致，将在下次写入时升级为 ${currentVersion}。`,
      );
      // 本地已有旧版本数据（非首次访问）且与当前系统版本不一致时，提示用户重置系统。
      // 确认后恢复默认配置并持久化，版本号随之对齐为 CURRENT_DATA_VERSION，避免反复提示。
      if (persistedVersion !== undefined) {
        confirm({
          title: '检测到数据版本不一致',
          body: `本地保存的数据版本（v${persistedVersion}）与当前系统版本（v${currentVersion}）不一致，可能存在兼容性问题。建议重置系统恢复默认配置，此操作不可撤销；也可以选择「继续使用」由系统自动迁移数据。`,
          confirmText: '重置系统',
          cancelText: '继续使用',
          danger: true,
          onConfirm: () => {
            useHomeStore.getState().resetAll();
          },
        });
      }
    }
  }, []);

  // 进入页面打招呼（仅触发一次）。
  useGreeting();

  // 监听桌宠对话框选项触发的副作用（打开模态框 / 执行功能 / 应用内跳转）
  useEffect(() => {
    const onAction = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { modal?: 'settings' | 'addWidget' | 'wallpaper'; command?: string; url?: string }
        | undefined;
      if (!detail) return;
      if (detail.modal === 'settings') setIsSettingsModalOpen(true);
      else if (detail.modal === 'addWidget') setIsAddWidgetModalOpen(true);
      else if (detail.modal === 'wallpaper') setIsWallpaperModalOpen(true);
      else if (detail.command === 'navigate' && detail.url) {
        // 应用内路由：当前为单页，这里以滚动到顶部作为示例落地行为
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener(ROLE_DIALOG_ACTION_EVENT, onAction);
    return () => window.removeEventListener(ROLE_DIALOG_ACTION_EVENT, onAction);
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
