import {
  Check,
  Download,
  Image as ImageIcon,
  Moon,
  Palette,
  RotateCcw,
  Settings as SettingsIcon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import { playSound } from '../utils/sound';

// Curated accent colors exposed in the settings panel. Each entry is a CSS
// color used for the `--accent` CSS variable (drives buttons, rings, focus).
const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: '蓝', value: '#007AFF' },
  { name: '绿', value: '#34C759' },
  { name: '橙', value: '#FF9500' },
  { name: '粉', value: '#FF2D55' },
  { name: '紫', value: '#AF52DE' },
  { name: '红', value: '#FF3B30' },
  { name: '青', value: '#5AC8FA' },
  { name: '黄', value: '#FFCC00' },
];

export const SettingsWidget: React.FC = () => {
  const isDarkMode = useHomeStore((s) => s.isDarkMode);
  const setDarkMode = useHomeStore((s) => s.setDarkMode);
  const themeColor = useHomeStore((s) => s.themeColor);
  const setThemeColor = useHomeStore((s) => s.setThemeColor);
  const soundEnabled = useHomeStore((s) => s.soundEnabled);
  const setSoundEnabled = useHomeStore((s) => s.setSoundEnabled);
  const fontVariant = useHomeStore((s) => s.fontVariant);
  const setFontVariant = useHomeStore((s) => s.setFontVariant);
  const fontScale = useHomeStore((s) => s.fontScale);
  const setFontScale = useHomeStore((s) => s.setFontScale);
  const openWallpaper = useHomeStore((s) => s.openWallpaper);
  const resetLayout = useHomeStore((s) => s.resetLayout);
  const widgets = useHomeStore((s) => s.widgets);
  const notes = useHomeStore((s) => s.notes);

  const [justReset, setJustReset] = useState(false);

  // Keep the sound engine's master switch in sync with persisted state.
  useEffect(() => {
    playSound.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleDark = () => {
    playSound.playClick();
    setDarkMode(!isDarkMode);
  };

  const handleToggleSound = () => {
    // Play the confirmation click before muting so the user gets feedback.
    playSound.playClick();
    setSoundEnabled(!soundEnabled);
  };

  const handleReset = () => {
    playSound.playClick();
    resetLayout();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1500);
  };

  // 导出布局：将当前组件顺序、尺寸与便签序列化为 JSON 下载
  const handleExport = () => {
    playSound.playClick();
    const payload = {
      app: 'macOS 主页',
      version: 1,
      exportedAt: new Date().toISOString(),
      widgets,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macos-home-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col justify-between text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <SettingsIcon size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">
            系统设置 (Settings)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">macOS</span>
      </div>

      {/* Toggle rows */}
      <div className="flex flex-col space-y-2 my-2">
        {/* Dark mode */}
        <button
          onClick={handleToggleDark}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors text-left"
        >
          <span className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </div>
            <div>
              <div className="font-semibold text-[11px]">外观</div>
              <div className="text-[9px] text-slate-400">
                {isDarkMode ? '深色模式' : '浅色模式'}
              </div>
            </div>
          </span>
          <ToggleDot active={isDarkMode} />
        </button>

        {/* Sound */}
        <button
          onClick={handleToggleSound}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors text-left"
        >
          <span className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                soundEnabled
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/10 dark:bg-white/10 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </div>
            <div>
              <div className="font-semibold text-[11px]">点击音效</div>
              <div className="text-[9px] text-slate-400">
                {soundEnabled ? '已开启' : '已静音'}
              </div>
            </div>
          </span>
          <ToggleDot active={soundEnabled} />
        </button>

        {/* Wallpaper */}
        <button
          onClick={() => {
            playSound.playClick();
            openWallpaper();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors text-left"
        >
          <span className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              <ImageIcon size={14} />
            </div>
            <div>
              <div className="font-semibold text-[11px]">壁纸</div>
              <div className="text-[9px] text-slate-400">动态 / 静态</div>
            </div>
          </span>
          <span className="text-[10px] text-slate-400">更改 ›</span>
        </button>
      </div>

      {/* Accent color picker */}
      <div className="glass-panel p-2.5 rounded-2xl">
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1.5 font-medium">
          <Palette size={12} />
          <span>主题色</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                playSound.playClick();
                setThemeColor(c.value);
              }}
              title={c.name}
              className={`w-full aspect-square rounded-full transition-transform hover:scale-110 ${
                themeColor.toLowerCase() === c.value.toLowerCase()
                  ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-white/70'
                  : ''
              }`}
              style={{ backgroundColor: c.value }}
            >
              {themeColor.toLowerCase() === c.value.toLowerCase() && (
                <Check size={12} className="mx-auto text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font size: two variants (A: 12/14/16, B: 13/15/17) × three tiers */}
      <div className="glass-panel p-2.5 rounded-2xl">
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1.5 font-medium">
          <span className="text-[12px] leading-none">A</span>
          <span>字体大小</span>
        </div>

        {/* Variant switch (A / B) */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {(['A', 'B'] as const).map((v) => {
            const active = fontVariant === v;
            const sample = v === 'A' ? '12 / 14 / 16' : '13 / 15 / 17';
            return (
              <button
                key={v}
                onClick={() => {
                  playSound.playClick();
                  setFontVariant(v);
                }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl border transition-colors ${
                  active
                    ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                    : 'border-black/10 dark:border-white/10 text-slate-500 hover:bg-white/60 dark:hover:bg-white/5'
                }`}
              >
                <span className="text-[13px] font-bold">{v}</span>
                <span className="text-[9px] font-mono opacity-80">{sample}</span>
              </button>
            );
          })}
        </div>

        {/* Tier switch (小 / 中 / 大) */}
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { key: 'sm', label: '小' },
              { key: 'base', label: '中' },
              { key: 'lg', label: '大' },
            ] as const
          ).map((t) => {
            const active = fontScale === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  playSound.playClick();
                  setFontScale(t.key);
                }}
                className={`py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                    : 'border-black/10 dark:border-white/10 text-slate-500 hover:bg-white/60 dark:hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Export layout */}
      <button
        onClick={handleExport}
        className="mt-2 w-full flex items-center justify-center space-x-1.5 p-2 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors text-[11px] font-medium"
      >
        <Download size={12} className="text-slate-500" />
        <span className="text-slate-500">导出布局</span>
      </button>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="mt-2 w-full flex items-center justify-center space-x-1.5 p-2 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors text-[11px] font-medium"
      >
        <RotateCcw
          size={12}
          className={justReset ? 'text-[#28C840]' : 'text-slate-500'}
        />
        <span className={justReset ? 'text-[#28C840]' : 'text-slate-500'}>
          {justReset ? '已恢复默认布局' : '恢复默认布局'}
        </span>
      </button>
    </div>
  );
};

/** Small pill toggle indicator shown on the right of each setting row. */
const ToggleDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
      active ? 'bg-[#007AFF]' : 'bg-black/15 dark:bg-white/15'
    }`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
        active ? 'translate-x-3.5' : 'translate-x-0.5'
      }`}
    />
  </span>
);
