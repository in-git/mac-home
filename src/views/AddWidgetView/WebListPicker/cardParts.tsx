import { Eye, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { SiteItem } from '@/api/site';
import { IconButton } from '@/components/IconButton/IconButton';

/** 新站点判定天数：发布时间在该天数内则打上 NEW 角标 */
const NEW_DAYS = 3;
const NEW_WINDOW_MS = NEW_DAYS * 24 * 60 * 60 * 1000;

/**
 * 发布时间是否在「新」窗口内。
 * 兼容后端常见的 'YYYY-MM-DD HH:mm:ss'（Safari 无法解析空格分隔，替换为 T）。
 */
export function isNewSite(createTime?: string): boolean {
  if (!createTime) return false;
  const normalized = createTime.trim().replace(' ', 'T');
  // 无时区信息时按本地时间解析（与后端展示口径一致）
  const time = Date.parse(
    /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized)
      ? normalized
      : `${normalized}${normalized.length > 10 ? '' : 'T00:00:00'}`,
  );
  if (Number.isNaN(time)) return false;
  // 未来时间（时区偏差 / 脏数据）不算新站点：否则 now - time 为负也会命中「3 天内」
  const diff = Date.now() - time;
  return diff >= 0 && diff < NEW_WINDOW_MS;
}

/** 各类站点卡片共用的入参 */
export interface SiteCardBaseProps {
  item: SiteItem;
  onOpen: (item: SiteItem) => void;
  /** 是否已被收藏（「我的」）；默认 false */
  favorited?: boolean;
  /** 切换收藏状态；不传则不展示收藏按钮 */
  onToggleFavorite?: (item: SiteItem) => void;
}

/** 卡片根容器共用的类名（边框、圆角、悬停高亮等） */
export const CARD_ROOT_CLASS =
  'group relative overflow-hidden rounded-md border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40 bg-white dark:bg-white/5 cursor-pointer';

/** 无封面 / 加载失败时的渐变占位背景 */
export function gradientOf(item: SiteItem): string {
  return (
    item.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  );
}

interface SiteAvatarProps {
  item: SiteItem;
  /** 头像尺寸：md 用于普通卡，lg 用于超大卡 */
  size?: 'md' | 'lg';
}

/** Logo 或首字母头像；加载失败自动回退为渐变首字母块 */
export const SiteAvatar: React.FC<SiteAvatarProps> = ({ item, size = 'md' }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // 图片可能来自缓存：已缓存的图片不会触发 onLoad，需主动检查 complete 避免永远空白
  React.useEffect(() => {
    if (imgRef.current?.complete) setImgLoaded(true);
  }, [item.logo]);

  // 头像尺寸：移动端略小，桌面端恢复；首字母字号随之响应式
  const sizeClass =
    size === 'lg'
      ? 'h-10 w-10 text-base sm:h-12 sm:w-12 sm:text-xl'
      : 'h-8 w-8 text-sm sm:h-9 sm:w-9 sm:text-md';

  if (item.logo && !imgError) {
    return (
      <img
        ref={imgRef}
        src={item.logo}
        alt={item.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 ${sizeClass} ${
          imgLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{ background: gradientOf(item) }}
    >
      {(item.name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

/** 右上角收藏按钮：移动端（无 hover）常驻显示；桌面端仅悬停时显示；已收藏则始终显示 */
export const FavoriteButton: React.FC<{
  item: SiteItem;
  favorited: boolean;
  onToggleFavorite: (item: SiteItem) => void;
}> = ({ item, favorited, onToggleFavorite }) => (
  <IconButton
    label={favorited ? '取消收藏' : '收藏到我的'}
    aria-pressed={favorited}
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      onToggleFavorite(item);
    }}
    icon={
      <Heart
        size={15}
        className={favorited ? 'fill-rose-500 text-rose-500' : ''}
      />
    }
    className={`absolute right-2 top-2 z-10 bg-black/45 ring-1 ring-white/25 backdrop-blur-md hover:bg-black/65 ${
      favorited ? 'opacity-100' : 'text-white'
    } ${favorited ? '' : 'opacity-0 max-sm:opacity-100 group-hover:opacity-100'}`}
  />
);

/** 点击量角标：辅助信息，移动端 12px（text-xs），桌面端 14px（text-sm） */
export const CountBadge: React.FC<{ count?: number }> = ({ count }) =>
  count !== undefined && count > 0 ? (
    <span className="flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-xs text-white leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65 sm:text-sm">
      <Eye size={12} className="opacity-90" />
      {count > 999 ? '999+' : count}
    </span>
  ) : null;

/**
 * NEW 角标：发布时间在 3 天内。
 * 实心胶囊（自带底色）：早期版本缺背景色，白底卡片上只剩阴影轮廓，
 * 表现为「一个带阴影的空边框」。
 * 字号同为辅助信息档：移动端 12px，桌面端 14px。
 */
export const NewBadge: React.FC = () => (
  <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-xs font-semibold uppercase leading-tight tracking-wide text-white ring-1 ring-white/25 sm:text-sm">
    New
  </span>
);
