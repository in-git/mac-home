import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe } from 'lucide-react';
import type { SiteItem } from '../../api/site';

interface WebAppProps {
  editing?: boolean;
  /** 图标固定像素尺寸；不传则由父容器 flex 撑满（默认行为）。 */
  iconSize?: number;
  /** 站点数据：图标图片取 site.logo、标签取 site.name、链接取 site.link、背景取 site.background。 */
  site?: SiteItem;
  /** 为 true 时不渲染站点名文本（如正方形档位/特定尺寸档位）。 */
  hideLabel?: boolean;
}

const POPOVER_WIDTH = 224; // w-56

export function WebApp({ site, iconSize, hideLabel = false, editing = false }: WebAppProps) {
  const [imgError, setImgError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; centerX: number } | null>(null);
  const label = site?.name || '';
  const hasValidLogo = !!site?.logo && !imgError;
  const link = site?.link || '';
  const cover = site?.cover || site?.logo;
  const hasValidCover = !!cover && !coverError;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (editing || !link) return;
    // 阻止冒泡，避免触发卡片整体 onClick（如进入编辑/布局逻辑）
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // 悬停时计算磁贴位置，将 popover 挂载到 body 上（避免被 overflow 裁剪）
  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (editing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // 居中于磁贴，并限制在视口内
    let left = centerX - POPOVER_WIDTH / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8));
    setPos({ left, top: rect.bottom + 8, centerX });
    setHover(true);
  };

  const popover = hover && pos && (
    <div
      role="tooltip"
      style={{ left: pos.left, top: pos.top, zIndex: 100, width: POPOVER_WIDTH }}
      className="pointer-events-none fixed scale-100 rounded-xl border border-black/10 bg-[color:var(--popover)] p-3 text-[color:var(--popover-foreground)] opacity-100 shadow-2xl ring-1 ring-black/5 transition-all duration-150 dark:border-white/15"
    >
      <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {hasValidCover ? (
          <img
            src={cover}
            alt={label}
            onError={() => setCoverError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
            style={{
              background:
                site?.background ||
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {(label || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className="truncate text-sm font-semibold">{label}</p>
      {site?.des && (
        <p className="mt-0.5 line-clamp-2 text-xs opacity-70">{site.des}</p>
      )}
      {/* 小箭头（指向正上方磁贴中心，向下偏移 50%） */}
      <span
        style={{ left: pos.centerX - pos.left }}
        className="absolute bottom-full h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-l border-t border-black/10 bg-[color:var(--popover)] dark:border-white/15"
      />
    </div>
  );

  return (
    <div className="group relative flex h-full w-full flex-col items-center justify-center">
      <button
        type="button"
        title={label}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
        disabled={editing}
        style={{ ['--label-size' as string]: iconSize ? `${Math.max(10, Math.round(iconSize * 0.18))}px` : '12px' }}
        className="group/btn flex h-full w-full flex-col items-center justify-center gap-1 disabled:cursor-default"
      >
        <div
          className="min-h-0 min-w-0 aspect-square rounded-[var(--card-radius)] overflow-hidden flex items-center justify-center bg-white/10"
          style={{
            background: site?.background || undefined,
            ...(iconSize ? { width: iconSize, height: iconSize, flex: '0 0 auto' } : { height: '100%', flex: '1 1 min-0' }),
          }}
        >
          {hasValidLogo ? (
            <img
              src={site.logo}
              alt={label}
              title={label}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[color:var(--card-fg)]">
              <Globe className="h-2/3 w-2/3" strokeWidth={1.75} />
            </div>
          )}
        </div>

        {!hideLabel && label && (
          <span className="w-full min-w-0 shrink-0 truncate text-center text-white text-sm">
            {label}
          </span>
        )}
      </button>

      {createPortal(popover, document.body)}
    </div>
  );
}

export default WebApp;
