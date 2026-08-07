import React, { useState, useEffect } from 'react';
import {
  Apple,
  Search,
  Sun,
  Moon,
  Image as ImageIcon,
  Sliders,
  LayoutGrid,
  Check,
  RotateCcw,
  Volume2,
  Wifi,
  Battery,
  ShieldAlert,
  CloudSun,
  Plus,
  StickyNote,
  CheckSquare,
  Clock,
  Compass,
  Sparkles
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { WidgetType } from '../types';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaperModal: () => void;
  onOpenSpotlight: () => void;
  onOpenFormShowcase: () => void;
  onResetLayout: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onAddWidget: (type: WidgetType) => void;
  weatherTemp?: string;
}

export const TopBar: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaperModal,
  onOpenSpotlight,
  onOpenFormShowcase,
  onResetLayout,
  isFocusMode,
  onToggleFocusMode,
  onAddWidget,
  weatherTemp = '26°C',
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isAppleMenuOpen, setIsAppleMenuOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })
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
              <button
                onClick={onOpenFormShowcase}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center justify-between rounded-lg mx-0.5 transition-colors"
              >
                <span>关于此主页 & UI 规范</span>
                <span className="text-[10px] opacity-70">⌘I</span>
              </button>
              <div className="my-1 border-t border-slate-200/50 dark:border-slate-700/50" />
              <button
                onClick={onOpenWallpaperModal}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center rounded-lg mx-0.5 transition-colors"
              >
                设置壁纸 (动态/静态)
              </button>
              <button
                onClick={onToggleEditMode}
                className="w-full text-left px-3 py-1.5 hover:bg-[#007AFF] hover:text-white flex items-center justify-between rounded-lg mx-0.5 transition-colors"
              >
                <span>{isEditMode ? '锁定布局' : '自定义布局与大小'}</span>
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

        {/* Focus Mode Badge */}
        <button
          onClick={() => {
            playSound.playClick();
            onToggleFocusMode();
          }}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center space-x-1 transition-all ${
            isFocusMode
              ? 'bg-[#007AFF] text-white shadow-xs'
              : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10'
          }`}
          title="专注模式 (勿扰)"
        >
          <ShieldAlert size={11} />
          <span>{isFocusMode ? '专注中' : '标准'}</span>
        </button>
      </div>

      {/* Center Spotlight Search Trigger */}
      <button
        onClick={() => {
          playSound.playClick();
          onOpenSpotlight();
        }}
        className="px-3 py-0.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center space-x-2 transition-all cursor-pointer border border-black/5 dark:border-white/5"
      >
        <Search size={12} className="text-slate-400" />
        <span className="text-[11px]">聚焦搜索...</span>
        <span className="text-[10px] opacity-50 px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">⌘K</span>
      </button>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-slate-700 dark:text-slate-200">
        {/* Add Widget Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              playSound.playClick();
              setIsAddWidgetOpen(!isAddWidgetOpen);
            }}
            className="px-2.5 py-0.5 rounded-lg bg-[#007AFF] text-white hover:bg-blue-600 transition-all flex items-center space-x-1 text-[11px] font-semibold shadow-xs"
            title="添加小组件"
          >
            <Plus size={12} />
            <span>添加组件</span>
          </button>

          {isAddWidgetOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 glass-panel rounded-xl shadow-2xl border border-white/30 dark:border-white/10 py-1.5 z-50 text-slate-800 dark:text-slate-100 backdrop-blur-3xl animate-in fade-in duration-150 space-y-0.5"
              onClick={() => setIsAddWidgetOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                选择添加组件
              </div>
              {[
                { type: 'weather', name: '天气预报', icon: CloudSun, color: 'text-sky-500' },
                { type: 'tasks', name: '实时提醒', icon: CheckSquare, color: 'text-amber-500' },
                { type: 'sticky-notes', name: '便签笔记', icon: StickyNote, color: 'text-yellow-500' },
                { type: 'clock', name: '时钟日历', icon: Clock, color: 'text-purple-500' },
                { type: 'shortcuts', name: '快捷导航', icon: Compass, color: 'text-emerald-500' },
                { type: 'control-center', name: '控制中心', icon: Sliders, color: 'text-blue-500' },
                { type: 'form-showcase', name: 'Apple UI 表单', icon: Sparkles, color: 'text-indigo-500' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => onAddWidget(item.type as WidgetType)}
                    className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 flex items-center space-x-2 rounded-lg mx-0.5 transition-colors text-xs font-medium"
                  >
                    <IconComponent size={14} className={item.color} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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

        {/* Apple UI Form Specs Showcase Modal Button */}
        <button
          onClick={() => {
            playSound.playClick();
            onOpenFormShowcase();
          }}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#007AFF]"
          title="Apple UI 表单规范展示"
        >
          <Sliders size={14} />
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
          {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-700" />}
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
