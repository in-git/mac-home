import {
  Apple,
  Battery,
  Check,
  CloudSun,
  Image as ImageIcon,
  LayoutGrid,
  Moon,
  RotateCcw,
  Search,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { playSound } from '../utils/sound';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaperModal: () => void;
  onOpenSpotlight: () => void;
  onResetLayout: () => void;
  weatherTemp?: string;
}

export const TopBar: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaperModal,
  onOpenSpotlight,
  onResetLayout,
  weatherTemp = '26°C',
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isAppleMenuOpen, setIsAppleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
      setDateStr(
        now.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-8 px-3 glass-panel flex items-center justify-between text-xs font-medium border-b border-white/20 dark:border-white/10 select-none shadow-xs">
      {/* Left Menu Items */}
      <div className="flex items-center space-x-3">
        {/* Apple Logo Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              playSound.playClick();
              setIsAppleMenuOpen(!isAppleMenuOpen);
            }}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-slate-800 dark:text-slate-200"
            title="Apple 菜单"
          >
            <Apple size={15} className="fill-current" />
          </button>

          {isAppleMenuOpen && (
            <div
              className="absolute left-0 top-full mt-1 w-52 glass-panel rounded-xl shadow-2xl border border-white/30 dark:border-white/10 py-1.5 z-50 text-slate-800 dark:text-slate-100 backdrop-blur-3xl animate-in fade-in slide-in-from-top-1 duration-150"
              onClick={() => setIsAppleMenuOpen(false)}
            >
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                macOS Sonoma 桌面
              </div>
              <div className="my-1 border-t border-slate-200/50 dark:border-slate-700/50" />
              <button
                onClick={onOpenWallpaperModal}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center rounded-lg mx-0.5 transition-colors"
              >
                设置壁纸 (动态/静态)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEditMode();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center justify-between rounded-lg mx-0.5 transition-colors"
              >
                <span>{isEditMode ? '锁定布局' : '调整布局'}</span>
                {isEditMode ? <Check size={12} /> : <LayoutGrid size={12} />}
              </button>
              <button
                onClick={() => {
                  playSound.playClick();
                  onResetLayout();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center justify-between rounded-lg mx-0.5 transition-colors text-amber-600 dark:text-amber-400 hover:text-white"
              >
                <span>重置默认布局</span>
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>

        <span className="font-semibold text-slate-800 dark:text-slate-100 hidden sm:inline">
          macOS 主页
        </span>
      </div>

      {/* Center Spotlight Search Trigger */}
      <button
        onClick={() => {
          playSound.playClick();
          onOpenSpotlight();
        }}
        className="px-3 py-0.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center space-x-2 transition-colors cursor-pointer border border-black/5 dark:border-white/5"
      >
        <Search size={12} className="text-slate-400" />
        <span className="text-[11px]">聚焦搜索...</span>
        <span className="text-[10px] opacity-50 px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">
          ⌘K
        </span>
      </button>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-slate-700 dark:text-slate-200">
        {/* Weather Quick Stat */}
        <div className="hidden md:flex items-center space-x-1 text-[11px] font-medium bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
          <CloudSun size={13} className="text-amber-500" />
          <span>上海 {weatherTemp}</span>
        </div>

        {/* Wallpaper Picker Toggle */}
        <button
          onClick={() => {
            playSound.playClick();
            onOpenWallpaperModal();
          }}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="切换动态/静态壁纸"
        >
          <ImageIcon size={14} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            playSound.playClick();
            onToggleDarkMode();
          }}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        >
          {isDarkMode ? (
            <Sun size={14} className="text-amber-400" />
          ) : (
            <Moon size={14} className="text-slate-700" />
          )}
        </button>

        {/* Status System Icons */}
        <div className="hidden lg:flex items-center space-x-1.5 opacity-80">
          <Wifi size={13} />
          <Volume2 size={13} />
          <Battery size={14} />
        </div>

        {/* Time and Date */}
        <div className="flex items-center space-x-1 font-semibold text-[11px] pl-1">
          <span className="hidden sm:inline opacity-70">{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
