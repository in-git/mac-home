import clsx from 'clsx';
import React, {useState} from 'react';
import {Check, Image as ImageIcon} from 'lucide-react';
import {Skeleton} from '@heroui/react';

/** 图片壁纸项（仅含图片 URL，与渐变壁纸彻底分离） */
export interface ImageWallpaperItem {
  id: string;
  name?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  theme?: 'light' | 'dark' | 'both';
}

interface ImageWallpaperCardProps {
  item: ImageWallpaperItem;
  isSelected: boolean;
  onSelect: (item: ImageWallpaperItem) => void;
  /** 紧凑横向模式：用于顶部「当前壁纸」单独一行预览 */
  compact?: boolean;
}

export const ImageWallpaperCard: React.FC<ImageWallpaperCardProps> = ({
  item,
  isSelected,
  onSelect,
  compact = false,
}) => {
  const src = item.imageUrl || item.thumbnailUrl;
  const label = item.name || item.id;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // 已缓存图片不会触发 onLoad，主动检查 complete 避免永远空白
  React.useEffect(() => {
    setImgLoaded(false);
    if (imgRef.current?.complete) setImgLoaded(true);
  }, [src]);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={label}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08] transition-all duration-200',
        compact ? 'w-40' : 'w-full',
        isSelected &&
          'ring-2 ring-[color:var(--accent)] dark:ring-[color:var(--accent)]',
      )}
    >
      {/* 图片预览 */}
      <div
        className={clsx(
          'relative w-full bg-black/5 dark:bg-white/5 overflow-hidden ',
          compact ? 'aspect-[16/10]' : 'aspect-[16/9]',
        )}
      >
        {src && !imgError ? (
          <>
            {!imgLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            )}
            <img
              ref={imgRef}
              src={src}
              alt={label}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={clsx(
                'h-full w-full object-cover transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            <ImageIcon className="mr-1 h-4 w-4" />
            暂无预览
          </div>
        )}
      </div>

      {/* 选中态：主题背景色 + 白色勾（右上角） */}
      <div
        className={clsx(
          'pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-200',
          isSelected
            ? 'bg-[color:var(--accent)]/35 opacity-100'
            : 'bg-black/0 opacity-0 group-hover:bg-black/15 group-hover:opacity-100',
        )}
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
