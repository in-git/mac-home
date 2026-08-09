import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef } from 'react';
import { getWidgetConfig } from '../data/widgetConfig';
import {
  DESKTOP_CONTEXT_MENU,
  WIDGET_CONTEXT_MENU,
  ContextMenuAction,
  ContextMenuItemConfig,
} from '../data/contextMenuConfig';
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
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaper: () => void;
  onOpenAddWidget: () => void;
  onOpenSettings: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  widgets,
  onDeleteWidget,
  onResizeWidget,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaper,
  onOpenAddWidget,
  onOpenSettings,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Adjust coordinates so the context menu doesn't overflow screen boundaries
  const menuWidth = 220;
  const menuHeight = 360;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const adjustedX = Math.min(position.x, screenW - menuWidth - 10);
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
      case 'removeWidget':
        return {
          onClick: () => targetWidget && onDeleteWidget(targetWidget.id),
          visible: !!targetWidget,
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
    return (
      <React.Fragment key={item.id}>
        <button
          onClick={() => {
            resolved.onClick();
            onClose();
          }}
          className={`w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2 text-left transition-colors ${
            item.danger
              ? 'hover:bg-red-500/10 text-red-500 font-medium'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <Icon size={14} className={item.danger ? '' : 'text-[#007AFF]'} />
          <span>{item.label}</span>
        </button>
        {item.dividerAfter && (
          <div className="my-1 border-t border-black/5 dark:border-white/10" />
        )}
      </React.Fragment>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
        className="fixed z-50 w-56 p-1.5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/85 backdrop-blur-3xl shadow-2xl border border-white/60 dark:border-white/15 text-xs text-slate-800 dark:text-slate-100 select-none overflow-hidden"
      >
        {/* Widget right-click: header + 调整尺寸 + widget-specific menu */}
        {targetWidget ? (
          <>
            <div className="px-2.5 py-1.5 mb-1 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-font-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                {targetWidget.title}
              </span>
              <span className="text-font-sm px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase">
                {targetWidget.size}
              </span>
            </div>

            {/* Widget Size Switching */}
            <div className="px-2 py-1 text-font-sm text-slate-400 font-medium">
              调整尺寸
            </div>
            <div className="grid grid-cols-4 gap-1 px-1.5 mb-1.5">
              {getWidgetConfig(targetWidget.type).sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    onResizeWidget(targetWidget.id, sz);
                    onClose();
                  }}
                  className={`py-1 rounded-lg text-font-sm font-semibold transition-colors ${
                    targetWidget.size === sz
                      ? 'bg-[#007AFF] text-white shadow-xs'
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
      </motion.div>
    </AnimatePresence>
  );
};
