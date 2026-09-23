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
  /** 追加类名，用于外部调整定位 / 显隐 */
  className?: string;
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

/**
 * 右上角收藏按钮：移动端（无 hover）常驻显示；桌面端仅悬停时显示；已收藏则始终显示。
 *
 * 暴露给 `CardTopRightBar` 使用（作为其 flex 子项，故不带绝对定位）；
 * 若需单独放置，请自行补上定位类名。
 */
export const FavoriteButton: React.FC<{
  item: SiteItem;
  favorited: boolean;
  onToggleFavorite: (item: SiteItem) => void;
  className?: string;
}> = ({ item, favorited, onToggleFavorite, className = '' }) => (
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
    className={`pointer-events-auto bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-black/65 ${className}`}
  />
);

/**
 * 点击量角标的尺寸档位。
 * - `badge`（默认）：高 18px，与信号条（`SignalBars`）严格等高 ——
 *   两者常在封面浮层上并排展示，高度不同会明显错位；
 * - `button`：高 28px，与 `IconButton` 的 `sm` 档等高，用于和图标按钮同排的场景。
 */
export type CountBadgeSize = 'badge' | 'button';

const COUNT_BADGE_SIZE_CLASS: Record<CountBadgeSize, string> = {
  badge: 'h-[18px] px-1.5',
  button: 'h-7 px-2',
};

/**
 * 点击量角标：辅助信息，字号移动端 12px（text-xs）、桌面端 14px（text-sm）。
 *
 * 图标与数字都是纯白（不额外降透明度），在半透明黑底上保持最高对比度。
 *
 * 视觉与收藏按钮（`FavoriteButton`）**逐条对齐**，两者并排时才算真正一致：
 * - 底色 `bg-black/45`、描边 `ring-1 ring-white/25`、模糊 `backdrop-blur-md`；
 * - 悬停加深同样用 `hover:bg-black/65`（**自身**悬停，而非 `group-hover`）——
 *   收藏按钮是 `IconButton`、加深挂在自身 `hover` 上，角标若用整卡 `group-hover`，
 *   会出现「鼠标扫过卡片时角标变深、收藏按钮却纹丝不动」的不一致；
 * - 过渡与 `IconButton` 同为一档（`duration-200 ease-out`），只是仅作用于底色：
 *   角标是纯展示元素，不参与点击，不需要按压缩放；
 * - 不带阴影 / 缩放：收藏按钮没有这些，角标单方面加上会显得更"浮"。
 */
export const CountBadge: React.FC<{
  count?: number;
  /** 尺寸档位，默认 `badge`（18px，与信号条等高） */
  size?: CountBadgeSize;
  /** 追加类名，用于外部调整定位 / 对齐 */
  className?: string;
}> = ({ count, size = 'badge', className = '' }) =>
  count !== undefined && count > 0 ? (
    <span
      className={`pointer-events-auto flex shrink-0 items-center justify-center gap-1 rounded-full bg-black/45 text-xs text-white leading-none ring-1 ring-white/25 backdrop-blur-md transition-[background-color] duration-200 ease-out hover:bg-black/65 sm:text-sm ${COUNT_BADGE_SIZE_CLASS[size]} ${className}`}
    >
      <Eye size={12} strokeWidth={2.5} />
      <span className="text-white">
        {count > 999 ? '999+' : count}
      </span>
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

/**
 * 各档位的柱高（px），由弱到强递增形成阶梯感。
 *
 * 必须用固定 px 而不是百分比：柱高百分比是相对**容器高度**解析的，
 * 最高一档只能到 88% × 18 ≈ 15.8px，视觉上永远比 18px 的「浏览量」矮一截，
 * 两者并排就会错位。写死 px 后最高柱严格等于容器高度。
 */
const SIGNAL_BAR_HEIGHTS = [6, 8, 10, 14, 18];

/** 信号条整体高度（px）：最高一档柱高，与 `CountBadge` 严格等高 */
const SIGNAL_HEIGHT = 18;

/** 按强度取色：弱（1-2）偏灰、中（3）琥珀、强（4-5）绿 */
function signalColor(level: number): string {
  if (level <= 2) return 'bg-slate-400';
  if (level === 3) return 'bg-amber-400';
  return 'bg-emerald-500';
}

/**
 * 信号强度可视化：5 格阶梯柱状条，点亮的格数 = signal（1 最弱、5 最强）。
 *
 * 关于配色：不用红/黄/绿三档暗示好坏，仅按「弱=中性灰、中=琥珀、强=绿」递进。
 *
 * 外观上**不带任何底色与边框**，直接落在卡片背景上：
 * - 未点亮的格子用 `bg-current`（跟随前景色）+ 低透明度，
 *   这样在浅色信息条（深色文字）与深色封面浮层（白色文字）上都能看清。
 * - 点亮的格子用彩色，保证可辨识。
 *
 * 卡片请勿直接使用本组件，统一走 `SiteSignal`。
 */
export const SignalBars: React.FC<{
  signal?: number;
  className?: string;
}> = ({ signal, className = '' }) => {
  const level = normalizeSignal(signal);
  if (level === null) return null;

  return (
    <span
      className={`flex items-end gap-[2px] leading-none ${className}`}
      style={{ height: SIGNAL_HEIGHT }}
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
              active ? signalColor(level) : 'bg-current opacity-25'
            }`}
          />
        );
      })}
    </span>
  );
};

/**
 * 卡片信号强度：各卡片展示信噪比的**唯一入口**。
 *
 * 只是对 `SignalBars` 的薄封装（传入 `item` 而非 `signal`，减少各卡片重复取字段），
 * 样式固定为无底色、无边框，避免每张卡片手写 variant / className 造成不一致。
 */
export const SiteSignal: React.FC<{
  item: SiteItem;
  className?: string;
}> = ({ item, className = '' }) => (
  <SignalBars signal={item.signal} className={className} />
);

/**
 * 卡片**右上角工具条**：浏览量 + 收藏，各卡片统一走这里。
 *
 * 早期两者是分开的 —— 收藏固定在右上角，浏览量浮在右下角、且是更小的
 * `badge` 档。结果同一张卡上两个同类信息散落两处、深浅与大小也不一致。
 * 现统一为「右上角一条工具条」，两者同高（28px）、同底色、同显隐节奏。
 *
 * **显隐规则由容器统一控制**（与收藏按钮原有行为一致）：
 * - 未收藏：默认隐藏，鼠标悬停卡片（`group-hover`）才出现；移动端无悬停，常驻；
 * - 已收藏：常驻（收藏状态本身是需要常显的信息）。
 * 规则放在容器而非各子元素上，否则会出现「收藏常驻、浏览量时隐时现」的半截闪动。
 *
 * `pointer-events-none` 让工具条不拦截卡片的拖动手势 / 点击；
 * 收藏按钮自身再用 `pointer-events-auto` 收回点击能力（浏览量是纯展示，无需点击）。
 *
 * 收藏按钮不传时（`onToggleFavorite` 缺省）只渲染浏览量，显隐退化为常驻。
 */
export const CardTopRightBar: React.FC<{
  item: SiteItem;
  favorited?: boolean;
  onToggleFavorite?: (item: SiteItem) => void;
  /** 追加类名，用于外部调整定位 */
  className?: string;
}> = ({
  item,
  favorited = false,
  onToggleFavorite,
  className = '',
}) => {
  const hasCount = item.count !== undefined && item.count > 0;
  // 两者都无内容时不渲染空容器
  if (!hasCount && !onToggleFavorite) return null;

  return (
    <div
      className={`pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 transition-opacity ${
        favorited
          ? 'opacity-100'
          : 'opacity-0 max-sm:opacity-100 group-hover:opacity-100'
      } ${className}`}
    >
      <CountBadge count={item.count} size="button" />
      {onToggleFavorite && (
        <FavoriteButton
          item={item}
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
};
