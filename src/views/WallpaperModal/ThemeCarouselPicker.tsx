import { useMemo, useRef, useState } from 'react';
import THEME_OPTIONS from '../../data/options/filter.options';
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

/** filter.options.ts 中单个桌面主题预设的结构 */
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

/**
 * 桌面主题 3D 卡片选择器：最前方的卡片 = 当前选中效果。
 *
 * 采用单向数据流：
 *  - 卡片 → 数据：用户滑动卡片，等轮播动画真正停止后（onSettle）才把对应主题写入
 *    wallpaper（onUpdateWallpaper）。滑动过程中仅即时更新展示，不写入。
 *  - 数据 ↛ 卡片：下方手动微调（滤镜滑块）改变 wallpaper 时，不会回流影响卡片位置/状态，
 *    卡片仅在挂载时从 wallpaper 读取一次初始主题。
 *  - 限定触发次数：onSettle 由底层 CircularGallery 在动画停止时触发一次，
 *    一次滑动操作只触发一次 onUpdateWallpaper，避免高频重绘与状态闪烁。
 */
export const ThemeCarouselPicker: React.FC<ThemeCarouselPickerProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  // 仅在挂载时从 wallpaper 读取初始主题，锁定 initialIndex。
  // 必须只取一次：若每次随 wallpaper 变化，会作为新 prop 传入
  // DepthCarousel → CircularGallery，而 initialIndex 恰在 CircularGallery 的
  // useEffect 依赖中，会触发 WebGL 场景销毁并异步重建（等待字体加载），
  // 重建间隙 canvas 被移除 → 卡片白屏。用 useState 惰性初始化锁定初值。
  const [initialIndex] = useState(() =>
    Math.max(0, THEME_OPTIONS.findIndex((o) => isThemeSelected(o, wallpaper))),
  );
  // 当前正前方卡片索引：滑动过程中即时更新，仅用于展示名称/描述/徽标。
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  // 最近一次已应用到桌面的主题索引；仅在 debounce 结束后更新，驱动「当前/预览」徽标。
  // 单向数据流：不再从 wallpaper 反推，避免下方手动微调导致徽标反复跳变。
  const [appliedIndex, setAppliedIndex] = useState(initialIndex);

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
  const isApplied = activeIndex === appliedIndex;

  // 单向：卡片 → 数据。用 ref 持有最新回调，避免成为定时器依赖。
  const onUpdateRef = useRef(onUpdateWallpaper);
  onUpdateRef.current = onUpdateWallpaper;

  return (
    <div>
      <div className="relative h-[340px] bg-black">
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
          cardWidth={150}
          cardHeight={300}
          radius={20}
          tint="#05060a"
          duration={650}
          ease="power3.out"
          showControls
          showIndicators
          onChange={(index) => {
            // 即时更新展示（名称/描述/预览徽标），不写入 wallpaper。
            setActiveIndex(index);
          }}
          onSettle={(index) => {
            // 轮播动画真正停止后才把主题写入 wallpaper，避免滑动过程中频繁应用。
            setAppliedIndex(index);
            onUpdateRef.current(themeOptionToPatch(THEME_OPTIONS[index]));
          }}
        />
      </div>
      <div className="mt-2.5 flex min-h-[18px] items-center gap-2 px-1 dark:bg-black bg-white p-4 justify-center">
        {isApplied ? (
          <span className="shrink-0 rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-font-sm font-semibold text-white">
            当前
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-font-sm font-medium dark:bg-white/10 dark:text-slate-300">
            预览
          </span>
        )}
        <span className="shrink-0  font-medium text-slate-700 dark:text-slate-200">
          {active.name}
        </span>
        <span className="truncate   dark:text-slate-500">
          {active.desc}
        </span>
      </div>
    </div>
  );
};
