import { Eye, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { normalizeSignal, SiteItem } from '@/api/site';
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
 *
 * 跟在**标题行的右侧**，各端一致（PC 与移动端相同）。
 *
 * 早期它绝对定位在封面右上角，问题有两个：
 * - 移动端封面小，右上角还挤着收藏按钮，「New」既挡画面又容易和按钮打架
 * - 压在图上需要靠 `right-9` 给收藏按钮让位，位置随按钮有无而变，不稳定
 *
 * 改为标题行内的普通 flex 子项后：位置由布局决定、不会浮在截断的
 * 标题文字上，也不再需要为收藏按钮预留空间。
 *
 * 实心胶囊自带底色（早期版本缺背景色时只剩阴影轮廓，表现为空边框）。
 * 字号为辅助信息档：12px。
 */
export const NewBadge: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <span
    className={`shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-xs font-semibold uppercase leading-tight tracking-wide text-white ring-1 ring-white/25 ${className}`}
    aria-label="新站点"
  >
    New
  </span>
);

/** 信号条总格数：与 signal 的取值上限（5）一致 */
const SIGNAL_LEVELS = 5;

/** 各档位的柱高（px），由弱到强递增；配合 5 格形成阶梯感 */
const SIGNAL_BAR_HEIGHTS = [4, 6, 8, 11, 14];

/** 按强度取色：弱（1-2）偏灰、中（3）琥珀、强（4-5）绿 */
function signalColor(level: number): string {
  if (level <= 2) return 'bg-slate-400';
  if (level === 3) return 'bg-amber-400';
  return 'bg-emerald-500';
}

/**
 * 信号强度可视化：5 格阶梯柱状条，点亮的格数 = signal（1 最弱、5 最强）。
 *
 * 关于配色：不用红/黄/绿三档暗示好坏，仅按「弱=中性灰、中=琥珀、强=绿」递进，
 * 未点亮的格子统一低透明度灰底，保证在封面图与信息条两种底色上都可读。
 *
 * `variant` 决定适配的场景：
 * - `onImage`：压在封面图上，用白色半透明底 + ring 提升对比度
 * - `plain`：位于卡片信息条内，跟随前景色
 */
export const SignalBars: React.FC<{
  signal?: number;
  variant?: 'onImage' | 'plain';
  className?: string;
}> = ({ signal, variant = 'plain', className = '' }) => {
  const level = normalizeSignal(signal);
  if (level === null) return null;

  const onImage = variant === 'onImage';

  return (
    <span
      className={`flex items-end gap-[2px] leading-none ${
        onImage
          ? 'rounded-full bg-black/55 px-1.5 py-1 ring-1 ring-white/15 backdrop-blur-md'
          : ''
      } ${className}`}
      title={`信号强度 ${level}/5`}
      aria-label={`信号强度 ${level} / 5`}
      role="img"
    >
      {Array.from({ length: SIGNAL_LEVELS }).map((_, i) => {
        const idx = i + 1;
        const active = idx <= level;
        return (
          <span
            key={idx}
            style={{ height: SIGNAL_BAR_HEIGHTS[i], width: 3 }}
            className={`rounded-[1px] transition-colors ${
              active
                ? signalColor(level)
                : onImage
                  ? 'bg-white/30'
                  : 'bg-black/20 dark:bg-white/25'
            }`}
          />
        );
      })}
    </span>
  );
};

/**
 * 卡片辅助信息行：信号强度。
 *
 * signal 为后端补充的元数据，可能缺失；缺失时返回 null，
 * 避免在卡片底部留下一行空白高度，影响网格对齐。
 */
export const SiteMetaRow: React.FC<{
  item: SiteItem;
  className?: string;
}> = ({ item, className = '' }) => {
  if (normalizeSignal(item.signal) === null) return null;

  return (
    <div
      className={`flex items-center gap-2 px-2 pb-2 sm:px-2.5 ${className}`}
    >
      <SignalBars signal={item.signal} variant="plain" />
    </div>
  );
};
