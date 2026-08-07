import { Globe, Plus, Link2, Rocket, type LucideIcon } from 'lucide-react';
import { WidgetSize, IconBehavior } from '../types';
import { getWidgetAction } from '../data/presetData';

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
  // `type` decides behaviour: `link` opens href, `action` triggers the handler
  // resolved by `id` via getWidgetAction (see presetData).
  iconType?: IconBehavior;
  iconGlyph?: string;
  iconLabel?: string;
  // Widget id used to look up its action callback at click time.
  id?: string;
  iconHref?: string;
}

export function IconWidget({
  editing,
  size = 'icon-1-8',
  iconType,
  iconGlyph,
  iconLabel,
  id,
  iconHref,
}: IconWidgetProps) {
  const kind = iconType ?? DEFAULT_ICON.type;
  const glyphName = iconGlyph ?? DEFAULT_ICON.glyph;
  const label = iconLabel ?? DEFAULT_ICON.label;
  const href = iconHref ?? DEFAULT_ICON.href;
  const typo = ICON_TYPOGRAPHY[size] ?? ICON_TYPOGRAPHY['icon-1-8'];
  const GlyphIcon = ICON_REGISTRY[glyphName] ?? Rocket;

  const handleClick = () => {
    // Action tiles (e.g. the "添加组件" entry) stay interactive even in edit
    // mode so they can open their modal; plain link icons are inert while editing.
    if (editing && kind !== 'action') return;
    if (kind === 'action') {
      // Resolve the handler by widget id so it survives a localStorage reload
      // (functions are never serialized — only the id persists).
      const action = id ? getWidgetAction(id) : undefined;
      console.log('[IconWidget] action clicked', { id, label, glyphName, action });
      action?.();
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const title =
    kind === 'action' ? `${label}（功能）` : `${label}（打开链接）`;

  return (
    <button
      type="button"
      onClick={handleClick}
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
