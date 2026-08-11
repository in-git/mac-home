import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Toast } from '@heroui/react';
import { useShallow } from 'zustand/react/shallow';
import { initScheduler } from './agent/scheduler';
import { ContextMenu, ContextMenuPosition } from './components/ContextMenu';
import { DynamicWallpaperCanvas } from './components/DynamicWallpaperCanvas';
import { IconEditModal } from './components/IconEditModal';
import { MuuriDashboard } from './components/MuuriDashboard';
import { TopBar } from './components/TopBar';
import { getStoredUser, LoginUser } from './api/auth';
import { registerWidgetAction } from './data/widgetConfig';
import { useHomeStore } from './store/useHomeStore';
import { CARD_RADIUS_PX, FONT_TIER_PX } from './types';
import { chatWithPet } from './utils/aiClient';
import { initGlobalSound } from './utils/sound';
import { AddWidgetModal } from './views/AddWidgetModal';
import { CommandDialog } from './views/CommandDialog';
import { SettingsModal } from './views/SettingsModal';
import { SpotlightModal } from './views/SpotlightModal';
import { WallpaperModal } from './views/WallpaperModal';
import { RoleCharacterCanvas } from './widgets/RoleCharacterCanvas';

// 进入页面打招呼只触发一次（module 级 flag，StrictMode 双挂载下也只会发起一次模型请求）
let greetingDispatchedRef = false;

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

  // 桌宠自由活动配置（是否开启 + 触发间隔秒数），驱动下面的定时器 effect
  const petAutoActivity = useHomeStore((s) => s.petAutoActivity);
  const petActivityInterval = useHomeStore((s) => s.petActivityInterval);

  const {
    setWidgets,
    addWidget,
    deleteWidget,
    resizeWidget,
    updateWidgetBackground,
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

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] =
    useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] =
    useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  // 图标编辑 Modal 当前编辑的 widget id（null 表示关闭）。
  const [editIconId, setEditIconId] = useState<string | null>(null);
  // 命令对话框（按 Enter 在屏幕正下方弹出）。
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);

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

  // Write the card corner-radius CSS variable from the chosen radius tier.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--card-radius', `${CARD_RADIUS_PX[cardRadius]}px`);
  }, [cardRadius]);

  // One-time app startup: register the add-widget action, restore scheduled
  // agent tasks, and wire up global click sound.
  const openWallpaperModal = () => setIsWallpaperModalOpen(true);
  useEffect(() => {
    registerWidgetAction('widget-add', () => setIsAddWidgetModalOpen(true));
    initScheduler();
    const disposeSound = initGlobalSound();
    return () => {
      disposeSound();
    };
  }, []);

  // 进入页面时，给模型发送一条打招呼指令，让模型随机让桌宠说一句问候语。
  // 仅在首次进入时触发一次（module 级 flag 防止 StrictMode 双执行）。
  useEffect(() => {
    if (greetingDispatchedRef) return;
    greetingDispatchedRef = true;
    const aiConfig = useHomeStore.getState().aiConfig;
    const greetingPrompt =
      '你刚进入用户桌面，请以桌宠的身份随机挑一句简短友好的打招呼用语' +
      '（10~20 字，语气活泼自然，不要复述指令），直接输出这句话即可。';
    chatWithPet(aiConfig, greetingPrompt, []).catch((err) => {
      console.warn('进入页面打招呼失败（忽略）：', err);
    });
  }, []);

  // 每 petActivityInterval 秒触发一次「模型驱动桌宠自主活动」：把当前设备
  // 宽度上报给模型，由模型随机决定本次动作（移动 / 跳跃 / 说一句对话问候），
  // 配合 RoleCharacterCanvas 的物理循环执行。
  // 仅在设置中开启「宠物 → 自由活动」时运行；busy ref 防止上一次请求
  // 未结束时堆积新一轮请求。
  const petActivityBusyRef = useRef(false);
  useEffect(() => {
    if (!petAutoActivity) return;

    const drivePetActivity = () => {
      if (petActivityBusyRef.current) return;
      petActivityBusyRef.current = true;
      const aiConfig = useHomeStore.getState().aiConfig;
      const deviceWidth = window.innerWidth;
      const activityPrompt =
        `现在是桌宠定时自主活动时刻。当前设备宽度为 ${deviceWidth} 像素。` +
        '请随机选择以下三种动作之一执行：' +
        '1) 调用 pet_move 工具让桌宠向左或向右移动一次（方向可自由选择，' +
        '移动距离请结合设备宽度合理取值，建议 80~300 像素，注意不要移出屏幕）；' +
        '2) 调用 pet_jump 工具让桌宠跳一下（可偶尔二段跳）；' +
        '3) 调用 pet_speak 工具，让桌宠随口说一句简短、活泼的对话问候语' +
        '（10~20 字，符合桌宠身份，不要复述指令）。' +
        '三种动作随机选取，避免每次固定同一种。';
      chatWithPet(aiConfig, activityPrompt, [])
        .catch((err) => {
          console.warn('定时驱动桌宠自主活动失败（忽略）：', err);
        })
        .finally(() => {
          petActivityBusyRef.current = false;
        });
    };

    const timer = setInterval(drivePetActivity, petActivityInterval * 1000);
    return () => clearInterval(timer);
  }, [petAutoActivity, petActivityInterval]);

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

  // Global "/"-to-open-command-dialog. Ignored when an input/textarea/contenteditable
  // is focused so it never hijacks typing, and ignored if a modal is already open.
  // 使用 e.code === 'Slash' 以兼容中文/英文输入法下按 / 键。
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Slash' && e.key !== '/') return;
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      if (typing || isCommandOpen) return;
      if (
        isSpotlightOpen ||
        isWallpaperModalOpen ||
        isAddWidgetModalOpen ||
        isSettingsModalOpen
      )
        return;
      e.preventDefault();
      setIsCommandOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandOpen,
    isSpotlightOpen,
    isWallpaperModalOpen,
    isAddWidgetModalOpen,
    isSettingsModalOpen,
  ]);

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
      className="relative h-screen w-full flex flex-col overflow-y-hidden font-sans overflow-x-hidden selection:bg-[#007AFF] selection:text-white"
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
            onWeatherChange={setWeatherInfo}
          />

          {/* 右下角完成按钮（仅在编辑模式展示） */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="fixed right-4 sm:right-6 bottom-5 z-[60] flex items-center space-x-1.5 px-4 py-2 bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold rounded-[var(--card-radius)] shadow-lg transition-all"
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
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onOpenWallpaper={openWallpaperModal}
        onOpenAddWidget={() => setIsAddWidgetModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onEditIcon={(id) => setEditIconId(id)}
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

      {/* Icon Edit Modal */}
      <IconEditModal
        widget={widgets.find((w) => w.id === editIconId) ?? null}
        onClose={() => setEditIconId(null)}
      />

      {/* Command Dialog (opened by pressing Enter) */}
      <CommandDialog
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      <Toast.Provider placement="top" />
    </div>
  );
}
