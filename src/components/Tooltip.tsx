import { Tooltip as HeroUITooltip } from '@heroui/react';
import { type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred placement relative to the trigger. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// 基于 HeroUI（React Aria）的 Tooltip 封装。
// 保持原有的 `content` / `placement` 属性形状，调用方无需改动，
// 定位、Portal、延迟与键盘/焦点处理由 React Aria 负责。
export function Tooltip({
  content,
  children,
  placement = 'top',
  className = '',
}: TooltipProps) {
  return (
    <HeroUITooltip delay={150}>
      <HeroUITooltip.Trigger className="inline-flex">
        {children}
      </HeroUITooltip.Trigger>
      <HeroUITooltip.Content placement={placement} className={className}>
        {content}
      </HeroUITooltip.Content>
    </HeroUITooltip>
  );
}
