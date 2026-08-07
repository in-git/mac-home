import { useState } from 'react';
import { WidgetProps } from '../types';

interface IconConfig {
  glyph: string;
  label: string;
  href?: string;
}

const DEFAULT_ICON: IconConfig = {
  glyph: '🚀',
  label: 'App',
  href: undefined,
};

export function IconWidget({ editing }: WidgetProps) {
  const [icon] = useState<IconConfig>(DEFAULT_ICON);

  const handleClick = () => {
    if (icon.href && !editing) {
      window.open(icon.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={editing}
      title={icon.label}
      className="glass-icon group flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-1 backdrop-blur-sm transition hover:bg-white/25 active:scale-95 disabled:cursor-default"
    >
      <span className="text-3xl leading-none">{icon.glyph}</span>
      <span className="max-w-full truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">
        {icon.label}
      </span>
    </button>
  );
}
