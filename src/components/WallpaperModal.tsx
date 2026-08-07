import { useEffect, useRef, useState } from 'react';
import { Palette, Image as ImageIcon, SunMedium } from 'lucide-react';
import { Modal } from './Modal';
import { DynamicWallpaperCanvas } from './DynamicWallpaperCanvas';
import MoltenMetalWallpaper from '../effects/MoltenMetal';
import { ThreadsWallpaper } from '../effects/Threads';
import { PlasmaWaveWallpaper } from '../effects/PlasmaWave';
import {
  dynamicPresets,
  getWallpaperEffect,
  createParticles,
} from '../data/wallpaperEffects';
import { STATIC_WALLPAPERS } from '../data/presetData';
import type { WallpaperConfig } from '../types';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

type TabId = 'dynamic' | 'static' | 'adjust';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dynamic', label: '动态效果', icon: <Palette size={16} /> },
  { id: 'static', label: '静态壁纸', icon: <ImageIcon size={16} /> },
  { id: 'adjust', label: '桌面模糊与亮度', icon: <SunMedium size={16} /> },
];

/** Live miniature of a dynamic preset — renders the REAL effect, scaled to fit. */
const PresetLivePreview: React.FC<{ presetId: string; isDark: boolean }> = ({
  presetId,
  isDark,
}) => {
  if (presetId === 'molten-metal') {
    return <MoltenMetalWallpaper className="absolute inset-0" />;
  }
  if (presetId === 'threads') {
    return (
      <ThreadsWallpaper
        className="absolute inset-0"
        color={isDark ? [0.6, 0.6, 0.7] : [1, 1, 1]}
      />
    );
  }
  if (presetId === 'plasma-wave') {
    return (
      <PlasmaWaveWallpaper
        className="absolute inset-0"
        colors={isDark ? ['#A855F7', '#22D3EE'] : ['#C084FC', '#67E8F9']}
      />
    );
  }
  return <MiniCanvas2D presetId={presetId} isDark={isDark} />;
};

/** Tiny 2D canvas that drives the actual effect's `render` for a live thumbnail. */
const MiniCanvas2D: React.FC<{ presetId: string; isDark: boolean }> = ({
  presetId,
  isDark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ReturnType<typeof createParticles> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = 360);
    const H = (canvas.height = 240);
    particlesRef.current = createParticles(W, H);

    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const effect = getWallpaperEffect(presetId);
      if (effect) {
        effect.render({
          ctx,
          width: W,
          height: H,
          time: (now - start) / 1000,
          isDarkMode: isDark,
          particles: particlesRef.current!,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [presetId, isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />;
};

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  isDarkMode,
  onUpdateWallpaper,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('dynamic');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="桌面与屏幕保护" maxWidth="max-w-6xl">
      <div className="flex min-h-0 flex-1">
        {/* 竖向 Tab 导航 */}
        <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-black/5 p-3 dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500/15 font-medium text-blue-600 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* 右侧内容面板 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          {activeTab === 'dynamic' ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                动态效果
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {dynamicPresets.map((preset) => {
                  const isSelected = wallpaper.dynamicPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() =>
                        onUpdateWallpaper({
                          type: 'dynamic',
                          dynamicPreset: preset.id,
                        })
                      }
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/40'
                          : 'border-black/10 hover:border-blue-400/60 dark:border-white/10'
                      }`}
                    >
                      <PresetLivePreview
                        presetId={preset.id}
                        isDark={preset.isDarkMode ?? isDarkMode}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2.5 py-2">
                        <div className="truncate text-xs font-medium text-white">
                          {preset.name}
                        </div>
                        <div className="truncate text-[10px] text-white/70">
                          {preset.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          当前
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : activeTab === 'static' ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                静态壁纸
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {STATIC_WALLPAPERS.map((w) => {
                    const isSelected =
                      wallpaper.type === 'static' && wallpaper.gradient === w.gradient;
                    return (
                      <button
                        key={w.id}
                        onClick={() =>
                          onUpdateWallpaper({ type: 'static', gradient: w.gradient })
                        }
                      className={`aspect-[4/3] overflow-hidden rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/40'
                          : 'border-black/10 hover:scale-105 dark:border-white/10'
                      }`}
                      style={{ background: w.gradient }}
                      title={w.name}
                    >
                      {isSelected && (
                        <span className="inline-flex h-full w-full items-center justify-center">
                          <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            当前
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="space-y-5">
              {/* 实时预览 */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                <DynamicWallpaperCanvas wallpaper={wallpaper} isDarkMode={isDarkMode} />
              </div>

              {/* 模糊调节 */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    桌面模糊
                  </span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {wallpaper.blur}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={wallpaper.blur}
                  onChange={(e) => onUpdateWallpaper({ blur: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* 亮度调节 */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    亮度
                  </span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
                    {wallpaper.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={wallpaper.brightness}
                  onChange={(e) => onUpdateWallpaper({ brightness: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                调整将实时作用于桌面背景与顶部菜单栏。
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
