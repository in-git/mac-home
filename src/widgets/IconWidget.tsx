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
  /** 站点数据：图标图片取 site.logo、标签取 site.name、链接取 site.link、背景取 site.background。 */
  site?: SiteItem;
}

export function IconWidget({ editing, size = '1/8', site }: IconWidgetProps) {
  const label = site?.name ?? DEFAULT_ICON.label;
  const iconOnly = ICON_ONLY_SIZES.has(size);


  return (
    <button
      type="button"
      disabled={editing}
      title={label}
     
      className=" group !pointer-events-auto   flex h-full w-full flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-200  active:scale-95 disabled:cursor-default"
    >
      {site?.logo ? (
        <img
          src={site.logo}
          alt={label}
          title={label}
          className="h-full w-full object-cover rounded-[var(--card-radius)] overflow-hidden"
        />
      ) : (
        <Rocket className="leading-none" strokeWidth={1.75} />
      )}
      {!iconOnly && (
        <span className="max-w-full truncate mix-blend-difference text-white">
          {label}
        </span>
      )}
    </button>
  );
}
