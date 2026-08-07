import { Bluetooth, Moon, Sliders, Sun, Volume2, Wifi } from 'lucide-react';
import React, { useState } from 'react';
import { playSound } from '../utils/sound';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ControlCenterWidget: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [btEnabled, setBtEnabled] = useState(true);
  const [airdropEnabled, setAirdropEnabled] = useState(true);
  const [brightness, setBrightness] = useState(85);
  const [volume, setVolume] = useState(70);

  return (
    <div className="h-full flex flex-col justify-between text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <Sliders size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">
            控制中心 (Control Center)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          macOS Sonoma
        </span>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* Connectivity 2x2 Box */}
        <div className="glass-panel p-2.5 rounded-2xl space-y-2">
          {/* Wifi */}
          <button
            onClick={() => {
              playSound.playClick();
              setWifiEnabled(!wifiEnabled);
            }}
            className="w-full flex items-center space-x-2 text-left"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                wifiEnabled
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-black/10 dark:bg-white/10 text-slate-400'
              }`}
            >
              <Wifi size={14} />
            </div>
            <div>
              <div className="font-semibold text-[11px]">Wi-Fi</div>
              <div className="text-[9px] text-slate-400">
                {wifiEnabled ? '5G_Apple_Studio' : '已关闭'}
              </div>
            </div>
          </button>

          {/* Bluetooth */}
          <button
            onClick={() => {
              playSound.playClick();
              setBtEnabled(!btEnabled);
            }}
            className="w-full flex items-center space-x-2 text-left"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                btEnabled
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-black/10 dark:bg-white/10 text-slate-400'
              }`}
            >
              <Bluetooth size={14} />
            </div>
            <div>
              <div className="font-semibold text-[11px]">蓝牙</div>
              <div className="text-[9px] text-slate-400">
                {btEnabled ? 'AirPods Pro' : '已断开'}
              </div>
            </div>
          </button>
        </div>

        {/* Focus & Dark Mode Buttons */}
        <div className="flex flex-col space-y-2">
          {/* Dark Mode Tile */}
          <button
            onClick={() => {
              playSound.playClick();
              onToggleDarkMode();
            }}
            className={`flex-1 p-2.5 rounded-2xl flex items-center space-x-2 text-left transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 shadow-md border border-slate-700'
                : 'glass-panel hover:bg-white/80'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Moon size={14} />
            </div>
            <div>
              <div className="font-semibold text-[11px]">浅色深色</div>
              <div className="text-[9px] opacity-70">
                {isDarkMode ? '深色模式' : '浅色模式'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Sliders: Brightness & Volume */}
      <div className="glass-panel p-3 rounded-2xl space-y-2.5">
        <div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
            <span className="flex items-center space-x-1 font-medium">
              <Sun size={12} />
              <span>屏幕亮度</span>
            </span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
            <span className="flex items-center space-x-1 font-medium">
              <Volume2 size={12} />
              <span>声音音量</span>
            </span>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
