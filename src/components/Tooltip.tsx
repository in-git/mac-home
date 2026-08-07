import { type ReactNode, type CSSProperties, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred placement relative to the trigger. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// Lightweight, dependency-free tooltip. Shows `content` on hover/focus of the
// child trigger. Rendered through a portal on document.body with fixed
// positioning so it is never clipped by an ancestor's `overflow: hidden` or
// stacked under sibling cards. Fades in via a one-frame opacity transition.
export function Tooltip({ content, children, placement = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const show = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 10;
    let top = rect.top;
    let left = rect.left + rect.width / 2;
    if (placement === 'top') top = rect.top - gap;
    if (placement === 'bottom') top = rect.bottom + gap;
    if (placement === 'left') left = rect.left - gap;
    if (placement === 'right') left = rect.right + gap;
    setCoords({ top, left });
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setShown(false);
  };

  // Flip to the shown state on the next frame so the opacity transition runs.
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const positionStyle: CSSProperties =
    placement === 'top' || placement === 'bottom'
      ? { top: coords.top, left: coords.left, transform: 'translate(-50%, -100%)' }
      : { top: coords.top, left: coords.left, transform: 'translate(-100%, -50%)' };

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible &&
        createPortal(
          <span
            role="tooltip"
            className={`pointer-events-none fixed z-[9999] whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg opacity-0 transition-opacity duration-150 dark:bg-slate-700 ${className}`}
            style={{ ...positionStyle, opacity: shown ? 1 : 0 }}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
