import { Globe, Plus, Link2, Rocket, Settings, type LucideIcon } from 'lucide-react';
import { WidgetSize, IconBehavior } from '../types';

// Maps the `iconGlyph` string (a lucide icon name) to its component. Unknown
// names fall back to the default icon so the tile never renders empty.
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Globe,
  Plus,
  Link2,
  Settings,
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
// both the icon and its text together. The 1:16 tile is icon-only (no label).
const ICON_TYPOGRAPHY: Record<WidgetSize, { glyph: string; label: string }> = {
  'icon-1-8': { glyph: 'text-lg', label: 'text-font-sm' },
  'icon-1-16': { glyph: 'text-lg', label: 'text-font-sm' },
  // Fallback sizes (non-icon tiles) — kept for type completeness; the icon-grid
  // widget only ever receives icon-* sizes.
  sm: { glyph: 'text-lg', label: 'text-font-sm' },
  third: { glyph: 'text-lg', label: 'text-font-sm' },
  wide: { glyph: 'text-lg', label: 'text-font-sm' },
  large: { glyph: 'text-lg', label: 'text-font-sm' },
  fifth: { glyph: 'text-lg', label: 'text-font-sm' },
  sixth: { glyph: 'text-lg', label: 'text-font-sm' },
};

// When true the tile renders only the glyph (no text label). Used for the
// smallest 1:16 size where the label would overflow the tiny tile.
const ICON_ONLY_SIZES: ReadonlySet<WidgetSize> = new Set<WidgetSize>(['icon-1-16']);

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
  // 站点图标图片（如 SiteItem.logo）；提供时优先显示图片而非 lucide 图标
  iconImage?: string;
  // Custom tile colors. `iconTextColor` tints the glyph + label; `iconBgColor`
  // overrides the default translucent background. Any valid CSS color accepted.
  iconTextColor?: string;
  iconBgColor?: string;
}

export function IconWidget({
  editing,
  size = 'icon-1-8',
  iconType,
  iconGlyph,
  iconLabel,
  iconHref,
  iconImage,
  iconTextColor,
  iconBgColor,
}: IconWidgetProps) {
  const kind = iconType ?? DEFAULT_ICON.type;
  const glyphName = iconGlyph ?? DEFAULT_ICON.glyph;
  const label = iconLabel ?? DEFAULT_ICON.label;
  const typo = ICON_TYPOGRAPHY[size] ?? ICON_TYPOGRAPHY['icon-1-8'];
  const GlyphIcon = ICON_REGISTRY[glyphName] ?? Rocket;
  const iconOnly = ICON_ONLY_SIZES.has(size);

  const title =
    kind === 'action' ? `${label}（功能）` : `${label}（打开链接）`;

  // Inline style overrides for custom colors. The custom text color is applied
  // to the button itself so both the SVG glyph (via currentColor) and the label
  // text inherit the exact same color — they always stay in sync.
  const bgStyle = iconBgColor ? { backgroundColor: iconBgColor } : undefined;
  const btnStyle = {
    ...(bgStyle ?? {}),
    ...(iconTextColor ? { color: iconTextColor } : {}),
  };
  const hasBtnStyle = Object.keys(btnStyle).length > 0;

  return (
    <button
      type="button"
      // No onClick here — the click bubbles to the widget-card container, which
      // owns the custom onAction event (resolved by id via getWidgetAction).
      disabled={editing && kind !== 'action'}
      title={title}
      style={hasBtnStyle ? btnStyle : undefined}
      className=" group !pointer-events-auto flex h-full w-full flex-col items-center justify-center gap-1 rounded-[var(--card-radius)] text-slate-700 dark:text-slate-200 transition active:scale-95 disabled:cursor-default"
    >
      {iconImage ? (
        <img
          src={iconImage}
          alt={label}
          className="h-[60%] w-[60%] rounded-[25%] object-cover shadow-sm"
        />
      ) : (
        <GlyphIcon
          className={`${typo.glyph} leading-none`}
          strokeWidth={1.75}
        />
      )}
      {!iconOnly && (
        <span
          className={`max-w-full truncate font-medium ${typo.label}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
