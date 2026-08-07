import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Sliders, Check, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { WallpaperConfig, DynamicPreset } from '../types';
import { STATIC_WALLPAPERS } from '../data/presetData';
import { playSound } from '../utils/sound';
import { Modal } from './Modal';
import { dynamicPresets } from '../data/wallpaperEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (config: Partial<WallpaperConfig>) => void;
}

export const WallpaperModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wallpaper,
  onUpdateWallpaper,
}) => {
  const [customUrl, setCustomUrl] = useState('');



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="壁纸设置 (Dynamic & Static)"
      icon={<ImageIcon size={18} className="text-[#007AFF]" />}
      maxWidth="max-w-2xl"
    >
      {/* Modal Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Type Selector (Segmented Control) */}
            <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => {
                  playSound.playClick();
                  onUpdateWallpaper({ type: 'dynamic' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  wallpaper.type === 'dynamic'
                    ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} />
                <span>动态壁纸 (Canvas 60fps)</span>
              </button>
              <button
                onClick={() => {
                  playSound.playClick();
                  onUpdateWallpaper({ type: 'static' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  wallpaper.type === 'static'
                    ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <ImageIcon size={14} />
                <span>静态壁纸 / 渐变</span>
              </button>
            </div>

            {/* Dynamic Wallpapers Section */}
            {wallpaper.type === 'dynamic' ? (
              <div>
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider text-[11px]">
                  预设动态效果
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dynamicPresets.map((preset) => {
                    const isSelected = wallpaper.dynamicPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          playSound.playClick();
                          onUpdateWallpaper({ dynamicPreset: preset.id });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group flex items-center space-x-3 ${
                          isSelected
                            ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-[#007AFF]/30'
                            : 'border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/70'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${preset.previewColor} shadow-xs flex items-center justify-center text-white font-bold shrink-0`}
                        >
                          {isSelected && <Check size={16} />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-100">
                            {preset.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {preset.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Static Wallpapers Section */
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider text-[11px]">
                  精选 macOS Sonoma / 渐变壁纸
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {STATIC_WALLPAPERS.map((item) => {
                    const isSelected =
                      wallpaper.gradient === item.gradient || wallpaper.imageUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          playSound.playClick();
                          onUpdateWallpaper({
                            imageUrl: item.url,
                            gradient: item.gradient,
                          });
                        }}
                        className={`group relative h-24 rounded-xl overflow-hidden border transition-all text-left p-2 flex flex-col justify-end ${
                          isSelected
                            ? 'border-[#007AFF] ring-2 ring-[#007AFF]'
                            : 'border-black/5 dark:border-white/10 hover:border-black/20'
                        }`}
                        style={{
                          background: item.url ? `url(${item.url}) center/cover` : item.gradient,
                        }}
                      >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <span className="relative z-10 text-white font-medium text-[11px] drop-shadow-md">
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#007AFF] text-white p-1 rounded-full shadow-md">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Wallpaper URL */}
                <div className="pt-2">
                  <label className="block font-medium mb-1.5 text-slate-600 dark:text-slate-300">
                    自定义壁纸图片 URL:
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="输入图片链接 (e.g. https://...)"
                        className="w-full px-3 py-2 pl-8 rounded-[12px] bg-black/5 dark:bg-white/10 border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 text-xs"
                      />
                      <LinkIcon size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>
                    <button
                      onClick={() => {
                        if (customUrl.trim()) {
                          playSound.playClick();
                          onUpdateWallpaper({ imageUrl: customUrl.trim() });
                          setCustomUrl('');
                        }
                      }}
                      className="px-4 py-2 rounded-[12px] bg-[#007AFF] text-white font-medium hover:bg-blue-600 transition-colors"
                    >
                      应用
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Effects Tuning: Blur & Brightness */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-center space-x-2 font-semibold text-slate-700 dark:text-slate-200">
                <Sliders size={14} />
                <span>桌面模糊与亮度调节</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Blur Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">磨砂毛玻璃模糊:</span>
                    <span className="font-semibold">{wallpaper.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={wallpaper.blur}
                    onChange={(e) => onUpdateWallpaper({ blur: Number(e.target.value) })}
                    className="w-full accent-[#007AFF] cursor-pointer"
                  />
                </div>

                {/* Brightness Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">背景亮度:</span>
                    <span className="font-semibold">{wallpaper.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="120"
                    value={wallpaper.brightness}
                    onChange={(e) => onUpdateWallpaper({ brightness: Number(e.target.value) })}
                    className="w-full accent-[#007AFF] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-black/5 dark:border-white/10 flex justify-between items-center bg-black/5 dark:bg-white/5">
            <button
              onClick={() => {
                playSound.playClick();
                onUpdateWallpaper({ blur: 0, brightness: 100 });
              }}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <RefreshCw size={12} />
              <span>恢复默认滤镜</span>
            </button>
            <button
              onClick={() => {
                playSound.playClick();
                onClose();
              }}
              className="px-5 py-1.5 rounded-[12px] bg-[#007AFF] text-white font-medium hover:bg-blue-600 transition-colors shadow-xs"
            >
              完成
            </button>
          </div>
    </Modal>
  );
};
