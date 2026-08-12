import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import { WidgetItem } from '../types';

interface IconEditModalProps {
  widget: WidgetItem | null;
  onClose: () => void;
}

/**
 * 编辑图标组件：可修改链接地址与「在内部浏览器打开」开关。
 * 仅对 type 为 icon / icon-grid 的组件有意义。
 */
export const IconEditModal: React.FC<IconEditModalProps> = ({
  widget,
  onClose,
}) => {
  const updateWidget = useHomeStore((s) => s.updateWidget);
  const [iconLabel, setIconLabel] = useState('');
  const [iconHref, setIconHref] = useState('');
  const [openInApp, setOpenInApp] = useState(false);

  useEffect(() => {
    if (widget) {
      setIconLabel(widget.iconLabel ?? widget.title ?? '');
      setIconHref(widget.iconHref ?? '');
      setOpenInApp(!!widget.openInApp);
    }
  }, [widget]);

  const save = () => {
    if (!widget) return;
    updateWidget(widget.id, {
      iconLabel: iconLabel.trim() || undefined,
      iconHref: iconHref.trim() || undefined,
      openInApp,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {widget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[420px] max-w-[92vw] p-6 rounded-[var(--card-radius)] glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-[0_30px_80px_rgba(0,0,0,0.3)] border border-white/70 dark:border-white/20"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                编辑图标
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm dark:text-slate-400">
                  名称
                </span>
                <input
                  value={iconLabel}
                  onChange={(e) => setIconLabel(e.target.value)}
                  placeholder="图标显示名称"
                  className="mt-1 w-full px-3 py-2 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50"
                />
              </label>

              <label className="block">
                <span className="text-sm dark:text-slate-400">
                  链接地址（URL）
                </span>
                <input
                  value={iconHref}
                  onChange={(e) => setIconHref(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full px-3 py-2 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    在内部浏览器打开
                  </span>
                  <span className="text-xs ">
                    开启后，点击图标用内置全屏浏览器（iframe）打开，否则在新标签页打开
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpenInApp((v) => !v)}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    openInApp ? 'bg-[color:var(--accent)]' : 'bg-black/15 dark:bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      openInApp ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--card-radius)] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded-[var(--card-radius)] text-sm font-medium bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)] transition-colors"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
