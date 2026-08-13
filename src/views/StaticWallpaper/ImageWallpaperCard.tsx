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
}

export const ImageWallpaperCard: React.FC<ImageWallpaperCardProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const src = item.imageUrl || item.thumbnailUrl;
  const label = item.name || item.id;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={label}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08]',
        isSelected &&
          'ring-2 ring-[color:var(--accent)] dark:ring-[color:var(--accent)]',
      )}
    >
      {/* 图片预览 */}
      <div className="relative aspect-[16/9] w-full bg-black/5 dark:bg-white/5">
        {src && !imgError ? (
          <>
            {!imgLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            )}
            <img
              src={src}
              alt={label}
              loading="lazy"
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

      {/* 选中态遮罩 + 勾选 */}
      <div
        className={clsx(
          'absolute inset-0 flex items-center justify-center rounded-xl transition-opacity duration-200',
          isSelected
            ? 'bg-black/25 opacity-100'
            : 'bg-black/0 opacity-0 group-hover:bg-black/15 group-hover:opacity-100',
        )}
      >
        {isSelected && (
          <Check className="h-7 w-7 text-white drop-shadow" strokeWidth={3} />
        )}
      </div>
    </button>
  );
};
