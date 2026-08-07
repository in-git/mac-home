import THEME_OPTIONS from '../../data/theme.options';
import { buildWallpaperFilter } from '../../utils/wallpaperFilter';
import DepthCarousel from './DepthCarousel';

/** 所有主题卡片共用同一张预览图，仅滤镜参数不同 */
const THEME_CAROUSEL_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

/** 循环 theme.options.ts 生成卡片：brightness 为 0-1 系数，转成滤镜百分比 */
const items = THEME_OPTIONS.map((opt) => ({
  image: THEME_CAROUSEL_IMAGE,
  alt: opt.name,
  filter: buildWallpaperFilter({
    blur: opt.blur,
    brightness: opt.brightness * 100,
    contrast: opt.contrast,
    saturation: opt.saturation,
    hue: opt.hue,
    sepia: opt.sepia,
    grayscale: opt.grayscale,
    invert: opt.invert,
  }),
}));

<div style={{ height: '500px', position: 'relative' }}>
  <DepthCarousel
    items={items}
    depth={210}
    spread={60}
    tilt={22}
    tiltDirection="right"
    perspective={1400}
    visibleCards={4}
    falloff={0.2}
    blur={6}
    autoplay={false}
    loop
    cardWidth={380}
    cardHeight={430}
    radius={21}
    tint="#05060a"
    duration={700}
    ease="power3.out"
    autoplayDelay={3200}
    showControls
    showIndicators
  />
</div>;
