import { Tooltip as HeroTooltip } from '@heroui/react';
import { type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred placement relative to the trigger. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// Lightweight wrapper around HeroUI's Tooltip (React Aria Components based).
// Keeps the previous `content` / `placement` prop shape so call sites stay
// unchanged, while delegating positioning, portals, delays and focus/keyboard
// handling to HeroUI.
export function Tooltip({
  content,
  children,
  placement = 'top',
  className = '',
}: TooltipProps) {
  return (
    <HeroTooltip className="inline-flex">
      <span className="inline-flex">{children}</span>
      <HeroTooltip.Content placement={placement} className={className}>
        {content}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
