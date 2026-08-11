import { useEffect, useMemo, useRef, useState } from 'react';
import THEME_OPTIONS from '../../data/options/theme.options';
import type { WallpaperConfig } from '../../types';
import {
  buildWallpaperFilter,
  WallpaperFilterValues,
} from '../../utils/wallpaperFilter';
import DepthCarousel from '../../components/DepthCarousel/DepthCarousel';

interface ThemeCarouselPickerProps {
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

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

/** 主题预设（brightness 为 0-1 系数）→ WallpaperConfig 的滤镜字段（brightness 为百分比） */
const THEME_CAROUSEL_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

/** 桌面主题 3D 卡片选择器：最前方的卡片 = 当前选中效果 */
export const ThemeCarouselPicker: React.FC<ThemeCarouselPickerProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      THEME_OPTIONS.findIndex((o) => isThemeSelected(o, wallpaper)),
    ),
  );

  // 打开面板时定位到当前已应用的主题（若匹配）。
  // 必须仅在挂载时取值一次：若每次随 wallpaper 变化，会作为新 prop 传入
  // DepthCarousel → CircularGallery，而 initialIndex 恰在 CircularGallery 的
  // useEffect 依赖中，会触发 WebGL 场景销毁并异步重建（等待字体加载），
  // 重建间隙 canvas 被移除 → 卡片白屏。用 useState 惰性初始化锁定初值。
  const [initialIndex] = useState(() =>
    Math.max(0, THEME_OPTIONS.findIndex((o) => isThemeSelected(o, wallpaper))),
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

  // 滑动过程中 onActiveChange 会跨过多张卡片连续触发。
  // 用 requestAnimationFrame 合并：同一帧内的多次触发只应用最后一次，
  // 既避免背景反复重绘闪烁，又不像 setTimeout 那样产生 250ms 延迟与白屏。
  const onUpdateRef = useRef(onUpdateWallpaper);
  onUpdateRef.current = onUpdateWallpaper;
  const pendingIndex = useRef<number | undefined>(undefined);
  const applyRaf = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (applyRaf.current !== undefined) {
        cancelAnimationFrame(applyRaf.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="relative h-[240px]">
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
            pendingIndex.current = index;
            if (applyRaf.current === undefined) {
              applyRaf.current = requestAnimationFrame(() => {
                applyRaf.current = undefined;
                const idx = pendingIndex.current;
                if (idx !== undefined) {
                  onUpdateRef.current(themeOptionToPatch(THEME_OPTIONS[idx]));
                }
              });
            }
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
