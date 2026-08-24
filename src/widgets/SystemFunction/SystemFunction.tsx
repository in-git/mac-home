import { Cog, Plus, Settings, type LucideIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type WidgetItem } from '../../types';

// 将 icon 字符串 key 解析为可渲染的 lucide 组件（避免把组件对象存入本地存储导致反序列化失败）
const ICON_MAP: Record<string, LucideIcon> = {
  settings: Settings,
  add: Plus,
};



function resolveIcon(widget: WidgetItem): LucideIcon {
  const key = (typeof widget.data?.icon === 'string' && widget.data.icon);
  return (key && ICON_MAP[key]) || Cog;
}

interface SystemFunctionProps {
  widget: WidgetItem;
}

/**
 * 系统功能磁贴：展示私有 icon + 标题，点击时触发 onClick 事件。
 * 与「网页应用」一致保持 1:1 正方形、纯图标无玻璃背景。
 */
export const SystemFunction: React.FC<SystemFunctionProps> = ({ widget }) => {
  const Icon: LucideIcon = resolveIcon(widget);
  const label = widget.title || '系统功能';

  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [iconSize, setIconSize] = useState(0);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; centerX: number } | null>(null);

  // 图标尺寸 = 父容器（按钮）较短边的 70%
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const update = () => {
      const size = Math.min(el.clientWidth, el.clientHeight);
      setIconSize(Math.round(size * 0.7));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 悬停整个组件时显示 tooltip，定位向上寻找 .widget-card 父容器，挂在其下方
  const handleEnter = () => {
    const el = wrapRef.current;
    if (!el) return;
    const card = el.closest('.widget-card') as HTMLElement | null;
    const rect = (card ?? el).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    setPos({ left: centerX, top: rect.bottom + 8, centerX });
    setHover(true);
  };

  const tooltip = hover && pos && (
    <div
      role="tooltip"
      style={{ left: pos.left, top: pos.top, zIndex: 100, transform: 'translateX(-50%)' }}
      className="pointer-events-none fixed whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white opacity-100 shadow-lg ring-1 ring-white/10"
    >
      {label}
    </div>
  );

  return (
    <div
      ref={wrapRef}
      className="group flex h-full w-full flex-col items-center justify-center"
      title={label}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHover(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className="flex h-full w-full flex-col items-center justify-center gap-1 disabled:cursor-default"
      >
        <span className="flex items-center justify-center">
          <Icon
            size={iconSize || undefined}
            strokeWidth={1.5}
            className="text-[color:var(--accent)] transition-transform duration-150 group-hover:scale-110 "
          />
        </span>
      </button>

      {createPortal(tooltip, document.body)}
    </div>
  );
};
