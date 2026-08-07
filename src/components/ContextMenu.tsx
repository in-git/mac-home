import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Image as ImageIcon,
  Search,
  Moon,
  Sun,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  AppWindow,
  ArrowUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { WidgetType, WidgetSize, WidgetItem, WIDGET_SIZE_OPTIONS, WIDGET_SIZE_LABEL } from '../types';
import { playSound } from '../utils/sound';

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
  onMoveToTopWidget: (id: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenWallpaper: () => void;
  onOpenSpotlight: () => void;
  onResetLayout: () => void;
  onOpenAddWidget: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  widgets,
  onDeleteWidget,
  onResizeWidget,
  onMoveToTopWidget,
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onToggleEditMode,
  isFocusMode,
  onToggleFocusMode,
  onOpenWallpaper,
  onOpenSpotlight,
  onResetLayout,
  onOpenAddWidget
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
        {/* If right clicked on a widget */}
        {targetWidget ? (
          <>
            <div className="px-2.5 py-1.5 mb-1 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                {targetWidget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase">
                {targetWidget.size}
              </span>
            </div>

            {/* Widget Size Switching */}
            <div className="px-2 py-1 text-[11px] text-slate-400 font-medium">调整尺寸</div>
            <div className="grid grid-cols-4 gap-1 px-1.5 mb-1.5">
              {WIDGET_SIZE_OPTIONS[targetWidget.type].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    playSound.playClick();
                    onResizeWidget(targetWidget.id, sz);
                    onClose();
                  }}
                  className={`py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    targetWidget.size === sz
                      ? 'bg-[#007AFF] text-white shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {WIDGET_SIZE_LABEL[sz]}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playSound.playClick();
                onMoveToTopWidget(targetWidget.id);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-left transition-colors"
            >
              <ArrowUp size={14} className="text-[#007AFF]" />
              <span>置于最前</span>
            </button>

            <button
              onClick={() => {
                playSound.playClick();
                onDeleteWidget(targetWidget.id);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 text-red-500 flex items-center space-x-2 text-left transition-colors font-medium"
            >
              <Trash2 size={14} />
              <span>移除该组件</span>
            </button>

            <div className="my-1 border-t border-black/5 dark:border-white/10" />
          </>
        ) : null}

        {/* Global Context Menu Options */}
        {/* Add Widget — opens the Add Widget modal directly */}
        <button
          onClick={() => {
            playSound.playClick();
            onOpenAddWidget();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Plus size={14} className="text-[#007AFF]" />
            <span>添加小组件...</span>
          </div>
          <span className="text-[10px] text-slate-400">›</span>
        </button>

        {/* Change Wallpaper */}
        <button
          onClick={() => {
            playSound.playClick();
            onOpenWallpaper();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-left transition-colors"
        >
          <ImageIcon size={14} className="text-purple-500" />
          <span>壁纸中心</span>
        </button>

        {/* Spotlight Search */}
        <button
          onClick={() => {
            playSound.playClick();
            onOpenSpotlight();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-left transition-colors"
        >
          <Search size={14} className="text-blue-500" />
          <span>聚焦搜索 (Spotlight)</span>
        </button>

        <div className="my-1 border-t border-black/5 dark:border-white/10" />

        {/* Toggle Dark Mode */}
        <button
          onClick={() => {
            playSound.playClick();
            onToggleDarkMode();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isDarkMode ? (
              <Sun size={14} className="text-amber-400" />
            ) : (
              <Moon size={14} className="text-indigo-500" />
            )}
            <span>外观：{isDarkMode ? '深色模式' : '浅色模式'}</span>
          </div>
          <span className="text-[10px] text-slate-400">{isDarkMode ? 'Dark' : 'Light'}</span>
        </button>

        {/* Toggle Edit Mode */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playSound.playClick();
            onToggleEditMode();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <Unlock size={14} className="text-emerald-500" />
            ) : (
              <Lock size={14} className="text-slate-400" />
            )}
            <span>{isEditMode ? '锁定自由布局' : '调整布局'}</span>
          </div>
          <span className="text-[10px] text-slate-400">{isEditMode ? '解锁中' : '已锁定'}</span>
        </button>

        {/* Focus Mode */}
        <button
          onClick={() => {
            playSound.playClick();
            onToggleFocusMode();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isFocusMode ? (
              <EyeOff size={14} className="text-rose-500" />
            ) : (
              <Eye size={14} className="text-sky-500" />
            )}
            <span>{isFocusMode ? '退出专注模式' : '进入专注模式'}</span>
          </div>
        </button>

        <div className="my-1 border-t border-black/5 dark:border-white/10" />

        {/* Reset Layout */}
        <button
          onClick={() => {
            playSound.playClick();
            onResetLayout();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 text-left transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <RotateCcw size={14} />
          <span>恢复默认排版</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
