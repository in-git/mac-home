import { Eye, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { SiteItem } from '@/api/site';
import { LazyImage } from '@/components/LazyImage/LazyImage';

/** 新站点判定天数：发布时间在该天数内则打上 NEW 角标 */
const NEW_DAYS = 3;
const NEW_WINDOW_MS = NEW_DAYS * 24 * 60 * 60 * 1000;

/**
 * 发布时间是否在「新」窗口内。
 * 兼容后端常见的 'YYYY-MM-DD HH:mm:ss'（Safari 无法解析空格分隔，替换为 T）。
 */
function isNewSite(createTime?: string): boolean {
  if (!createTime) return false;
  const normalized = createTime.trim().replace(' ', 'T');
  // 无时区信息时按本地时间解析（与后端展示口径一致）
  const time = Date.parse(
    /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized)
      ? normalized
      : `${normalized}${normalized.length > 10 ? '' : 'T00:00:00'}`,
  );
  if (Number.isNaN(time)) return false;
  return Date.now() - time < NEW_WINDOW_MS;
}

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
  // 是否为新站点（发布时间在 3 天内）
  const showNew = isNewSite(item.createTime);

  // 图片可能来自缓存：已缓存的图片不会触发 onLoad，需主动检查 complete 避免永远空白
  React.useEffect(() => {
    if (logoImgRef.current?.complete) setImgLoaded(true);
  }, [item.logo]);
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-md border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40 bg-white dark:bg-white/5 cursor-pointer"
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
        {/* 右上角收藏按钮：移动端（无 hover）常驻显示；桌面端仅悬停时显示；已收藏则始终显示 */}
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
                : 'opacity-0 max-sm:opacity-100 group-hover:opacity-100 text-white'
            }`}
          >
            <Heart
              size={15}
              className={favorited ? 'fill-rose-500 text-rose-500' : ''}
            />
          </button>
        )}
        {item.count !== undefined && item.count > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white   leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <Eye size={13} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}
      </div>

      <div className="relative p-2.5 flex items-center gap-3 text-left">
        {/* 左侧：Logo + 标题与描述 */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-md font-bold text-white"
              style={{
                background:
                  item.background ||
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* 文本区：宽度随内容自适应（w-fit），最长不超过可用宽度（max-w-full 后截断） */}
          <div className="flex flex-col justify-center min-w-0 max-w-full w-fit">
            {/* 标题行：非新站点直接渲染标题，不产生角标相关的任何节点 */}
            {showNew ? (
              <div className="flex items-center gap-1.5 min-w-0 max-w-full w-fit">
                <p className="truncate text-xl">{item.name}</p>
                {/* NEW 角标：发布时间在 3 天内 */}
                <span className="shrink-0 rounded-full px-1.5 py-px text-md font-semibold uppercase leading-tight tracking-wide text-white shadow-sm">
                  New
                </span>
              </div>
            ) : (
              <p className="truncate text-xl max-w-full">{item.name}</p>
            )}
            {item.des && (
              <p className="truncate text-md mt-1 max-w-full text-gray-500">
                {item.des}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
