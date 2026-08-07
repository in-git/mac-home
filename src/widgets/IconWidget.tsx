import { Globe, Plus, Link2, Rocket, type LucideIcon } from 'lucide-react';
import { WidgetSize, IconBehavior } from '../types';

// Maps the `iconGlyph` string (a lucide icon name) to its component. Unknown
// names fall back to the default icon so the tile never renders empty.
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Globe,
  Plus,
  Link2,
};

// Fallback used only when an icon-grid widget provides no icon fields.
const DEFAULT_ICON = {
  glyph: 'Rocket',
  label: 'App',
  type: 'link' as IconBehavior,
  href: 'https://www.apple.com',
};

// Glyph + label font sizes scale with the icon tile size so the emoji and
// caption stay proportional — large 1/6 tile reads big, tiny 1/16 tile shrinks
// both the icon and its text together.
const ICON_TYPOGRAPHY: Record<WidgetSize, { glyph: string; label: string }> = {
  'icon-1-8': { glyph: 'text-4xl', label: 'text-[11px]' },
  // Fallback sizes (non-icon tiles) — kept for type completeness; the icon-grid
  // widget only ever receives icon-* sizes.
  sm: { glyph: 'text-3xl', label: 'text-[10px]' },
  wide: { glyph: 'text-3xl', label: 'text-[10px]' },
  large: { glyph: 'text-3xl', label: 'text-[10px]' },
};

interface IconWidgetProps {
  editing?: boolean;
  size?: WidgetSize;
  // `type` decides behaviour: `link` opens href, `action` triggers the handler
  // resolved by `id` via getWidgetAction (see widgetConfig). The actual click is
  // handled by the parent widget-card (the custom onAction lives there), so this
  // component only renders the visual tile and exposes its behaviour via props.
  iconType?: IconBehavior;
  iconGlyph?: string;
  iconLabel?: string;
  iconHref?: string;
}

export function IconWidget({
  editing,
  size = 'icon-1-8',
  iconType,
  iconGlyph,
  iconLabel,
  iconHref,
}: IconWidgetProps) {
  const kind = iconType ?? DEFAULT_ICON.type;
  const glyphName = iconGlyph ?? DEFAULT_ICON.glyph;
  const label = iconLabel ?? DEFAULT_ICON.label;
  const typo = ICON_TYPOGRAPHY[size] ?? ICON_TYPOGRAPHY['icon-1-8'];
  const GlyphIcon = ICON_REGISTRY[glyphName] ?? Rocket;

  const title =
    kind === 'action' ? `${label}（功能）` : `${label}（打开链接）`;

  return (
    <button
      type="button"
      // No onClick here — the click bubbles to the widget-card container, which
      // owns the custom onAction event (resolved by id via getWidgetAction).
      disabled={editing && kind !== 'action'}
      title={title}
      className="glass-icon group !pointer-events-auto flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-1 backdrop-blur-sm transition hover:bg-white/25 active:scale-95 disabled:cursor-default"
    >
      <GlyphIcon className={`${typo.glyph} leading-none`} strokeWidth={1.75} />
      <span
        className={`max-w-full truncate font-medium text-slate-700 dark:text-slate-200 ${typo.label}`}
      >
        {label}
      </span>
    </button>
  );
}
