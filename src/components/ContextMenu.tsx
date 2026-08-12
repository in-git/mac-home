import React, { useEffect, useRef, useState } from 'react';
import {
  ContextMenuAction,
  ContextMenuItemConfig,
  DESKTOP_CONTEXT_MENU,
  WIDGET_CONTEXT_MENU,
} from '../data/contextMenuConfig';
import { PRESET_DATA } from '../data/presetData';
import { getWidgetConfig } from '../data/widgetConfig';
import { useHomeStore } from '../store/useHomeStore';
import { WIDGET_SIZE_LABEL, WidgetItem, WidgetSize } from '../types';

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetWidgetId?: string | null;
}

interface ContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  widgets: WidgetItem[];
  onDeleteWidget: (id: string) => void;
  onResizeWidget: (id: string, newSize: WidgetSize) => void;
  onChangeWidgetBackground: (
    id: string,
    background: string | undefined,
    backgroundTheme?: 'light' | 'dark',
  ) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaper: () => void;
  onOpenAddWidget: () => void;
  onOpenSettings: () => void;
  onEditIcon: (id: string) => void;
}

/** 卡片背景纯色快捷选项 —— 一排并列的「透明 / 纯黑 / 纯白」。 */
const SOLID_BG_COLORS: {
  label: string;
  value: string;
  theme: 'light' | 'dark';
  transparent?: boolean;
}[] = [
  { label: '透明', value: 'transparent', theme: 'light', transparent: true },
  { label: '纯黑', value: '#1a1a1a', theme: 'dark' },
  { label: '纯白', value: '#FFFFFF', theme: 'light' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  widgets,
  onDeleteWidget,
  onResizeWidget,
  onChangeWidgetBackground,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaper,
  onOpenAddWidget,
  onOpenSettings,
  onEditIcon,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Hover submenu state for the "切换卡片背景" widget action.
  const [bgSubmenuOpen, setBgSubmenuOpen] = useState(false);
  const submenuLeaveTimer = useRef<number | null>(null);

  // Reset the submenu whenever the menu is (re)opened.
  useEffect(() => {
    setBgSubmenuOpen(false);
  }, [position]);

  const isDarkMode = useHomeStore((s) => s.isDarkMode);

  // 卡片背景选项卡：手动切换亮色 / 暗色，而非按系统模式自动匹配。
  const [bgTab, setBgTab] = useState<'light' | 'dark'>('light');

  const backgroundOptions = PRESET_DATA.STATIC_WALLPAPERS.filter((w) => {
    if (!w.gradient) return false;
    if (!w.theme || w.theme === 'both') return true;
    return w.theme === bgTab;
  });

  const openBgSubmenu = () => {
    if (submenuLeaveTimer.current) {
      window.clearTimeout(submenuLeaveTimer.current);
      submenuLeaveTimer.current = null;
    }
    setBgSubmenuOpen(true);
  };

  const scheduleCloseBgSubmenu = () => {
    if (submenuLeaveTimer.current)
      window.clearTimeout(submenuLeaveTimer.current);
    submenuLeaveTimer.current = window.setTimeout(
      () => setBgSubmenuOpen(false),
      120,
    );
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  const targetWidget = position.targetWidgetId
    ? widgets.find((w) => w.id === position.targetWidgetId)
    : null;

  // Adjust coordinates so the context menu doesn't overflow screen boundaries.
  // When a widget is targeted it can open the "切换卡片背景" flyout submenu
  // (240px wide) to its right, so reserve extra horizontal room in that case.
  const menuWidth = 272;
  const submenuWidth = 280;
  const menuHeight = 540;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const horizontalReserve = targetWidget
    ? menuWidth + submenuWidth + 12
    : menuWidth;
  const adjustedX = Math.min(
    position.x,
    screenW - Math.max(horizontalReserve, menuWidth) - 10,
  );
  const adjustedY = Math.min(position.y, screenH - menuHeight - 10);

  // Map an action id to its handler + whether it should currently render.
  const resolveAction = (
    action: ContextMenuAction,
    item: ContextMenuItemConfig,
  ): { onClick: () => void; visible: boolean } | null => {
    switch (action) {
      case 'addWidget':
        return { onClick: onOpenAddWidget, visible: true };
      case 'wallpaper':
        return { onClick: onOpenWallpaper, visible: true };
      case 'settings':
        return { onClick: onOpenSettings, visible: true };
      case 'toggleEditMode':
        return {
          onClick: onToggleEditMode,
          visible: !isEditMode && !!item.showOnlyWhenEditLocked,
        };
      case 'changeBackground':
        return {
          // Hover (not click) opens the secondary submenu; no onClick action.
          onClick: () => {},
          visible: !!targetWidget,
        };
      case 'removeWidget':
        return {
          onClick: () => targetWidget && onDeleteWidget(targetWidget.id),
          visible: !!targetWidget,
        };
      case 'editIcon':
        return {
          onClick: () => targetWidget && onEditIcon(targetWidget.id),
          visible: !!targetWidget && targetWidget.type === 'icon-grid',
        };
      default:
        return null;
    }
  };

  // Render a single configured menu item.
  const renderItem = (item: ContextMenuItemConfig) => {
    const resolved = resolveAction(item.action, item);
    if (!resolved || !resolved.visible) return null;
    const Icon = item.icon;

    // "切换卡片背景" reveals a secondary submenu (flyout) on hover.
    if (item.action === 'changeBackground' && targetWidget) {
      const gradients = backgroundOptions;
      return (
        <React.Fragment key={item.id}>
          <div
            className="relative"
            onMouseEnter={openBgSubmenu}
            onMouseLeave={scheduleCloseBgSubmenu}
          >
            <button
              onClick={resolved.onClick}
              className={`w-full px-3 py-2.5 rounded-[var(--card-radius)] flex items-center justify-between text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10`}
            >
              <span className="flex items-center space-x-3">
                <Icon size={18} className="text-[color:var(--accent)]" />
                <span className="text-font-md">{item.label}</span>
              </span>
              <span className="text-slate-400 text-lg leading-none">›</span>
            </button>

            {/* Hover secondary submenu — pops out to the right of the menu */}
            {bgSubmenuOpen && (
              <div
                onMouseEnter={openBgSubmenu}
                onMouseLeave={scheduleCloseBgSubmenu}
                className="absolute left-full top-0 ml-3 w-72 p-5 rounded-[var(--card-radius)] bg-white dark:bg-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-black/10 dark:border-white/15"
              >
                <div className="px-1 mb-3 text-font-md font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                  卡片背景
                </div>

                {/* 亮色 / 暗色 选项卡，点击切换 */}
                <div className="mb-4 flex p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10">
                  {(['light', 'dark'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setBgTab(tab)}
                      className={`flex-1 py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors ${
                        bgTab === tab
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab === 'light' ? '亮色' : '暗色'}
                    </button>
                  ))}
                </div>

                {/* 纯色快捷选项：透明 / 纯黑 / 纯白，一排并列 */}
                <div className="mb-3 grid grid-cols-3 gap-3">
                  {SOLID_BG_COLORS.map((c) => (
                    <button
                      key={c.label}
                      title={c.label}
                      onClick={() => {
                        onChangeWidgetBackground(
                          targetWidget.id,
                          c.transparent ? undefined : c.value,
                          c.theme,
                        );
                        setBgSubmenuOpen(false);
                        onClose();
                      }}
                      style={
                        c.transparent
                          ? {
                              backgroundImage:
                                'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)',
                              backgroundSize: '10px 10px',
                              backgroundPosition: '0 0,5px 5px',
                              backgroundColor: '#fff',
                            }
                          : { background: c.value }
                      }
                      className={`h-12 rounded-[var(--card-radius)] border-2 hover:scale-105 hover:shadow-lg transition-transform ${
                        (c.transparent
                          ? targetWidget.background === undefined
                          : targetWidget.background === c.value)
                          ? 'border-[color:var(--accent)] ring-4 ring-[color:var(--accent)]/40'
                          : 'border-black/10 dark:border-white/15'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3.5">
                  {gradients.map((g) => (
                    <button
                      key={g.gradient}
                      title={g.gradient}
                      onClick={() => {
                        const t =
                          g.theme === 'dark' || g.theme === 'light'
                            ? g.theme
                            : undefined;
                        onChangeWidgetBackground(
                          targetWidget.id,
                          g.gradient,
                          t,
                        );
                        setBgSubmenuOpen(false);
                        onClose();
                      }}
                      style={{ background: g.gradient }}
                      className={`h-12 rounded-[var(--card-radius)] border-2 hover:scale-110 hover:shadow-lg ${
                        targetWidget.background === g.gradient
                          ? 'border-[color:var(--accent)] ring-4 ring-[color:var(--accent)]/40'
                          : 'border-white/50 dark:border-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {item.dividerAfter && (
            <div className="my-1 border-t border-black/5 dark:border-white/10" />
          )}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={item.id}>
        <button
          onClick={() => {
            resolved.onClick();
            onClose();
          }}
          className={`w-full px-3 py-2.5 rounded-[var(--card-radius)] flex items-center space-x-3 text-left transition-colors ${
            item.danger
              ? 'hover:bg-red-500/10 text-red-500 font-medium'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <Icon size={18} className={item.danger ? '' : 'text-[color:var(--accent)]'} />
          <span className="text-font-md">{item.label}</span>
        </button>
        {item.dividerAfter && (
          <div className="my-1 border-t border-black/5 dark:border-white/10" />
        )}
      </React.Fragment>
    );
  };

  return (
    <div
      ref={menuRef}
      style={{
        top: `${adjustedY}px`,
        left: `${adjustedX}px`,
          width: '272px',
        }}
        className="context-menu fixed z-[70] p-2.5 rounded-[var(--card-radius)] glass-panel bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-white/60 dark:border-white/15 text-font-md text-slate-800 dark:text-slate-100 select-none"
      >
        {/* Widget right-click: header + 调整尺寸 + widget-specific menu */}
        {targetWidget ? (
          <>
            <div className="px-3 py-2 mb-1.5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-font-md uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                {targetWidget.title}
              </span>
              <span className="text-font-sm px-2 py-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase">
                {targetWidget.size}
              </span>
            </div>

            {/* Widget Size Switching */}
            <div className="px-3 py-1.5 text-font-sm text-slate-400 font-medium">
              调整尺寸
            </div>
            <div className="grid grid-cols-4 gap-1.5 px-2 mb-2">
              {getWidgetConfig(targetWidget.type).sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    onResizeWidget(targetWidget.id, sz);
                    onClose();
                  }}
                  className={`py-1.5 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors ${
                    targetWidget.size === sz
                      ? 'bg-[color:var(--accent)] text-white shadow-md'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {WIDGET_SIZE_LABEL[sz]}
                </button>
              ))}
            </div>

            <div className="my-1 border-t border-black/5 dark:border-white/10" />

            {WIDGET_CONTEXT_MENU.map(renderItem)}
          </>
        ) : (
          /* Desktop (empty area) right-click */
          <>{DESKTOP_CONTEXT_MENU.map(renderItem)}</>
        )}
    </div>
  );
};
