import { useState, type MouseEvent } from 'react';
import { Maximize2 } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Inline size/ratio hint toggle.
 *
 * Instead of a popover list, the control is rendered as a single frosted
 * "text ratio" chip: it shows the current option's label (e.g. the screen
 * occupancy ratio like "1/2", "1:1") and, when many options exist, cycles
 * through them on click. This keeps the surface calm and avoids an overlay
 * dropdown that would conflict with the dashboard drag gesture.
 *
 * Interactions are isolated from the surrounding dashboard: mousedown/click are
 * stopped from bubbling so the parent Muuri drag gesture and the root "click
 * outside <main> closes edit mode" handler are never triggered.
 */
export function Dropdown({ value, options, onChange, className = '' }: DropdownProps) {
  const [idx, setIdx] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (options.length <= 1) {
      onChange(options[0].value);
      return;
    }
    const next = (idx + 1) % options.length;
    setIdx(next);
    onChange(options[next].value);
  };

  if (options.length === 0) return null;

  const current = options[idx] ?? options[0];

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={options.length > 1 ? `当前占比 ${current.label} · 点击切换` : `占比 ${current.label}`}
      className={`flex items-center gap-1 rounded-[10px] px-1.5 py-1 text-font-xs font-medium text-slate-700 transition-colors hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 ${className}`}
    >
      <Maximize2 size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
      <span className="select-none">{current.label}</span>
    
    </button>
  );
}
