import {
  Battery,
  CloudSun,
  Image as ImageIcon,
  Moon,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';


interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaperModal: () => void;
  weatherTemp?: string;
}

export const TopBar: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaperModal,
  weatherTemp = '26°C',
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

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
        <span className="font-semibold text-slate-800 dark:text-slate-100 hidden sm:inline">
          吴文龙的实验室
        </span>
      </div>

      {/* Center spacer */}

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-slate-700 dark:text-slate-200">
        {/* Weather Quick Stat */}
        <div className="hidden md:flex items-center space-x-1 text-font-sm font-medium bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
          <CloudSun size={13} className="text-amber-500" />
          <span>上海 {weatherTemp}</span>
        </div>

        {/* Wallpaper Picker Toggle */}
        <button
          onClick={() => {
            
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
        <div className="flex items-center space-x-1 font-semibold text-font-sm pl-1">
          <span className="hidden sm:inline opacity-70">{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
