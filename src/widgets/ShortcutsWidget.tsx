import { Compass, MoreHorizontal, Plus } from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { SiteItem } from '../api/site';
import { ShortcutTile } from './ShortcutTile';

export interface ShortcutsWidgetCardProps {
  expanded?: boolean;
  onExpand?: () => void;
  shortcuts: SiteItem[];
  onAddClick: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onOpen: (s: SiteItem) => void;
}

export const ShortcutsWidgetCard: React.FC<ShortcutsWidgetCardProps> = ({
  expanded = false,
  onExpand,
  shortcuts,
  onAddClick,
  onDelete,
  onOpen,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);

  const actions = [
    {
      key: 'add',
      label: '添加网址',
      icon: <Plus size={13} />,
      className:
        'bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)] shadow-xs',
      onClick: () => {
        onAddClick();
      },
    },
  ];

  const [visibleCount, setVisibleCount] = useState(actions.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const avail = container.clientWidth;
      const els = actionsRef.current;
      els.forEach((el) => {
        if (el) el.style.display = '';
      });
      const widths = els.map((el) => el?.offsetWidth ?? 0);
      const moreW = moreRef.current?.offsetWidth ?? 36;
      const gap = 8;
      const total = widths.reduce((s, w) => s + w + gap, 0) - gap;
      if (total <= avail) {
        setVisibleCount(actions.length);
        return;
      }
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + widths[i] + gap;
        if (next + moreW > avail) break;
        used = next;
        count++;
      }
      setVisibleCount(Math.max(count, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [actions.length, expanded]);

  return (
    <div className="h-full flex flex-col text-xs p-1 text-slate-800 dark:text-slate-100">
      <div
        ref={headerRef}
        className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10"
      >
        <div className="flex items-center space-x-2">
          <Compass size={16} className="text-[color:var(--accent)]" />
          <span className="font-bold text-sm tracking-tight">快捷导航</span>
        </div>

        <div ref={containerRef} className="flex items-center gap-2">
          {actions.map((a, i) => (
            <button
              key={a.key}
              ref={(el) => {
                actionsRef.current[i] = el;
              }}
              onClick={a.onClick}
              title={a.label}
              className={`p-1 rounded-[var(--card-radius)] transition-transform active:scale-95 ${a.className} ${
                i >= visibleCount ? 'hidden' : ''
              }`}
            >
              {a.icon}
            </button>
          ))}
          {!expanded && (
            <button
              ref={moreRef}
              onClick={() => onExpand?.()}
              title="更多"
              className={`p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-slate-500 hover:bg-black/10 dark:hover:bg-white/15 transition-transform active:scale-95 ${
                visibleCount >= actions.length ? 'hidden' : ''
              }`}
            >
              <MoreHorizontal size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Shortcuts */}
      <div
        className={`${expanded ? 'flex-1 min-h-0' : 'max-h-52'} my-2 overflow-y-auto pr-1 @container`}
      >
        <div className="grid grid-cols-3 @sm:grid-cols-4 @md:grid-cols-6 @lg:grid-cols-6 @xl:grid-cols-10 @2xl:grid-cols-12 gap-3">
          {shortcuts.map((item) => (
            <a
              key={item.id || item.link}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              onClick={() => onOpen(item)}
              className="group relative flex flex-col rounded-[var(--card-radius)] transition-colors shadow-xs text-center aspect-square"
            >
              <ShortcutTile item={item} onDelete={onDelete} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
