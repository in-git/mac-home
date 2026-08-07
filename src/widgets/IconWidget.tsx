import { WidgetSize, IconConfig } from '../types';

const DEFAULT_ICON: IconConfig = {
  glyph: '🚀',
  label: 'App',
  kind: 'link',
  href: 'https://www.apple.com',
};

// Glyph + label font sizes scale with the icon tile size so the emoji and
// caption stay proportional — large 1/6 tile reads big, tiny 1/16 tile shrinks
// both the icon and its text together.
const ICON_TYPOGRAPHY: Record<WidgetSize, { glyph: string; label: string }> = {
  'icon-1-6': { glyph: 'text-5xl', label: 'text-xs' },
  'icon-1-8': { glyph: 'text-4xl', label: 'text-[11px]' },
  'icon-1-12': { glyph: 'text-2xl', label: 'text-[9px]' },
  'icon-1-16': { glyph: 'text-lg', label: 'text-[8px]' },
  // Fallback sizes (non-icon tiles) — kept for type completeness; the icon-grid
  // widget only ever receives icon-* sizes.
  sm: { glyph: 'text-3xl', label: 'text-[10px]' },
  md: { glyph: 'text-3xl', label: 'text-[10px]' },
  lg: { glyph: 'text-3xl', label: 'text-[10px]' },
  wide: { glyph: 'text-3xl', label: 'text-[10px]' },
  tall: { glyph: 'text-3xl', label: 'text-[10px]' },
  large: { glyph: 'text-3xl', label: 'text-[10px]' },
};

interface IconWidgetProps {
  editing?: boolean;
  size?: WidgetSize;
  /** Explicit icon config. Falls back to a demo link icon when omitted. */
  icon?: IconConfig;
  /** Fallback callback used when kind === 'action' and no inline action is set. */
  onAction?: () => void;
}

export function IconWidget({ editing, size = 'icon-1-8', icon, onAction }: IconWidgetProps) {
  const cfg = icon ?? DEFAULT_ICON;
  const typo = ICON_TYPOGRAPHY[size] ?? ICON_TYPOGRAPHY['icon-1-8'];

  const handleClick = () => {
    if (editing) return;
    if (cfg.kind === 'action') {
      (cfg.action ?? onAction)?.();
    } else if (cfg.href) {
      window.open(cfg.href, '_blank', 'noopener,noreferrer');
    }
  };

  const title =
    cfg.kind === 'action'
      ? `${cfg.label}（功能）`
      : cfg.href
        ? `${cfg.label}（打开链接）`
        : cfg.label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={editing}
      title={title}
      className="glass-icon group flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-1 backdrop-blur-sm transition hover:bg-white/25 active:scale-95 disabled:cursor-default"
    >
      <span className={`${typo.glyph} leading-none`}>{cfg.glyph}</span>
      <span
        className={`max-w-full truncate font-medium text-slate-700 dark:text-slate-200 ${typo.label}`}
      >
        {cfg.label}
      </span>
    </button>
  );
}
