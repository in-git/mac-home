import { Image as ImageIcon, Palette, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { STATIC_WALLPAPERS } from '../data/presetData';
import THEME_OPTIONS from '../data/theme.options';
import {
  createParticles,
  dynamicPresets,
  getWallpaperEffect,
} from '../data/wallpaperEffects';
import MoltenMetalWallpaper from '../effects/MoltenMetal';
import { PlasmaWaveWallpaper } from '../effects/PlasmaWave';
import { ThreadsWallpaper } from '../effects/Threads';
import type { WallpaperConfig } from '../types';
import {
  buildWallpaperFilter,
  WallpaperFilterValues,
} from '../utils/wallpaperFilter';
import DepthCarousel from './DepthCarousel/DepthCarousel';
import { Modal } from './Modal';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  themeColor: string;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
  onUpdateThemeColor: (color: string) => void;
  onToggleDarkMode: () => void;
}

type TabId = 'dynamic' | 'static' | 'adjust';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dynamic', label: '动态效果', icon: <Palette size={16} /> },
  { id: 'static', label: '静态壁纸', icon: <ImageIcon size={16} /> },
  { id: 'adjust', label: '桌面主题', icon: <SunMedium size={16} /> },
];

const THEME_COLORS = [
  '#007AFF',
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
];

/** theme.options.ts 中单个桌面主题预设的结构 */
interface ThemeOption {
  name: string;
  desc: string;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  grayscale: number;
  invert: number;
}

/** 主题预设（brightness 为 0-1 系数）→ WallpaperConfig 的滤镜字段（brightness 为百分比） */
const themeOptionToPatch = (opt: ThemeOption): Partial<WallpaperConfig> => ({
  blur: opt.blur,
  brightness: Math.round(opt.brightness * 100),
  contrast: opt.contrast,
  saturation: opt.saturation,
  hue: opt.hue,
  sepia: opt.sepia,
  grayscale: opt.grayscale,
  invert: opt.invert,
});

/** 主题预设 → 预览用滤镜参数 */
const themeOptionToFilterValues = (
  opt: ThemeOption,
): WallpaperFilterValues => ({
  blur: opt.blur,
  brightness: opt.brightness * 100,
  contrast: opt.contrast,
  saturation: opt.saturation,
  hue: opt.hue,
  sepia: opt.sepia,
  grayscale: opt.grayscale,
  invert: opt.invert,
});

/** 判断当前 wallpaper 是否正应用了该主题预设 */
const isThemeSelected = (opt: ThemeOption, w: WallpaperConfig): boolean =>
  w.blur === opt.blur &&
  w.brightness === Math.round(opt.brightness * 100) &&
  (w.contrast ?? 1) === opt.contrast &&
  (w.saturation ?? 1) === opt.saturation &&
  (w.hue ?? 0) === opt.hue &&
  (w.sepia ?? 0) === opt.sepia &&
  (w.grayscale ?? 0) === opt.grayscale &&
  (w.invert ?? 0) === opt.invert;

/** 桌面主题轮播的共享预览图：所有卡片用同一张图，仅滤镜参数不同 */
const THEME_CAROUSEL_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

/** 桌面主题 3D 卡片选择器：最前方的卡片 = 当前选中效果 */
const ThemeCarouselPicker: React.FC<{
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}> = ({ wallpaper, onUpdateWallpaper }) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      THEME_OPTIONS.findIndex((o) => isThemeSelected(o, wallpaper)),
    ),
  );

  // 打开面板时定位到当前已应用的主题（若匹配）。
  // 作为 prop 传给 DepthCarousel，仅在挂载时生效一次。
  const initialIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((o) => isThemeSelected(o, wallpaper)),
  );

  const items = useMemo(
    () =>
      THEME_OPTIONS.map((opt) => ({
        image: THEME_CAROUSEL_IMAGE,
        alt: opt.name,
        filter: buildWallpaperFilter(themeOptionToFilterValues(opt)),
      })),
    [],
  );

  const active = THEME_OPTIONS[activeIndex];
  const isApplied = isThemeSelected(active, wallpaper);

  return (
    <div>
      <div className="relative h-[340px]">
        <DepthCarousel
          items={items}
          initialIndex={initialIndex}
          depth={200}
          spread={58}
          tilt={16}
          tiltDirection="right"
          perspective={1300}
          visibleCards={4}
          falloff={0.18}
          blur={5}
          autoplay={false}
          loop
          cardWidth={250}
          cardHeight={300}
          radius={20}
          tint="#05060a"
          duration={650}
          ease="power3.out"
          showControls
          showIndicators
          onChange={(index) => {
            setActiveIndex(index);
            onUpdateWallpaper(themeOptionToPatch(THEME_OPTIONS[index]));
          }}
        />
      </div>
      <div className="mt-2.5 flex min-h-[18px] items-center gap-2 px-1">
        {isApplied ? (
          <span className="shrink-0 rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-font-sm font-semibold text-white">
            当前
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-font-sm font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
            预览
          </span>
        )}
        <span className="shrink-0 text-sm font-medium text-slate-700 dark:text-slate-200">
          {active.name}
        </span>
        <span className="truncate text-xs text-slate-400 dark:text-slate-500">
          {active.desc}
        </span>
      </div>
    </div>
  );
};

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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
};

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  isDarkMode,
  themeColor,
  onUpdateWallpaper,
  onUpdateThemeColor,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('dynamic');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="桌面与屏幕保护"
      maxWidth="max-w-6xl"
    >
      <div className="flex min-h-0 flex-1   min-h-[80vh] md:min-h-[60vh]">
        {/* 竖向 Tab 导航 */}
        <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-black/5 p-3 dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[color:var(--accent)]/15 font-medium text-[color:var(--accent)] dark:text-[color:var(--accent)]'
                  : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* 右侧内容面板 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-5 ">
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
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-colors ${
                        isSelected
                          ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                          : 'border-black/10 hover:border-[color:var(--accent)]/60 dark:border-white/10'
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
                        <div className="truncate text-font-sm text-white/70">
                          {preset.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute right-2 top-2 rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-font-sm font-semibold text-white">
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
                    wallpaper.type === 'static' &&
                    wallpaper.gradient === w.gradient &&
                    (wallpaper.imageUrl ?? '') === (w.url ?? '');
                  return (
                    <button
                      key={w.id}
                      onClick={() =>
                        onUpdateWallpaper(
                          w.url
                            ? {
                                type: 'static',
                                gradient: w.gradient,
                                imageUrl: w.url,
                                dynamicPreset: undefined,
                              }
                            : {
                                type: 'static',
                                gradient: w.gradient,
                                imageUrl: undefined,
                                dynamicPreset: undefined,
                              },
                        )
                      }
                      className={`relative aspect-[4/3] overflow-hidden rounded-lg border transition-[transform,colors] ${
                        isSelected
                          ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                          : 'border-black/10 hover:scale-105 dark:border-white/10'
                      }`}
                      style={{ background: w.gradient }}
                      title={w.name}
                    >
                      {w.url && (
                        <img
                          src={w.url}
                          alt={w.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      {isSelected && (
                        <span className="absolute inset-0 inline-flex items-center justify-center bg-black/30">
                          <span className="rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-font-sm font-semibold text-white">
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
            <div className="space-y-6">
              {/* 桌面主题：3D 卡片轮播选择 */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  桌面主题
                </h3>
                <ThemeCarouselPicker
                  wallpaper={wallpaper}
                  onUpdateWallpaper={onUpdateWallpaper}
                />
              </section>

              {/* 手动微调 */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
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
                    onChange={(e) =>
                      onUpdateWallpaper({ blur: Number(e.target.value) })
                    }
                    className="w-full accent-[var(--accent)]"
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
                    max={120}
                    value={wallpaper.brightness}
                    onChange={(e) =>
                      onUpdateWallpaper({ brightness: Number(e.target.value) })
                    }
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              </div>

              {/* 主题色 */}
              <div>
                <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  主题色
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateThemeColor(c)}
                      className={`h-7 w-7 rounded-full border transition-transform ${
                        themeColor.toLowerCase() === c.toLowerCase()
                          ? 'scale-110 border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                          : 'border-black/10 hover:scale-110 dark:border-white/20'
                      }`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                  <label
                    className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-black/10 dark:border-white/20"
                    title="自定义主题色"
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                      }}
                    />
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => onUpdateThemeColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                拖动或点击最前方卡片切换主题，也可用下方滑块手动微调，效果实时作用于桌面背景与顶部菜单栏。
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
