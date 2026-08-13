import React, { useRef, useState } from 'react';
import { CLOCK_FONT_COLORS, CLOCK_FONT_SIZES } from '../../data/options';
import type { WidgetConfigSubmenuProps } from './widgetSubmenus';

export const ClockFontSubmenu: React.FC<WidgetConfigSubmenuProps> = ({
  item,
  targetWidget,
  onUpdateWidgetData,
  onClose,
}) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  const currentFont = targetWidget.data?.clockFont;
  const currentColor = currentFont?.color ?? '';
  const currentSize = currentFont?.size ?? '';

  const openSubmenu = () => {
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  // 合并写入 clockFont 的局部字段（保留另一字段）。
  const applyFont = (patch: { color?: string; size?: string }) => {
    onUpdateWidgetData(targetWidget.id, {
      clockFont: {
        ...(currentFont ?? {}),
        ...patch,
      },
    });
  };

  const Icon = item.icon;

  return (
    <div
      className="relative"
      onMouseEnter={openSubmenu}
      onMouseLeave={scheduleClose}
    >
      <button className="w-full px-3 py-2.5 rounded-[var(--card-radius)] flex items-center justify-between text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10">
        <span className="flex items-center space-x-3">
          <Icon size={18} className="text-[color:var(--accent)]" />
          <span className="text-font-md">{item.label}</span>
        </span>
        <span className="text-slate-400 text-lg leading-none">›</span>
      </button>

      {open && (
        <div
          onMouseEnter={openSubmenu}
          onMouseLeave={scheduleClose}
          className="absolute left-full top-0 ml-3 w-72 p-5 rounded-[var(--card-radius)] bg-white dark:bg-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-black/10 dark:border-white/15"
        >
          {/* 字体颜色 */}
          <div className="px-1 mb-3 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            字体颜色
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2.5">
            {CLOCK_FONT_COLORS.map((c) => (
              <button
                key={c.label}
                title={c.label}
                onClick={() => {
                  applyFont({ color: c.clear ? '' : c.value });
                  setOpen(false);
                  onClose();
                }}
                style={
                  c.clear
                    ? {
                        backgroundImage:
                          'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)',
                        backgroundSize: '10px 10px',
                        backgroundPosition: '0 0,5px 5px',
                        backgroundColor: '#fff',
                      }
                    : { background: c.value }
                }
                className={`h-9 rounded-[var(--card-radius)] border-2 hover:scale-105 hover:shadow-lg transition-transform ${
                  (c.clear ? !currentColor : currentColor === c.value)
                    ? 'border-[color:var(--accent)] ring-4 ring-[color:var(--accent)]/40'
                    : 'border-black/10 dark:border-white/15'
                }`}
              />
            ))}
          </div>
          {/* 自定义颜色输入 */}
          <div className="mb-5 flex items-center space-x-2">
            <input
              type="color"
              value={currentColor && !currentColor.startsWith('var(') ? currentColor : '#ffffff'}
              onChange={(e) => applyFont({ color: e.target.value })}
              className="h-9 w-9 cursor-pointer rounded-[var(--card-radius)] border border-black/10 dark:border-white/15 bg-transparent p-0.5"
            />
            <input
              type="text"
              placeholder="自定义颜色 (如 #ff0 / var(--accent))"
              value={currentColor}
              onChange={(e) => applyFont({ color: e.target.value })}
              className="flex-1 px-2 py-1.5 text-font-sm rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 outline-none focus:ring-2 ring-[color:var(--accent)]/40"
            />
          </div>

          {/* 字号 */}
          <div className="px-1 mb-3 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            字号
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2.5">
            {CLOCK_FONT_SIZES.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  applyFont({ size: s.value });
                  setOpen(false);
                  onClose();
                }}
                className={`py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors border-2 ${
                  currentSize === s.value
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                    : 'border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="自定义字号 (如 2rem / 32px)"
              value={currentSize}
              onChange={(e) => applyFont({ size: e.target.value })}
              className="flex-1 px-2 py-1.5 text-font-sm rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 outline-none focus:ring-2 ring-[color:var(--accent)]/40"
            />
          </div>
        </div>
      )}
    </div>
  );
};
