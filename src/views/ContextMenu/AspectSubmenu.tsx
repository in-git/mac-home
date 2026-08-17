import React, { useRef, useState } from 'react';
import type { WidgetConfigSubmenuProps } from './widgetSubmenus';

/** 预设纵横比选项。value 为合法 CSS aspect-ratio 字符串。 */
const ASPECT_PRESETS: { label: string; value: string }[] = [
  { label: '正方形 1:1', value: '1 / 1' },
  { label: '横向 4:3', value: '4 / 3' },
  { label: '横向 16:9', value: '16 / 9' },
  { label: '竖向 3:4', value: '3 / 4' },
  { label: '竖向 9:16', value: '9 / 16' },
  { label: '竖向 1:2', value: '1 / 2' },
];

export const AspectSubmenu: React.FC<WidgetConfigSubmenuProps> = ({
  item,
  targetWidget,
  onUpdateWidgetData,
  onClose,
}) => {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const leaveTimer = useRef<number | null>(null);

  const currentAspect = targetWidget.data?.aspect ?? '';

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

  const applyAspect = (value: string) => {
    // 空串表示清除自定义纵横比（回退到默认布局）。
    onUpdateWidgetData(targetWidget.id, { aspect: value || undefined });
    setOpen(false);
    onClose();
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
          <div className="px-1 mb-3 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            纵横比
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            {ASPECT_PRESETS.map((p) => {
              const isSelected = currentAspect === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => applyAspect(p.value)}
                  className={`py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors border-2 ${
                    isSelected
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                      : 'border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="px-1 mb-2 text-font-md font-semibold dark:text-slate-400 tracking-wide">
            自定义（CSS aspect-ratio）
          </div>
          <div className="flex items-center gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="如 3 / 2"
              className="flex-1 px-3 py-2 rounded-[var(--card-radius)] text-font-md bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 outline-none focus:border-[color:var(--accent)]"
            />
            <button
              onClick={() => applyAspect(custom.trim())}
              className="px-3 py-2 rounded-[var(--card-radius)] text-font-md font-semibold border-2 border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] hover:bg-[color:var(--accent)]/20"
            >
              应用
            </button>
          </div>

          <button
            onClick={() => applyAspect('')}
            className="mt-3 w-full py-2 rounded-[var(--card-radius)] text-font-md font-semibold border-2 border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          >
            清除（使用默认布局）
          </button>
        </div>
      )}
    </div>
  );
};
