import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import {
  ContextMenuAction,
  ContextMenuItemConfig,
  DESKTOP_CONTEXT_MENU,
  WIDGET_CONTEXT_MENU,
} from '../../data/contextMenuConfig';
import { getSizeOptions } from '../../data/options/size.options';
import { useHomeStore } from '../../store/useHomeStore';
import { BackgroundSubmenu } from './BackgroundSubmenu';
import {
  WIDGET_CONFIG_SUBMENUS,
  WidgetConfigSubmenuProps,
} from './widgetSubmenus';
import { ContextMenuProps } from './types';

export type { ContextMenuPosition } from './types';

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  widgets,
  onDeleteWidget,
  onResizeWidget,
  onChangeWidgetBackground,
  onUpdateWidget,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaper,
  onOpenAddWidget,
  onOpenSettings,
  showDesktopIcons,
  onToggleDesktopIcons,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // 最终渲染坐标：先按点击位置渲染一次，measure 到真实尺寸后再修正，避免溢出屏幕。
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // 在渲染后测量菜单真实尺寸，动态夹紧到屏幕边界，避免点击屏幕下方时偏离坐标。
  useLayoutEffect(() => {
    if (!position) return;
    const el = menuRef.current;
    if (!el) return;

    const menuWidth = el.offsetWidth;
    const menuHeight = el.offsetHeight;
    // 有目标组件时主菜单右侧可能弹出二级 flyout 子菜单，水平方向额外预留其宽度，
    // 避免子菜单被挤出屏幕；无则仅按主菜单宽度夹紧。
    const submenuReserve = position.targetWidgetId ? 292 : 0;

    const margin = 10;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let x = position.x;
    let y = position.y;
    // 水平：优先保证点击点位于菜单左侧；溢出右边界时左移。
    if (x + menuWidth + submenuReserve > screenW - margin) {
      x = screenW - menuWidth - submenuReserve - margin;
    }
    // 垂直：菜单默认从点击点往下展开，溢出底边界时上移，使其底部贴齐点击点。
    if (y + menuHeight > screenH - margin) {
      y = screenH - menuHeight - margin;
    }
    x = Math.max(margin, x);
    y = Math.max(margin, y);

    setPos({ x, y });
  }, [position]);

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

  // 查不到或者位置未配置列表时，按默认列表或第一项 fallback
  const storeWidgets = useHomeStore.getState().widgets;
  const allWidgets = widgets && widgets.length > 0 ? widgets : storeWidgets;
  const targetWidget = position.targetWidgetId
    ? allWidgets.find((w) => w.id === position.targetWidgetId)
    : null;

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
          visible: true,
        };
      case 'changeBackground':
        return {
          // Hover (not click) opens the secondary submenu; no onClick action.
          onClick: () => {},
          visible: !!targetWidget,
        };
      case 'editWidgetConfig':
        return {
          // Hover opens the type-specific secondary submenu; only show when a
          // submenu is registered for this widget type.
          onClick: () => {},
          visible: !!targetWidget && !!WIDGET_CONFIG_SUBMENUS[targetWidget.type],
        };
      case 'removeWidget':
        return {
          onClick: () => targetWidget && onDeleteWidget(targetWidget.id),
          visible: !!targetWidget,
        };
      case 'toggleDesktopIcons':
        return {
          onClick: onToggleDesktopIcons,
          visible: !targetWidget,
        };

      default:
        return null;
    }
  };

  // Render a single configured menu item.
  const renderItem = (item: ContextMenuItemConfig) => {
    const resolved = resolveAction(item.action, item);
    if (!resolved || !resolved.visible) return null;

    // "切换卡片背景" reveals a secondary submenu (flyout) on hover.
    if (item.action === 'changeBackground' && targetWidget) {
      return (
        <BackgroundSubmenu
          key={item.id}
          item={item}
          targetWidget={targetWidget}
          onChangeWidgetBackground={onChangeWidgetBackground}
          onClose={onClose}
        />
      );
    }

    // "个性化" reveals the type-specific secondary config submenu (flyout) on hover.
    if (item.action === 'editWidgetConfig' && targetWidget) {
      const Submenu = WIDGET_CONFIG_SUBMENUS[targetWidget.type];
      if (Submenu) {
        const submenuProps: WidgetConfigSubmenuProps = {
          item,
          targetWidget,
          onUpdateWidgetData: (id, patch) =>
            onUpdateWidget(id, {
              data: { ...targetWidget.data, ...patch },
            }),
          onClose,
        };
        return <Submenu key={item.id} {...submenuProps} />;
      }
    }

    const Icon = item.icon;

    // Toggle-style item (e.g. "清屏"、"布局") renders a checkmark on the right.
    if (item.isToggle || item.action === 'toggleEditMode') {
      const checked =
        item.action === 'toggleDesktopIcons'
          ? !showDesktopIcons
          : item.action === 'toggleEditMode'
          ? isEditMode
          : false;
      return (
        <React.Fragment key={item.id}>
          <button
            onClick={() => {
              resolved.onClick();
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-[var(--card-radius)] flex items-center space-x-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon size={18} className="text-[color:var(--accent)]" />
            <span className="text-font-md flex-1">{item.label}</span>
            {checked && (
              <Check size={16} className="text-[color:var(--accent)]" />
            )}
          </button>
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
              ? 'hover:bg-red-500/10 text-red-500 '
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

  // 渲染坐标：position 为点击位置；measure 完成后用修正后的 pos（避免菜单溢出屏幕）。
  const renderX = pos ? pos.x : position.x;
  const renderY = pos ? pos.y : position.y;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${renderY}px`,
        left: `${renderX}px`,
        width: '272px',
      }}
      className="context-menu fixed z-[70] p-2.5 rounded-[var(--card-radius)] bg-white dark:bg-black shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-black/10 dark:border-white/15 text-font-md  select-none"
    >
      {/* Widget right-click: header + 调整尺寸 + widget-specific menu */}
      {targetWidget ? (
        <>
          <div className="px-3 py-2 mb-1.5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <span className="font-bold text-font-md uppercase tracking-wider  dark:truncate">
              {targetWidget.title}
            </span>
            <span className="text-font-sm px-2 py-0.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10  uppercase">
              {targetWidget.grid?.w ? `${targetWidget.grid.w}/36` : ''}
            </span>
          </div>

          {/* Widget Size Switching */}
          {(() => {
            const sizeList = getSizeOptions(targetWidget.type);
            return (
              <>
                <div className="px-3 py-1.5 text-font-sm ">
                  调整尺寸
                </div>
                <div className="grid grid-cols-4 gap-1.5 px-2 mb-2">
                  {sizeList.map((sz) => {
                    // 配置了 h 的档位需宽高都匹配才算当前档位
                    const isCurrent =
                      targetWidget.grid?.w === sz.w &&
                      (sz.h === undefined || targetWidget.grid?.h === sz.h);
                    // 宽高相等时显示原始值（如 6x6），不相等时显示约分后的比例（如 3:2）
                    const label = sz.h !== undefined 
                      ? sz.w === sz.h 
                        ? `${sz.w}x${sz.h}`
                        : (() => {
                            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                            const divisor = gcd(sz.w, sz.h);
                            return `${sz.w / divisor}:${sz.h / divisor}`;
                          })()
                      : `${sz.w}`;
                    return (
                      <button
                        key={`${sz.w}x${sz.h ?? ''}`}
                        onClick={() => {
                          onResizeWidget(targetWidget.id, sz);
                          onClose();
                        }}
                        className={`py-1.5 rounded-[var(--card-radius)] text-font-md  transition-colors ${
                          isCurrent
                            ? 'bg-[color:var(--accent)] text-white shadow-md'
                            : 'hover:bg-black/5 dark:hover:bg-white/10  '
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}

          <div className="my-1 border-t border-black/5 dark:border-white/10" />

          {WIDGET_CONTEXT_MENU.map(renderItem)}

          {/* 底部显示当前卡片的高度和宽度参数 (grid: w, h)，可输入调整 */}
          <div
            key={targetWidget.id}
            className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 px-3 py-2 text-font-sm "
          >
            <div className="flex items-center justify-between mb-1.5">
              <span>尺寸调整</span>
              <span className="font-mono text-font-xs  bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded opacity-70">
                {targetWidget.grid?.w ?? '-'} / {targetWidget.grid?.h ?? '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-1.5">
                <span className="text-font-xs opacity-70">宽</span>
                <input
                  type="number"
                  min={1}
                  defaultValue={targetWidget.grid?.w ?? 2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  onBlur={(e) => {
                    const val = Number(e.currentTarget.value);
                    if (!Number.isFinite(val) || val < 1) return;
                    onUpdateWidget(targetWidget.id, {
                      grid: {
                        ...targetWidget.grid,
                        w: val,
                      },
                    });
                  }}
                  className="w-full min-w-0 px-2 py-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 border border-transparent focus:border-[color:var(--accent)] focus:outline-none text-font-md font-mono"
                />
              </label>
              <label className="flex flex-1 items-center gap-1.5">
                <span className="text-font-xs opacity-70">高</span>
                <input
                  type="number"
                  min={1}
                  defaultValue={targetWidget.grid?.h ?? 5}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  onBlur={(e) => {
                    const val = Number(e.currentTarget.value);
                    if (!Number.isFinite(val) || val < 1) return;
                    onUpdateWidget(targetWidget.id, {
                      grid: {
                        ...targetWidget.grid,
                        h: val,
                      },
                    });
                  }}
                  className="w-full min-w-0 px-2 py-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 border border-transparent focus:border-[color:var(--accent)] focus:outline-none text-font-md font-mono"
                />
              </label>
            </div>
          </div>
        </>
      ) : (
        /* Desktop (empty area) right-click */
        <>{DESKTOP_CONTEXT_MENU.map(renderItem)}</>
      )}
    </div>
  );
};
