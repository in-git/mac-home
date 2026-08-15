import { Rocket } from 'lucide-react';
import { WidgetSize } from '../types';
import type { SiteItem } from '../api/site';

// Fallback used when a site provides no logo (renders a generic launch tile).
const DEFAULT_ICON = {
  glyph: 'Rocket',
  label: 'App',
};

// When true the tile renders only the glyph (no text label). Used for the
// smallest 1/16 size where the label would overflow the tiny tile.
const ICON_ONLY_SIZES: ReadonlySet<WidgetSize> = new Set<WidgetSize>(['1/16']);

interface IconWidgetProps {
  editing?: boolean;
  size?: WidgetSize;
  /** 图标固定像素尺寸；不传则由父容器 flex 撑满（默认行为）。 */
  iconSize?: number;
  /** 站点数据：图标图片取 site.logo、标签取 site.name、链接取 site.link、背景取 site.background。 */
  site?: SiteItem;
}

export function IconWidget({ size = '1/12', site, iconSize }: IconWidgetProps) {
  const label = site?.name ?? DEFAULT_ICON.label;
  const iconOnly = ICON_ONLY_SIZES.has(size);


  return (
    <button
      type="button"
      title={label}
      className=" group !pointer-events-auto   flex h-full w-full flex-col items-center justify-center gap-1   disabled:cursor-default"
    >
      {site?.logo ? (
        /* 外层 div 通过 flex-1 占据剩余高度，图片加载失败时也不会塌陷 */
        <div
          className="min-h-0 w-full aspect-square rounded-[var(--card-radius)] overflow-hidden"
          style={{
            background: site.background || 'transparent',
            ...(iconSize ? { width: iconSize, height: iconSize, flex: '0 0 auto' } : { flex: '1 1 auto' }),
          }}
        >
          <img
            src={site.logo}
            alt={label}
            title={label}
            className="h-full  w-full object-cover  "
          />
        </div>
      ) : (
        <Rocket className="leading-none" strokeWidth={1.75} {...(iconSize ? { size: iconSize } : {})} />
      )}
      {!iconOnly && (
        <span className="w-full min-w-0 truncate text-center text-white dark:text-black">
          {label}
        </span>
      )}
    </button>
  );
}
