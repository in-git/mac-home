import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import {
  createParticles,
  dynamicPresets,
  getWallpaperEffect,
} from '../../data/wallpaperEffects';
import MoltenMetalWallpaper from '../../effects/MoltenMetal';
import { PlasmaWaveWallpaper } from '../../effects/PlasmaWave';
import { ThreadsWallpaper } from '../../effects/Threads';
import type { WallpaperConfig } from '../../types';

interface DynamicWallpaperSectionProps {
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
  onToggleDarkMode: () => void;
}

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
    const H = (canvas.height = 202);
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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
};

/** 动态效果面板组件：以「亮色 / 深色」Tab 区分预设，点击后应用到桌面 */
export const DynamicWallpaperSection: React.FC<
  DynamicWallpaperSectionProps
> = ({ wallpaper, isDarkMode, onUpdateWallpaper, onToggleDarkMode }) => {
  // 固定深色的预设（WebGL 类）归入「深色」，其余跟随全局模式归入「亮色」
  const lightPresets = dynamicPresets.filter((p) => !p.isDarkMode);
  const darkPresets = dynamicPresets.filter((p) => p.isDarkMode);

  const renderPreset = (preset: (typeof dynamicPresets)[number]) => {
    const isSelected =
      wallpaper.type === 'dynamic' && wallpaper.dynamicPreset === preset.id;
    return (
      <button
        key={preset.id}
        onClick={() => {
          onUpdateWallpaper({
            type: 'dynamic',
            dynamicPreset: preset.id,
            // 清除静态字段，避免残留污染渲染分支。
            imageUrl: undefined,
          });
          // 预设配置了 isDarkMode 时，强制切换到暗色模式；
          // 否则跟随全局模式，避免从强制深色预设切走后卡在暗色。
          if (preset.isDarkMode && !isDarkMode) {
            onToggleDarkMode();
          }
        }}
        className={`group relative aspect-video overflow-hidden rounded-[var(--card-radius)] border bg-black text-left transition-colors ${
          isSelected
            ? 'border-[color:var(--accent)]'
            : 'border-black/10 hover:border-[color:var(--accent)]/60 dark:border-white/10'
        }`}
      >
        <PresetLivePreview
          presetId={preset.id}
          isDark={preset.isDarkMode ?? isDarkMode}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2.5 py-2">
          <div className="truncate text-xs  text-white">
            {preset.name}
          </div>
          <div className="truncate text-font-sm text-white/70">
            {preset.desc}
          </div>
        </div>
        {/* 选中态：主题背景色 + 右上角白色勾，与静态壁纸保持一致 */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-[var(--card-radius)] transition-opacity duration-200 ${
            isSelected
              ? 'bg-[color:var(--accent)]/35 opacity-100'
              : 'bg-black/0 opacity-0'
          }`}
        >
          {isSelected && (
            <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] shadow-md">
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200 ">
        动态效果
      </h3>
      {/* 深色在上 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {darkPresets.map(renderPreset)}
      </div>
      {/* 亮色在下 */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {lightPresets.map(renderPreset)}
      </div>
    </section>
  );
};
