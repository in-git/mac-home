import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred placement relative to the trigger. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// 基于 shadcn/ui（Radix UI）的 Tooltip 封装。
// 保持原有的 `content` / `placement` 属性形状，调用方无需改动，
// 定位、Portal、延迟与键盘/焦点处理由 Radix 负责。
export function Tooltip({
  content,
  children,
  placement = 'top',
  className = '',
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <RadixTooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={placement} className={className}>
          {content}
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  );
}
