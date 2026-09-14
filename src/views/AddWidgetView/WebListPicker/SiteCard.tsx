import { Eye, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { SiteItem } from '../../../api/site';
import { LazyImage } from '../../../components/LazyImage/LazyImage';

interface SiteCardProps {
  item: SiteItem;
  onOpen: (item: SiteItem) => void;
  /** 是否已被收藏（「我的」）；默认 false */
  favorited?: boolean;
  /** 切换收藏状态；不传则不展示收藏按钮 */
  onToggleFavorite?: (item: SiteItem) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  item,
  onOpen,
  favorited = false,
  onToggleFavorite,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const coverSrc = item.cover || item.logo;
  const logoImgRef = React.useRef<HTMLImageElement | null>(null);

  // 图片可能来自缓存：已缓存的图片不会触发 onLoad，需主动检查 complete 避免永远空白
  React.useEffect(() => {
    if (logoImgRef.current?.complete) setImgLoaded(true);
  }, [item.logo]);
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40 bg-white dark:bg-white/5 cursor-pointer"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="16/9"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white text-3xl font-bold"
            style={{
              background:
                item.background ||
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {/* 右上角收藏按钮：已收藏时常驻显示实心爱心，未收藏时鼠标悬停卡片才显示 */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            title={favorited ? '取消收藏' : '收藏到我的'}
            aria-label={favorited ? '取消收藏' : '收藏到我的'}
            aria-pressed={favorited}
            className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur-md transition-all hover:bg-black/65 active:scale-90 ${
              favorited
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 text-white'
            }`}
          >
            <Heart
              size={15}
              className={favorited ? 'fill-rose-500 text-rose-500' : ''}
            />
          </button>
        )}
        {item.count !== undefined && item.count > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[13px]  leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <Eye size={13} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}
      </div>

      <div className="relative p-2.5 flex items-center gap-3 text-left">
        {/* 左侧：Logo + 标题与描述 */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {item.logo && !imgError ? (
            <img
              ref={logoImgRef}
              src={item.logo}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background:
                  item.background ||
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <p className="truncate text-sm  ">
              {item.name}
            </p>
            {item.des && (
              <p className="truncate text-xs   mt-0.5">
                {item.des}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
