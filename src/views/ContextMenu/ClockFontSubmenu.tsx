import React, { useRef, useState } from 'react';
import { ACCENT_COLORS, CLOCK_FONT_SIZES, THEME_COLORS } from '../../data/options';
import type { WidgetConfigSubmenuProps } from './widgetSubmenus';

/** 字体颜色选项：首项「跟随主题」用于清空自定义颜色，其余取自系统主题色板。 */
const CLOCK_COLOR_OPTIONS = [
  { label: '跟随主题', value: '', clear: true },
  ...ACCENT_COLORS.map((c) => ({ label: c.name, value: c.value })),
];

export const ClockFontSubmenu: React.FC<WidgetConfigSubmenuProps> = ({
  item,
  targetWidget,
  onUpdateWidgetData,
  onClose,
}) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  const currentData = targetWidget.data ?? {};
  const currentColor = currentData.color ?? '';
  const currentSize = currentData.size ?? '';
  const currentBold = currentData.bold ?? true;

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

  // 合并写入 data 的局部字段（保留其它字段）。
  const applyFont = (
    patch: { color?: string; size?: string; bold?: boolean },
  ) => {
    onUpdateWidgetData(targetWidget.id, patch);
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
            {THEME_COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => {
                  applyFont({ color: c });
                  setOpen(false);
                  onClose();
                }}
                style={
                 { background: c }
                }
                className={`h-9 rounded-[var(--card-radius)] border-2 hover:scale-105 hover:shadow-lg transition-transform ${
                  (c ? !currentColor : currentColor === c)
                    ? 'border-[color:var(--accent)] ring-4 ring-[color:var(--accent)]/40'
                    : 'border-black/10 dark:border-white/15'
                }`}
              />
            ))}
          </div>
       

          {/* 字号 */}
          <div className="px-1 mb-3 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            字号
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
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

          {/* 是否加粗（作用于数字时间） */}
          <div className="mt-4 px-1 mb-2 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            数字加粗
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                applyFont({ bold: true });
                setOpen(false);
                onClose();
              }}
              className={`py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors border-2 ${
                currentBold
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                  : 'border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              加粗
            </button>
            <button
              onClick={() => {
                applyFont({ bold: false });
                setOpen(false);
                onClose();
              }}
              className={`py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors border-2 ${
                !currentBold
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                  : 'border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              常规
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
