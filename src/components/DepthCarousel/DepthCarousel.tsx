import { useEffect, useMemo, useState } from 'react';
import CircularGallery from '../CircularGallery/CircularGallery';

export type DepthCarouselItem =
  | string
  | { image: string; alt?: string; filter?: string };

export interface DepthCarouselProps {
  items?: DepthCarouselItem[];
  /** 3D 参数保留以兼容旧调用，但新渲染（CircularGallery）不使用 */
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  /** 初始定位到指定索引（仅挂载时生效一次），用于打开面板时对齐当前选中项 */
  initialIndex?: number;
  onChange?: (index: number, item: { image: string; alt?: string }) => void;
  /** 动画停止后触发，传入最终停留的卡片索引。 */
  onSettle?: (index: number) => void;
  className?: string;
}

const normalizeItem = (it: DepthCarouselItem) =>
  typeof it === 'string'
    ? { image: it, alt: '', filter: undefined }
    : { image: it.image, alt: it.alt ?? '', filter: it.filter };

/**
 * 将「原图 + CSS filter」预渲染到 canvas 生成 dataURL，
 * 让 WebGL 纹理也能保留原本依赖 CSS filter 的主题效果。
 * 原图需允许跨域（crossOrigin=anonymous），否则 canvas 会被污染而失败，此时回退到原始图片。
 */
function renderFiltered(src: string, filter?: string): Promise<string> {
  if (!filter) return Promise.resolve(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src);
        if (filter) ctx.filter = filter;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

const DepthCarousel = ({
  items = [],
  showControls = true,
  showIndicators = true,
  initialIndex,
  onChange,
  onSettle,
  className = '',
}: DepthCarouselProps) => {
  const data = useMemo(
    () => (Array.isArray(items) ? items : []).map(normalizeItem),
    [items],
  );
  const count = data.length;

  // 把每张卡片的 filter 预渲染进图片，得到可用于 WebGL 纹理的 dataURL。
  const [rendered, setRendered] = useState<{ image: string; text: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await Promise.all(
        data.map(async (it) => ({
          image: await renderFiltered(it.image, it.filter),
          text: it.alt,
        })),
      );
      if (!cancelled) setRendered(res);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className={`w-full h-full ${className}`.trim()}>
      <CircularGallery
        items={rendered.length === count ? rendered : []}
        initialIndex={initialIndex}
        showControls={showControls}
        showIndicators={showIndicators}
        textColor="#ffffff"
        bend={Math.min(3, Math.max(1, count > 6 ? 3 : 1.5))}
        scrollSpeed={count > 1 ? 2 : 0}
        onActiveChange={(index) => onChange?.(index, { image: data[index]?.image ?? '', alt: data[index]?.alt })}
        onSettle={onSettle}
      />
    </div>
  );
};

export default DepthCarousel;
